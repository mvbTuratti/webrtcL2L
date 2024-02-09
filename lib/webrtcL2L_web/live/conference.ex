defmodule WebrtcL2LWeb.Conference do
  use WebrtcL2LWeb, :live_view
  alias WebrtcL2L.{Presence, PubSub}
  alias WebrtcL2L.RoutingState.Routing
  alias WebrtcL2LWeb.Components.RoomParticipants

  @presence "webrtcL2L:"

  @impl true
  def mount(%{"room" => room}, _session, socket) do
    socket = assign(socket, conference: false, participants: %{}, current: 0)
    socket = if connected?(socket), do: set_user_and_room(socket, room), else: socket
    {:ok, socket}
  end
  def mount(%{}, _session, socket) do
    {:ok, push_redirect(socket, to: "/")}
  end

  defp set_user_and_room(socket, room) do
    user_id =
      ?a..?z
      |> Enum.take_random(8)
      |> List.to_string()
    assign(socket, room: room, user_id: user_id)
  end

  # def attempt_to_join_a_meeting(%{assigns: %{user_id: id}} = socket) do
  #   {:ok, _} = Presence.track(self(), @presence <> socket.assigns.room, id, %{
  #     name: id,
  #     })
  #   Phoenix.PubSub.subscribe(PubSub, @presence <> socket.assigns.room)
  #   socket = set_room(socket)
  #   response = GenServer.call(via_tuple(socket.assigns.name), {:list_nodes, %{"id" => id}})
  #   payload = %{id: id, current: socket.assigns.current, sdps: response.sdps}
  #   {:noreply, push_event(socket, "joining", payload)}
  # end
end
