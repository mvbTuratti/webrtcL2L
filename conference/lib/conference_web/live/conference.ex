defmodule ConferenceWeb.Conference do
  use ConferenceWeb, :live_view
  alias Conference.{Presence, PubSub}
  # alias Conference.RoutingState.Routing
  alias Conference.SdpTable.PeerFinding
  alias Conference.DynamicSupervision.DynamicRouting
  # alias ConferenceWeb.Components.RoomParticipants

  @presence "conference:"

  @impl true
  def mount(%{"room" => room}, _session, socket) do
    socket = assign(socket, conference: false, current: 0, presences: %{}, routing_pid: nil, peer_finding_pid: nil)
    socket = if connected?(socket), do:
      set_user_and_room(socket, room)
      |> attempt_to_join_a_meeting()
      |> define_routing_state()
      |> check_server_status() , else: socket
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
    # IO.puts("Subscriber to " <> @presence <>  "#{socket.assigns.room}:#{socket.assigns.user_id}")
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
  defp join_data_channels(sdp_value, %{assigns: %{user_id: id, peer_finding_pid: pf_pid}} = socket) do
    {:ok, list_of_sdp, list_of_affected_users} = PeerFinding.join_call(pf_pid, id, sdp_value)
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
  defp check_server_status(socket) do
    # Process.send_after(self(), :check_server_status, 15000)
    socket
  end


  @impl true
  def handle_event("icecandidate-response", %{"sdp" => sdp, "source" => user_host, "type" => type}, socket) do
    # IO.puts("ice candidate response")
    payload = %{sdp: sdp, user_id: socket.assigns.user_id, type: type}
    # IO.inspect(payload)
    Phoenix.PubSub.broadcast(PubSub, @presence <> "#{socket.assigns.room}:#{user_host}" , {:response, payload})
    # IO.puts("send message to topic " <> @presence <> "#{socket.assigns.room}:#{user_host}")
    {:noreply, socket}
  end
  def handle_event("ice-candidate", %{"type" => "room", "pc" => sdp}, socket) do
    # IO.puts("ice-candidate")
    # IO.inspect(sdp)
    {:noreply, join_data_channels(sdp, socket)}
  end
  def handle_event("ice-candidate", %{"type" => "perfect-negotiation-room", "pc" => sdp}, %{assigns: %{user_id: id, peer_finding_pid: pf_pid}} = socket) do
    # IO.puts("perfect-negotiation-room")
    PeerFinding.update_data_channel_sdp_value(pf_pid, id, sdp)
    {:noreply, socket}
  end
  def handle_event("ice-candidate", %{"type" => "negotiation-perfect-negotiation-room", "pc" => sdp}, %{assigns: %{user_id: id, peer_finding_pid: pf_pid}} = socket) do
    # IO.puts("negotiation-perfect-negotiation-room")
    # IO.inspect(sdp)
    PeerFinding.update_data_channel_sdp_value(pf_pid, id, sdp)
    {:noreply, socket}
  end
  def handle_event("ice-candidate", %{"type" => "negotiation-room", "pc" => sdp}, %{assigns: %{user_id: id, peer_finding_pid: pf_pid}} = socket) do
    # IO.puts("negotiation-room")
    # IO.inspect(sdp)
    PeerFinding.update_data_channel_sdp_value(pf_pid, id, sdp)
    {:noreply, socket}
  end
  def handle_event(_event, _payload, socket) do
    # IO.puts(event)
    # IO.inspect(payload)
    {:noreply, socket}
  end
  @impl true
  def handle_info({:response, %{sdp: _sdp, type: "ice-response-room", user_id: _user_id} = payload}, socket) do
    # # IO.puts("phoenix broadcast")
    # :sys.get_state(socket.assigns.peer_finding_pid) |> # IO.inspect()
    {
      :noreply,
      push_event(socket, "ice-response-room", payload)
    }
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
  def handle_info(:check_server_status, socket) do
    # # IO.inspect(:sys.get_state(socket.assigns.peer_finding_pid))
    {:noreply, socket}
  end

  @impl true
  def handle_info(_, socket), do: {:noreply, socket}

end
