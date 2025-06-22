defmodule ConferenceWeb.Channel.RoomTest do
  use ConferenceWeb.ChannelCase, async: false
  @chars Enum.concat([?a..?z, ?0..?9]) |> Enum.to_list()

  describe "Successfully loads channel" do
    setup do
      {:ok, _response, socket} =
        ConferenceWeb.RoomSocket
        |> socket("user_id", %{sdp: "test sdp", user: "user_id"})
        |> subscribe_and_join(ConferenceWeb.Channel.Room, "room:lobby")
      %{socket: socket}
    end
    test "captures after_join push events", %{socket: _socket} do
      assert_push("sdp_pairs", %{"sdp_pairs" => _something})
      assert_push("pairs", %{"pairs" => _})
    end
  end

  describe "Different rooms segregation" do
    test "Different rooms dont affect each other" do
      room1 = generate_string()
      room2 = generate_string()
      socket1 = join_room("user1", "sdp 1", room1)
      socket2 = join_room("user2", "sdp 2", room2)
      user_ref2 = socket2.join_ref
      user_ref1 = socket1.join_ref
      assert_receive %Phoenix.Socket.Message{event: "pairs", payload: %{"pairs" => []}, join_ref: ^user_ref1}
      assert_receive %Phoenix.Socket.Message{event: "pairs", payload: %{"pairs" => []}, join_ref: ^user_ref2}
    end
  end

  # describe "Join room should allow user to push ICE gathering" do
  #   test "allows user to push ICE gathering" do
  #     room1 = generate_string()
  #     socket1 = join_room("user1", "sdp 1", room1)
  #     push(socket1, "ice_candidate", %{"to" => "placeholder", "ice" => %{
  #       "candidate": "candidate:3227376277 1 udp 2122262783 typ host generation 0 ufrag VDHh network-id 2 network-cost 10",
  #       "sdpMid": "0",
  #       "sdpMLineIndex": 0,
  #       "usernameFragment": "VDHh",
  #   }, "mode" => "data"})
  #   end
  # end

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
