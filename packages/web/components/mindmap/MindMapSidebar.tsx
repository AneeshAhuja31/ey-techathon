"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Network,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DiseaseNode, MoleculeNode, ProductNode } from "./CustomNodes";
import { getLayoutedElements } from "@/lib/layout";

interface MindMapSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  mindMapData?: {
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      data?: Record<string, unknown>;
    }>;
    edges: Array<{
      id: string;
      source: string;
      target: string;
      label?: string;
    }>;
  };
  className?: string;
}

export function MindMapSidebar({
  isOpen,
  onToggle,
  mindMapData,
  className,
}: MindMapSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle button shown when sidebar is closed
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className={cn(
          "fixed right-0 top-1/2 -translate-y-1/2 z-40",
          "bg-background-card border border-border-default border-r-0",
          "px-2 py-4 rounded-l-lg shadow-lg",
          "hover:bg-background-tertiary transition-colors",
          "group"
        )}
        title="Open Mind Map Panel"
      >
        <div className="flex flex-col items-center gap-2">
          <Network className="w-5 h-5 text-accent-cyan" />
          <ChevronLeft className="w-4 h-4 text-text-muted group-hover:text-text-primary" />
        </div>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-background-secondary border-l border-border-default",
        "transition-all duration-300 ease-in-out",
        isExpanded ? "w-[600px]" : "w-[350px]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-accent-cyan" />
          <span className="font-semibold text-text-primary">Mind Map</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-background-tertiary rounded transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <Minimize2 className="w-4 h-4 text-text-muted" />
            ) : (
              <Maximize2 className="w-4 h-4 text-text-muted" />
            )}
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 hover:bg-background-tertiary rounded transition-colors"
            title="Close panel"
          >
            <X className="w-4 h-4 text-text-muted" />
          </button>
        </div>
      </div>

      {/* Content - Mind Map only (no tabs) */}
      <div className="flex-1 overflow-auto p-4">
        {mindMapData && mindMapData.nodes.length > 0 ? (
          <MindMapView data={mindMapData} />
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-text-muted">
            <Network className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No mind map data</p>
            <p className="text-xs mt-1">
              Complete a research analysis to generate a mind map
            </p>
          </div>
        )}
      </div>

      {/* Footer with collapse button */}
      <div className="border-t border-border-default p-2">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-text-muted hover:text-text-primary hover:bg-background-tertiary rounded transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
          <span>Hide Panel</span>
        </button>
      </div>
    </div>
  );
}

// React Flow mind map visualization component with expand/collapse
const nodeTypes = {
  disease: DiseaseNode,
  molecule: MoleculeNode,
  product: ProductNode,
};

// Interface for backend node data
interface BackendNode {
  id: string;
  label: string;
  type: string;
  parentId?: string;
  childIds?: string[];
  isExpanded?: boolean;
  data?: Record<string, unknown>;
}

interface BackendEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

