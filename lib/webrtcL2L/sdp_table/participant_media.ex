defmodule WebrtcL2L.SdpTable.ParticipantMedia do
  alias WebrtcL2L.SdpTable.ParticipantMedia
  defstruct high_quality: "", low_quality: "", audio_only: "", screen_sharing: ""

  def set_high_quality_value(%ParticipantMedia{} = participant, sdp_value) do
    %{participant | high_quality: sdp_value}
  end
  def set_low_quality_value(%ParticipantMedia{} = participant, sdp_value) do
    %{participant | low_quality: sdp_value}
  end
  def set_audio_value(%ParticipantMedia{} = participant, sdp_value) do
    %{participant | audio_only: sdp_value}
  end
  def set_screen_sharing_value(%ParticipantMedia{} = participant, sdp_value) do
    %{participant | screen_sharing: sdp_value}
  end
end
