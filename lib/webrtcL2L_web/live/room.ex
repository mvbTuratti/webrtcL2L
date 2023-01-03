defmodule WebrtcL2LWeb.Room do
  use WebrtcL2LWeb, :live_view
  alias WebrtcL2L.Router
  alias WebrtcL2LWeb.Components.RoomParticipants

  def mount(%{"room" => room}, _session, socket) do
    socket = assign(socket, conference: false, participants: [], current: 0)
    socket = if connected?(socket), do: set_user_and_room(socket, room), else: socket
    {:ok, socket}
  end


  def handle_event("conference", _params, socket) do
    IO.inspect(socket)
    socket = set_room(socket)

    socket = assign(socket, conference: true, participants: [socket.assigns.user_id | socket.assigns.participants],
      id: socket.assigns.user_id, current: socket.assigns.current + 1)
    response = %{participants: socket.assigns.participants, id: socket.assigns.user_id, current: socket.assigns.current}
    {:noreply, push_event(socket, "joining", response)}
  end

  def handle_event("icecandidate", payload, %{assigns: %{name: name}} = socket) do
    response = GenServer.call(via_tuple(name), {:add_node, payload})
    payload = response
              |> Map.new()

    IO.inspect(payload)
    {:noreply, push_event(socket, "participants", payload)}
  end

  def handle_event(_,_, socket) do
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
