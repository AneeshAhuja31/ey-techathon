/**
 * Mind Map Node component - individual node in the graph
 */
import React from 'react';
import { G, Circle, Text, Rect } from 'react-native-svg';
import { NodeColors } from '@/constants/colors';
import { NodeType } from '@/services/graphService';

interface MindMapNodeProps {
  id: string;
  x: number;
  y: number;
  label: string;
  type: NodeType;
  matchScore?: number;
  onPress: (nodeId: string) => void;
}

const NODE_CONFIG = {
  disease: {
    color: NodeColors.disease,
    radius: 40,
    fontSize: 11,
  },
  molecule: {
    color: NodeColors.molecule,
    radius: 35,
    fontSize: 10,
  },
  product: {
    color: NodeColors.product,
    radius: 28,
    fontSize: 9,
  },
};

export function MindMapNode({
  id,
  x,
  y,
  label,
  type,
  matchScore,
  onPress,
}: MindMapNodeProps) {
  const config = NODE_CONFIG[type] || NODE_CONFIG.molecule;

  return (
    <G onPress={() => onPress(id)}>
      {/* Glow effect */}
      <Circle
        cx={x}
        cy={y}
        r={config.radius + 6}
        fill={config.color}
        opacity={0.15}
      />

      {/* Outer ring */}
      <Circle
        cx={x}
        cy={y}
        r={config.radius + 2}
        fill="none"
        stroke={config.color}
        strokeWidth={1}
        opacity={0.5}
      />

      {/* Main node circle */}
      <Circle
        cx={x}
        cy={y}
        r={config.radius}
        fill="#1A1A1A"
        stroke={config.color}
        strokeWidth={2}
      />

      {/* Label */}
      <Text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize={config.fontSize}
        fontWeight="bold"
      >
        {label}
      </Text>

      {/* Match score badge for products */}
      {matchScore !== undefined && type === 'product' && (
        <>
          <Circle
            cx={x + config.radius - 5}
            cy={y - config.radius + 5}
            r={12}
            fill={config.color}
          />
          <Text
            x={x + config.radius - 5}
            y={y - config.radius + 9}
            textAnchor="middle"
            fill="#000000"
            fontSize={8}
            fontWeight="bold"
          >
            {matchScore}%
          </Text>
        </>
      )}
    </G>
  );
}

export default MindMapNode;
