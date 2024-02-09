defmodule WebrtcL2L.SdpTable.PeerFinding do
  use GenServer, restart: :transient

  @timeout 600_000

  def start_link(options) do
    # [name: {:via, Registry, {WebrtcL2L.RouterRegistry, name}}] = options
    GenServer.start_link(__MODULE__, %{}, options)
  end

   @doc """
  Initialize a GenServer responsible for holding ICE Perfect Negotiations, the server state is simply a map where each key
  represents a streamer and as a value it contains another map with the following values:
  - :candidate - this value represents a high quality or low quality s
  """
  @impl true
  def init(_init_args) do
    {:ok, %{}, @timeout}
  end

  @impl true
  def handle_call({:create_stream, stream_type, streamer}, _, current_state) do
    case Map.get(current_state[stream_type], streamer) do
      nil ->
        graph_with_only_root = Graph.new() |> Graph.add_vertex(streamer)
        current_state = Kernel.put_in(current_state, [stream_type, streamer], graph_with_only_root)
        {:reply, self(), current_state, @timeout}
      _current_graph ->
        #TODO: consider rebuilding the graph in case of extreme failure or no-op?
        {:reply, self(), current_state, @timeout}
    end
  end

end
