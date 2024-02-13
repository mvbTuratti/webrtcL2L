defmodule WebrtcL2L.SdpTable.PerfectNegotiation do
  alias WebrtcL2L.SdpTable.MediaStructs.ParticipantMedia

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
  @spec upsert_screen_sharing_value(%{}, String.t(), String.t(), String.t()) :: %{}
  def upsert_screen_sharing_value(current_sdp_state, user, routee, sdp_string_value) do
    new_participant_media = %ParticipantMedia{screen_sharing: sdp_string_value}
    _upsert_sdp_value(&ParticipantMedia.set_screen_sharing_value/2, new_participant_media, current_sdp_state, user, routee, sdp_string_value)
  end
  @spec upsert_audio_only_value(%{}, String.t(), String.t(), String.t()) :: %{}
  def upsert_audio_only_value(current_sdp_state, user, routee, sdp_string_value) do
    new_participant_media = %ParticipantMedia{audio_only: sdp_string_value}
    _upsert_sdp_value(&ParticipantMedia.set_audio_value/2, new_participant_media, current_sdp_state, user, routee, sdp_string_value)
  end
  @spec upsert_high_quality_value(%{}, String.t(), String.t(), String.t()) :: %{}
  def upsert_high_quality_value(current_sdp_state, user, routee, sdp_string_value) do
    new_participant_media = %ParticipantMedia{high_quality: sdp_string_value}
    _upsert_sdp_value(&ParticipantMedia.set_high_quality_value/2, new_participant_media, current_sdp_state, user, routee, sdp_string_value)
  end
  @spec upsert_low_quality_value(%{}, String.t(), String.t(), String.t()) :: %{}
  def upsert_low_quality_value(current_sdp_state, user, routee, sdp_string_value) do
    new_participant_media = %ParticipantMedia{low_quality: sdp_string_value}
    _upsert_sdp_value(&ParticipantMedia.set_low_quality_value/2, new_participant_media, current_sdp_state, user, routee, sdp_string_value)
  end

  def _get_sdp_value(current_sdp_state, user, routee, type_of_stream) do
    value = Map.get(current_sdp_state, user, %{})
      |> Map.get(routee, %ParticipantMedia{})
      |> Map.get(type_of_stream)
    case value do
      "" ->
        {:missing_value, value}
      _ ->
        {:ok, value}
    end
  end
  @spec get_screen_sharing_sdp_value(%{}, String.t(), String.t()) :: {:ok, String.t()} | {:missing_value, String.t()}
  def get_screen_sharing_sdp_value(current_sdp_state, user, routee), do: _get_sdp_value(current_sdp_state, user, routee, :screen_sharing)
  @spec get_high_quality_sdp_value(%{}, String.t(), String.t()) :: {:ok, String.t()} | {:missing_value, String.t()}
  def get_high_quality_sdp_value(current_sdp_state, user, routee), do: _get_sdp_value(current_sdp_state, user, routee, :high_quality)
  @spec get_low_quality_sdp_value(%{}, String.t(), String.t()) :: {:ok, String.t()} | {:missing_value, String.t()}
  def get_low_quality_sdp_value(current_sdp_state, user, routee), do: _get_sdp_value(current_sdp_state, user, routee, :low_quality)
  @spec get_audio_sdp_value(%{}, String.t(), String.t()) :: {:ok, String.t()} | {:missing_value, String.t()}
  def get_audio_sdp_value(current_sdp_state, user, routee), do: _get_sdp_value(current_sdp_state, user, routee, :audio_only)
end
