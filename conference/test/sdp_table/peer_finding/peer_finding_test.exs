defmodule SdpTable.PeerFinding.PeerFindingTest do
  use ConferenceWeb.ConnCase, async: true
  alias Conference.SdpTable.PeerFinding
  alias Conference.SdpTable.MediaStructs.{ParticipantMedia, DataChannel}

  describe "upsert_perfect_negotiation_of_high_quality_stream/4" do
    setup do
      {:ok, room_pid} = PeerFinding.start_link([])
      {:ok, room: room_pid}
    end
    test "should be able to upsert a high quality stream", state do
      PeerFinding.upsert_perfect_negotiation_of_high_quality_stream(state.room, "user", "zeze", "sdp value")
      assert %{"user" => %{"zeze" => %ParticipantMedia{high_quality: "sdp value"}}} = :sys.get_state(state.room)
    end
    test "should be able to update a high quality stream", state do
      PeerFinding.upsert_perfect_negotiation_of_high_quality_stream(state.room, "user", "zeze", "sdp value")
      PeerFinding.upsert_perfect_negotiation_of_high_quality_stream(state.room, "user", "zeze", "sdp value2")
      assert %{"user" => %{"zeze" => %ParticipantMedia{high_quality: "sdp value2"}}} = :sys.get_state(state.room)
    end
  end
  describe "upsert_perfect_negotiation_of_low_quality_stream/4" do
    setup do
      {:ok, room_pid} = PeerFinding.start_link([])
      {:ok, room: room_pid}
    end
    test "should be able to upsert a low quality stream", state do
      PeerFinding.upsert_perfect_negotiation_of_low_quality_stream(state.room, "user", "zeze", "sdp value")
      assert %{"user" => %{"zeze" => %ParticipantMedia{low_quality: "sdp value"}}} = :sys.get_state(state.room)
    end
    test "should be able to update a low quality stream", state do
      PeerFinding.upsert_perfect_negotiation_of_low_quality_stream(state.room, "user", "zeze", "sdp value")
      PeerFinding.upsert_perfect_negotiation_of_low_quality_stream(state.room, "user", "zeze", "sdp value2")
      assert %{"user" => %{"zeze" => %ParticipantMedia{low_quality: "sdp value2"}}} = :sys.get_state(state.room)
    end
  end
  describe "upsert_perfect_negotiation_of_audio_only_stream/4" do
    setup do
      {:ok, room_pid} = PeerFinding.start_link([])
      {:ok, room: room_pid}
    end
    test "should be able to upsert a audio only stream", state do
      PeerFinding.upsert_perfect_negotiation_of_audio_only_stream(state.room, "user", "zeze", "sdp value")
      assert %{"user" => %{"zeze" => %ParticipantMedia{audio_only: "sdp value"}}} = :sys.get_state(state.room)
    end
    test "should be able to update a audio only stream", state do
      PeerFinding.upsert_perfect_negotiation_of_audio_only_stream(state.room, "user", "zeze", "sdp value")
      PeerFinding.upsert_perfect_negotiation_of_audio_only_stream(state.room, "user", "zeze", "sdp value2")
      assert %{"user" => %{"zeze" => %ParticipantMedia{audio_only: "sdp value2"}}} = :sys.get_state(state.room)
    end
  end
  describe "upsert_perfect_negotiation_of_screen_sharing_stream/4" do
    setup do
      {:ok, room_pid} = PeerFinding.start_link([])
      {:ok, room: room_pid}
    end
    test "should be able to upsert a screen sharing stream", state do
      PeerFinding.upsert_perfect_negotiation_of_screen_sharing_stream(state.room, "user", "zeze", "sdp value")
      assert %{"user" => %{"zeze" => %ParticipantMedia{screen_sharing: "sdp value"}}} = :sys.get_state(state.room)
    end
    test "should be able to update a screen sharing stream", state do
      PeerFinding.upsert_perfect_negotiation_of_screen_sharing_stream(state.room, "user", "zeze", "sdp value")
      PeerFinding.upsert_perfect_negotiation_of_screen_sharing_stream(state.room, "user", "zeze", "sdp value2")
      assert %{"user" => %{"zeze" => %ParticipantMedia{screen_sharing: "sdp value2"}}} = :sys.get_state(state.room)
    end
  end
  describe "join_call/3" do
    setup do
      {:ok, room_pid} = PeerFinding.start_link([])
      {:ok, room: room_pid}
    end
    test "is able to join an empty room and get no list of recommendations", state do
      assert {:ok, [], []} = PeerFinding.join_call(state.room, "user", "sdp value")
      assert %{data_channel: %{"user" => %DataChannel{room: "sdp value"}}} = :sys.get_state(state.room)
    end
    test "gets recommendation from room with members", state do
      PeerFinding.join_call(state.room, "user", "sdp value")
      assert {:ok, [{"user", "sdp value"}], ["user"]} = PeerFinding.join_call(state.room, "user1", "sdp value")
    end
    test "gets recommendation after multiple insertions", state do
      PeerFinding.join_call(state.room, "user", "sdp value")
      PeerFinding.join_call(state.room, "user1", "sdp value1")
      PeerFinding.update_data_channel_sdp_value(state.room, "user", "sdp value")
      assert {:ok, [{"user1", "sdp value1"},{"user", "sdp value"}], ["user1","user"]} = PeerFinding.join_call(state.room, "user2", "sdp value2")
    end
  end
  describe "remove_user/2" do
    setup do
      {:ok, room_pid} = PeerFinding.start_link([])
      PeerFinding.join_call(room_pid, "user", "sdp value")
      PeerFinding.join_call(room_pid, "user1", "sdp value1")
      PeerFinding.update_data_channel_sdp_value(room_pid, "user", "sdp value")
      {:ok, room: room_pid}
    end
    test "no-op for non-existing users", state do
      PeerFinding.remove_user(state.room, "user2")
      assert %{data_channel: %{"user" => %DataChannel{room: "sdp value"}, "user1" => %DataChannel{room: "sdp value1"}}} =
        :sys.get_state(state.room)
    end
    test "removes user and its nestings", state do
      PeerFinding.remove_user(state.room, "user1")
      assert %{data_channel: %{"user" => %DataChannel{room: "sdp value", members: %{}}}, screen_sharing: ""} ==
        :sys.get_state(state.room)
    end
    test "remove two users", state do
      PeerFinding.remove_user(state.room, "user")
      PeerFinding.remove_user(state.room, "user1")
      assert %{data_channel: %{}, screen_sharing: ""} == :sys.get_state(state.room)
    end
  end
end
