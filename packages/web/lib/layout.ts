import dagre from "dagre";
import { Node, Edge } from "@xyflow/react";

const nodeWidth = 200;
const nodeHeight = 90;

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "LR"
) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const isHorizontal = direction === "LR";
  // Increased spacing: nodesep = vertical gap, ranksep = horizontal gap between levels
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 80,  // Vertical spacing between nodes (was 50)
    ranksep: 150, // Horizontal spacing between levels (was 100)
    marginx: 20,
    marginy: 20
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
