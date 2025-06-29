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
  * hash: a unique identifier for this negotiation entry.
  * sdp: the session description.
  * channel_pid: the caller’s channel PID.
  * connection_type: a string indicating the type of connection.
  1. If an entry for this hash doesn’t exist in pending or active, it is added.
  2. All pending negotiations (except the caller’s own) are fetched and marked as active
      by associating them with the caller’s channel PID.
  3. Returns a map of matched negotiations.
  """
  def join_negotiation(pid \\ __MODULE__, hash, sdp, channel_pid, connection_type \\ "data", refill \\ false, name \\ "user", opts \\ []) do
    GenServer.call(pid, {:join_negotiation, hash, sdp, channel_pid, connection_type, refill, name, opts})
  end

  @doc """

  """
  def request_media_specific(pid \\ __MODULE__, pid_user, media_type, pid_self) do
    GenServer.call(pid, {:request_media, pid_user, media_type, pid_self})
  end
  @doc """
  Updates the ICE candidate for the negotiation entry identified by hash.

  If the entry is active (i.e. already matched and with a consumer channel PID),
  the ICE diff is sent directly to that PID. Otherwise, the diff is appended to the stored list.
  """
  def update_ice(pid \\ __MODULE__, hash, new_ice, user_pid) do
    GenServer.call(pid, {:update_ice, hash, new_ice, user_pid})
  end

  @doc """
  Deletes a negotiation entry identified by hash from either the pending or active state.
  """
  def delete_entry(pid \\ __MODULE__, hash) do
    GenServer.call(pid, {:delete_entry, hash})
  end

  def remove_user(pid \\ __MODULE__, pid_user) do
    GenServer.call(pid, {:delete_user, pid_user})
  end

  # Server callbacks

  @impl true
  def init(state) do
    {:ok, state, @timeout}
  end

  @impl true
  def handle_call({:request_media, pid_user, media_type, pid_self}, _from, state) do
    case does_user_have_media?(pid_user, media_type, state) do
      {found_hash, _value} ->
        {popped_entry, new_pending_map} = Map.pop(state.pending, found_hash)
        updated_with_self_pid = %{popped_entry | partner_pid: pid_self}
        new_state = %{state | pending: new_pending_map, active: Map.put(state.active, found_hash, updated_with_self_pid)}
        {:reply, %{found_hash => updated_with_self_pid}, new_state, @timeout}
      nil ->
        {:reply, nil, state, @timeout}
    end
  end
  @impl true
  def handle_call({:update_ice, hash, new_ice, user_pid}, _from, state) do
    # IO.inspect({hash, new_ice}, label: "Here in handle call")
    cond do
      Map.has_key?(state.active, hash) ->
        entry = state.active[hash]
        cond do
          entry.partner_pid != user_pid ->
              IO.inspect({entry.partner_pid}, label: "Sending message for ICE update")
              send(entry.partner_pid, {:private_message, %{protocol: :ice_update, hash: hash, ice: new_ice}})
              {:reply, {:ok, :success}, state, @timeout}
          entry.creator_pid != user_pid ->
              IO.inspect({entry.creator_pid}, label: "Sending message for ICE update")
              send(entry.creator_pid, {:private_message, %{protocol: :ice_update, hash: hash, ice: new_ice}})
              {:reply, {:ok, :success}, state, @timeout}
        end

      Map.has_key?(state.pending, hash) ->
        # IO.inspect(state.pending[hash], label: "Updating pending entry")
        entry = state.pending[hash]
        updated_entry = Map.update!(entry, :ice, fn existing_ice ->
          normalized_new_ice = List.wrap(new_ice)
          (normalized_new_ice ++ existing_ice) |> Enum.uniq()
        end)
        new_pending = Map.put(state.pending, hash, updated_entry)
        # IO.inspect(new_pending, label: "New pending entry")
        {:reply, {:ok, :success}, %{state | pending: new_pending}, @timeout}

      true ->
        IO.inspect({:update_ice, hash, new_ice, user_pid}, label: "ERROR in handle call of PEERS ICE UPDATE")
        {:reply, {:error, :not_found}, state, @timeout}
    end
  end
  @impl true
  def handle_call({:join_negotiation, hash, sdp, channel_pid, connection_type, refill, name, opts}, _from, state) do
    state = maybe_insert_entry(hash, sdp, channel_pid, connection_type, state, name)

    {matches, new_state} =
      case connection_type do
        "data" -> try_auto_match(hash, state, channel_pid, refill, opts)
        _ -> {nil, state}
      end

    {:reply, matches || %{}, new_state, @timeout}
  end


  # Handle deletion of an entry (from pending or active).
  @impl true
  def handle_call({:delete_entry, hash}, _from, state) do
    cond do
      Map.has_key?(state.pending, hash) ->
        new_pending = Map.delete(state.pending, hash)
        {:reply, :ok, %{state | pending: new_pending}, @timeout}

      Map.has_key?(state.active, hash) ->
        new_active = Map.delete(state.active, hash)
        {:reply, :ok, %{state | active: new_active}, @timeout}

      true ->
        {:reply, :error, state, @timeout}
    end
  end

  @impl true
  def handle_call({:delete_user, pid_to_delete}, _from, state) do
    {pending_hashes, state_after_pending} =
      Enum.reduce(state.pending, {[], state}, fn {hash, entry}, {hashes_acc, state_acc} ->
        if entry.creator_pid == pid_to_delete do
          new_pending_map = Map.delete(state_acc.pending, hash)
          {[hash | hashes_acc], %{state_acc | pending: new_pending_map}}
        else
          {hashes_acc, state_acc}
        end
      end)
    {all_removed_hashes, final_state} =
      Enum.reduce(state.active, {pending_hashes, state_after_pending}, fn {hash, entry}, {hashes_acc, state_acc} ->
        if entry.creator_pid == pid_to_delete or entry.partner_pid == pid_to_delete do
          new_active_map = Map.delete(state_acc.active, hash)
          {[hash | hashes_acc], %{state_acc | active: new_active_map}}
        else
          {hashes_acc, state_acc}
        end
      end)
    {:reply, all_removed_hashes, final_state, @timeout}
  end
  defp does_user_have_media?(pid_to_check, type_to_check, state) do
    Enum.find(state.pending, fn {_hash, entry} ->
      entry.creator_pid == pid_to_check and entry.connection_type == type_to_check
    end)
  end

  defp maybe_insert_entry(hash, sdp, channel_pid, connection_type, state, name) do
    if Map.has_key?(state.pending, hash) or Map.has_key?(state.active, hash) do
      state
    else
      entry = %{
        sdp: sdp,
        ice: [],
        creator_pid: channel_pid,
        connection_type: connection_type,
        partner_pid: nil,
        name: name
      }
      %{state | pending: Map.put(state.pending, hash, entry)}
    end
  end

  defp try_auto_match(joining_hash, state, joining_channel_pid, true, opts) do
    # Case is a refill, send the current joined colleagues and check if there's any non-seen before
    existing_partners = opts
    {to_match, remaining_pending} =
      state.pending
      |> Enum.split_with(fn {key, entry} ->
        is_data_channel = entry.connection_type == "data"
        is_not_myself = key != joining_hash
        is_a_new_partner = entry.name not in existing_partners
        is_data_channel and is_not_myself and is_a_new_partner
      end)
      |> then(fn {match_list, rest} -> {Map.new(match_list), Map.new(rest)} end)
    change_state(map_size(to_match), to_match, remaining_pending, joining_channel_pid, state)
  end
  defp try_auto_match(joining_hash, state, joining_channel_pid, _refill, _opts) do
    # Case that is not a refill but a first joiner, consume all pending "data"
    {to_match, remaining_pending} =
      state.pending
      |> Enum.split_with(fn {key, entry} ->
        key != joining_hash and entry.connection_type == "data"
      end)
      |> then(fn {match_list, rest} -> {Map.new(match_list), Map.new(rest)} end)
    change_state(map_size(to_match), to_match, remaining_pending, joining_channel_pid, state)
  end
  defp change_state(waiting_data_connections, _match,_rem,_joining_channel,state) when waiting_data_connections <= 0, do: {nil, state}
  defp change_state(_map_size, to_match, remaining_pending, joining_channel_pid, state) do
    active_matches =
      Enum.into(to_match, %{}, fn {key, entry} ->
        # Set partner_pid to the joining peer PID
        {key, Map.put(entry, :partner_pid, joining_channel_pid)}
      end)
    new_state = %{
      state
      | pending: remaining_pending,
        active: Map.merge(state.active, active_matches)
    }
    {active_matches, new_state}
  end

  @impl true
  def handle_info(:timeout, state) do
    {:stop, :normal, state}
  end

  def generate_hash(user) do
    "#{user}-#{:erlang.unique_integer([:positive, :monotonic])}"
  end
end
