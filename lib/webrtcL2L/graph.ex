defmodule WebrtcL2L.Graph do

  defstruct sdps: %{},
            size: 0,
            participants: MapSet.new()

  def add_vertex(%{sdps: sdps, participants: participants} = graph, member, sdp) do
    participants = MapSet.put(participants, member)
    size = MapSet.size(participants)
    sdp = Map.put(sdps, member, sdp)
    %{graph | sdps: sdp, participants: participants, size: size}
  end
end
