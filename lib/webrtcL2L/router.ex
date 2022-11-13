defmodule WebrtcL2L.Router do
  use GenServer, restart: :transient
  alias WebrtcL2L.Graph
  defstruct graph: %Graph{}

  @timeout 600_000

  def start_link(options) do
    GenServer.start_link(__MODULE__, %Graph{}, options)
  end

  @impl true
  def init(router) do
    {:ok, router, @timeout}
  end

  @impl true
  def handle_call(:router, _, router) do
    {:reply, router, router, @timeout}
  end

  @impl true
  def handle_cast({:info, source}, router) do
    IO.inspect(source)
    {:noreply, router, @timeout}
  end
end
