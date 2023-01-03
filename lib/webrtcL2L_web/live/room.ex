defmodule WebrtcL2LWeb.Room do
  use WebrtcL2LWeb, :live_view
  alias WebrtcL2L.{Router, Presence, PubSub}
  alias WebrtcL2LWeb.Components.RoomParticipants

  @presence "webrtcL2L:presence"

  @impl true
  def mount(%{"room" => room}, _session, socket) do
    socket = assign(socket, conference: false, participants: %{}, current: 0)
    socket = if connected?(socket), do: set_user_and_room(socket, room), else: socket
    {:ok, socket}
  end

  @impl true
  def handle_event("conference", _params, socket) do
    IO.inspect(socket)
    socket = set_room(socket)

    socket = assign(socket, conference: true)
    response = %{participants: socket.assigns.participants, id: socket.assigns.user_id, current: socket.assigns.current}
    {:noreply, push_event(socket, "joining", response)}
  end

  @impl true
  def handle_event("icecandidate", payload, %{assigns: %{name: name}} = socket) do
    response = GenServer.call(via_tuple(name), {:add_node, payload})
    payload = response |> Map.new()
    {:noreply, push_event(socket, "participants", payload)}
  end

  @impl true
  def handle_event(_,_, socket) do
    {:noreply, socket}
  end

  @impl true
  def handle_info(%Phoenix.Socket.Broadcast{event: "presence_diff", payload: diff}, socket) do
    IO.puts("Diff!!!")
    IO.inspect(diff)
    {
      :noreply,
      socket
      |> handle_leaves(diff.leaves)
      |> handle_joins(diff.joins)
    }
  end

  defp handle_joins(socket, joins) do
    Enum.reduce(joins, socket, fn {user, %{metas: [meta| _]}}, socket ->
      assign(socket,
      participants: Map.put(socket.assigns.participants, user, meta),
      current: socket.assigns.current + 1)
    end)
  end

  defp handle_leaves(socket, leaves) do
    Enum.reduce(leaves, socket, fn {user, _}, socket ->
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
    {:ok, _} = Presence.track(self(), @presence, user_id, %{
      name: user_id,
      joined_at: :os.system_time(:seconds)
    })

    Phoenix.PubSub.subscribe(PubSub, @presence)
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
    |> handle_joins(Presence.list(@presence))
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
