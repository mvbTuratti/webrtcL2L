defmodule ConferenceWeb.Channel.Room do
  use Phoenix.Channel
  alias Phoenix.PubSub
  alias Conference.RoutingState.Routing
  alias Conference.SdpTable.PeerFinding
  alias Conference.DynamicSupervision.DynamicRouting
  intercept ["presence_diff"]
  @doc """
  Expects either 'high', 'low' or 'audio'
  """
  defp get_stream_type(type) do
    Map.get(%{"high" => :high_quality, "low" => :low_quality, "audio" => :audio_only}, type, :high_quality)
  end

  defp get_state_pids(room) do
    routing_pid = DynamicRouting.get_routing_pid(room)
    peerfinding_pid = DynamicRouting.get_peer_finding_pid(room)
    {routing_pid, peerfinding_pid}
  end
  defp create_stream_for_user(routing_pid, type, user) do
    Routing.create_stream(routing_pid, get_stream_type(type), user)
  end
  defp warn_users_they_should_create_new_sdps(sdp_values, room) do
    users = Enum.reduce(sdp_values, [], fn {user, sdp}, acc ->
        case sdp do
          "" ->
            acc
          _ ->
            [ user | acc ]
        end
      end)
    PubSub.broadcast(Conference.PubSub, room, {:update_data_channel_sdp, %{users_affected: users}})
  end
  def join(room, _params, socket) do
    IO.puts("join")
    PubSub.subscribe(Conference.PubSub, room)
    {:ok, _} = Conference.Presence.track(socket, socket.assigns.user, %{status: "online", pid: self()})
    {routing_pid, peerfinding_pid} = get_state_pids(room)
    {:ok, sdp_values, current_users} = PeerFinding.join_call(peerfinding_pid, socket.assigns.user, socket.assigns.sdp)
    socket = assign(socket, :routing_pid, routing_pid)
    |> assign(:peerfinding_pid, peerfinding_pid)
    |> assign(:sdp_pairs, sdp_values)
    |> assign(:pairs, current_users)
    |> assign(:room, room)
    warn_users_they_should_create_new_sdps(sdp_values, socket.assigns.room)
    # IO.inspect(socket, label: "room.ex: User #{socket.id} - Room #{room} // after changes to subscription")
    send(self(), :after_join)
    {:ok, socket}
  end

  def terminate(_reason, socket) do
    IO.puts("LEFT terminate/2")
    PeerFinding.remove_user(socket.assigns.peerfinding_pid, socket.assigns.user)
    # Routing.
    PubSub.broadcast(Conference.PubSub, socket.assigns.room, {:user_left, %{id: socket.id, name: socket.assigns.user}})
    PubSub.unsubscribe(Conference.PubSub, socket.assigns.room)
    :ok
  end
  # Messages from server: Broadcasts, direct messages
  def handle_info(:after_join, socket) do
    # IO.inspect(socket, label: "room.ex: handle_info/2 - :after_join")
    sdp_pairs = Enum.map(socket.assigns.sdp_pairs, fn {user, sdp} ->
      %{user: user, sdp: sdp}
    end)
    push(socket, "sdp_pairs", %{"sdp_pairs" => sdp_pairs})
    push(socket, "pairs", %{"pairs" => socket.assigns.pairs})
    {:noreply, socket}
  end
  def handle_info({:user_left, data}, socket) do
    IO.inspect(data, label: "room.ex - handle_info - :user_left")
    push(socket, "user_left",%{"user" => data.name})
    {:noreply, socket}
  end
  def handle_info({:update_data_channel_sdp, %{users_affected: users}}, socket) do
    if Enum.member?(users, socket.assigns.user), do: push(socket, "new_data_webrtc_required", %{})
    {:noreply, socket}
  end
  def handle_info({:private_message, %{protocol: :negotiation_response, sdp: sdp, from: from, mode: mode}}, socket) do
    IO.inspect(from, label: "Received message from user")
    push(socket, "negotiation_response", %{"pair" => from, "sdp" => sdp, "mode" => mode})
    {:noreply, socket}
  end
  def handle_info({:private_message, %{protocol: :sdp_update, sdp: sdp, from: from, mode: mode}}, socket) do
    IO.inspect(from, label: "Received message from user")
    push(socket, "perfect_negotiation_sdp_update", %{"pair" => from, "sdp" => sdp, "mode" => mode})
    {:noreply, socket}
  end
  def handle_info(protocol, socket) do
    IO.inspect(protocol, label: "Uncaught protocol")
    {:noreply, socket}
  end

  # Direct messages from client

  def handle_in("negotiation_response", %{"sdp" => sdp, "to" => user , "mode" => mode}, socket) do
    case Conference.Presence.get_by_key(socket.topic, user) do
      %{metas: [%{pid: pid} | _]} ->
        send(pid, {:private_message, %{protocol: :negotiation_response, sdp: sdp, from: socket.assigns.user, mode: mode}})
        {:noreply, socket}
      [] ->
        IO.inspect("Missing PID user")
        {:noreply, socket}
    end
    {:noreply, socket}
  end
  def handle_in("sdp_update", %{"to" => user, "sdp" => sdp, "mode" => mode}, socket) do
    IO.inspect("sdp update, here")
    case Conference.Presence.get_by_key(socket.topic, user) do
      %{metas: [%{pid: pid} | _]} ->
        send(pid, {:private_message, %{protocol: :sdp_update, sdp: sdp, from: socket.assigns.user, mode: mode}})
        {:noreply, socket}
      [] ->
        IO.inspect("Missing PID user")
        {:noreply, socket}
    end
    {:noreply, socket}
  end

  def handle_in(protocol, data, socket) do
    IO.inspect(protocol, label: "Uncaught protocol")
    IO.inspect(data, label: "Uncaught protocol")
    IO.inspect(socket.assigns.user, label: "Uncaught protocol")
    {:noreply, socket}
  end
  def handle_out("presence_diff", _message, socket) do
    # IO.inspect("#{message.joins} - #{socket.assigns.room}", label: "Presence diff")
    {:noreply, socket}
  end
end
