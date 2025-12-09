"use client";

import { useState, useCallback } from "react";
import { Node, Edge } from "@xyflow/react";
import { graphApi } from "@/lib/api";
import { mockMindMapData } from "@/lib/mock-data";
import { getLayoutedElements } from "@/lib/layout";

export function useMindMap() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const loadGraph = useCallback(async (context: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, use API:
      // const response = await graphApi.visualize(context);
      // const { nodes: rawNodes, edges: rawEdges } = response.data;

      // For now, use mock data
      const { nodes: rawNodes, edges: rawEdges } = mockMindMapData;

      // Apply layout
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        rawNodes,
        rawEdges
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    } catch (err) {
      setError("Failed to load graph");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getNodeDetails = useCallback(async (nodeId: string) => {
    try {
      const response = await graphApi.getNodeDetails(nodeId);
      return response.data;
    } catch (err) {
      console.error("Failed to get node details:", err);
      return null;
    }
  }, []);

  const onNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  return {
    nodes,
    edges,
    isLoading,
    error,
    selectedNode,
    loadGraph,
    getNodeDetails,
    onNodeClick,
    setNodes,
    setEdges,
  };
}
