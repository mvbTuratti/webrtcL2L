defmodule WebrtcL2L.DynamicSupervision.DynamicRouting do
  alias WebrtcL2L.RoutingState.Routing
  alias WebrtcL2L.SdpTable.PeerFinding

  def get_routing_pid(room) do
    Registry.lookup(WebrtcL2L.RouterRegistry, "recommendation:" <> room)
    |> create_or_return_routing(room)
  end
  defp create_or_return_routing([], room) do
    {:ok, pid} =
      DynamicSupervisor.start_child(WebrtcL2L.RouterSupervisor, {Routing, name: via_tuple("recommendation:" <> room)})
    pid
  end
  defp create_or_return_routing([{pid, _}], _), do: pid

  def get_peer_finding_pid(room) do
    Registry.lookup(WebrtcL2L.RouterRegistry, "peerfinding:" <> room)
    |> create_or_return_peer_finding(room)
  end

  defp create_or_return_peer_finding([], room) do
    {:ok, pid} =
      DynamicSupervisor.start_child(WebrtcL2L.RouterSupervisor, {PeerFinding, name: via_tuple("peerfinding:" <> room)})
    pid
  end
  defp create_or_return_peer_finding([{pid, _}], _), do: pid

  defp via_tuple(name) do
    {:via, Registry, {WebrtcL2L.RouterRegistry, name}}
  end
end
