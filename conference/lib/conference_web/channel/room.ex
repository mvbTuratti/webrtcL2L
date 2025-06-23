defmodule ConferenceWeb.Channel.Room do
  use Phoenix.Channel
  alias Phoenix.PubSub
  alias Conference.RoutingState.Routing
  alias Conference.SdpTable.Peers
  alias Conference.DynamicSupervision.DynamicRouting
  # intercept ["presence_diff"]

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

  defp warn_users_they_should_create_new_sdps(users, room, from) do
    IO.inspect(users, label: "WARNING USERS")
    IO.inspect({:broadcasting_from_pid, self(), from: from, users_affected: users}, label: "BROADCAST SOURCE")
    PubSub.broadcast_from(Conference.PubSub, self(), room, {:update_data_channel_sdp, %{users_affected: users, from: from}})
  end
  def join(room, _params, socket) do
    IO.puts("join")
    IO.inspect(room, label: "ROOM IN JOIN!!")
    PubSub.subscribe(Conference.PubSub, room)
    {:ok, _} = Conference.Presence.track(socket, socket.assigns.user, %{status: "online", pid: self()})
    {routing_pid, peerfinding_pid} = get_state_pids(room)
    hash = Peers.generate_hash(socket.assigns.user)
    current_users = Peers.join_negotiation(peerfinding_pid,hash, socket.assigns.sdp, self(), "data", false, socket.assigns.user)
    users = Enum.reduce(current_users, [], fn {_key, %{name: user}}, acc ->
      [ user | acc ]
    end)
    socket = assign(socket, :routing_pid, routing_pid)
    |> assign(:peerfinding_pid, peerfinding_pid)
    |> assign(:sdp_pairs, current_users)
    |> assign(:room, room)
    |> assign(:pairs, users)
    |> assign(:hash, hash)

    warn_users_they_should_create_new_sdps(users, socket.assigns.room, socket.assigns.user)
    # IO.inspect(socket, label: "room.ex: User #{socket.id} - Room #{room} // after changes to subscription")
    # send(self(), :after_join)
    ############# IMPORTANT!!!!!!!
    ##############################
    ################## ADD THE SEND SELF WHEN NOT TESTING!
    {:ok, socket}
  end

  def terminate(_reason, socket) do
    IO.puts("LEFT terminate/2")
    case check_and_cleanup_room(socket.assigns.room) do
      :deleted ->
        PubSub.unsubscribe(Conference.PubSub, socket.assigns.room)
        :ok
      :active ->
        hashes = Peers.remove_user(socket.assigns.peerfinding_pid, self())
        PubSub.broadcast_from(Conference.PubSub, self(), socket.assigns.room, {:user_left, %{id: socket.id, name: socket.assigns.user, hashes: hashes}})
        {:ok, recoms} = Routing.remove_user(socket.assings.routing_pid, socket.assings.user)
        Enum.map(recoms, fn {type, rec} ->
          # PubSub.broadcast_from(Conference.PubSub, self(), room,
          #     {:get_new_streamer, %{type: type, stream: stream_user, recommendations: recommendation}})
          # TODO
          IO.inspect(rec)
        end)
        PubSub.unsubscribe(Conference.PubSub, socket.assigns.room)
        :ok
    end
  end
  defp check_and_cleanup_room(room) do
    presences = Conference.Presence.list(room)
    room_presences = Map.get(presences, "room:" <> room, %{metas: []})
    case Enum.empty?(room_presences.metas) do
      true ->
        IO.puts("Room #{room} is empty. Cleaning up resources.")
        stop_room_genservers(room)
        :deleted
      false ->
        :active
    end
  end

  defp stop_room_genservers(room) do
    with [{routing_pid, _}] <- Registry.lookup(Conference.RouterRegistry, "recommendation:" <> room) do
      GenServer.stop(routing_pid)
    end
    with [{peerfinding_pid, _}] <- Registry.lookup(Conference.RouterRegistry, "peerfinding:" <> room) do
      GenServer.stop(peerfinding_pid)
    end
  end

  # Messages from server: Broadcasts, direct messages
  def handle_info(:after_join, socket) do
    # IO.inspect(socket, label: "room.ex: handle_info/2 - :after_join")
    sdp_pairs = Enum.reduce(socket.assigns.sdp_pairs, [],fn {hash, %{name: user, sdp: sdp, ice: ice}}, acc ->
      [%{hash: hash, user: user, sdp: sdp, ice: ice}  | acc]
    end)
    push(socket, "sdp_pairs", %{"sdp_pairs" => sdp_pairs})
    push(socket, "pairs", %{"pairs" => socket.assigns.pairs})
    push(socket, "join_hash", %{"hash" => socket.assigns.hash})
    {:noreply, socket}
  end
  def handle_info({:user_left, data}, socket) do
    IO.inspect(data, label: "room.ex - handle_info - :user_left")
    current_hashes = Enum.reduce(data.hashes, socket.assigns.current_users, fn hash, hashes ->
      Map.delete(hashes, hash)
    end)
    push(socket, "user_left",%{"user" => data.name, "hashes" => data.hashes})
    users = socket.assigns.pairs |> Enum.filter(fn {:missing_streamer, viewer, streamer} -> entry != data.name end)
    socket = assign(socket, :sdp_pairs, current_hashes) |> assign(:pairs, users)
    {:noreply, socket}
  end
  def handle_info({:update_data_channel_sdp, %{users_affected: users, from: from}}, socket) do
    IO.inspect({:handle_info_in_pid, self(), user: socket.assigns.user, from: from}, label: "BROADCAST RECIPIENT")
    if Enum.member?(users, socket.assigns.user), do: push(socket, "new_data_webrtc_required", %{})
    {:noreply, socket}
  end
  def handle_info({:get_new_streamer, %{type: type, stream: stream_user, recommendations: recommendation}}, socket) do
    IO.inspect({:handle_info_in_pid, self(), user: socket.assigns.user, from: from}, label: "BROADCAST NEW STREAMER RECIPIENT")
    recommendations = Enum.filter(recommendation, fn {status, viewer, streamer} -> viewer == socket.assings.user end)
    if length(recommendations) > 0 do
      push(socket, "get_new_souces_of_stream", %{type: type, stream: stream_user, recommendations: recommendation})
    end
    {:noreply, socket}
  end
  def handle_info({:private_message, {:private_message, %{protocol: :pair_request, hash: hash,sdp: sdp, ice: ice, user: user}}}, socket) do
    IO.inspect(%{protocol: :pair_request, hash: hash,sdp: sdp, ice: ice, user: user}, label: "Received message from user")
    push(socket, "negotiation_response", %{"hash" => hash, "sdp" => sdp, "ice" => ice})
    socket = assign(socket, :current_users, Map.put(socket.assigns.current_users, hash, %{user: user})) |> assign(:users, [user | socket.assigns.users])
    {:noreply, socket}
  end
  def handle_info({:private_message,  %{protocol: :ice_update, hash: hash, ice: new_ice}}, socket) do
    IO.inspect(%{protocol: :ice_update, hash: hash, ice: new_ice}, label: "Received message from user")
    push(socket, "ice_update", %{"hash" => hash, "ice" => new_ice})
    {:noreply, socket}
  end
  def handle_info({:private_message, %{protocol: :finish_webrtc, hash: hash, ice: ice, sdp: sdp}}, socket) do
    IO.inspect(%{protocol: :finish_webrtc, hash: hash, ice: ice, sdp: sdp}, label: "Received message from user")
    push(socket, "finish_webrtc", %{"hash" => hash, "ice" => new_ice, "sdp" => sdp})
    {:noreply, socket}
  end
  @doc "Test-only callback to update transport and reply to the caller."
  def handle_info({:test_update_transport, new_transport_pid, ref}, socket) do
    new_socket = %{socket | transport_pid: new_transport_pid}
    send(new_transport_pid, {:transport_updated, ref})
    {:noreply, new_socket}
  end
  def handle_info(protocol, socket) do
    IO.inspect(protocol, label: "Uncaught protocol")
    {:noreply, socket}
  end
  def handle_info(protocol, extra, socket) do
    IO.inspect({protocol, extra}, label: "Uncaught protocl")
    {:noreply, socket}
  end

  # Direct messages from client
  # General data connection
  def handle_in("negotiation_response", %{"sdp" => sdp, "hash" => hash , "ice" => ice}, socket) do
    case Map.get(socket.assigns.sdp_pairs, hash) do
      nil -> {:noreply, socket}
      map ->
        send(map.creator_pid, {:private_message, %{protocol: :pair_request, hash: hash,sdp: sdp, ice: ice, user: socket.assigns.user}})
        {:noreply, socket}
    end
  end
  def handle_in("ice_update", %{"hash" => hash, "ice" => ice}, socket) do
    IO.inspect(%{"hash" => hash, "ice" => ice}, label: "Handle IN")
    {term, response} = Peers.update_ice(socket.assigns.peerfinding_pid, hash, ice, self())
    IO.inspect({term, response}, label: "Here")
    {:reply, term, socket}
  end
  def handle_in("finish_webrtc", %{"hash" => hash, "ice" => ice, "sdp" => sdp}, socket) do
    IO.inspect(%{"hash" => hash, "ice" => ice, "sdp" => sdp}, label: "Handle IN")
    peer = socket.assigns.sdp_pairs[hash]
    send(peer.creator_pid, {:private_message, %{protocol: :finish_webrtc, hash: hash, ice: ice, sdp: sdp}})
    {:reply, :ok, socket}
  end
  def handle_in("new_webrtc", %{"sdp" => sdp}, socket) do
    hash = Peers.generate_hash(socket.assigns.user)
    peerfinding_pid = socket.assigns.peerfinding_pid
    current_users = Peers.join_negotiation(peerfinding_pid, hash, sdp, self(), "data", true, socket.assigns.user, socket.assigns.pairs)
    sdp_pairs = Enum.reduce(socket.assigns.sdp_pairs, [],fn {hash, %{name: user, sdp: sdp, ice: ice}}, acc ->
      [%{hash: hash, user: user, sdp: sdp, ice: ice}  | acc]
    end)
    push(socket, "sdp_pairs", %{"sdp_pairs" => sdp_pairs})
    push(socket, "join_hash", %{"hash" => hash})
    users = Enum.reduce(current_users, [], fn {_key, %{name: user}}, acc ->
      [ user | acc ]
    end)
    push(socket, "pairs", %{"pairs" => users})
    socket = assign(socket, :users, socket.assigns.users ++ users) |> assign(:sdp_pairs, Map.merge(socket.assigns.sdp_pairs, current_users))
    {:noreply, socket}
  end
  def handle_in("presence_diff", something, socket) do
    IO.inspect(something, label: "HERE IN BROADCASTS")
    {:noreply, socket}
  end
  def handle_in("connection_quality", %{"target" => target, "weight" => weight}, socket) do
    router = socket.assings.routing_pid
    Routing.upsert_connection_quality(router, [%{source: socket.assings.user, target: target, weight: weight}])
    {:noreply, socket}
  end
  def handle_in("multiple_connection_quality", %{"connections" => conn}, socket) do
    router = socket.assings.routing_pid
    modified = Enum.map(conn, fn %{target: target, weight: weight} ->
      %{source: socket.assings.user, target: target, weight: weight} end)
    Routing.upsert_connection_quality(router, modified)
    {:noreply, socket}
  end
  def handle_in("add_stream", %{type: type}, socket) do
    router = socket.assings.routing_pid
    Routing.create_stream(router, type, socket.assigns.user)
    {:noreply, socket}
  end
  def handle_in("request_recommendation", %{type: type, stream: stream_user}, socket) do
    router = socket.assings.routing_pid
    {result, recommendation} = Routing.join_stream(router, type, stream_user, socket.assigns.user)
    {:reply, :ok, recommendation, socket}
  end
  def handle_in("leave_stream", %{type: type, stream: stream_user}, socket) do
    router = socket.assings.routing_pid
    {result, recommendation} = Routing.leave_stream(router, type, stream_user, socket.assigns.user)
    PubSub.broadcast_from(Conference.PubSub, self(), room,
              {:get_new_streamer, %{type: type, stream: stream_user, recommendations: recommendation}})
    {:reply, :ok, recommendation, socket}
  end

  # Recomendations
  def handle_in(protocol, data, socket) do
    IO.inspect(protocol, label: "Uncaught protocol")
    IO.inspect(data, label: "Uncaught protocol")
    IO.inspect(socket.assigns.user, label: "Uncaught protocol")
    {:noreply, socket}
  end
  def handle_in(something, socket) do
    IO.inspect(something, label: "HANDLE IN")
    {:ok, socket}
  end

  def handle_out("presence_diff", message, socket) do
    # IO.inspect("#{message} - #{socket.assigns.room}", label: "Presence diff")
    {:noreply, socket}
  end
end
