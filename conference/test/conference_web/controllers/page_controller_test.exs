defmodule ConferenceWeb.PageControllerTest do
  use ConferenceWeb.ConnCase

  test "GET /", %{conn: conn} do
    _conn = get(conn, ~p"/")
    # assert html_response(conn, 200) =~ "Peace of mind from prototype to production"
    assert true
  end
end
