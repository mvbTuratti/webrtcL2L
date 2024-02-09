defmodule WebrtcL2L.RoutingState.Routing do
  use GenServer, restart: :transient
  alias WebrtcL2L.Routing.Recommendation

  @timeout 600_000

  def start_link(options) do
    # [name: {:via, Registry, {WebrtcL2L.RouterRegistry, name}}] = options
    GenServer.start_link(__MODULE__, %{}, options)
  end

  # Initialize the server state connections, connection quality is a graph representing custom data metrics, others forests
  @impl true
  def init(_init_args) do
    {:ok, %{high_quality: %{}, low_quality: %{}, audio_only: %{}, connection_quality: Graph.new()}, @timeout}
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
  def handle_call({:add_viewer, stream_type, streamer, viewer}, _, current_state) do
    incoming_references = get_incoming_quality_streams_of_user(current_state[:connection_quality], viewer)
    {status, graph, recommendation} =
      Map.get(current_state[stream_type], streamer)
      |> Recommendation.join_viewer(streamer, viewer, incoming_references)
    case status do
      :missing_streamer -> {:reply, {:missing_streamer, nil}, current_state, @timeout}
      :ok ->
        current_state = Kernel.put_in(current_state, [stream_type, streamer], graph)
        {:reply, {status, recommendation}, current_state, @timeout}
    end
  end
  def handle_call({:update_connection_quality, weights}, _, current_state) do
    connection_quality =
      Enum.reduce(weights, current_state[:connection_quality],
        fn %{source: source, target: target, weight: weight}, graph ->
          case Graph.update_edge(graph, source, target, weight: weight) do
            {:error, :no_such_edge} ->
              Graph.add_edge(graph, Graph.Edge.new(source, target, weight: weight))
            graph ->
              graph
          end
      end)
    {:reply, self(), Map.put(current_state, :connection_quality, connection_quality), @timeout}
  end
  def handle_call({:leave_stream, type_of_stream, streamer, viewer}, _, current_state) do
    case _is_user_streaming(current_state, type_of_stream, streamer) do
      nil ->
        {:reply, {:missing_streamer, []}, current_state, @timeout}
      graph ->
        {graph, affected_users} = Recommendation.remove_viewer(graph, viewer)
        {graph, recommendations} = _get_new_recommendation_for_users(graph, current_state[:connection_quality], affected_users, streamer)
        new_state = Kernel.put_in(current_state, [type_of_stream, streamer], graph)
        {:reply, {:ok, recommendations}, new_state, @timeout}
    end
  end
  defp _get_new_recommendation_for_users(graph, connection_quality, list_of_affected_users, streamer) do
    Enum.reduce(list_of_affected_users, {graph, []}, fn (viewer, {graph, recommendations}) ->
      incoming_references = get_incoming_quality_streams_of_user(connection_quality, viewer)
      {status, graph, recommendation} = Recommendation.join_viewer(graph, streamer, viewer, incoming_references)
      case status do
        :missing_streamer -> {graph, [{:missing_streamer, viewer, streamer} | recommendations ]}
        :ok ->
          {graph, [{:ok, viewer, recommendation} | recommendations ]}
      end
    end)
  end
  defp _is_user_streaming(current_state, stream_type, streamer), do: Map.get(current_state[stream_type], streamer)
  defp get_incoming_quality_streams_of_user(connection_quality, viewer) do
    connection_quality
      |> Graph.in_edges(viewer)
      |> Enum.map(fn %{v1: source, weight: weight} -> {source, weight} end)
  end
  @spec create_stream(pid(), :high_quality | :low_quality | :audio_only, String.t()) :: pid()
  def create_stream(pid, :high_quality = type, streamer), do: GenServer.call(pid, {:create_stream, type, streamer})
  def create_stream(pid, :low_quality = type, streamer), do: GenServer.call(pid, {:create_stream, type, streamer})
  def create_stream(pid, :audio_only = type, streamer), do: GenServer.call(pid, {:create_stream, type, streamer})

  @spec join_stream(pid(), :high_quality | :low_quality | :audio_only, String.t(), String.t()) :: {:ok, String.t()} | {:missing_streamer, []}
  def join_stream(pid, :high_quality, streamer, viewer), do: GenServer.call(pid, {:add_viewer, :high_quality, streamer, viewer})

  @spec upsert_connection_quality(pid(), [%{source: String.t(), target: String.t(), weight: pos_integer()|pos_integer()}]) :: pid()
  def upsert_connection_quality(pid, new_weights), do: GenServer.call(pid, {:update_connection_quality, new_weights})

  @spec leave_stream(pid(), :high_quality|:low_quality, String.t(), String.t()) :: {:ok, [{:ok, String.t(), String.t()}|{:missing_parent, String.t(), String.t()}]}
  def leave_stream(pid, :high_quality, streamer, viewer), do: GenServer.call(pid, {:leave_stream, :high_quality, streamer, viewer})
  def leave_stream(pid, :low_quality, streamer, viewer), do: GenServer.call(pid, {:leave_stream, :low_quality, streamer, viewer})
  # @impl true
  # def handle_cast({:info, _source}, router) do
  #   # IO.inspect(source)
  #   {:noreply, router, @timeout}
  # end
end
