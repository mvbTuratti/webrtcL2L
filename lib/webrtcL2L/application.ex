defmodule WebrtcL2L.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # Start the Telemetry supervisor
      WebrtcL2LWeb.Telemetry,
      # Start the PubSub system
      {Phoenix.PubSub, name: WebrtcL2L.PubSub},
      # Start the Endpoint (http/https)
      WebrtcL2LWeb.Endpoint,
      # Start a worker by calling: WebrtcL2L.Worker.start_link(arg)
      # {WebrtcL2L.Worker, arg}
      {Registry, keys: :unique, name: WebrtcL2L.RouterRegistry},
      {DynamicSupervisor, strategy: :one_for_one, name: WebrtcL2L.RouterSupervisor}
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: WebrtcL2L.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    WebrtcL2LWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
