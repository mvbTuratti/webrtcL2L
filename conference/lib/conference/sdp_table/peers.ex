defmodule Conference.SdpTable.Peers do
  use GenServer, restart: :transient

  @timeout 600_000

  # Starts the GenServer with two maps:
  # - pending: negotiations not yet matched.
  # - active: negotiations that have been matched.
  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, %{pending: %{}, active: %{}}, opts)
  end

  @doc """
  Idempotently join a negotiation and fetch pending negotiations.

  Parameters:
    - hash: a unique identifier for this negotiation entry.
    - sdp: the session description.
    - channel_pid: the caller’s channel PID.
    - connection_type: a string indicating the type of connection.

  Behavior:
    1. If an entry for this hash doesn’t exist in pending or active, it is added.
    2. All pending negotiations (except the caller’s own) are fetched and marked as active
       by associating them with the caller’s channel PID.
    3. Returns a map of matched negotiations.
  """
  def join_negotiation(pid \\ __MODULE__, hash, sdp, channel_pid, connection_type) do
    GenServer.call(pid, {:join_negotiation, hash, sdp, channel_pid, connection_type})
  end

  @doc """
  Updates the ICE candidate for the negotiation entry identified by hash.

  If the entry is active (i.e. already matched and with a consumer channel PID),
  the ICE diff is sent directly to that PID. Otherwise, the diff is appended to the stored list.
  """
  def update_ice(pid \\ __MODULE__, hash, new_ice) do
    GenServer.call(pid, {:update_ice, hash, new_ice})
  end

  @doc """
  Deletes a negotiation entry identified by hash from either the pending or active state.
  """
  def delete_entry(pid \\ __MODULE__, hash) do
    GenServer.call(pid, {:delete_entry, hash})
  end

  # Server callbacks

  @impl true
  def init(state) do
    {:ok, state, @timeout}
  end

  @impl true
  def handle_call({:join_negotiation, hash, sdp, channel_pid, connection_type}, _from, state) do
    state = maybe_insert_entry(hash, sdp, channel_pid, connection_type, state)

    {matches, new_state} =
      case connection_type do
        "data" -> try_auto_match(hash, state, channel_pid)
        _ -> {nil, state}
      end

    {:reply, matches || %{}, new_state}
  end

  defp maybe_insert_entry(hash, sdp, channel_pid, connection_type, state) do
    if Map.has_key?(state.pending, hash) or Map.has_key?(state.active, hash) do
      state
    else
      entry = %{
        sdp: sdp,
        ice: [],
        creator_pid: channel_pid,
        connection_type: connection_type,
        partner_pid: nil
      }
      %{state | pending: Map.put(state.pending, hash, entry)}
    end
  end

  # Adjusted auto matching: only move other pending entries to active.
  defp try_auto_match(joining_hash, state, joining_channel_pid) do
    {to_match, remaining_pending} =
      state.pending
      |> Enum.split_with(fn {key, entry} ->
        key != joining_hash and entry.connection_type == "data"
      end)
      |> then(fn {match_list, rest} -> {Map.new(match_list), Map.new(rest)} end)

    if map_size(to_match) > 0 do
      active_matches =
        Enum.into(to_match, %{}, fn {key, entry} ->
          # Set partner_pid to the joining peer's PID
          {key, Map.put(entry, :partner_pid, joining_channel_pid)}
        end)

      # Do not move the joining entry; leave it in pending.
      new_state = %{
        state
        | pending: Map.put(remaining_pending, joining_hash, state.pending[joining_hash]),
          active: Map.merge(state.active, active_matches)
      }
      {active_matches, new_state}
    else
      {nil, state}
    end
  end

  @impl true
  def handle_call({:update_ice, hash, new_ice}, _from, state) do
    cond do
      Map.has_key?(state.active, hash) ->
        entry = state.active[hash]
        if entry.partner_pid do
          send(entry.partner_pid, {:ice_update, hash, new_ice})
          {:reply, :ok, state}
        else
          updated_entry = Map.update!(entry, :ice, fn ice -> [new_ice | ice] end)
          new_active = Map.put(state.active, hash, updated_entry)
          {:reply, :ok, %{state | active: new_active}}
        end

      Map.has_key?(state.pending, hash) ->
        entry = state.pending[hash]
        updated_entry = Map.update!(entry, :ice, fn ice -> [new_ice | ice] end)
        new_pending = Map.put(state.pending, hash, updated_entry)
        {:reply, :ok, %{state | pending: new_pending}}

      true ->
        {:reply, {:error, :not_found}, state}
    end
  end


  # Handle deletion of an entry (from pending or active).
  @impl true
  def handle_call({:delete_entry, hash}, _from, state) do
    cond do
      Map.has_key?(state.pending, hash) ->
        new_pending = Map.delete(state.pending, hash)
        {:reply, :ok, %{state | pending: new_pending}}

      Map.has_key?(state.active, hash) ->
        new_active = Map.delete(state.active, hash)
        {:reply, :ok, %{state | active: new_active}}

      true ->
        {:reply, {:error, :not_found}, state, @timeout}
    end
  end

  @impl true
  def handle_info(:timeout, state) do
    {:stop, :normal, state}
  end
end
