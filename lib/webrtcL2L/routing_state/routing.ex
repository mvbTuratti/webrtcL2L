defmodule WebrtcL2L.RoutingState.Routing do
  use GenServer, restart: :transient
  alias WebrtcL2L.Routing.Recommendation

  @timeout 600_000

  def start_link(options) do
    # [name: {:via, Registry, {WebrtcL2L.RouterRegistry, name}}] = options
    GenServer.start_link(__MODULE__, %{}, options)
  end

  # Initialize the server state with an empty graph
  @impl true
  def init(_init_args) do
    {:ok, %{high_quality: %{}, low_quality: %{}, audio_only: %{}, connection_quality: Graph.new()}, @timeout}
  end

  @impl true
  def handle_call(:create_high_quality_stream, streamer, current_state) do
    current_state = Kernel.put_in(current_state, [:high_quality, streamer], Graph.new())
    {:reply, :ok, current_state, @timeout}
  end
  @impl true
  def handle_call(:create_low_quality_stream, streamer, current_state) do
    current_state = Kernel.put_in(current_state, [:low_quality, streamer], Graph.new())
    {:reply, :ok, current_state, @timeout}
  end
  @impl true
  def handle_call(:create_audio_only_stream, streamer, current_state) do
    current_state = Kernel.put_in(current_state, [:audio_only, streamer], Graph.new())
    {:reply, :ok, current_state, @timeout}
  end
  def handle_call(:add_viewer_high_quality, {streamer, viewer}, current_state) do
    incoming_references = current_state[:connection_quality]
      |> Graph.in_edges(viewer)
      |> Enum.map(fn %{v1: source, weight: weight} -> {source, weight} end)
    {status, high_quality_stream, recommendation} = Recommendation.join_viewer(current_state[:high_quality], streamer, viewer, incoming_references)
    current_state = Kernel.put_in(current_state, [:high_quality, streamer], high_quality_stream)
    {:reply, {status, recommendation}, current_state, @timeout}
  end
  # @impl true
  # def handle_cast({:info, _source}, router) do
  #   # IO.inspect(source)
  #   {:noreply, router, @timeout}
  # end
end
