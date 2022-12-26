defmodule WebrtcL2L.Router do
  use GenServer, restart: :transient


  @timeout 600_000

  def start_link(options) do
    [name: {:via, Registry, {WebrtcL2L.RouterRegistry, name}}] = options
    GenServer.start_link(__MODULE__,name, options)
  end

  # Initialize the server state with an empty graph
  @impl true
  def init(_name) do
    icetable = :ets.new(:icecandidates, [:set, :protected])
    digraph = :digraph.new([:acyclic, :private])
    {:ok, {digraph, icetable}, @timeout}
  end

  # Add a vertex to the graph
  def add_vertex(%{"id" => vertex, "pc" => payload}, digraph, icetable) do
    :ets.insert(icetable, {vertex, %{"pc" => payload}})
    _d = :digraph.add_vertex(digraph, vertex)
    {:ok, digraph}
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

  def get_icecandidates(icetable, vertex) do
    filter = [{{:"$1", :"$2"}, [{:"/=", :"$1", vertex}], [{{:"$1", :"$2"}}]}]
    :ets.select(icetable, filter)
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
  def handle_call({:add_node, %{"id" => cid} = icecandidate}, _from, {digraph, icetable}) do
    {:ok, digraph} = add_vertex(icecandidate, digraph,icetable)
    ice_response = get_icecandidates(icetable, cid)
    {:reply, ice_response, {digraph, icetable}, @timeout}
  end

  @impl true
  def handle_cast({:info, source}, router) do
    IO.inspect(source)
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
