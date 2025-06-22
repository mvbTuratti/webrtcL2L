defmodule ConferenceWeb.Channel.ClientHarness.TestClient do
  @moduledoc """
  A GenServer representing a single, isolated client for channel testing.
  """
  use GenServer
  import Phoenix.ChannelTest

  defstruct socket: nil,
            received_pushes: [],
            received_broadcasts: []

  # Client API
  def start_link(opts) do
    endpoint = Keyword.fetch!(opts, :endpoint)
    GenServer.start_link(__MODULE__, endpoint, [])
  end

  # GenServer Callbacks
  @impl true
  def init(endpoint) do
    socket = %Phoenix.Socket{
      id: nil,
      channel: nil,
      channel_pid: nil,
      endpoint: endpoint,
      handler: nil,
      join_ref: nil,
      ref: nil,
      topic: nil,
      assigns: %{},
      joined: false,
      private: %{},
      pubsub_server: endpoint.config(:pubsub_server),
      transport: {Phoenix.ChannelTest, self()},
      transport_pid: self(),
      serializer: Phoenix.ChannelTest.NoopSerializer
    }

    {:ok, %__MODULE__{socket: socket}}
  end

  @impl true
  def handle_call({:adopt_socket, socket_to_adopt}, _from, state) do
    new_socket = %{socket_to_adopt | transport_pid: self()}
    ref = make_ref()
    send(socket_to_adopt.channel_pid, {:test_update_transport, self(), ref})
    receive do
      {:transport_updated, ^ref} ->
        :ok #
    after
      5000 ->
        raise "Failed to receive transport update confirmation from channel"
    end
    send(socket_to_adopt.channel_pid, :after_join)
    {:reply, :ok, %{state | socket: new_socket}}
  end
  @impl true
  def handle_call({:pop_message, type, event}, _from, state) do
    messages = Map.get(state, type)
    index = Enum.find_index(messages, &(&1.event == event))
    if index do
      {found_message, remaining_messages} = List.pop_at(messages, index)
      new_state = Map.put(state, type, remaining_messages)
      {:reply, {:ok, found_message}, new_state}
    else
      {:reply, :not_found, state}
    end
  end
  @impl true
  def handle_call(:get_socket, _from, state) do
    {:reply, state.socket, state}
  end
  @impl true
  def handle_call({:push, {event, payload}}, _from, state) do
    ref = push(state.socket, event, payload)
    {:reply, ref, state}
  end

  @impl true
  def handle_call(:get_received, _from, state) do
    messages = %{
      pushes: Enum.reverse(state.received_pushes),
      broadcasts: Enum.reverse(state.received_broadcasts)
    }
    {:reply, messages, state}
  end

  @impl true
  def handle_call(:clear_messages, _from, state) do
    new_state = %{state | received_pushes: [], received_broadcasts: []}
    {:reply, :ok, new_state}
  end

  @impl true
  def handle_call({:leave, _timeout}, _from, state) do
    ref = Phoenix.ChannelTest.leave(state.socket)
    {:reply, ref, state}
  end

  @impl true
  def handle_info(%Phoenix.Socket.Message{} = msg, state) do
    new_pushes = [msg | state.received_pushes]
    {:noreply, %{state | received_pushes: new_pushes}}
  end

  @impl true
  def handle_info(%Phoenix.Socket.Broadcast{} = msg, state) do
    new_broadcasts = [msg | state.received_broadcasts]
    {:noreply, %{state | received_broadcasts: new_broadcasts}}
  end

  @impl true
  def handle_info(_other, state) do
    {:noreply, state}
  end
end
