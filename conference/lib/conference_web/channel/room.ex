defmodule ConferenceWeb.Channel.Room do
  use Phoenix.Channel
  # alias Phoenix.PubSub

  def join(_, _params, socket) do
    # PubSub.subscribe(Ticketing.PubSub, "message:updates")
    IO.inspect(socket)
    {:ok, socket}
  end

  # def handle_info({:assigned_to_user, data}, socket) do
  #   IO.puts("HANDLE INFO")
  #   IO.inspect(data)
  #   push(socket, "assigned", data)
  #   IO.puts("pushed data!")
  #   {:noreply, socket}
  # end

  # def handle_info({:created, data}, socket) do
  #   IO.puts("HANDLE INFO CREATED")
  #   IO.inspect(data)
  #   push(socket, "created", data)
  #   {:noreply, socket}
  # end

  # def handle_info({:deleted, data}, socket) do
  #   IO.puts("HANDLE INFO DELETED")
  #   IO.inspect(data)
  #   push(socket, "deleted", data)
  #   {:noreply, socket}
  # end
end
