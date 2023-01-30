defmodule WebrtcL2LWeb.Components.RoomParticipants do
  use Phoenix.Component

  # def participants(assigns) when assigns.quantity <= 4 do
  #   ~H"""
  #     <%= for number <- 1..assigns.quantity do %>
  #       <%= if number == 1 do %>
  #         <div class={"participant-#{number}-#{assigns.quantity}"}>
  #           <video id={"video-#{number}"} class="h-full w-full" src="#" autoplay playsinline muted></video>
  #         </div>
  #       <% else %>
  #         <div class={"participant-#{number}-#{assigns.quantity}"}>
  #           <video id={"video-#{number}"} class="h-full w-full" src="#" autoplay playsinline ></video>
  #         </div>
  #       <% end %>
  #     <% end %>
  #   """
  # end

  def participants(assigns) do
    ~H"""
      <%= for number <- 1..assigns.quantity do %>
        <%= if number == 1 do %>
          <div class={"participant-#{number}-#{min(4,assigns.quantity)}"}>
            <video id={"video-#{number}"} class="h-full w-full" src="#" autoplay playsinline muted></video>
          </div>
        <% else %>
          <div class={"#{if number > 4, do: 'hidden participant-#{ if rem(number,4) == 0, do: 4, else: rem(number,4) }-4', else: 'flex participant-#{number}-#{min(4,assigns.quantity)}'}"}>
            <video id={"video-#{number}"} class="h-full w-full" src="#" autoplay playsinline ></video>
          </div>
        <% end %>
      <% end %>
    """
  end

end
