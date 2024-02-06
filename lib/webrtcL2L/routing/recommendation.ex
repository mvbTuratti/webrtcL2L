defmodule WebrtcL2L.Routing.Recommendation do
  @moduledoc """
  Recommendation module provides functions for managing recommendation systems for a specific tree during a videocall.
  It can be reused for any of the required graphs
  """


  @spec update_viewer_connections(Graph.t(), [%{source: String.t(), target: String.t(), weight: pos_integer()|pos_integer()}]) :: Graph.t()
  def update_viewer_connections(graph, new_values) do
    Enum.reduce(new_values, graph, fn %{source: streamer, target: viewer, weight: weight}, graph ->
      case Graph.update_edge(graph, streamer, viewer, weight: weight) do
        {:error, :no_such_edge} ->
          graph
        graph ->
          graph
      end
    end)
  end

  @doc """
  Remove a viewer from the stream, if this viewer has any subscribers, also returns a list containing the names of the
  affected users

  Returns `{Graph.t(), [String.t()]}`.
  ## Examples

      iex> WebrtcL2L.Routing.Recommendation.remove_viewer(graph, "watcher")
      {graph, []}

  """
  @spec remove_viewer(Graph.t(), String.t()) :: {Graph.t(), [String.t()]}
  def remove_viewer(graph, viewer) do
    affected_viewers = Graph.out_edges(graph, viewer) |> Enum.map(fn %{v2: affected_viewer} -> affected_viewer end)
    graph = Graph.delete_vertex(graph, viewer)
    {graph, affected_viewers}
  end
  @doc """
  Adds a viewer to a stream, it expects the current graph, the root and the new viewer and a list of weights between the
  new viewer and all available connections in tuples where the first value is the name of the source and the second value
  a positive integer or positive float.

  Returns `{:ok|:missing_streamer,Graph.t(), String.t()|nil}`.
  ## Examples

      iex> WebrtcL2L.Routing.Recommendation.join_viewer(graph, "root", "new_member", [{"watcher1", 2}, {"watcher2", 1}])
      {:ok, graph, "watcher2"}

  """
  @spec join_viewer(Graph.t(), String.t(), String.t(),[{String.t(), pos_integer()|pos_integer()}]) :: {:ok|:missing_streamer,Graph.t(), String.t()|[]}
  def join_viewer(nil, _source, _viewer, _), do: {:missing_streamer, nil, []}
  def join_viewer(graph, _source, _viewer, []), do: {:missing_streamer, graph, []}
  def join_viewer(graph, source, viewer, weights) do
    with current_vertices <- Graph.vertices(graph),
          {:ok, current_vertices} <- _validate_if_viewer_is_present(current_vertices, viewer),
          {:ok, graph, vertices} <- _add_all_edges_to_all_available_watchers(graph, weights, current_vertices, viewer) do
            _get_streamer(graph, source, vertices, viewer)
          else
            {:missing_streamer, graph, vertices} -> {:missing_streamer, graph, vertices}
            {:already_consuming, _current_vertices} -> {:missing_streamer, graph, []}
    end
  end
  defp _validate_if_viewer_is_present(current_vertices, viewer) do
    case viewer in current_vertices do
      true ->
        {:already_consuming, current_vertices}
      false ->
        {:ok, current_vertices}
    end
  end
  defp _get_streamer(graph, source, vertices, viewer) do
    streamer = Graph.dijkstra(graph, source, viewer) |> _get_direct_streamer()
    graph = _remove_edges_between_non_optimal_watchers(graph, vertices, streamer, viewer)
    {:ok, graph, streamer}
  end
  defp _get_direct_streamer(list_of_path) do
    [_watcher | [streamer | _]] = Enum.reverse(list_of_path)
    streamer
  end
  defp _add_all_edges_to_all_available_watchers(graph, weights, current_vertices, viewer) do
    Enum.reduce(weights, {:missing_streamer, graph, []}, fn {watcher, weight}, {state, graph, new_vertices} ->
      cond do
        watcher in current_vertices ->
          graph = Graph.add_edge(graph, Graph.Edge.new(watcher, viewer, weight: weight))
          {:ok, graph, [watcher | new_vertices]}
        true ->
          {state, graph, new_vertices}
      end
    end)
  end
  defp _remove_edges_between_non_optimal_watchers(graph, vertices, streamer, viewer) do
    Enum.reduce(vertices, graph, fn vertice, graph ->
      cond do
        vertice != streamer ->
          graph |> Graph.delete_edge(vertice, viewer)
        true ->
          graph
      end
    end)
  end

end
