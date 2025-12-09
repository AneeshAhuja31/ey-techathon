/**
 * Mind Map Canvas - SVG visualization for the graph
 */
import { useState, useRef } from 'react';
import { View, Dimensions, ScrollView } from 'react-native';
import Svg, { G } from 'react-native-svg';
import { MindMapNode } from './MindMapNode';
import { MindMapEdge } from './MindMapEdge';
import { GraphNode, GraphEdge } from '@/services/graphService';

interface MindMapCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodePress: (nodeId: string) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

export function MindMapCanvas({ nodes, edges, onNodePress }: MindMapCanvasProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Calculate bounds
  const minX = Math.min(...nodes.map((n) => n.x || 0)) - 100;
  const maxX = Math.max(...nodes.map((n) => n.x || 0)) + 100;
  const minY = Math.min(...nodes.map((n) => n.y || 0)) - 100;
  const maxY = Math.max(...nodes.map((n) => n.y || 0)) + 100;

  const viewBoxWidth = maxX - minX;
  const viewBoxHeight = maxY - minY;

  // Find node position by ID
  const getNodePosition = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    return node ? { x: node.x || 0, y: node.y || 0 } : { x: 0, y: 0 };
  };

  return (
    <View className="flex-1 bg-background-primary">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
        }}
        maximumZoomScale={2}
        minimumZoomScale={0.5}
        bouncesZoom
      >
        <Svg
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          viewBox={`${minX} ${minY} ${viewBoxWidth} ${viewBoxHeight}`}
        >
          <G>
            {/* Render edges first (behind nodes) */}
            {edges.map((edge) => {
              const source = getNodePosition(edge.source);
              const target = getNodePosition(edge.target);
              return (
                <MindMapEdge
                  key={edge.id}
                  sourceX={source.x}
                  sourceY={source.y}
                  targetX={target.x}
                  targetY={target.y}
                />
              );
            })}

            {/* Render nodes */}
            {nodes.map((node) => (
              <MindMapNode
                key={node.id}
                id={node.id}
                x={node.x || 0}
                y={node.y || 0}
                label={node.label}
                type={node.type}
                matchScore={node.match_score}
                onPress={onNodePress}
              />
            ))}
          </G>
        </Svg>
      </ScrollView>
    </View>
  );
}

export default MindMapCanvas;
