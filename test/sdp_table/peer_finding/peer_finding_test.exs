defmodule SdpTable.PeerFinding.PeerFindingTest do
  use WebrtcL2LWeb.ConnCase, async: true
  alias WebrtcL2L.SdpTable.PeerFinding
  alias WebrtcL2L.SdpTable.MediaStructs.ParticipantMedia

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
end
