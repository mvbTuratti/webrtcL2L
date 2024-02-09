defmodule WebrtcL2L.SdpTable.PerfectNegotiation do
  alias WebrtcL2L.SdpTable.ParticipantMedia

  def add_routing_values_to_member(current_sdp_state, %ParticipantMedia{} = participant_media, user, routee) do
    Kernel.put_in(current_sdp_state, [user, routee], participant_media)
  end
  def remove_routing_values_to_member(current_sdp_state, user, routee) do
    current_user_perfect_negotiations = Map.get(current_sdp_state, user, %{})
    %{current_sdp_state | user => Map.delete(current_user_perfect_negotiations, routee)}
  end

end
