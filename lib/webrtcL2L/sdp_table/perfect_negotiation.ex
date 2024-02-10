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
  def _upsert_sdp_value(fun_update, new_participant_media, current_sdp_state, user, routee, sdp_string_value) do
    case Map.get(current_sdp_state, user, nil) do
      nil ->
        upsert_routing_values_to_member(current_sdp_state, new_participant_media, user, routee)
      user_routing_medias ->
        participant_media = Map.get(user_routing_medias, routee, new_participant_media)
        upsert_routing_values_to_member(current_sdp_state, fun_update.(participant_media, sdp_string_value), user, routee)
    end
  end
  def upsert_audio_only_value(current_sdp_state, user, routee, sdp_string_value) do
    new_participant_media = %ParticipantMedia{audio_only: sdp_string_value}
    _upsert_sdp_value(&ParticipantMedia.set_audio_value/2, new_participant_media, current_sdp_state, user, routee, sdp_string_value)
  end
  def upsert_high_quality_value(current_sdp_state, user, routee, sdp_string_value) do
    new_participant_media = %ParticipantMedia{high_quality: sdp_string_value}
    _upsert_sdp_value(&ParticipantMedia.set_high_quality_value/2, new_participant_media, current_sdp_state, user, routee, sdp_string_value)
  end
  def upsert_low_quality_value(current_sdp_state, user, routee, sdp_string_value) do
    new_participant_media = %ParticipantMedia{low_quality: sdp_string_value}
    _upsert_sdp_value(&ParticipantMedia.set_low_quality_value/2, new_participant_media, current_sdp_state, user, routee, sdp_string_value)
  end
end
