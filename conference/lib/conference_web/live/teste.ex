defmodule ConferenceWeb.Teste do
  use ConferenceWeb, :live_view

  @impl true
  def mount(_, _session, socket) do
    {:ok, socket}
  end

  @impl true
  def handle_event(name, payload, socket) do
    IO.inspect(name)
    IO.inspect(payload)
    {:noreply, push_event(socket, "ack", %{hash: payload["hash"]})}
  end
end
