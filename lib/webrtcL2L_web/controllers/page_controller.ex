defmodule WebrtcL2LWeb.PageController do
  use WebrtcL2LWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
