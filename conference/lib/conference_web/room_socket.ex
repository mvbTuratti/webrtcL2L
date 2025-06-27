defmodule ConferenceWeb.RoomSocket do
  use Phoenix.Socket

  channel "room:*", ConferenceWeb.Channel.Room

  @impl true
  def connect(_params, socket) do
    IO.puts("connect /2")
    # IO.inspect(params)
    # IO.inspect(socket)
    {:ok, socket}
  end
  @impl true
  def connect(params, socket, _connect_info) do
    IO.puts("connect /3")
    socket = assign(socket, :user, params["user"])
            |> assign(:sdp, params["sdp"])
            |> assign(:origin, params["origin"])
    # IO.inspect(params, label: "Params in connect/3")
    # IO.inspect(socket)
    {:ok, socket}
  end

  # Socket id's are topics that allow you to identify all sockets for a given user:
  #
  #     def id(socket), do: "user_socket:#{socket.assigns.user_id}"
  #
  # Would allow you to broadcast a "disconnect" event and terminate
  # all active sockets and channels for a given user:
  #
  #     Elixir.BucketsWeb.Endpoint.broadcast("user_socket:#{user.id}", "disconnect", %{})
  #
  # Returning `nil` makes this socket anonymous.
  @impl true
  def id(socket), do: "user_socket:#{socket.assigns[:user]}"

end
