defmodule ConferenceWeb.Channel.ClientHarness do
  @moduledoc """
  Public API for the multi-client testing harness.
  """
  import ExUnit.Assertions
  alias ConferenceWeb.Channel.ClientHarness.TestClient
  alias ConferenceWeb.Channel.ClientHarness.Supervisor

  @supervisor Supervisor

  def setup_harness do
    DynamicSupervisor.start_link(name: @supervisor)
  end

  def start_client(endpoint) do
    spec = {TestClient, endpoint: endpoint}
    DynamicSupervisor.start_child(@supervisor, spec)
  end

  def stop_client(client_pid) do
    DynamicSupervisor.terminate_child(@supervisor, client_pid)
  end

  def adopt_socket(client_pid, socket) do
    GenServer.call(client_pid, {:adopt_socket, socket})
  end

  def leave_channel(client_pid, timeout \\ 5000) do
    socket = get_socket(client_pid)
    if socket && socket.channel_pid do
      Process.unlink(socket.channel_pid)
    end
    GenServer.call(client_pid, {:leave, timeout})
  end

  def push(client_pid, event, payload \\ %{}) do
    GenServer.call(client_pid, {:push, {event, payload}})
  end

  def assert_received_push(client_pid, event, payload_pattern, timeout \\ 100) do
    assert_received_message(client_pid, :pushes, event, payload_pattern, timeout)
  end

  def assert_received_broadcast(client_pid, event, payload_pattern, timeout \\ 100) do
    assert_received_message(client_pid, :broadcasts, event, payload_pattern, timeout)
  end

  def refute_received(client_pid, event, payload_pattern, wait_time \\ 100) do
    Process.sleep(wait_time)
    all_messages = GenServer.call(client_pid, :get_received)
    all_flat = all_messages.pushes ++ all_messages.broadcasts
    refute Enum.any?(all_flat, fn msg ->
      match?({^event, ^payload_pattern}, {msg.event, msg.payload})
    end), "Expected client #{inspect(client_pid)} not to receive event `#{event}` with matching payload."

    GenServer.call(client_pid, :clear_messages)
  end
  def get_socket(client_pid) do
    GenServer.call(client_pid, :get_socket)
  end

  defp assert_received_message(client_pid, type, event, payload_pattern, timeout) do
    start_time = System.monotonic_time(:millisecond)
    await_message(client_pid, type, event, payload_pattern, start_time, timeout)
  end

  defp await_message(client_pid, type, event, payload_pattern, start_time, timeout) do
    all_messages = GenServer.call(client_pid, :get_received)
    messages_of_type = Map.get(all_messages, type)
    found_message = Enum.find(messages_of_type, fn msg ->
      match?({^event, ^payload_pattern}, {msg.event, msg.payload})
    end)
    if found_message do
      :ok
    else
      elapsed = System.monotonic_time(:millisecond) - start_time
      if elapsed >= timeout do
        flunk("""
        Expected client #{inspect(client_pid)} to receive #{type} event `#{event}` with matching payload.
        Timeout after #{timeout}ms.
        Received #{type}: #{inspect(messages_of_type)}
        """)
      else
        Process.sleep(10)
        await_message(client_pid, type, event, payload_pattern, start_time, timeout)
      end
    end
  end
  def pop_received_push!(client_pid, event, timeout \\ 100) do
    start_time = System.monotonic_time(:millisecond)
    await_and_pop_message(client_pid, :pushes, event, start_time, timeout)
  end

  # --- FUNÇÕES PRIVADAS ---
  defp await_and_pop_message(client_pid, type, event, start_time, timeout) do
    case GenServer.call(client_pid, {:pop_message, type, event}) do
      {:ok, found_message} ->
        found_message # Encontramos! Retorne a mensagem completa.
      :not_found ->
        elapsed = System.monotonic_time(:millisecond) - start_time
        if elapsed >= timeout do
          # ... (código do flunk para falhar o teste) ...
        else
          Process.sleep(10)
          await_and_pop_message(client_pid, type, event, start_time, timeout)
        end
    end
  end
end
