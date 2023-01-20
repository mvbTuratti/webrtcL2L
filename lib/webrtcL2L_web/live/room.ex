defmodule WebrtcL2LWeb.Room do
  use WebrtcL2LWeb, :live_view
  alias WebrtcL2L.{Router, Presence, PubSub}
  alias WebrtcL2LWeb.Components.RoomParticipants

  @presence "webrtcL2L:"

  @impl true
  def mount(%{"room" => room}, _session, socket) do
    socket = assign(socket, conference: false, participants: %{}, current: 0)
    socket = if connected?(socket), do: set_user_and_room(socket, room), else: socket
    {:ok, socket}
  end

  @impl true
  def handle_event("conference", _params, %{assigns: %{user_id: id}} = socket) do
    {:ok, _} = Presence.track(self(), @presence <> socket.assigns.room, id, %{
      name: id,
      })

    Phoenix.PubSub.subscribe(PubSub, @presence <> socket.assigns.room)
    socket = set_room(socket) |> assign(conference: true)
    response = GenServer.call(via_tuple(socket.assigns.name), {:list_nodes, %{"id" => id}})
    payload = %{id: id, current: socket.assigns.current, sdps: response.sdps}
    {:noreply, push_event(socket, "joining", payload)}
  end

  @impl true
  def handle_event("icecandidate", payload, %{assigns: %{name: name}} = socket) do
    IO.puts("ice candidate!")
    _response = GenServer.call(via_tuple(name), {:add_node, payload})
    r = GenServer.call(via_tuple(name), :list)
    IO.inspect(r.sdps)
    IO.inspect(Map.keys(r.sdps))
    {:noreply, socket}
  end

  @impl true
  def handle_event("icecandidate-response", payload, socket) do
    # IO.puts("ice candidate response")
    # IO.inspect(payload)
    Phoenix.PubSub.broadcast(PubSub, @presence <> socket.assigns.room, {:response, payload})
    {:noreply, socket}
  end

  #Response from browser - event #x - Response ack from browser.
  @impl true
  def handle_event("presence-client", %{"ref" => ref, "user" => user}, socket) do
    {
      :noreply,
      socket
      |> handle_leaves(%{user => %{metas: [%{name: user, phx_ref: ref}]}})
    }
  end

  @impl true
  def handle_event(_,_, socket) do
    {:noreply, socket}
  end

  def handle_info({:response, payload = %{"id" => id}}, socket) do
    # IO.puts("Response!!")
    # IO.inspect(payload)
    # IO.inspect(id)
    # IO.inspect(socket.assigns)
    if socket.assigns.user_id == id, do: {:noreply, push_event(socket, "response", payload)}, else: {:noreply, socket}

  end

  # Send info to browser, step need to avoid overflow on client side. Step ObjSource needs to be emptied before removal
  # from DOM
  @impl true
  def handle_info(%Phoenix.Socket.Broadcast{event: "presence_diff", payload: %{leaves: leaves}}, socket) when leaves != %{} do
    [user] = Map.keys(leaves)
    %{^user => %{metas: [%{phx_ref: ref}]}} = leaves
    IO.puts("presence diff")
    {
      :noreply,
      socket
      |> push_event("presence", %{user: user, ref: ref})
    }
  end

  # Change info on socket. Liveview sends the change to the client.
  @impl true
  def handle_info(%Phoenix.Socket.Broadcast{event: "presence_diff", payload: diff}, socket) do
    {
      :noreply,
      socket
      |> handle_joins(diff.joins)
    }
  end

  @impl true
  def handle_info(_, socket), do: {:noreply, socket}


  defp handle_joins(socket, joins) do
    Enum.reduce(joins, socket, fn {user, %{metas: [meta| _]}}, socket ->
      assign(socket,
      participants: Map.put(socket.assigns.participants, user, meta),
      current: socket.assigns.current + 1)
    end)
  end

  defp handle_leaves(socket, leaves) do
    Enum.reduce(leaves, socket, fn {user, _}, socket ->
      GenServer.call(via_tuple(socket.assigns.name), {:remove_node, user})
      assign(socket,
      participants: Map.delete(socket.assigns.participants, user),
      current: socket.assigns.current - 1)
    end)
  end

  defp via_tuple(name) do
    {:via, Registry, {WebrtcL2L.RouterRegistry, name}}
  end


  defp set_user_and_room(socket, room) do
    user_id =
      ?a..?z
      |> Enum.take_random(8)
      |> List.to_string()

    assign(socket, room: room, user_id: user_id)
  end

  defp set_room(socket) do
    room = socket.assigns.room
    pid = get_router_pid(room)
    socket = assign(socket, pid_router: pid)
    assign_rtc(socket, room)
  end

  defp assign_rtc(socket, name) do
    socket
    |> assign(name: name)
    |> handle_joins(Presence.list(@presence <> socket.assigns.room))
  end

  defp get_router_pid(room) do
    Registry.lookup(WebrtcL2L.RouterRegistry, room)
    |> create_or_return(room)
  end

  defp create_or_return([], room) do
    {:ok, pid} =
      DynamicSupervisor.start_child(WebrtcL2L.RouterSupervisor, {Router, name: via_tuple(room)})
    pid
  end
  defp create_or_return([{pid, _}], _) do
    pid
  end


end
