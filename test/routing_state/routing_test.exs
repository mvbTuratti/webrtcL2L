defmodule WebrtcL2LWeb.RoutingTest do
  alias WebrtcL2L.Routing.Recommendation
  alias WebrtcL2L.RoutingState.Routing
  use WebrtcL2LWeb.ConnCase, async: true

  describe "creating new state for a room" do
    setup do
      {:ok, room_pid} = Routing.start_link([])
      {:ok, room: room_pid}
    end
    test "successfully start up a room", state do
      assert %{high_quality: _, low_quality: _, audio_only: _, connection_quality: _} = :sys.get_state(state[:room])
    end
    test "adding one streamer", state do
      result = Routing.create_stream(state[:room], :create_high_quality_stream, "bolinha")
      assert :ok = result
      assert %{high_quality: %{"bolinha" => %Graph{}}} = :sys.get_state(state[:room])
    end
  end
end
