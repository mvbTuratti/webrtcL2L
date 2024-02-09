defmodule PerfectNegotiation.PerfectNegotiationTest do
  use WebrtcL2LWeb.ConnCase, async: true
  alias WebrtcL2L.SdpTable.ParticipantMedia
  alias WebrtcL2L.SdpTable.PerfectNegotiation

  describe "add_routing_values_to_member/4" do
    setup do
      negotiation_values = create_four_participant_medias()
      {:ok, %{sdp_state: %{"user" => %{}}, participants: negotiation_values}}
    end
    test "should be able to update values", state do
      [h | t] = state[:participants]
      # PerfectNegotiation.add_routing_values_to_member(state[:user], h, "user", "zeze")
      assert %{"user" => %{"zeze" => %{high_quality: "1", low_quality: "1", audio_only: "1"}}} =
        PerfectNegotiation.add_routing_values_to_member(state[:sdp_state], h, "user", "zeze")
    end
  end

  def create_four_participant_medias() do
    Enum.map(1..5, fn iteration ->
      %ParticipantMedia{high_quality: "#{iteration}", low_quality: "#{iteration}", audio_only: "#{iteration}"}
    end)
  end
end
