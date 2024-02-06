defmodule WebrtcL2LWeb.RoutingTest do
  alias WebrtcL2L.Routing.Recommendation
  alias WebrtcL2L.RoutingState.Routing
  use WebrtcL2LWeb.ConnCase, async: true

  describe "create_stream/3" do
    setup do
      {:ok, room_pid} = Routing.start_link([])
      {:ok, room: room_pid}
    end
    test "successfully start up a room", state do
      assert %{high_quality: _, low_quality: _, audio_only: _, connection_quality: _} = :sys.get_state(state[:room])
    end
    test "adding one streamer", state do
      _pid = Routing.create_stream(state[:room], :high_quality, "bolinha")
      assert %{high_quality: %{"bolinha" => %Graph{}}} = :sys.get_state(state[:room])
    end
    test "adding new member to an stream without having established a connection results in error", state do
      _result = Routing.create_stream(state[:room], :high_quality, "fulano")
      assert {:missing_streamer, []} = Routing.join_stream(state[:room], "fulano", "ciclano")
    end
    test "create all possible stream types", state do
      _result = Routing.create_stream(state[:room], :high_quality, "fulano")
        |> Routing.create_stream(:low_quality, "fulano")
        |> Routing.create_stream(:audio_only, "fulano")
      assert %{high_quality: %{"fulano" => %Graph{}},
              low_quality: %{"fulano" => %Graph{}},
              audio_only: %{"fulano" => %Graph{}}} = :sys.get_state(state[:room])
    end
    test "creating two streams in the same type", state do
      _result = Routing.create_stream(state[:room], :high_quality, "fulano")
        |> Routing.create_stream(:high_quality, "ciclano")
      assert %{high_quality: %{"fulano" => %Graph{}, "ciclano" => %Graph{}}} = :sys.get_state(state[:room])
    end
    test "creating the same streamer is a no-op", state do
      _result = Routing.create_stream(state[:room], :high_quality, "fulano")
        |> Routing.create_stream(:high_quality, "fulano")
      assert %{high_quality: %{"fulano" => %Graph{}}} = :sys.get_state(state[:room])
    end
  end
  describe "upsert_connection_quality/2" do
    setup do
      {:ok, room_pid} = Routing.start_link([])
      base_connections = [%{source: "fulano", target: "ciclano", weight: 1}]
      {:ok, %{room: room_pid, conn: base_connections}}
    end
    test "creates a connection between two elements", state do
      _ = Routing.upsert_connection_quality(state[:room], state[:conn])
      # assert %{connection_quality: %Graph{}} = :sys.get_state(state[:room])
      assert ["ciclano", "fulano"] |> Enum.sort() ==
        :sys.get_state(state[:room]) |> Map.get(:connection_quality) |> Graph.vertices() |> Enum.sort()
    end
    test "creates new connection and updates existing one", state do
      _ = Routing.upsert_connection_quality(state[:room], state[:conn])
        |> Routing.upsert_connection_quality([%{source: "fulano", target: "ciclano", weight: 2},
        %{source: "ciclano", target: "beltrano", weight: 2}])
      %{connection_quality: conn} = :sys.get_state(state[:room])
      assert ["fulano","ciclano", "beltrano"] |> Enum.sort() == Graph.vertices(conn) |> Enum.sort()
      assert [%Graph.Edge{label: nil, v1: "fulano", v2: "ciclano", weight: 2}, %Graph.Edge{
        label: nil,v1: "ciclano", v2: "beltrano", weight: 2}] |> Enum.sort() == Graph.edges(conn, "ciclano") |> Enum.sort()
    end
  end
  describe "join_stream/2" do
    setup do
      {:ok, room_pid} = Routing.start_link([])
      base_connections = [%{source: "fulano", target: "ciclano", weight: 1},
                          %{source: "ciclano", target: "beltrano", weight: 2},
                          %{source: "beltrano", target: "fulano", weight: 1}]
      Routing.upsert_connection_quality(room_pid, base_connections)
        |> Routing.create_stream(:high_quality, "fulano")
        |> Routing.create_stream(:high_quality, "ciclano")
        |> Routing.create_stream(:high_quality, "beltrano")
      {:ok, room: room_pid}
    end
    test "user gets a recommendation when joining a stream", state do
      {status, recommendation} = Routing.join_stream(state[:room], :high_quality, "fulano", "ciclano")
      assert recommendation == "fulano"
      assert status == :ok
    end
  end
end
