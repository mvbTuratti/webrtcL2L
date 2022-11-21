defmodule WebrtcL2LWeb.Room do
  use WebrtcL2LWeb, :live_view
  alias WebrtcL2L.Router

  def mount(%{"room" => room}, _session, socket) do
    socket = assign(socket, teste: 3)
    socket = if connected?(socket), do: set_user_and_room(socket, room), else: socket
    {:ok, socket}
  end

  def handle_event("teste", _params, socket) do
    IO.inspect(socket)
    socket = set_room(socket)
    {:noreply, socket}
  end

  defp via_tuple(name) do
    {:via, Registry, {WebrtcL2L.RouterRegistry, name}}
  end


  defp set_user_and_room(socket, room) do
    user_id =
      ?a..?z
      |> Enum.take_random(8)
      |> List.to_string()
    assign(socket, room: room, user_id: user_id)
  end

  defp set_room(socket) do
    room = socket.assigns.room
    pid = get_router_pid(room)
    socket = assign(socket, pid_router: pid)
    assign_rtc(socket, room)
  end



  defp assign_rtc(socket, name) do
    socket
    |> assign(name: name)
    |> assign_rtc()
  end

  defp assign_rtc(%{assigns: %{name: name}} = socket) do
    router = GenServer.call(via_tuple(name), :router)
    assign(socket, router: router)
  end

  defp get_router_pid(room) do
    Registry.lookup(WebrtcL2L.RouterRegistry, room)
    |> create_or_return(room)
  end

  defp create_or_return([], room) do
    {:ok, pid} =
      DynamicSupervisor.start_child(WebrtcL2L.RouterSupervisor, {Router, name: via_tuple(room)})
    pid
  end
  defp create_or_return([{pid, _}], _) do
    pid
  end
end
