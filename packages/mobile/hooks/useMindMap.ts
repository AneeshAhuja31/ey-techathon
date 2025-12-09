/**
 * Mind Map hook for graph visualization data
 */
import { useState, useCallback } from 'react';
import { graphService, GraphVisualization, GraphNode, NodeDetail } from '@/services/graphService';
import { MOCK_MIND_MAP } from '@/constants/mockData';

interface UseMindMapReturn {
  graphData: GraphVisualization | null;
  selectedNode: GraphNode | null;
  nodeDetail: NodeDetail | null;
  isLoading: boolean;
  error: string | null;
  loadGraph: (context: string) => Promise<void>;
  selectNode: (node: GraphNode | null) => void;
  getNodeDetails: (nodeId: string) => Promise<void>;
  useMockData: () => void;
}

export function useMindMap(): UseMindMapReturn {
  const [graphData, setGraphData] = useState<GraphVisualization | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [nodeDetail, setNodeDetail] = useState<NodeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGraph = useCallback(async (context: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await graphService.getVisualization(context);
      setGraphData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load graph');
      // Fallback to mock data
      setGraphData({
        nodes: MOCK_MIND_MAP.nodes as GraphNode[],
        edges: MOCK_MIND_MAP.edges,
        context,
        metadata: {
          total_nodes: MOCK_MIND_MAP.nodes.length,
          total_edges: MOCK_MIND_MAP.edges.length,
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectNode = useCallback((node: GraphNode | null) => {
    setSelectedNode(node);
    if (!node) {
      setNodeDetail(null);
    }
  }, []);

  const getNodeDetails = useCallback(async (nodeId: string) => {
    setIsLoading(true);

    try {
      const detail = await graphService.getNodeDetails(nodeId);
      setNodeDetail(detail);
    } catch (err) {
      // Generate mock detail from current data
      if (graphData) {
        const node = graphData.nodes.find((n) => n.id === nodeId);
        if (node) {
          const relatedNodes = graphData.edges
            .filter((e) => e.source === nodeId || e.target === nodeId)
            .map((e) => {
              const relatedId = e.source === nodeId ? e.target : e.source;
              return graphData.nodes.find((n) => n.id === relatedId);
            })
            .filter(Boolean) as GraphNode[];

          setNodeDetail({
            node,
            related_nodes: relatedNodes,
            additional_info: node.data,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [graphData]);

  const useMockData = useCallback(() => {
    setGraphData({
      nodes: MOCK_MIND_MAP.nodes as GraphNode[],
      edges: MOCK_MIND_MAP.edges,
      context: 'GLP-1',
      metadata: {
        total_nodes: MOCK_MIND_MAP.nodes.length,
        total_edges: MOCK_MIND_MAP.edges.length,
      },
    });
    setError(null);
  }, []);

  return {
    graphData,
    selectedNode,
    nodeDetail,
    isLoading,
    error,
    loadGraph,
    selectNode,
    getNodeDetails,
    useMockData,
  };
}

export default useMindMap;
