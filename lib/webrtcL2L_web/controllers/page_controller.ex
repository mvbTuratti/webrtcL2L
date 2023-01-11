defmodule WebrtcL2LWeb.PageController do
  use WebrtcL2LWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end

  def teste(conn, _) do
    render(conn, "teste.html")
  end
end
