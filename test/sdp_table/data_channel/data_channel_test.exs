defmodule SdpTable.DataChannel.DataChannelTest do
  use WebrtcL2LWeb.ConnCase, async: true
  alias WebrtcL2L.SdpTable.MediaStructs.DataChannel
  describe "create_new_data_channel/1" do
    test "successfully create new data channel user" do
      assert %DataChannel{members: %{}, room: "sdp"} == DataChannel.create_new_data_channel("sdp")
    end
  end
  describe "user_joining/2" do
    setup do
      {:ok, data_channel: %DataChannel{members: %{}, room: "sdp"}}
    end
    test "successfully add user to a data channel", state do
      assert {:ok, %DataChannel{members: %{"user1" => "sdp"}, room: ""}, "sdp"} == DataChannel.user_joining(state.data_channel, "user1")
    end
    test "successfully add two users to a data channel", state do
      {:ok, data_channel, sdp} = DataChannel.user_joining(state.data_channel, "user1")
      data_channel = DataChannel.set_room_value(data_channel, "sdp2")
      assert {:ok, %DataChannel{members: %{"user1" => "sdp", "user2" => "sdp2"}, room: ""}, "sdp2"} == DataChannel.user_joining(data_channel, "user2")
    end
  end
  describe "set_room_value/2" do
    setup do
      {:ok, data_channel: %DataChannel{room: "sdp"}}
    end
    test "successfully set new room value", state do
      assert %DataChannel{room: "sdp2"} = DataChannel.set_room_value(state.data_channel, "sdp2")
    end
  end
end
