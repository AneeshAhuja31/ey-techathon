"use client";

import { useCallback, useMemo } from "react";
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

import { DiseaseNode, MoleculeNode, ProductNode } from "./CustomNodes";
import { mockMindMapData } from "@/lib/mock-data";
import { getLayoutedElements } from "@/lib/layout";

const nodeTypes = {
  disease: DiseaseNode,
  molecule: MoleculeNode,
  product: ProductNode,
};

export function MindMapCanvas() {
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return getLayoutedElements(mockMindMapData.nodes, mockMindMapData.edges);
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log("Node clicked:", node);
    // In real app, show details panel
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
