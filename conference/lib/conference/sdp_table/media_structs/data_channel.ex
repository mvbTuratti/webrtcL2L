defmodule Conference.SdpTable.MediaStructs.DataChannel do
  alias Conference.SdpTable.MediaStructs.DataChannel
  @enforce_keys [:room]
  defstruct room: "", members: %{}

  def create_new_data_channel(sdp_value) do
    %DataChannel{room: sdp_value}
  end
  def user_joining(%DataChannel{} = data_channel, new_user) do
    {:ok, sdp_value} = Map.fetch(data_channel, :room)
    data_channel = data_channel
      |> set_user_value(new_user, sdp_value)
      |> set_room_value("")
    {:ok, data_channel, sdp_value}
  end
  def set_room_value(%DataChannel{} = data_channel, sdp_value) do
    %{data_channel | room: sdp_value}
  end
  @spec get_user_sdp_value(%DataChannel{}, String.t()) :: {:ok, String.t()} | :error
  def get_user_sdp_value(%DataChannel{} = data_channel, user) do
    Map.fetch(data_channel[:members], user)
  end
  @spec set_user_value(%DataChannel{}, String.t(), String.t()) :: %DataChannel{}
  def set_user_value(%DataChannel{} = data_channel, user, sdp_value) do
    sdp_values = Kernel.put_in(data_channel.members, [user], sdp_value)
    %{data_channel | members: sdp_values}
  end
  def remove_partner(%DataChannel{} = data_channel, user) do
    {_, member_routing} = Map.pop(data_channel.members, user)
    %{data_channel | members: member_routing}
  end
end
