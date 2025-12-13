"use client";

import { Handle, Position, NodeProps, Node } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { Activity, Beaker, Package, ChevronRight, ChevronDown, Building2, Folder, FileText, FlaskConical, Newspaper } from "lucide-react";

interface NodeData {
  label: string;
  score?: number;
  match_score?: number;
  isExpanded?: boolean;
  childCount?: number;
  onExpand?: (nodeId: string) => void;
  // Additional metadata for leaf nodes
  patent_id?: string;
  nct_id?: string;
  status?: string;
  phase?: string;
  source?: string;
  date?: string;
  url?: string;
  expiration?: string;
  sponsor?: string;
  manufacturer?: string;
  assignee?: string;
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
  const hasChildren = data.childCount && data.childCount > 0;

  return (
    <div
      onClick={() => hasChildren && data.onExpand?.(id)}
      className={cn(
        "px-4 py-3 rounded-xl border-2 bg-background-card min-w-[140px] transition-all",
        selected
          ? "border-node-disease shadow-lg shadow-node-disease/20"
          : "border-node-disease/50",
        data.isExpanded && "ring-2 ring-node-disease/30",
        hasChildren && "cursor-pointer hover:shadow-lg hover:shadow-node-disease/10"
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
  const hasChildren = data.childCount && data.childCount > 0;

  return (
    <div
      onClick={() => hasChildren && data.onExpand?.(id)}
      className={cn(
        "px-4 py-3 rounded-xl border-2 bg-background-card min-w-[140px] transition-all",
        selected
          ? "border-node-molecule shadow-lg shadow-node-molecule/20"
          : "border-node-molecule/50",
        data.isExpanded && "ring-2 ring-node-molecule/30",
        hasChildren && "cursor-pointer hover:shadow-lg hover:shadow-node-molecule/10"
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
  const hasChildren = data.childCount && data.childCount > 0;
  const matchScore = data.score || data.match_score;

  // Determine the type of content based on available metadata
  const isPatent = !!data.patent_id;
  const isTrial = !!data.nct_id;
  const isNews = !!data.source || !!data.url;

  // Pick appropriate icon
  const Icon = isPatent ? FileText : isTrial ? FlaskConical : isNews ? Newspaper : Package;
  const typeLabel = isPatent ? "Patent" : isTrial ? "Trial" : isNews ? "News" : "Product";

  return (
    <div
      onClick={() => hasChildren && data.onExpand?.(id)}
      className={cn(
        "px-4 py-3 rounded-xl border-2 bg-background-card min-w-[160px] max-w-[280px] transition-all",
        selected
          ? "border-node-product shadow-lg shadow-node-product/20"
          : "border-node-product/50",
        data.isExpanded && "ring-2 ring-node-product/30",
        hasChildren && "cursor-pointer hover:shadow-lg hover:shadow-node-product/10"
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
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg bg-node-product/20 flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-node-product" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-node-product uppercase tracking-wide">
            {typeLabel}
          </p>
          <p className="font-medium text-text-primary text-sm leading-tight line-clamp-2">{data.label}</p>

          {/* Patent metadata */}
          {isPatent && (
            <div className="mt-1 space-y-0.5">
              {data.patent_id && (
                <p className="text-xs text-accent-cyan font-mono">{data.patent_id}</p>
              )}
              {data.expiration && (
                <p className="text-xs text-text-muted">Exp: {data.expiration}</p>
              )}
            </div>
          )}

          {/* Trial metadata */}
          {isTrial && (
            <div className="mt-1 space-y-0.5">
              {data.nct_id && (
                <p className="text-xs text-accent-cyan font-mono">{data.nct_id}</p>
              )}
              {data.status && (
                <p className={cn(
                  "text-xs",
                  data.status === "Completed" ? "text-green-400" :
                  data.status === "Recruiting" ? "text-blue-400" :
                  "text-text-muted"
                )}>{data.status}</p>
              )}
              {data.sponsor && (
                <p className="text-xs text-text-muted truncate">{data.sponsor}</p>
              )}
            </div>
          )}

          {/* News metadata */}
          {isNews && (
            <div className="mt-1 space-y-0.5">
              {data.source && (
                <p className="text-xs text-accent-cyan">{data.source}</p>
              )}
              {data.date && (
                <p className="text-xs text-text-muted">{data.date}</p>
              )}
            </div>
          )}

          {/* Match score for all types */}
          {matchScore && !isPatent && !isTrial && !isNews && (
            <p className="text-xs text-text-muted mt-1">{matchScore}% match</p>
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

// Company node for assignees/manufacturers
export function CompanyNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  const hasChildren = data.childCount && data.childCount > 0;

  return (
    <div
      onClick={() => hasChildren && data.onExpand?.(id)}
      className={cn(
        "px-4 py-3 rounded-xl border-2 bg-background-card min-w-[140px] transition-all",
        selected
          ? "border-blue-500 shadow-lg shadow-blue-500/20"
          : "border-blue-500/50",
        data.isExpanded && "ring-2 ring-blue-500/30",
        hasChildren && "cursor-pointer hover:shadow-lg hover:shadow-blue-500/10"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-500 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-blue-500 !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Building2 className="w-4 h-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-blue-400 uppercase tracking-wide">
            Company
          </p>
          <p className="font-medium text-text-primary">{data.label}</p>
        </div>
        <ExpandButton
          isExpanded={data.isExpanded}
          childCount={data.childCount}
          onClick={() => data.onExpand?.(id)}
          colorClass="text-blue-400"
        />
      </div>
    </div>
  );
}

// Category node for phases/themes
export function CategoryNode({ id, data, selected }: NodeProps<Node<NodeData>>) {
  const hasChildren = data.childCount && data.childCount > 0;

  return (
    <div
      onClick={() => hasChildren && data.onExpand?.(id)}
      className={cn(
        "px-4 py-3 rounded-xl border-2 bg-background-card min-w-[140px] transition-all",
        selected
          ? "border-emerald-500 shadow-lg shadow-emerald-500/20"
          : "border-emerald-500/50",
        data.isExpanded && "ring-2 ring-emerald-500/30",
        hasChildren && "cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-emerald-500 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-emerald-500 !w-3 !h-3"
      />
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Folder className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-emerald-400 uppercase tracking-wide">
            Category
          </p>
          <p className="font-medium text-text-primary">{data.label}</p>
        </div>
        <ExpandButton
          isExpanded={data.isExpanded}
          childCount={data.childCount}
          onClick={() => data.onExpand?.(id)}
          colorClass="text-emerald-400"
        />
      </div>
    </div>
  );
}
