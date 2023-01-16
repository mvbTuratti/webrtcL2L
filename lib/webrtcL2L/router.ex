defmodule WebrtcL2L.Router do
  use GenServer, restart: :transient
  alias WebrtcL2L.Graph


  @timeout 600_000

  def start_link(options) do
    # [name: {:via, Registry, {WebrtcL2L.RouterRegistry, name}}] = options
    GenServer.start_link(__MODULE__, %Graph{}, options)
  end

  # Initialize the server state with an empty graph
  @impl true
  def init(graph) do
    digraph = :digraph.new([:acyclic, :private])
    {:ok, {digraph, graph}, @timeout}
  end

  # Add a vertex to the graph
  def add_vertex(%{"id" => vertex, "pc" => payload}, digraph,  graph) do
    graph = Graph.add_vertex(graph, vertex, payload)
    :digraph.add_vertex(digraph, vertex)
    {:ok, {digraph, graph}}
  end

  def list_sdps(graph, cid) do
    graph = Graph.list_sdps(graph, cid)
    # IO.inspect(graph)
    {:ok, graph}
  end
  # Add an edge to the graph
  def add_edge(from, to, weight, state) do
    {:ok, :digraph.add_edge(state, from, to, weight)}
  end

  # Remove a vertex from the graph
  def remove_vertex(vertex, digraph, graph) do
    graph = Graph.remove_vertex(graph, vertex)
    :digraph.del_vertex(digraph, vertex)
    :digraph.info(digraph)
    {:ok, {digraph, graph}}
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
  def handle_call({:add_node, %{"id" => cid} = icecandidate}, _from, {digraph, graph}) do
    {:ok, {digraph, graph}} = add_vertex(icecandidate, digraph,graph)
    %{sdps: sdps} =  graph
    ice_response = sdps |> Map.to_list() |> Enum.filter(fn {candidate, _} -> candidate !== cid end)
    {:reply, ice_response, {digraph, graph}, @timeout}
  end

  @impl true
  def handle_call({:list_nodes, %{"id" => cid}}, _, {digraph, graph}) do
    # IO.inspect(graph)
    {:ok, graph} = list_sdps(graph, cid)
    {:reply, graph, {digraph, graph}, @timeout}
  end

  @impl true
  def handle_call({:remove_node, cid}, _from, {digraph, graph}) do
    {:ok, {digraph, graph}} = remove_vertex(cid, digraph,graph)
    {:reply, :ok, {digraph, graph}, @timeout}
  end

  @impl true
  def handle_cast({:info, source}, router) do
    # IO.inspect(source)
    {:noreply, router, @timeout}
  end
end
# Start the GenServer
# {:ok, pid} = WebrtcL2L.start_link()

# # Add some vertices and edges to the graph
# WebrtcL2L.add_vertex(pid, :node1)
# WebrtcL2L.add_vertex(pid, :node2)
# WebrtcL2L.add_vertex(pid, :node3)
# WebrtcL2L.add_edge(pid, :node1, :node2, 5)
# WebrtcL2L.add_edge(pid, :node2, :node3, 3)
# WebrtcL2L.add_edge(pid, :node1, :node3, 2)

# # Calculate the shortest path between all pairs of nodes
# {:ok, paths} = WebrtcL2L.all_pairs_shortest_path(pid)
