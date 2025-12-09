/**
 * Graph visualization service for Mind Map
 */
import apiClient from './api';
import { API_ENDPOINTS } from '@/constants/api';

export type NodeType = 'disease' | 'molecule' | 'product';

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  x?: number;
  y?: number;
  data?: Record<string, any>;
  match_score?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  weight?: number;
}

export interface GraphVisualization {
  nodes: GraphNode[];
  edges: GraphEdge[];
  context: string;
  metadata?: {
    total_nodes: number;
    total_edges: number;
    node_types?: Record<string, number>;
  };
}

export interface NodeDetail {
  node: GraphNode;
  related_nodes: GraphNode[];
  additional_info?: Record<string, any>;
}

export const graphService = {
  /**
   * Get graph visualization data for a context
   */
  async getVisualization(context: string): Promise<GraphVisualization> {
    const response = await apiClient.get<GraphVisualization>(
      API_ENDPOINTS.graph.visualize,
      { params: { context } }
    );
    return response.data;
  },

  /**
   * Get node details (when user taps a node)
   */
  async getNodeDetails(nodeId: string): Promise<NodeDetail> {
    const response = await apiClient.get<NodeDetail>(
      API_ENDPOINTS.graph.nodeDetails(nodeId)
    );
    return response.data;
  },

  /**
   * List available contexts
   */
  async getContexts() {
    const response = await apiClient.get(API_ENDPOINTS.graph.contexts);
    return response.data;
  },

  /**
   * Export graph in various formats
   */
  async exportGraph(context: string, format: 'json' | 'cytoscape' | 'd3' = 'json') {
    const response = await apiClient.get(API_ENDPOINTS.graph.export, {
      params: { context, format },
    });
    return response.data;
  },
};

export default graphService;
