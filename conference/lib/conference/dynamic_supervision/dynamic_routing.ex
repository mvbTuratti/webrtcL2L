defmodule Conference.DynamicSupervision.DynamicRouting do
  alias Conference.RoutingState.Routing
  alias Conference.SdpTable.PeerFinding

  def get_routing_pid(room) do
    Registry.lookup(Conference.RouterRegistry, "recommendation:" <> room)
    |> create_or_return_routing(room)
  end
  defp create_or_return_routing([], room) do
    {:ok, pid} =
      DynamicSupervisor.start_child(Conference.RouterSupervisor, {Routing, name: via_tuple("recommendation:" <> room)})
    pid
  end
  defp create_or_return_routing([{pid, _}], _), do: pid

  def get_peer_finding_pid(room) do
    Registry.lookup(Conference.RouterRegistry, "peerfinding:" <> room)
    |> create_or_return_peer_finding(room)
  end

  defp create_or_return_peer_finding([], room) do
    {:ok, pid} =
      DynamicSupervisor.start_child(Conference.RouterSupervisor, {PeerFinding, name: via_tuple("peerfinding:" <> room)})
    pid
  end
  defp create_or_return_peer_finding([{pid, _}], _), do: pid

  defp via_tuple(name) do
    {:via, Registry, {Conference.RouterRegistry, name}}
  end
end
