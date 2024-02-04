defmodule WebrtcL2LWeb.Test do
  use WebrtcL2LWeb, :live_view

  def mount(_params, _session, socket) do
    {:ok, socket}
  end
end
