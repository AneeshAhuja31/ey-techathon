/**
 * Mind Map Edge - connection line between nodes
 */
import React from 'react';
import { Line, Path } from 'react-native-svg';
import Colors from '@/constants/colors';

interface MindMapEdgeProps {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  curved?: boolean;
}

export function MindMapEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  curved = true,
}: MindMapEdgeProps) {
  if (curved) {
    // Calculate control points for bezier curve
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;

    // Offset control point perpendicular to the line
    const offset = 30;
    const length = Math.sqrt(dx * dx + dy * dy);
    const cx = midX - (dy / length) * offset * 0.3;
    const cy = midY + (dx / length) * offset * 0.3;

    const pathData = `M ${sourceX} ${sourceY} Q ${cx} ${cy} ${targetX} ${targetY}`;

    return (
      <Path
        d={pathData}
        fill="none"
        stroke={Colors.border.default}
        strokeWidth={1.5}
        strokeLinecap="round"
        opacity={0.6}
      />
    );
  }

  return (
    <Line
      x1={sourceX}
      y1={sourceY}
      x2={targetX}
      y2={targetY}
      stroke={Colors.border.default}
      strokeWidth={1.5}
      strokeLinecap="round"
      opacity={0.6}
    />
  );
}

export default MindMapEdge;
