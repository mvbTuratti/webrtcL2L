defmodule WebrtcL2L.SdpTable.MediaStructs.DataChannel do
  alias WebrtcL2L.SdpTable.MediaStructs.DataChannel
  @enforce_keys [:room]
  defstruct room: ""

  def user_joining(%DataChannel{} = data_channel, new_user) do
    sdp_value = Map.fetch(data_channel, :room)
    data_channel = data_channel
      |> Kernel.put_in([new_user], sdp_value)
      |> Kernel.put_in([:room], "")
    {:ok, data_channel, sdp_value}
  end
  def set_room_value(%DataChannel{} = data_channel, sdp_value) do
    {:ok, %{data_channel | room: sdp_value}}
  end
end
