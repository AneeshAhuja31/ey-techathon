"use client";

import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Activity, Beaker, Package, ChevronRight, ChevronDown } from "lucide-react";

interface NodeData {
  label: string;
  score?: number;
  isExpanded?: boolean;
  childCount?: number;
  onExpand?: (nodeId: string) => void;
}

// Shared expand button component
function ExpandButton({
  isExpanded,
  childCount,
  onClick,
  colorClass,
}: {
  isExpanded?: boolean;
  childCount?: number;
  onClick?: () => void;
  colorClass: string;
}) {
  if (!childCount || childCount === 0) return null;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all",
        "hover:bg-white/10",
        colorClass
      )}
    >
      {isExpanded ? (
        <ChevronDown className="w-3 h-3" />
      ) : (
        <ChevronRight className="w-3 h-3" />
      )}
      {!isExpanded && <span>{childCount}</span>}
    </button>
  );
}

export function DiseaseNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl border-2 bg-background-card min-w-[140px] transition-all",
        selected
          ? "border-node-disease shadow-lg shadow-node-disease/20"
          : "border-node-disease/50",
        data.isExpanded && "ring-2 ring-node-disease/30"
      )}
    >
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-node-disease !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-node-disease/20 flex items-center justify-center">
          <Activity className="w-4 h-4 text-node-disease" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-node-disease uppercase tracking-wide">
            Disease
          </p>
          <p className="font-medium text-text-primary">{data.label}</p>
        </div>
        <ExpandButton
          isExpanded={data.isExpanded}
          childCount={data.childCount}
          onClick={() => data.onExpand?.(id)}
          colorClass="text-node-disease"
        />
      </div>
    </div>
  );
}

export function MoleculeNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl border-2 bg-background-card min-w-[140px] transition-all",
        selected
          ? "border-node-molecule shadow-lg shadow-node-molecule/20"
          : "border-node-molecule/50",
        data.isExpanded && "ring-2 ring-node-molecule/30"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-node-molecule !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-node-molecule !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-node-molecule/20 flex items-center justify-center">
          <Beaker className="w-4 h-4 text-node-molecule" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-node-molecule uppercase tracking-wide">
            Molecule
          </p>
          <p className="font-medium text-text-primary">{data.label}</p>
        </div>
        <ExpandButton
          isExpanded={data.isExpanded}
          childCount={data.childCount}
          onClick={() => data.onExpand?.(id)}
          colorClass="text-node-molecule"
        />
      </div>
    </div>
  );
}

export function ProductNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl border-2 bg-background-card min-w-[140px] transition-all",
        selected
          ? "border-node-product shadow-lg shadow-node-product/20"
          : "border-node-product/50",
        data.isExpanded && "ring-2 ring-node-product/30"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-node-product !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-node-product !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-node-product/20 flex items-center justify-center">
          <Package className="w-4 h-4 text-node-product" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-node-product uppercase tracking-wide">
            Product
          </p>
          <p className="font-medium text-text-primary">{data.label}</p>
          {data.score && (
            <p className="text-xs text-text-muted">{data.score}% match</p>
          )}
        </div>
        <ExpandButton
          isExpanded={data.isExpanded}
          childCount={data.childCount}
          onClick={() => data.onExpand?.(id)}
          colorClass="text-node-product"
        />
      </div>
    </div>
  );
}
