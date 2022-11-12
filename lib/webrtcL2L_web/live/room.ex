defmodule WebrtcL2LWeb.Room do
  use WebrtcL2LWeb, :live_view

  def mount(params, _session, socket) do
    IO.inspect(params)
    {:ok, socket}
  end

end
