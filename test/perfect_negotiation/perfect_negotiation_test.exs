defmodule PerfectNegotiation.PerfectNegotiationTest do
  use WebrtcL2LWeb.ConnCase, async: true
  alias WebrtcL2L.SdpTable.ParticipantMedia
  alias WebrtcL2L.SdpTable.PerfectNegotiation

  describe "add_routing_values_to_member/4" do
    setup do
      negotiation_values = create_two_participants()
      {:ok, %{sdp_state: %{"user" => %{}}, participants: negotiation_values}}
    end
    test "should be able to update values", state do
      [h | t] = state[:participants]
      # PerfectNegotiation.add_routing_values_to_member(state[:user], h, "user", "zeze")
      assert %{"user" => %{"zeze" => %{high_quality: "1", low_quality: "1", audio_only: "1"}}} =
        PerfectNegotiation.upsert_routing_values_to_member(state[:sdp_state], h, "user", "zeze")
    end
    test "should be able to insert values from new user", state do
      [h| t] = state[:participants]
      assert %{"user1" => %{"zeze" => %{high_quality: "1", low_quality: "1", audio_only: "1"}}} =
        PerfectNegotiation.upsert_routing_values_to_member(%{}, h, "user1", "zeze")
    end
    test "update only new routing participant keep previous state", state do
      state = for participant <- state[:participants], reduce: state[:sdp_state] do
        acc -> PerfectNegotiation.upsert_routing_values_to_member(acc, participant, "user", "zeze#{participant.high_quality}")
      end
      new_media = %ParticipantMedia{high_quality: "3", low_quality: "1", audio_only: "1"}
      [previous_media| _] = create_two_participants()
      assert %{"user" => %{"zeze1" => previous_media, "zeze2" => new_media}} =
        PerfectNegotiation.upsert_routing_values_to_member(state, new_media, "user", "zeze2")
    end
  end
  describe "remove_routing_values_to_member/3" do
    setup do
      negotiation_values = create_two_participants()
      state = for participant <- negotiation_values, reduce: %{} do
        acc -> PerfectNegotiation.upsert_routing_values_to_member(acc, participant, "user", "zeze#{participant.high_quality}")
      end
      {:ok, %{sdp_state: state, participants: negotiation_values}}
    end
    test "remove a user media from existing member", state do
      [h | _] = state[:participants]
      assert %{"user" => %{"zeze1" => h}} == PerfectNegotiation.remove_routing_values_to_member(state[:sdp_state], "user", "zeze2")
    end
    test "noop for removing media from non-existing member", state do
      assert state.sdp_state == PerfectNegotiation.remove_routing_values_to_member(state.sdp_state, "user1", "user2")
    end
  end

  def create_two_participants() do
    Enum.map(1..2, fn iteration ->
      %ParticipantMedia{high_quality: "#{iteration}", low_quality: "#{iteration}", audio_only: "#{iteration}"}
    end)
  end
end
