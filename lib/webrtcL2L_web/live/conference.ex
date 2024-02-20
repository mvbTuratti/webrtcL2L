defmodule WebrtcL2LWeb.Conference do
  use WebrtcL2LWeb, :live_view
  alias WebrtcL2L.{Presence, PubSub}
  alias WebrtcL2L.RoutingState.Routing
  alias WebrtcL2L.SdpTable.PeerFinding
  # alias WebrtcL2LWeb.Components.RoomParticipants

  @presence "webrtcL2L:"

  @impl true
  def mount(%{"room" => room}, _session, socket) do
    socket = assign(socket, conference: false, current: 0, presences: %{}, routing_pid: nil, peer_finding_pid: nil)
    socket = if connected?(socket), do:
      set_user_and_room(socket, room)
      |> attempt_to_join_a_meeting()
      |> define_routing_state() , else: socket
    {:ok, socket}
  end
  def mount(%{}, _session, socket) do
    {:ok, push_redirect(socket, to: "/")}
  end

  defp set_user_and_room(socket, room) do
    user_id =
      ?a..?z
      |> Enum.take_random(8)
      |> List.to_string()
    assign(socket, room: room, user_id: user_id)
  end

  def attempt_to_join_a_meeting(%{assigns: %{user_id: id}} = socket) do
    {:ok, _} = Presence.track(self(), @presence <> socket.assigns.room, id, %{
      name: id,
      })
    Phoenix.PubSub.subscribe(PubSub, @presence <> socket.assigns.room)
    assign_rtc(socket)
  end
  defp assign_rtc(socket) do
    socket
    |> handle_joins(Presence.list(@presence <> socket.assigns.room))
  end

  @impl true
  def handle_info(%Phoenix.Socket.Broadcast{event: "presence_diff", payload: %{leaves: leaves}}, socket) when leaves != %{} do
    [user] = Map.keys(leaves)
    # %{^user => %{metas: [%{phx_ref: ref}]}} = leaves
    socket = assign(socket, presences: Map.delete(socket.assigns.presences, user))
    {
      :noreply,
      socket
      # |> push_event("presence", %{user: user, ref: ref})
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
      presences: Map.put(socket.assigns.presences, user, meta),
      current: socket.assigns.current + 1)
    end)
  end

  def define_routing_state(socket) do
    routing_pid = get_routing_pid(socket.assigns.room)
    peer_finding_pid = get_peer_finding_pid(socket.assigns.room)
    assign(socket, routing_pid: routing_pid, peer_finding_pid: peer_finding_pid)
  end

  defp get_routing_pid(room) do
    Registry.lookup(WebrtcL2L.RouterRegistry, "recommendation:" <> room)
    |> create_or_return_routing(room)
  end
  defp create_or_return_routing([], room) do
    {:ok, pid} =
      DynamicSupervisor.start_child(WebrtcL2L.RouterSupervisor, {Routing, name: via_tuple("recommendation:" <> room)})
    pid
  end
  defp create_or_return_routing([{pid, _}], _), do: pid

  defp get_peer_finding_pid(room) do
    Registry.lookup(WebrtcL2L.RouterRegistry, "peerfinding:" <> room)
    |> create_or_return_peer_finding(room)
  end

  defp create_or_return_peer_finding([], room) do
    {:ok, pid} =
      DynamicSupervisor.start_child(WebrtcL2L.RouterSupervisor, {PeerFinding, name: via_tuple("peerfinding:" <> room)})
    pid
  end
  defp create_or_return_peer_finding([{pid, _}], _), do: pid

  defp via_tuple(name) do
    {:via, Registry, {WebrtcL2L.RouterRegistry, name}}
  end
end
