defmodule WebrtcL2L.SdpTable.PerfectNegotiation do
  alias WebrtcL2L.SdpTable.ParticipantMedia

  def upsert_routing_values_to_member(current_sdp_state, %ParticipantMedia{} = participant_media, user, routee) do
    case Map.get(current_sdp_state, user, nil) do
      nil ->
        Map.put(current_sdp_state, user, %{routee => participant_media})
      _ ->
        Kernel.put_in(current_sdp_state, [user, routee], participant_media)
    end
  end
  def remove_routing_values_to_member(current_sdp_state, user, routee) do
    case Map.get(current_sdp_state, user, nil) do
      nil ->
        current_sdp_state
      user_routing ->
        %{current_sdp_state | user => Map.delete(user_routing, routee)}
    end
  end

end
