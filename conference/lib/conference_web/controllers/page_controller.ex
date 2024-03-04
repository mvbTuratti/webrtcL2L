defmodule ConferenceWeb.PageController do
  use ConferenceWeb, :controller

  def home(conn, _params) do
    render(conn, :index)
  end
end
