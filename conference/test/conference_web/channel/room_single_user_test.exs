defmodule ConferenceWeb.Channel.RomSingleUserTest do
  use ConferenceWeb.ChannelCase, async: false
  @chars Enum.concat([?a..?z, ?0..?9]) |> Enum.to_list()

  describe "User alone behavior" do
    @tag :pending
    test "Receives no sdp nor pairs" do
      room = generate_string()
      room_topic = "room:" <> room
      {:ok, client1} = start_client(@endpoint)
      {:ok, _, socket1} =
        socket(ConferenceWeb.RoomSocket, "user1", %{user: "user1", sdp: "sdp 1"})
        |> subscribe_and_join(ConferenceWeb.Channel.Room, room_topic)
      :ok = adopt_socket(client1, socket1)
      assert_received_push(client1, "pairs", %{"pairs" => []})
      assert_received_push(client1, "sdp_pairs", %{"sdp_pairs" => []})
      socket_state = get_socket(client1)
      peers_pid = socket_state.assigns.peerfinding_pid
      assert %{active: active_map, pending: pending_map} = :sys.get_state(peers_pid)
      assert active_map == %{}
      assert map_size(pending_map) == 1
      [{hash_key, pending_data}] = Map.to_list(pending_map)
      assert String.starts_with?(hash_key, "user1-")
      assert pending_data.name == "user1"
      assert pending_data.sdp == "sdp 1"
      assert pending_data.connection_type == "data"
      assert pending_data.partner_pid == nil
      assert is_pid(pending_data.creator_pid)
      assert pending_data.creator_pid == socket_state.channel_pid
      stop_client(client1)
    end
    test "Can leave" do
      room1 = generate_string()
      socket1 = join_room("user1", "sdp 1", room1)
      peers_pid = socket1.assigns.peerfinding_pid
      routing_pid = socket1.assigns.routing_pid
      Process.unlink(socket1.channel_pid)
      close(socket1)
      refute Process.alive?(peers_pid)
      refute Process.alive?(routing_pid)
    end
    test "Leaving and joining again yield to new empty room" do
      room = generate_string()
      room_topic = "room:" <> room
      {:ok, client1} = start_client(@endpoint)
      {:ok, _, socket1} =
        socket(ConferenceWeb.RoomSocket, "user1", %{user: "user1", sdp: "sdp 1"})
        |> subscribe_and_join(ConferenceWeb.Channel.Room, room_topic)
      :ok = adopt_socket(client1, socket1)
      socket_state1 = get_socket(client1)
      peers_pid1 = socket_state1.assigns.peerfinding_pid
      assert Process.alive?(peers_pid1)
      ref = Process.monitor(peers_pid1)
      leave_channel(client1)
      assert_receive {:DOWN, ^ref, :process, ^peers_pid1, _reason}
      flush_pushes(client1)
      {:ok, _, socket2} =
        socket(ConferenceWeb.RoomSocket, "user1", %{user: "user1", sdp: "sdp 1"})
        |> subscribe_and_join(ConferenceWeb.Channel.Room, room_topic)
      :ok = adopt_socket(client1, socket2)
      socket_state2 = get_socket(client1)
      peers_pid2 = socket_state2.assigns.peerfinding_pid
      refute peers_pid1 == peers_pid2
      assert Process.alive?(peers_pid2)
      assert_received_push(client1, "sdp_pairs", %{"sdp_pairs" => []})
      assert_received_push(client1, "pairs", %{"pairs" => []})
    end
  end

  defp flush_pushes(client_pid) do
    Process.sleep(50)
    GenServer.call(client_pid, :clear_messages)
  end
  defp join_room(user, sdp, room) do
    {:ok, _response, socket} =
      ConferenceWeb.RoomSocket
      |> socket(user, %{sdp: sdp, user: user})
      |> subscribe_and_join(ConferenceWeb.Channel.Room, "room:#{room}")
    socket
  end
  defp generate_string() do
    1..6
    |> Enum.map(fn _ -> Enum.random(@chars) end)
    |> List.to_string()
  end
end
