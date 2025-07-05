defmodule ConferenceWeb.Channel.Room do
  use Phoenix.Channel
  alias Phoenix.PubSub
  alias Conference.RoutingState.Routing
  alias Conference.SdpTable.Peers
  alias Conference.DynamicSupervision.DynamicRouting
  # intercept ["presence_diff"]
  @available_types ["high", "low", "audio", "sharing"]

  defp get_stream_type(type) do
    Map.get(%{"high" => :high_quality, "low" => :low_quality, "audio" => :audio_only, "sharing" => :sharing}, type, :high_quality)
  end

  defp get_state_pids(room) do
    routing_pid = DynamicRouting.get_routing_pid(room)
    peerfinding_pid = DynamicRouting.get_peer_finding_pid(room)
    {routing_pid, peerfinding_pid}
  end
  defp create_stream_for_user(routing_pid, type, user) do
    Routing.create_stream(routing_pid, get_stream_type(type), user)
  end

  @impl true
  def handle_call({:get_name}, _from, socket) do
    IO.inspect("Called get name")
    {:reply, {:ok, socket.assigns.user}, socket}
  end
  def handle_call(protocol, _, socket) do
    IO.warn(protocol)
    {:reply, :ok, socket}
  end
  # defp warn_users_they_should_create_new_sdps(users, room, from) do
  #   IO.inspect(users, label: "WARNING USERS")
  #   IO.inspect({:broadcasting_from_pid, self(), from: from, users_affected: users}, label: "BROADCAST SOURCE")
  #   PubSub.broadcast_from(Conference.PubSub, self(), room, {:update_data_channel_sdp, %{users_affected: users, from: from}})
  # end
  def join(room, _params, socket) do
    IO.puts("join")
    IO.inspect(room, label: "ROOM IN JOIN!!")
    PubSub.subscribe(Conference.PubSub, room)
    {:ok, _} = Conference.Presence.track(socket, socket.assigns.user, %{status: "online", pid: self()})
    # {:ok, _} = Conference.Presence.track(socket, socket.assigns.user, %{status: "online"})
    {routing_pid, peerfinding_pid} = get_state_pids(room)
    # hash = Peers.generate_hash(socket.assigns.user)
    # hash, sdp, channel_pid, connection_type, refill, name, opts
    current_users = Peers.join_negotiation(peerfinding_pid,socket.assigns.hash, socket.assigns.sdp, self(), "data", false, socket.assigns.user, [], socket.assigns.user)
    users = Enum.reduce(current_users, [], fn {_key, %{name: user}}, acc ->
      [ user | acc ]
    end)
    socket = assign(socket, :routing_pid, routing_pid)
    |> assign(:peerfinding_pid, peerfinding_pid)
    |> assign(:sdp_pairs, current_users)
    |> assign(:room, room)
    |> assign(:pairs, users)
    # |> assign(:hash, hash)
    IO.inspect(peerfinding_pid)
    IO.inspect(routing_pid)
    # warn_users_they_should_create_new_sdps(users, socket.assigns.room, socket.assigns.user)
    # IO.inspect(socket, label: "room.ex: User #{socket.id} - Room #{room} // after changes to subscription")
    send(self(), :after_join)
    ############# IMPORTANT!!!!!!!
    ##############################
    ################## ADD THE SEND SELF WHEN NOT TESTING!
    {:ok, socket}
  end

  def terminate(reason, socket) do
    IO.puts("LEFT terminate/2")
    IO.inspect(reason)
    case check_and_cleanup_room(socket.assigns.room) do
      :deleted ->
        PubSub.unsubscribe(Conference.PubSub, socket.assigns.room)
        :ok
      :active ->
        hashes = Peers.remove_user(socket.assigns.peerfinding_pid, self())
        PubSub.broadcast_from(Conference.PubSub, self(), socket.assigns.room, {:user_left, %{id: socket.id, name: socket.assigns.user, hashes: hashes}})
        {:ok, recoms} = Routing.remove_user(socket.assigns.routing_pid, socket.assigns.user)
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
    # room_presences = Map.get(presences, "room:" <> room, %{metas: []})
    IO.inspect(presences, label: "ROOM PRESENCE!")
    case Enum.empty?(presences) do
      true ->
        IO.puts("Room #{room} is empty. will delete....")
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
    # IO.inspect(sdp_pairs, label: "Inspecting sdp_pairs in socket", pretty: true, limit: :infinity)
    # IO.inspect(socket.assigns.sdp_pairs, label: "Inspecting saved values", pretty: true, limit: :infinity)
    push(socket, "sdp_pairs", %{"sdp_pairs" => sdp_pairs})
    push(socket, "pairs", %{"pairs" => socket.assigns.pairs})
    # push(socket, "join_hash", %{"hash" => socket.assigns.hash, "origin" => socket.assigns.origin})
    Enum.map(socket.assigns.sdp_pairs, fn
      {hash, %{creator_pid: creator_pid}} ->
        send(creator_pid, {:private_message, %{protocol: :new_webrtc_required, from: socket.assigns.user}})
    end)
    {:noreply, socket}
  end
  def handle_info({:user_left, data}, socket) do
    IO.inspect(data, label: "room.ex - handle_info - :user_left")
    current_hashes = Enum.reduce(data.hashes, socket.assigns.sdp_pairs, fn hash, hashes ->
      Map.delete(hashes, hash)
    end)
    push(socket, "user_left",%{"user" => data.name, "hashes" => data.hashes})
    users = socket.assigns.pairs |> Enum.filter(fn user -> user != data.name end)
    socket = assign(socket, :sdp_pairs, current_hashes) |> assign(:pairs, users)
    {:noreply, socket}
  end
  # def handle_info({:update_data_channel_sdp, %{users_affected: users, from: from}}, socket) do
  #   IO.inspect({:handle_info_in_pid, self(), user: socket.assigns.user, from: from}, label: "BROADCAST RECIPIENT")
  #   if Enum.member?(users, socket.assigns.user), do: push(socket, "new_data_webrtc_required", %{})
  #   {:noreply, socket}
  # end
  def handle_info({:get_new_streamer, %{type: type, stream: stream_user, recommendations: recommendation}}, socket) do
    IO.inspect({:handle_info_in_pid, self(), socket.assigns.user}, label: "BROADCAST NEW STREAMER RECIPIENT")
    if type in @available_types do
      recommendations = Enum.filter(recommendation, fn {status, viewer, streamer} -> viewer == socket.assigns.user end)
      if length(recommendations) > 0 do
        push(socket, "get_new_souces_of_stream", %{type: type, stream: stream_user, recommendations: recommendation})
      end
    else
      IO.inspect(%{type: type, stream: stream_user, recommendations: recommendation}, label: "ERROR")
    end
    {:noreply, socket}
  end
  def handle_info({:private_message, %{protocol: :new_webrtc_required, from: user}}, socket) do
    IO.inspect(%{protocol: :new_webrtc_required, from: user}, label: "Received message from user")
    socket = assign(socket, :pairs, [ user | socket.assigns.pairs ])
    push(socket, "new_webrtc_required", %{})
    {:noreply, socket}
  end
  def handle_info({:private_message, %{protocol: :pair_request, hash: hash,sdp: sdp, ice: ice, user: user}}, socket) do
    IO.inspect(%{protocol: :pair_request, hash: hash,sdp: sdp, ice: ice, user: user}, label: "Received message from user")
    push(socket, "negotiation_response", %{"hash" => hash, "sdp" => sdp, "ice" => ice, "user" => user})
    peerfinding_pid = socket.assigns.peerfinding_pid
    case Peers.get_sdp_entry(peerfinding_pid, hash) do
      nil ->
        socket = assign(socket, :sdp_pairs, Map.put(socket.assigns.sdp_pairs, hash, %{user: user})) |> assign(:pairs, [user | socket.assigns.pairs])
        {:noreply, socket}
      %{hash: value} ->
        socket = assign(socket, :sdp_pairs, Map.put(socket.assigns.sdp_pairs, hash, value)) |> assign(:pairs, [user | socket.assigns.pairs])
        {:noreply, socket}
    end
  end
  def handle_info({:private_message,  %{protocol: :ice_update, hash: hash, ice: new_ice}}, socket) do
    # IO.inspect(%{protocol: :ice_update, hash: hash, ice: new_ice}, label: "Received message from user")
    push(socket, "ice_update", %{"hash" => hash, "ice" => new_ice})
    {:noreply, socket}
  end
  def handle_info({:private_message, %{protocol: :finish_webrtc, hash: hash, ice: ice, sdp: sdp}}, socket) do
    # IO.inspect(%{protocol: :finish_webrtc, hash: hash, ice: ice, sdp: sdp}, label: "Received message from user")
    push(socket, "finish_webrtc", %{"hash" => hash, "ice" => ice, "sdp" => sdp})
    {:noreply, socket}
  end
  @doc "Test-only callback to update transport and reply to the caller."
  def handle_info({:test_update_transport, new_transport_pid, ref}, socket) do
    new_socket = %{socket | transport_pid: new_transport_pid}
    send(new_transport_pid, {:transport_updated, ref})
    {:noreply, new_socket}
  end
  def handle_info({:process_quality_update, hash, weight}, socket) do
    router = socket.assigns.routing_pid
    entry = Map.get(socket.assigns.sdp_pairs, hash)
    case entry do
      nil ->
        :ok
      %{creator_pid: creator_pid, partner_pid: partner_pid, name: name} ->
        cond do
          creator_pid != self() ->
            Routing.upsert_connection_quality(router, [%{source: socket.assigns.user, target: name, weight: weight}])
          true ->
            try do
              case GenServer.call(partner_pid, {:get_name}, 5000) do
                {:ok, target} ->
                  Routing.upsert_connection_quality(router, [%{source: socket.assigns.user, target: target, weight: weight}])
                {:error, reason} ->
                  IO.warn("Peer replied with an error: #{inspect(reason)}")
              end
            catch
              :exit, {:timeout, _} ->
                IO.warn("GenServer.call timed out waiting for name ")
            end
        end
    end
    {:noreply, socket}
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
  def handle_in("presence_diff", broadcast, socket) do
    IO.inspect(broadcast, label: "HERE")
    {:noreply, socket}
  end
  def handle_in("negotiation_response", %{"sdp" => sdp, "hash" => hash , "ice" => ice}, socket) do
    case Map.get(socket.assigns.sdp_pairs, hash) do
      nil -> {:reply, :error, socket}
      map ->
        send(map.creator_pid, {:private_message, %{protocol: :pair_request, hash: hash,sdp: sdp, ice: ice, user: socket.assigns.user}})
        {:reply, :ok, socket}
    end
  end
  def handle_in("ice_update", %{"hash" => hash, "ice" => ice}, socket) do
    # IO.inspect(%{"hash" => hash, "ice" => ice}, label: "Handle IN")
    {term, response} = Peers.update_ice(socket.assigns.peerfinding_pid, hash, ice, self())
    # IO.inspect({term, response}, label: "Here")
    {:reply, term, socket}
  end
  def handle_in("finish_webrtc", %{"hash" => hash, "ice" => ice, "sdp" => sdp}, socket) do
    IO.inspect(%{"hash" => hash}, label: "Handle IN")
    peer = socket.assigns.sdp_pairs[hash]
    send(peer.creator_pid, {:private_message, %{protocol: :finish_webrtc, hash: hash, ice: ice, sdp: sdp}})
    {:reply, :ok, socket}
  end
  def handle_in("new_webrtc", %{"sdp" => sdp, "hash" => hash, "type" => type, "target" => target}, socket) do
    # hash = Peers.generate_hash(socket.assigns.user)
    peerfinding_pid = socket.assigns.peerfinding_pid
    # hash, sdp, channel_pid, connection_type, refill, name, opts
    current_users = Peers.join_negotiation(peerfinding_pid, hash, sdp, self(), type, true, socket.assigns.user, socket.assigns.pairs, target)
    # IO.inspect(current_users, label: "Inspecting sdp_pairs in socket", pretty: true, limit: :infinity)
    sdp_pairs = Enum.reduce(current_users, [],fn {hash, %{name: user, sdp: sdp, ice: ice}}, acc ->
      [%{hash: hash, user: user, sdp: sdp, ice: ice}  | acc]
    end)
    push(socket, "sdp_pairs", %{"sdp_pairs" => sdp_pairs})
    users = Enum.reduce(current_users, [], fn {_key, %{name: user}}, acc ->
      [ user | acc ]
    end)
    push(socket, "pairs", %{"pairs" => users})
    socket = assign(socket, :pairs, socket.assigns.pairs ++ users) |> assign(:sdp_pairs, Map.merge(socket.assigns.sdp_pairs, current_users))
    {:reply, :ok, socket}
  end
  def handle_in("connection_quality", %{"hash" => hash, "value" => weight}, socket) do
    send(self(), {:process_quality_update, hash, weight})
    {:noreply, socket}
  end
  def handle_in("multiple_connection_quality", %{"connections" => conn}, socket) do
    router = socket.assigns.routing_pid
    modified = Enum.map(conn, fn %{target: target, weight: weight} ->
      %{source: socket.assigns.user, target: target, weight: weight} end)
    Routing.upsert_connection_quality(router, modified)
    {:noreply, socket}
  end
  def handle_in("add_stream", %{"type" => type}, socket) do
    IO.inspect({"add_stream", %{"type" => type}})
    cond do
      type in @available_types ->
        router = socket.assigns.routing_pid
        create_stream_for_user(router, type, socket.assigns.user)
        IO.inspect("Sending OK back")
        {:reply, :ok , socket}
      true ->
        IO.inspect("FAILED!")
        {:reply, :error, socket}
    end
  end
  def handle_in("request_recommendation", %{"media" => type, "streamer" => stream_user}, socket) do
    IO.inspect({"request_recommendation", %{"media" => type, "streamer" => stream_user}})
    cond do
      type in @available_types ->
        router = socket.assigns.routing_pid
        result = Routing.join_stream(router, get_stream_type(type), stream_user, socket.assigns.user)
        IO.inspect({"request_recommendation", result}, label: "RESULTS")
        {:reply, result, socket}
      true ->
        {:reply, :error, socket}
    end
  end
  def handle_in("leave_stream", %{"type" => type, "stream" => stream_user}, socket) do
    cond do
      type in @available_types ->
        router = socket.assigns.routing_pid
        {result, recommendation} = Routing.leave_stream(router, get_stream_type(type), stream_user, socket.assigns.user)
        PubSub.broadcast_from(Conference.PubSub, self(), socket.assigns.room,
                  {:get_new_streamer, %{type: type, stream: stream_user, recommendations: recommendation}})
        {:reply, :ok, recommendation, socket}
      true ->
        {:reply, :error, "invalid type", socket}
    end
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
