"use client";

import { useCallback, useMemo, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { DiseaseNode, MoleculeNode, ProductNode, CompanyNode, CategoryNode } from "./CustomNodes";
import { hierarchicalMindMapData, mockMindMapData } from "@/lib/mock-data";
import { getLayoutedElements } from "@/lib/layout";

const nodeTypes = {
  disease: DiseaseNode,
  molecule: MoleculeNode,
  product: ProductNode,
  company: CompanyNode,
  category: CategoryNode,
};

export function MindMapCanvas() {
  // Start with the base mock data
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    return getLayoutedElements(mockMindMapData.nodes, mockMindMapData.edges);
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node expansion
  const handleNodeExpand = useCallback((nodeId: string) => {
    setNodes((currentNodes) => {
      // Find the node being expanded
      const targetNode = currentNodes.find((n) => n.id === nodeId);
      if (!targetNode) return currentNodes;

      const isCurrentlyExpanded = targetNode.data.isExpanded;
      const childIds = targetNode.data.childIds as string[] | undefined;

      if (!childIds || childIds.length === 0) return currentNodes;

      // Toggle expansion state
      const newIsExpanded = !isCurrentlyExpanded;

      // Get all descendant node IDs (children, grandchildren, etc.)
      const getDescendants = (ids: string[]): string[] => {
        const descendants: string[] = [];
        ids.forEach((id) => {
          descendants.push(id);
          const node = hierarchicalMindMapData.nodes.find((n) => n.id === id);
          if (node?.childIds && node.childIds.length > 0) {
            // Only add grandchildren if the child node is expanded
            const childNode = currentNodes.find((n) => n.id === id);
            if (childNode?.data.isExpanded) {
              descendants.push(...getDescendants(node.childIds));
            }
          }
        });
        return descendants;
      };

      if (newIsExpanded) {
        // Expanding: Add child nodes that don't exist yet
        const existingIds = new Set(currentNodes.map((n) => n.id));
        const newNodes: Node[] = [];

        childIds.forEach((childId) => {
          if (!existingIds.has(childId)) {
            const childData = hierarchicalMindMapData.nodes.find(
              (n) => n.id === childId
            );
            if (childData) {
              newNodes.push({
                id: childData.id,
                type: childData.type,
                position: { x: 0, y: 0 },
                data: {
                  label: childData.label,
                  score: childData.score,
                  isExpanded: false,
                  childCount: childData.childIds?.length || 0,
                  parentId: childData.parentId,
                  childIds: childData.childIds,
                  onExpand: handleNodeExpand,
                },
              });
            }
          }
        });

        // Update the target node's expanded state
        const updatedNodes = currentNodes.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: { ...node.data, isExpanded: true },
            };
          }
          return node;
        });

        // Add new nodes and relayout
        const allNodes = [...updatedNodes, ...newNodes];

        // Add new edges for the children
        const newEdgeIds = new Set(edges.map((e) => e.id));
        const newEdges = hierarchicalMindMapData.edges
          .filter(
            (e) =>
              e.source === nodeId &&
              childIds.includes(e.target) &&
              !newEdgeIds.has(e.id)
          )
          .map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            animated: true,
          }));

        if (newEdges.length > 0) {
          setEdges((currentEdges) => [...currentEdges, ...newEdges]);
        }

        // Relayout all nodes
        const { nodes: layoutedNodes } = getLayoutedElements(allNodes, [
          ...edges,
          ...newEdges,
        ]);
        return layoutedNodes;
      } else {
        // Collapsing: Hide all descendants
        const descendantIds = new Set(getDescendants(childIds));

        // Update the target node's expanded state and remove descendants
        const updatedNodes = currentNodes
          .filter((node) => !descendantIds.has(node.id))
          .map((node) => {
            if (node.id === nodeId) {
              return {
                ...node,
                data: { ...node.data, isExpanded: false },
              };
            }
            return node;
          });

        // Remove edges connected to hidden nodes
        setEdges((currentEdges) =>
          currentEdges.filter(
            (e) => !descendantIds.has(e.source) && !descendantIds.has(e.target)
          )
        );

        // Relayout remaining nodes
        const remainingEdges = edges.filter(
          (e) => !descendantIds.has(e.source) && !descendantIds.has(e.target)
        );
        const { nodes: layoutedNodes } = getLayoutedElements(
          updatedNodes,
          remainingEdges
        );
        return layoutedNodes;
      }
    });
  }, [edges, setEdges]);

  // Inject the expand handler into all nodes
  useEffect(() => {
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          onExpand: handleNodeExpand,
        },
      }))
    );
  }, [handleNodeExpand, setNodes]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log("Node clicked:", node);
    // Could show details panel here
  }, []);

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.5}
        maxZoom={2}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: { stroke: "#333333", strokeWidth: 2 },
        }}
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
              case "company":
                return "#3B82F6";
              case "category":
                return "#10B981";
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
