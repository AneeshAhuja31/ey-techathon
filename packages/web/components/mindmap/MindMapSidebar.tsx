"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Network,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { LangGraphCanvas } from "@/components/langgraph";
import { NodeState } from "@/hooks/useSSE";

interface MindMapSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  nodes?: NodeState[];
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
  nodes = [],
  mindMapData,
  className,
}: MindMapSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"pipeline" | "mindmap">("pipeline");

  // Auto-switch to pipeline when nodes are active
  useEffect(() => {
    if (nodes.length > 0 && nodes.some((n) => n.status === "running")) {
      setActiveTab("pipeline");
    }
  }, [nodes]);

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
          <span className="font-semibold text-text-primary">Analysis View</span>
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

      {/* Tab buttons */}
      <div className="flex border-b border-border-default">
        <button
          onClick={() => setActiveTab("pipeline")}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "pipeline"
              ? "text-accent-cyan border-b-2 border-accent-cyan"
              : "text-text-muted hover:text-text-primary"
          )}
        >
          Pipeline
          {nodes.some((n) => n.status === "running") && (
            <span className="ml-2 w-2 h-2 rounded-full bg-accent-cyan inline-block animate-pulse" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("mindmap")}
          className={cn(
            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "mindmap"
              ? "text-accent-cyan border-b-2 border-accent-cyan"
              : "text-text-muted hover:text-text-primary"
          )}
        >
          Mind Map
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === "pipeline" ? (
          <div className="p-4">
            {nodes.length > 0 ? (
              <LangGraphCanvas nodes={nodes} isCompact={!isExpanded} />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-text-muted">
                <Network className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No active pipeline</p>
                <p className="text-xs mt-1">
                  Start a research query to see the agent pipeline
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
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

// Simple mind map view component
function MindMapView({
  data,
}: {
  data: {
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
}) {
  const typeColors: Record<string, string> = {
    molecule: "bg-purple-100 text-purple-800 border border-purple-200",
    disease: "bg-pink-100 text-pink-800 border border-pink-200",
    product: "bg-amber-100 text-amber-800 border border-amber-200",
    patent: "bg-blue-100 text-blue-800 border border-blue-200",
    clinical: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    market: "bg-sky-100 text-sky-800 border border-sky-200",
    default: "bg-gray-100 text-gray-800 border border-gray-200",
  };

  // Group nodes by type
  const nodesByType = data.nodes.reduce(
    (acc, node) => {
      const type = node.type || "default";
      if (!acc[type]) acc[type] = [];
      acc[type].push(node);
      return acc;
    },
    {} as Record<string, typeof data.nodes>
  );

  return (
    <div className="space-y-6">
      {Object.entries(nodesByType).map(([type, nodes]) => (
        <div key={type}>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            {type}
          </h3>
          <div className="space-y-2">
            {nodes.map((node) => (
              <div
                key={node.id}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm",
                  typeColors[type] || typeColors.default
                )}
              >
                <div className="font-medium">{node.label}</div>
                {node.data && Object.keys(node.data).length > 0 && (
                  <div className="text-xs opacity-75 mt-1">
                    {Object.entries(node.data)
                      .slice(0, 2)
                      .map(([key, value]) => (
                        <div key={key}>
                          {key}: {String(value)}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.edges.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">
            Connections
          </h3>
          <div className="text-xs text-text-muted">
            {data.edges.length} relationships identified
          </div>
        </div>
      )}
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
