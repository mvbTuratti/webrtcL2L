defmodule WebrtcL2L.SdpTable.PeerFinding do
  use GenServer, restart: :transient
  alias WebrtcL2L.SdpTable.PerfectNegotiation


  @timeout 600_000

  def start_link(options) do
    # [name: {:via, Registry, {WebrtcL2L.RouterRegistry, name}}] = options
    GenServer.start_link(__MODULE__, %{}, options)
  end

  @doc """
  Initialize a GenServer responsible for holding ICE Perfect Negotiations, the server state is simply a map where each key
  represents a streamer and as a value it contains another map with %ParticipantMedia{:audio_only, :high_quality, :low_quality}
  For self-media data what you should expect is the following:
  ## Examples

      iex> WebrtcL2L.SdpTable.PeerFinding.upsert_perfect_negotiation_of_high_quality_stream(pid, "streamer", "streamer", "sdp value")
      %{"streamer" => %{"streamer" => %ParticipantMedia{high_quality: "sdp value", low_quality: "", audio_only: ""}}}

  """
  @impl true
  def init(_init_args) do
    {:ok, %{}, @timeout}
  end
  # def upsert_high_quality_value(current_sdp_state, user, routee, sdp_string_value) do
  @impl true
  def handle_cast({:create_sdp_channel, upsert_function, streamer, routee, sdp_string_value}, current_state) do
    new_state = upsert_function.(current_state, streamer, routee, sdp_string_value)
    {:noreply, new_state, @timeout}
  end
  @impl true
  def handle_call({:get_sdp_channel, get_function, streamer, routee}, _, current_state) do
    {:reply, get_function.(current_state, streamer, routee), current_state, @timeout}
  end

  @spec upsert_perfect_negotiation_of_high_quality_stream(pid(), String.t(), String.t(), String.t()) :: :ok
  def upsert_perfect_negotiation_of_high_quality_stream(pid, streamer, routee, sdp_string_value) do
    GenServer.cast(pid, {:create_sdp_channel, &PerfectNegotiation.upsert_high_quality_value/4, streamer, routee,sdp_string_value})
  end
  @spec upsert_perfect_negotiation_of_low_quality_stream(pid(), String.t(), String.t(), String.t()) :: :ok
  def upsert_perfect_negotiation_of_low_quality_stream(pid, streamer, routee, sdp_string_value) do
    GenServer.cast(pid, {:create_sdp_channel, &PerfectNegotiation.upsert_low_quality_value/4, streamer, routee,sdp_string_value})
  end
  @spec upsert_perfect_negotiation_of_audio_only_stream(pid(), String.t(), String.t(), String.t()) :: :ok
  def upsert_perfect_negotiation_of_audio_only_stream(pid, streamer, routee, sdp_string_value) do
    GenServer.cast(pid, {:create_sdp_channel, &PerfectNegotiation.upsert_audio_only_value/4, streamer, routee,sdp_string_value})
  end
  @spec upsert_perfect_negotiation_of_screen_sharing_stream(pid(), String.t(), String.t(), String.t()) :: :ok
  def upsert_perfect_negotiation_of_screen_sharing_stream(pid, streamer, routee, sdp_string_value) do
    GenServer.cast(pid, {:create_sdp_channel, &PerfectNegotiation.upsert_screen_sharing_value/4, streamer, routee,sdp_string_value})
  end

  @spec get_perfect_negotiation_of_screen_sharing_stream(pid(), String.t(), String.t()) :: {:ok, String.t} | {:missing_value, String.t}
  def get_perfect_negotiation_of_screen_sharing_stream(pid, streamer, routee) do
    GenServer.call(pid, {:get_sdp_channel, &PerfectNegotiation.get_screen_sharing_sdp_value/3, streamer, routee})
  end
  @spec get_perfect_negotiation_of_high_quality_stream(pid(), String.t(), String.t()) :: {:ok, String.t} | {:missing_value, String.t}
  def get_perfect_negotiation_of_high_quality_stream(pid, streamer, routee) do
    GenServer.call(pid, {:get_sdp_channel, &PerfectNegotiation.get_high_quality_sdp_value/3, streamer, routee})
  end
  @spec get_perfect_negotiation_of_low_quality_stream(pid(), String.t(), String.t()) :: {:ok, String.t} | {:missing_value, String.t}
  def get_perfect_negotiation_of_low_quality_stream(pid, streamer, routee) do
    GenServer.call(pid, {:get_sdp_channel, &PerfectNegotiation.get_low_quality_sdp_value/3, streamer, routee})
  end
  @spec get_perfect_negotiation_of_audio_only_stream(pid(), String.t(), String.t()) :: {:ok, String.t} | {:missing_value, String.t}
  def get_perfect_negotiation_of_audio_only_stream(pid, streamer, routee) do
    GenServer.call(pid, {:get_sdp_channel, &PerfectNegotiation.get_audio_sdp_value/3, streamer, routee})
  end

end
