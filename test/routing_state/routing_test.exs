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
    test "users gets a complex recommendation when joining stream", state do
      state[:room]
        |> Routing.upsert_connection_quality([%{source: "a", target: "b", weight: 10},
          %{source: "a", target: "c", weight: 1},
          %{source: "c", target: "e", weight: 2},
          %{source: "a", target: "f", weight: 8},
          %{source: "e", target: "b", weight: 1}])
        |> Routing.create_stream(:high_quality, "a")
      c_r = state[:room] |> Routing.join_stream(:high_quality,"a", "c")
      e_r = state[:room] |> Routing.join_stream(:high_quality,"a", "e")
      f_r = state[:room] |> Routing.join_stream(:high_quality,"a", "f")
      b_r = state[:room] |> Routing.join_stream(:high_quality,"a", "b")
      assert {:ok, "a"} = c_r
      assert {:ok, "c"} = e_r
      assert {:ok, "a"} = f_r
      assert {:ok, "e"} = b_r
    end
  end
  describe "leave_stream/2" do
    setup do
      {:ok, room_pid} = Routing.start_link([])
      base_connections = [%{source: "fulano", target: "ciclano", weight: 1},
                          %{source: "ciclano", target: "beltrano", weight: 2},
                          %{source: "beltrano", target: "fulano", weight: 1},
                         %{source: "fulano", target: "beltrano", weight: 10}]
      room_pid = Routing.upsert_connection_quality(room_pid, base_connections)
                |> Routing.create_stream(:high_quality, "fulano")

      _ = Routing.join_stream(room_pid, :high_quality,"fulano", "ciclano")
      _ = Routing.join_stream(room_pid, :high_quality,"fulano", "beltrano")
      {:ok, room: room_pid}
    end
    test "when user leaves, all of its children should be added with new direct streamers", state do
      graph = :sys.get_state(state[:room])
      assert [%{v1: "ciclano"}] = Graph.in_edges(graph[:high_quality]["fulano"], "beltrano")
      assert {:ok, [{:ok, "beltrano", "fulano"}]} = Routing.leave_stream(state[:room],:high_quality,"fulano", "ciclano")
    end
    test "code should correctly point out when there's no option for children of absent parent", state do
      room_pid = Routing.upsert_connection_quality(state[:room], [%{source: "ciclano", target: "zeze", weight: 1}])
      assert {:ok, "ciclano"} = Routing.join_stream(room_pid, :high_quality,"fulano","zeze")
      assert {:ok, [{:missing_streamer, "zeze", "fulano"}, {:ok, "beltrano", "fulano"}]} = Routing.leave_stream(room_pid, :high_quality, "fulano", "ciclano")
    end
  end
end
