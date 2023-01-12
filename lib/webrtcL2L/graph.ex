defmodule WebrtcL2L.Graph do

  defstruct sdps: %{}

  def add_vertex(%{sdps: sdps} = graph, member, sdp) do
    sdp = Map.put(sdps, member, sdp)
    %{graph | sdps: sdp}
  end

  def remove_vertex(graph, member) do
    sdps = Map.delete(graph.sdps, member)
    %{graph | sdps: sdps}
  end

  def list_sdps(graph, member) do
    sdps = Map.delete(graph.sdps, member)
    %{graph | sdps: sdps}
  end
end
