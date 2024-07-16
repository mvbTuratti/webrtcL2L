defmodule ConferenceWeb.RoomSocket do
  use Phoenix.Socket

  channel "room:*", ConferenceWeb.Channel.Room

  @impl true
  def connect(params, socket) do
    IO.puts("\n\n HEEERE")
    IO.inspect(params)
    IO.inspect(socket)
    {:ok, socket}
  end
  @impl true
  def connect(params, socket, connect_info) do
    IO.inspect(params)
    IO.inspect(socket)
    IO.inspect(connect_info)
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
  def id(_socket), do: nil

end
