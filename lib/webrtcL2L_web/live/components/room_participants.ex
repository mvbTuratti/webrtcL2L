defmodule WebrtcL2LWeb.Components.RoomParticipants do
  use Phoenix.Component

  def participants(assigns) when assigns.quantity <= 4 do
    ~H"""
      <%= for number <- 1..assigns.quantity do %>
        <div class={"participant-#{number}-#{assigns.quantity}"}>
          <video id={"video-#{number}"} class="h-full w-full" src="#" autoplay playsinline ></video>
        </div>
      <% end %>
    """
  end

  def participants(assigns) do
    ~H"""
      <%= for number <- 1..4 do %>
        <div class={"participant-#{number}-4"}>
          <video id={"video-#{number}"} src="#" class="h-full w-full" autoplay playsinline muted></video>
        </div>
      <% end %>
    """
  end
end