function MindMapView({
  data,
}: {
  data: {
    nodes: BackendNode[];
    edges: BackendEdge[];
  };
}) {
  // Store all original data for expand/collapse
  const allNodesRef = useRef<BackendNode[]>(data.nodes);
  const allEdgesRef = useRef<BackendEdge[]>(data.edges);

  // Update refs when data changes
  useEffect(() => {
    allNodesRef.current = data.nodes;
    allEdgesRef.current = data.edges;
  }, [data]);

  // Calculate initial visible nodes (first 2 layers by default, then based on expansion)
  const getVisibleNodesAndEdges = useCallback((
    allNodes: BackendNode[],
    allEdges: BackendEdge[],
    expandedState: Map<string, boolean>
  ) => {
    // Find which nodes should be visible based on parent expansion state
    const visibleNodeIds = new Set<string>();

    // Get node depth (0 = root, 1 = first child layer, etc.)
    const getNodeDepth = (nodeId: string, depth = 0): number => {
      const node = allNodes.find(n => n.id === nodeId);
      if (!node || !node.parentId) return depth;
      return getNodeDepth(node.parentId, depth + 1);
    };

    // Add root nodes (no parent) and their visible children
    const addVisibleNodes = (nodeId: string, depth: number = 0) => {
      const node = allNodes.find(n => n.id === nodeId);
      if (!node) return;

      visibleNodeIds.add(nodeId);

      // Check if this node should show children
      // By default: show first 2 layers (depth 0 and 1)
      // After that: only show if explicitly expanded
      const isExpanded = expandedState.has(nodeId)
        ? expandedState.get(nodeId)
        : depth < 1; // Default: expand only root level (depth 0)

      if (isExpanded && node.childIds) {
        node.childIds.forEach(childId => addVisibleNodes(childId, depth + 1));
      }
    };

    // Start from root nodes (no parentId)
    allNodes
      .filter(n => !n.parentId)
      .forEach(n => addVisibleNodes(n.id, 0));

    // Convert to React Flow format
    const rfNodes: Node[] = allNodes
      .filter(node => visibleNodeIds.has(node.id))
      .map((node) => {
        const nodeDepth = getNodeDepth(node.id);
        // Determine if this node is expanded
        const isNodeExpanded = expandedState.has(node.id)
          ? expandedState.get(node.id)!
          : nodeDepth < 1; // Default: expand only root level

        return {
          id: node.id,
          type: node.type as "disease" | "molecule" | "product",
          position: { x: 0, y: 0 },
          data: {
            label: node.label,
            score: node.data?.match_score as number | undefined,
            childCount: node.childIds?.length || 0,
            childIds: node.childIds,
            parentId: node.parentId,
            isExpanded: isNodeExpanded,
            ...node.data,
          },
        };
      });

    // Only include edges where both source and target are visible
    const rfEdges: Edge[] = allEdges
      .filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
      .map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: true,
      }));

    return getLayoutedElements(rfNodes, rfEdges);
  }, []);

  // Track expanded state (empty by default, uses depth-based defaults)
  const [expandedState, setExpandedState] = useState<Map<string, boolean>>(() => {
    return new Map<string, boolean>();
  });

  // Calculate initial nodes and edges
  const initialData = useMemo(() => {
    return getVisibleNodesAndEdges(data.nodes, data.edges, expandedState);
  }, [data, expandedState, getVisibleNodesAndEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  // Get node depth helper (needs to be outside for handleNodeExpand)
  const getNodeDepth = useCallback((nodeId: string): number => {
    const findDepth = (id: string, depth: number): number => {
      const node = allNodesRef.current.find(n => n.id === id);
      if (!node || !node.parentId) return depth;
      return findDepth(node.parentId, depth + 1);
    };
    return findDepth(nodeId, 0);
  }, []);

  // Handle node expansion
  const handleNodeExpand = useCallback((nodeId: string) => {
    setExpandedState(prev => {
      const next = new Map(prev);
      const nodeDepth = getNodeDepth(nodeId);
      // Get current state: check map first, then use depth-based default
      const currentState = prev.has(nodeId)
        ? prev.get(nodeId)!
        : nodeDepth < 1; // Default: depth 0 is expanded
      next.set(nodeId, !currentState);

      // Recalculate visible nodes
      const { nodes: newNodes, edges: newEdges } = getVisibleNodesAndEdges(
        allNodesRef.current,
        allEdgesRef.current,
        next
      );

      // Inject expand handler into all nodes
      const nodesWithHandler = newNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onExpand: handleNodeExpand,
        },
      }));

      setNodes(nodesWithHandler);
      setEdges(newEdges);

      return next;
    });
  }, [getNodeDepth, getVisibleNodesAndEdges, setNodes, setEdges]);

  // Inject expand handler into initial nodes
  useEffect(() => {
    setNodes(currentNodes =>
      currentNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          onExpand: handleNodeExpand,
        },
      }))
    );
  }, [handleNodeExpand, setNodes]);

  // Update when data changes from new research
  useEffect(() => {
    // Reset to empty state - let depth-based defaults apply
    const newExpandedState = new Map<string, boolean>();
    setExpandedState(newExpandedState);

    const { nodes: newNodes, edges: newEdges } = getVisibleNodesAndEdges(
      data.nodes,
      data.edges,
      newExpandedState
    );

    const nodesWithHandler = newNodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        onExpand: handleNodeExpand,
      },
    }));

    setNodes(nodesWithHandler);
    setEdges(newEdges);
  }, [data, getVisibleNodesAndEdges, handleNodeExpand, setNodes, setEdges]);

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-text-muted">
        <Network className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">No mind map data</p>
      </div>
    );
  }

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border border-border-default">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.3}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: { stroke: "#333333", strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls className="!bg-background-card !border-border-default !rounded-lg" />
        <MiniMap
          className="!bg-background-secondary !border-border-default !rounded-lg"
          nodeColor={(node) => {
            switch (node.type) {
              case "disease":
                return "#EC4899";
              case "molecule":
                return "#8B5CF6";
              case "product":
                return "#FBBF24";
              default:
                return "#666666";
            }
          }}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#333333"
        />
      </ReactFlow>
    </div>
  );
}

// Toggle button component for use in layouts
export function MindMapToggleButton({
  isOpen,
  onClick,
  hasActivity = false,
}: {
  isOpen: boolean;
  onClick: () => void;
  hasActivity?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative p-2 rounded-lg transition-colors",
        isOpen
          ? "bg-accent-cyan/20 text-accent-cyan"
          : "hover:bg-background-tertiary text-text-muted hover:text-text-primary"
      )}
      title={isOpen ? "Close Mind Map" : "Open Mind Map"}
    >
      <Network className="w-5 h-5" />
      {hasActivity && !isOpen && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
      )}
    </button>
  );
}
