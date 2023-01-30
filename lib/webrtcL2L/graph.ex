defmodule WebrtcL2L.Graph do

  defstruct sdps: %{}

  def add_vertex(%{sdps: sdps} = graph, member, {sdp, hash}) do
    payload = Map.put(sdp, "hash", hash)
    sdp = Map.put(sdps, member, payload)
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
