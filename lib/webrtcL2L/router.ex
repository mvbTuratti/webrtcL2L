defmodule WebrtcL2L.Router do
  use GenServer, restart: :transient
  # alias WebrtcL2L.Graph
  # defstruct graph: %Graph{}

  @timeout 600_000

  def start_link(_options) do
    GenServer.start_link(__MODULE__, @timeout)
  end

  # Initialize the server state with an empty graph
  @impl true
  def init(_) do
    {:ok, :digraph.new, @timeout}
  end

  # Add a vertex to the graph
  def add_vertex(vertex, state) do
    {:ok, :digraph.add_vertex(state, vertex)}
  end

  # Add an edge to the graph
  def add_edge(from, to, weight, state) do
    {:ok, :digraph.add_edge(state, from, to, weight)}
  end

  # Remove a vertex from the graph
  def remove_vertex(vertex, state) do
    {:ok, :digraph.del_vertex(state, vertex)}
  end

  # Remove an edge from the graph
  def remove_edge(edge, state) do
    {:ok, :digraph.del_edge(state, edge)}
  end

  # Calculate the shortest path between all pairs of nodes
  def all_pairs_shortest_path(state) do
    paths = for node1 <- :digraph.vertices(state), node2 <- :digraph.vertices(state), do:
      {:shortest_path, :digraph.get_short_path(state, node1, node2)}
    {:ok, paths}
  end

  @impl true
  def handle_call(:router, _, router) do
    {:reply, router, router, @timeout}
  end

  @impl true
  def handle_cast({:info, source}, router) do
    IO.inspect(source)
    {:noreply, router, @timeout}
  end
end
# Start the GenServer
# {:ok, pid} = GraphServer.start_link()

# # Add some vertices and edges to the graph
# GraphServer.add_vertex(pid, :node1)
# GraphServer.add_vertex(pid, :node2)
# GraphServer.add_vertex(pid, :node3)
# GraphServer.add_edge(pid, :node1, :node2, 5)
# GraphServer.add_edge(pid, :node2, :node3, 3)
# GraphServer.add_edge(pid, :node1, :node3, 2)

# # Calculate the shortest path between all pairs of nodes
# {:ok, paths} = GraphServer.all_pairs_shortest_path(pid)
