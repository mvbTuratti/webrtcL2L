defmodule WebrtcL2L.Graph do

  defstruct sdps: %{}

  def add_vertex(%{sdps: sdps} = graph, member, sdp) do
    sdp = Map.put(sdps, member, sdp)
    %{graph | sdps: sdp}
  end
end
