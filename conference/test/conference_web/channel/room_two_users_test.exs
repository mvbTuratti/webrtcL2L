defmodule ConferenceWeb.Channel.RoomTwoUsersTest do
  use ConferenceWeb.ChannelCase, async: false
  @chars Enum.concat([?a..?z, ?0..?9]) |> Enum.to_list()
  describe "Two pairs" do
    test "Second user receives sdp message" do
      room = generate_string()
      socket1 = join_room("user1", "sdp 1", room)
      socket2 = join_room("user2", "sdp 2", room)
      user_ref2 = socket2.join_ref
      user_ref1 = socket1.join_ref
      assert_receive %Phoenix.Socket.Message{
        event: "sdp_pairs",
        payload: %{"sdp_pairs" => [%{user: "user1", sdp: "sdp 1", state: "LOAD", ice: []}]},
        join_ref: ^user_ref2
      }
    end
    # test "First user should receive an update for negotiations" do
    #   room = generate_string()
    #   socket1 = join_room("user1", "sdp 1", room)
    #   socket2 = join_room("user2", "sdp 2", room)
    #   user_ref1 = socket1.join_ref
    #   push(socket2, "negotiation_response", %{"to" => "user1", "sdp" => "sdp 2", "mode" => "data"})
    #   assert_receive %Phoenix.Socket.Message{event: "negotiation_response", payload: %{"pair" => "user2","sdp" => "sdp 2", "mode" => "data"}, join_ref: ^user_ref1}
    # end
    # test "First user should receive a server notification that a new webrtc socket is required after user logs in" do
    #   room = generate_string()
    #   socket1 = join_room("user1", "sdp 1", room)
    #   socket2 = join_room("user2", "sdp 2", room)
    #   user_ref1 = socket1.join_ref
    #   assert_receive %Phoenix.Socket.Message{event: "new_data_webrtc_required", payload: %{}, join_ref: ^user_ref1}
    # end
    # test "Users should be able to continious update sdp in case of perfect negotiation" do
    #   room = generate_string()
    #   socket1 = join_room("user1", "sdp 1", room)
    #   socket2 = join_room("user2", "sdp 2", room)
    #   # Client pushes info to server that an update of SDP value is required
    #   push(socket2, "sdp_update", %{"to" => "user1", "sdp" => "sdp change", "mode" => "data"})
    #   push(socket1, "sdp_update", %{"to" => "user2", "sdp" => "sdp change", "mode" => "data"})
    #   user_ref1 = socket1.join_ref
    #   user_ref2 = socket2.join_ref
    #   # Check if user received the updates
    #   assert_receive %Phoenix.Socket.Message{event: "perfect_negotiation_sdp_update", payload: %{"pair" => "user1", "sdp" => "sdp change", "mode" => "data"}, join_ref: ^user_ref2}
    #   assert_receive %Phoenix.Socket.Message{event: "perfect_negotiation_sdp_update", payload: %{"pair" => "user2", "sdp" => "sdp change", "mode" => "data"}, join_ref: ^user_ref1}
    # end
    # test "Warns that users must remove their pair in case of disconnection" do
    #   room = generate_string()
    #   socket1 = join_room("user1", "sdp 1", room)
    #   socket2 = join_room("user2", "sdp 2", room)
    #   Process.unlink(socket1.channel_pid)
    #   close(socket1)
    #   # Client pushes info to server that an update of SDP value is required
    #   push(socket2, "sdp_update", %{"to" => "user1", "sdp" => "sdp change", "mode" => "data"})
    #   user_ref2 = socket2.join_ref
    #   # Check if user received the updates
    #   assert_receive %Phoenix.Socket.Message{event: "user_left", payload: %{"user" => "user1"}, join_ref: ^user_ref2}
    # end
    # @tag :current
    # test "Users negotiate " do
    #   room = generate_string()
    #   socket1 = join_room("user1", "sdp 1", room)
    #   socket2 = join_room("user2", "sdp 2", room)
    #   user_ref1 = socket1.join_ref
    #   push(socket2, "negotiation_response", %{"to" => "user1", "sdp" => "sdp 2", "mode" => "data"})
    #   assert_receive %Phoenix.Socket.Message{event: "negotiation_response", payload: %{"pair" => "user2","sdp" => "sdp 2", "mode" => "data"}, join_ref: ^user_ref1}
    # end
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
