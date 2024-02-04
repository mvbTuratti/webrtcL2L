defmodule WebrtcL2LWeb.RecommendationTest do
  alias WebrtcL2L.Routing.Recommendation
  use WebrtcL2LWeb.ConnCase, async: true

  # setup_all do
  #   {:ok, graph: Graph.new()}
  # end

  describe "testing base functionalities of Graph library" do
    setup do
      {:ok, graph: Graph.new()}
    end
    test "successfully add an edge", state do
      graph = state[:graph] |> Graph.add_edge(Graph.Edge.new(:a,:b))
      assert Graph.edges(graph) == [%Graph.Edge{v1: :a, v2: :b}]
    end
    test "sucessfully add two edges and calculate the shortest path", state do
      graph = state[:graph] |> Graph.add_edge(Graph.Edge.new(:a,:b))
              |> Graph.add_edge(Graph.Edge.new(:a,:c, weight: 5))
              |> Graph.add_edge(Graph.Edge.new(:b,:d))
              |> Graph.add_edge(Graph.Edge.new(:c,:d, weight: 2))

      assert Graph.dijkstra(graph,:a,:d) == [:a,:b,:d]
    end
    test "successfully retrieve shortest path for a node", state do
      graph = state[:graph] |> Graph.add_edge(Graph.Edge.new(:a,:b, weight: 10))
            |> Graph.add_edge(Graph.Edge.new(:a, :c, weight: 8))
            |> Graph.add_edge(Graph.Edge.new(:a, :d, weight: 11))
            |> Graph.add_edge(Graph.Edge.new(:c, :e, weight: 1))
            |> Graph.add_edge(Graph.Edge.new(:a, :f, weight: 15))
            |> Graph.add_edge(Graph.Edge.new(:e, :f, weight: 1))
      assert Graph.dijkstra(graph, :a, :f) == [:a, :c, :e, :f]
    end
  end

  describe "join_viewer/4" do
    setup do
      graph = Graph.new()
              |> Graph.add_edge(Graph.Edge.new("joao", "maria", weight: 2))
              |> Graph.add_edge(Graph.Edge.new("joao", "flavio", weight: 3))
              |> Graph.add_edge(Graph.Edge.new("maria", "zeze", weight: 1))
      {:ok, graph: graph}
    end
    test "should use root as streamer", state do
      weights = [{"joao", 1}, {"maria", 1}, {"flavio", 1}, {"zeze", 1}]
      {:ok, graph, streamer} = Recommendation.join_viewer(state[:graph],"joao","matheus", weights)
      assert streamer == "joao"
    end
    test "should use flavio as streamer", state do
      {:ok, graph, streamer} = Recommendation.join_viewer(state[:graph], "joao", "matheus", [{"flavio", 1}])
      assert streamer == "flavio"
    end
    test "should use zeze as streamer", state do
      weights = [{"joao", 6}, {"maria", 4}, {"flavio", 3}, {"zeze", 1}]
      {:ok, graph, streamer} = Recommendation.join_viewer(state[:graph], "joao", "matheus", weights)
      assert streamer == "zeze"
    end
    test "should only have vertices to streamer", state do
      weights = [{"joao", 6}, {"maria", 4}, {"flavio", 3}, {"zeze", 1}]
      {:ok, graph, streamer} = Recommendation.join_viewer(state[:graph], "joao", "matheus", weights)
      neighbors = Graph.neighbors(graph, "matheus")
      assert  neighbors == ["zeze"]
    end
    test "returns error if no weights are provided", state do
      {atom, _graph, streamer} = Recommendation.join_viewer(state[:graph], "joao", "matheus", [])
      assert atom == :missing_streamer
      assert streamer == nil
    end
    test "returns error if watcher only connects to peers not watching the stream", state do
      {atom, _graph, streamer} = Recommendation.join_viewer(state[:graph], "joao", "matheus", [{"cunha", 1}])
      assert atom == :missing_streamer
    end
  end
  describe "update_viewer_connections/2" do
    setup do
      graph = Graph.new()
              |> Graph.add_edge(Graph.Edge.new("joao", "maria", weight: 2))
              |> Graph.add_edge(Graph.Edge.new("joao", "flavio", weight: 3))
      {:ok, graph: graph}
    end
    test "update a single value", state do
      weights = [%{source: "joao", target: "maria", weight: 1}]
      graph = Recommendation.update_viewer_connections(state[:graph],weights)
      assert Graph.in_edges(graph, "maria") == [%Graph.Edge{v1: "joao", v2: "maria", weight: 1}]
    end
    test "ignore non-existing vertices", state do
      weights = [%{source: "joao", target: "rodolfo", weight: 1}]
      graph = Recommendation.update_viewer_connections(state[:graph],weights)
      assert Graph.out_edges(graph, "joao") == [%Graph.Edge{v1: "joao", v2: "maria", weight: 2}, %Graph.Edge{v1: "joao", v2: "flavio", weight: 3}]
      assert Graph.vertices(graph) |> Enum.sort() == ["joao", "maria", "flavio"] |> Enum.sort()
    end
    test "update two vertices", state do
      weights = [%{source: "joao", target: "maria", weight: 1}, %{source: "joao", target: "flavio", weight: 1}]
      graph = Recommendation.update_viewer_connections(state[:graph],weights)
      assert Graph.out_edges(graph, "joao") == [%Graph.Edge{v1: "joao", v2: "maria", weight: 1}, %Graph.Edge{v1: "joao", v2: "flavio", weight: 1}]
    end
  end
  describe "remove_viewer/2" do
    setup do
      graph = Graph.new()
              |> Graph.add_edge(Graph.Edge.new("joao", "maria", weight: 1))
              |> Graph.add_edge(Graph.Edge.new("maria", "flavio", weight: 1))
      {:ok, graph: graph}
    end
    test "remove a vertice successfully", state do
      {graph, _} = Recommendation.remove_viewer(state[:graph],"flavio")
      assert Graph.vertices(graph) == ["joao", "maria"]
    end
    test "removing a streamer should return the names of affected viewers", state do
      {graph, affected_viewers} = Recommendation.remove_viewer(state[:graph], "maria")
      assert affected_viewers == ["flavio"]
    end
  end
end
