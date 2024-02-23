defmodule WebrtcL2LWeb.Conference do
  use WebrtcL2LWeb, :live_view
  alias WebrtcL2L.{Presence, PubSub}
  # alias WebrtcL2L.RoutingState.Routing
  alias WebrtcL2L.SdpTable.PeerFinding
  alias WebrtcL2L.DynamicSupervision.DynamicRouting
  # alias WebrtcL2LWeb.Components.RoomParticipants

  @presence "webrtcL2L:"

  @impl true
  def mount(%{"room" => room}, _session, socket) do
    socket = assign(socket, conference: false, current: 0, presences: %{}, routing_pid: nil, peer_finding_pid: nil)
    socket = if connected?(socket), do:
      set_user_and_room(socket, room)
      |> attempt_to_join_a_meeting()
      |> define_routing_state()
      |> join_data_channels() , else: socket
    {:ok, socket}
  end
  def mount(%{}, _session, socket) do
    {:ok, push_redirect(socket, to: "/")}
  end
  @impl true
  def terminate(_, %{assigns: %{user_id: id, peer_finding_pid: pf_pid}}) do
    PeerFinding.remove_user(pf_pid, id)
  end

  defp set_user_and_room(socket, room) do
    user_id =
      ?a..?z
      |> Enum.take_random(8)
      |> List.to_string()
    assign(socket, room: room, user_id: user_id)
  end

  defp attempt_to_join_a_meeting(%{assigns: %{user_id: id}} = socket) do
    {:ok, _} = Presence.track(self(), @presence <> socket.assigns.room, id, %{
      name: id,
      })
    Phoenix.PubSub.subscribe(PubSub, @presence <> socket.assigns.room)
    Phoenix.PubSub.subscribe(PubSub, @presence <>  "#{socket.assigns.room}:#{socket.assigns.user_id}")
    assign_rtc(socket)
  end
  defp assign_rtc(socket) do
    socket
    |> handle_joins(Presence.list(@presence <> socket.assigns.room))
  end
  defp define_routing_state(socket) do
    routing_pid = DynamicRouting.get_routing_pid(socket.assigns.room)
    peer_finding_pid = DynamicRouting.get_peer_finding_pid(socket.assigns.room)
    assign(socket, routing_pid: routing_pid, peer_finding_pid: peer_finding_pid)
  end
  defp join_data_channels(%{assigns: %{user_id: id, peer_finding_pid: pf_pid}} = socket) do
    {:ok, list_of_sdp, list_of_affected_users} = PeerFinding.join_call(pf_pid, id, "sdp from #{id}")
    mapping_of_sdp = Enum.into(list_of_sdp, %{})
    push_event(socket, "joining", %{id: id, sdps: mapping_of_sdp, affected_users: list_of_affected_users})
  end
  defp handle_joins(socket, joins) do
    Enum.reduce(joins, socket, fn {user, %{metas: [meta| _]}}, socket ->
      assign(socket,
      presences: Map.put(socket.assigns.presences, user, meta),
      current: socket.assigns.current + 1)
    end)
  end

  @impl true
  def handle_event(_, payload, socket) do
    IO.puts("ice candidate response")
    IO.inspect(payload)
    # Phoenix.PubSub.broadcast(PubSub, @presence <> socket.assigns.room, {:response, payload})
    {:noreply, socket}
  end
  @impl true
  def handle_info(%Phoenix.Socket.Broadcast{event: "presence_diff", payload: %{leaves: leaves}}, socket) when leaves != %{} do
    [user] = Map.keys(leaves)
    socket = assign(socket, presences: Map.delete(socket.assigns.presences, user))
    {
      :noreply,
      socket
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

end
