defmodule Conference.SdpTable.PeerFinding do
  use GenServer, restart: :transient
  alias Conference.SdpTable.PerfectNegotiation
  alias Conference.SdpTable.MediaStructs.DataChannel


  @timeout 600_000

  def start_link(options) do
    # [name: {:via, Registry, {Conference.RouterRegistry, name}}] = options
    GenServer.start_link(__MODULE__, %{}, options)
  end

  @doc """
  Initialize a GenServer responsible for holding ICE Perfect Negotiations, the server state is simply a map where each key
  represents a streamer and as a value it contains another map with %ParticipantMedia{:audio_only, :high_quality, :low_quality}
  For self-media data what you should expect is the following:
  ## Examples

      iex> Conference.SdpTable.PeerFinding.upsert_perfect_negotiation_of_high_quality_stream(pid, "streamer", "streamer", "sdp value")
      %{"streamer" => %{"streamer" => %ParticipantMedia{high_quality: "sdp value", low_quality: "", audio_only: "", screen_sharing: ""}}}

  """
  @impl true
  def init(_init_args) do
    {:ok, %{screen_sharing: "", data_channel: %{}}, @timeout}
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
  def handle_call({:update_sdp_data_channel, user, sdp_string_value}, _, current_state) do
    case Map.get(current_state[:data_channel], user, nil) do
      nil ->
        current_state = Kernel.put_in(current_state, [:data_channel, user], DataChannel.create_new_data_channel(sdp_string_value))
        {:reply, :ok, current_state, @timeout}
      user_data_channel ->
        new_state = Kernel.put_in(current_state, [:data_channel, user], DataChannel.set_room_value(user_data_channel, sdp_string_value))
        {:reply, :ok, new_state, @timeout}
    end
  end
  def handle_call({:join_room, new_member, sdp_string_value}, _, current_state) do
    {new_state, users_sdp, affected_users} =
      Map.keys(current_state[:data_channel])
        |> Enum.reduce({current_state, [], []}, fn current_user_name, {new_state, list_of_user_and_sdp, list_of_affected_users} ->
          {:ok, a_user_data_channel, sdp_value} = DataChannel.user_joining(new_state[:data_channel][current_user_name], new_member)
          {Kernel.put_in(new_state, [:data_channel, current_user_name], a_user_data_channel), [{current_user_name, sdp_value} | list_of_user_and_sdp], [current_user_name | list_of_affected_users]}
        end)
    new_state = Kernel.put_in(new_state, [:data_channel, new_member], DataChannel.create_new_data_channel(sdp_string_value)) #set PN for user
    {:reply, {:ok, users_sdp, affected_users}, new_state, @timeout}
  end
  def handle_call({:user_leaving, user}, _, current_state) do
    new_state =
      Map.keys(current_state[:data_channel])
       |> Enum.reduce(current_state, fn current_user_name, new_state ->
        data_media = DataChannel.remove_partner(new_state[:data_channel][current_user_name], user)
        Kernel.put_in(new_state, [:data_channel, current_user_name], data_media)
      end)
    {_, new_data_channel_state} = Map.pop(new_state[:data_channel], user) # Remove the user as key
    {:reply, :ok, %{new_state | data_channel: new_data_channel_state}, @timeout}
  end
  @impl true
  def handle_info(:timeout, state) do
    {:stop, :normal, state}
  end

 # Client exposed functions

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
  @spec upsert_perfect_negotiation_of_data_channel_stream(pid(), String.t(), String.t(), String.t()) :: :ok
  def upsert_perfect_negotiation_of_data_channel_stream(pid, streamer, routee, sdp_string_value) do
    GenServer.cast(pid, {:create_sdp_data_channel, streamer, routee,sdp_string_value})
  end
  @spec get_perfect_negotiation_of_data_channel_stream(pid(), String.t(), String.t()) :: {:ok, String.t} | {:missing_value, String.t}
  def get_perfect_negotiation_of_data_channel_stream(pid, streamer, routee) do
    GenServer.call(pid, {:get_sdp_data_channel, streamer, routee})
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
  @doc """
    This function expects GenServer's PID, the user name and the user SDP value for a future data channel link.
    Will respond with a tuple :ok as first parament, second a list of tuples where {Name, SDP Perfect Negotiation} and third value
    is a list of affected users as to make calls to front-end in the future for setting up new Perfect Negotiation calls.
  """
  @spec join_call(pid(), String.t(), String.t()) :: {:ok, [{String.t(), String.t()}], [String.t()]}
  def join_call(pid, streamer), do: GenServer.call(pid, {:join_room, streamer, ""})
  def join_call(pid, streamer, sdp_value), do: GenServer.call(pid, {:join_room, streamer, sdp_value})

  @spec update_data_channel_sdp_value(pid(), String.t(), String.t()) :: :ok
  def update_data_channel_sdp_value(pid, streamer, sdp_value), do: GenServer.call(pid, {:update_sdp_data_channel, streamer, sdp_value})
  @spec remove_user(pid(), String.t()) :: :ok
  def remove_user(pid, watcher), do: GenServer.call(pid, {:user_leaving, watcher})
end
