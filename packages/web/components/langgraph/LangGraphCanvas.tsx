"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AgentNode, AgentNodeCompact, NodeConnection, NodeStatus } from "./AgentNodes";
import { NodeState } from "@/hooks/useSSE";
import {
  ChevronRight,
  Search,
  FileSearch,
  MessageSquare,
  ListChecks,
  BarChart2,
  Scale,
  Beaker,
  Building2,
  Globe,
  BookOpen,
  FileText,
  Check,
  Clock,
  Loader2,
} from "lucide-react";

interface LangGraphCanvasProps {
  nodes: NodeState[];
  isCompact?: boolean;
  className?: string;
}

// Default pipeline stages with icons
const DEFAULT_PIPELINE = [
  // Phase 1: Setup
  { id: "query_analyzer", name: "Analyzing Query", icon: Search },
  { id: "document_check", name: "Checking Documents", icon: FileSearch },
  { id: "chat_context", name: "Loading Context", icon: MessageSquare },
  { id: "task_planner", name: "Planning Tasks", icon: ListChecks },
  // Phase 2: Data Collection (each as separate node)
  { id: "iqvia_worker", name: "Market Research", icon: BarChart2 },
  { id: "patent_worker", name: "Patent Search (Google)", icon: Scale },
  { id: "clinical_worker", name: "Clinical Trials", icon: Beaker },
  { id: "company_rag_worker", name: "Company Documents (RAG)", icon: Building2 },
  { id: "web_intel_worker", name: "Web Search (Tavily)", icon: Globe },
  { id: "literature_worker", name: "Scientific Literature", icon: BookOpen },
  // Phase 3: Synthesis
  { id: "synthesizer", name: "Generating Report", icon: FileText },
];

export function LangGraphCanvas({
  nodes,
  isCompact = false,
  className,
}: LangGraphCanvasProps) {
  // Create a map of node states
  const nodeStates = useMemo(() => {
    const map = new Map<string, NodeState>();
    nodes.forEach((node) => {
      map.set(node.nodeId, node);
    });
    return map;
  }, [nodes]);

  // Calculate which nodes are active
  const activeNodeIndex = useMemo(() => {
    let lastActiveIndex = -1;
    DEFAULT_PIPELINE.forEach((stage, index) => {
      const state = nodeStates.get(stage.id);
      if (state && (state.status === "running" || state.status === "completed")) {
        lastActiveIndex = index;
      }
    });
    return lastActiveIndex;
  }, [nodeStates]);

  if (isCompact) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">
          Pipeline Progress
        </div>
        {DEFAULT_PIPELINE.map((stage) => {
          const state = nodeStates.get(stage.id);
          return (
            <AgentNodeCompact
              key={stage.id}
              name={stage.name}
              status={(state?.status as NodeStatus) || "pending"}
              progress={state?.progress || 0}
              thought={state?.thought}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("p-4", className)}>
      <div className="text-sm font-semibold text-text-primary mb-4">
        LangGraph Pipeline
      </div>

      {/* Pipeline visualization */}
      <div className="relative">
        {/* Row 1: Query Analyzer -> Task Router */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {DEFAULT_PIPELINE.slice(0, 2).map((stage, index) => {
            const state = nodeStates.get(stage.id);
            const isActive = activeNodeIndex >= index;
            const isRunning = state?.status === "running";

            return (
              <div key={stage.id} className="flex items-center gap-2">
                <AgentNode
                  id={stage.id}
                  name={stage.name}
                  status={(state?.status as NodeStatus) || "pending"}
                  progress={state?.progress || 0}
                  thought={state?.thought}
                  isActive={isRunning}
                />
                {index < 1 && (
                  <NodeConnection
                    isActive={isActive}
                    isComplete={activeNodeIndex > index}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Branching indicator */}
        <div className="flex justify-center mb-4">
          <ChevronRight className="w-5 h-5 text-gray-400 rotate-90" />
        </div>

        {/* Row 2: Parallel workers */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {DEFAULT_PIPELINE.slice(2, 5).map((stage) => {
            const state = nodeStates.get(stage.id);
            const isRunning = state?.status === "running";

            return (
              <div key={stage.id} className="flex justify-center">
                <AgentNode
                  id={stage.id}
                  name={stage.name}
                  status={(state?.status as NodeStatus) || "pending"}
                  progress={state?.progress || 0}
                  thought={state?.thought}
                  isActive={isRunning}
                />
              </div>
            );
          })}
        </div>

        {/* Row 3: More parallel workers */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {DEFAULT_PIPELINE.slice(5, 8).map((stage) => {
            const state = nodeStates.get(stage.id);
            const isRunning = state?.status === "running";

            return (
              <div key={stage.id} className="flex justify-center">
                <AgentNode
                  id={stage.id}
                  name={stage.name}
                  status={(state?.status as NodeStatus) || "pending"}
                  progress={state?.progress || 0}
                  thought={state?.thought}
                  isActive={isRunning}
                />
              </div>
            );
          })}
        </div>

        {/* Converging indicator */}
        <div className="flex justify-center mb-4">
          <ChevronRight className="w-5 h-5 text-gray-400 rotate-90" />
        </div>

        {/* Row 4: Synthesizer */}
        <div className="flex justify-center">
          {DEFAULT_PIPELINE.slice(8).map((stage) => {
            const state = nodeStates.get(stage.id);
            const isRunning = state?.status === "running";

            return (
              <AgentNode
                key={stage.id}
                id={stage.id}
                name={stage.name}
                status={(state?.status as NodeStatus) || "pending"}
                progress={state?.progress || 0}
                thought={state?.thought}
                isActive={isRunning}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Inline version for chat messages - shows all nodes with status
export function LangGraphInline({
  nodes,
  className,
}: {
  nodes: NodeState[];
  className?: string;
}) {
  const nodeStates = useMemo(() => {
    const map = new Map<string, NodeState>();
    nodes.forEach((node) => {
      map.set(node.nodeId, node);
    });
    return map;
  }, [nodes]);

  // Count completed and total
  const completedCount = nodes.filter((n) => n.status === "completed").length;
  const totalCount = DEFAULT_PIPELINE.length;
  const isComplete = completedCount === totalCount && totalCount > 0;

  // Get status icon for a node
  const getStatusIcon = (status: string | undefined) => {
    switch (status) {
      case "completed":
        return <Check className="w-4 h-4 text-accent-green" />;
      case "running":
        return <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />;
      case "failed":
        return <span className="w-4 h-4 text-red-500">✕</span>;
      default:
        return <Clock className="w-4 h-4 text-text-muted opacity-50" />;
    }
  };

  return (
    <div
      className={cn(
        "bg-background-card border border-border-default rounded-lg p-4 shadow-md",
        className
      )}
    >
      {/* Progress header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-text-primary">
          Analysis Progress
        </span>
        <span className="text-xs font-medium text-text-muted bg-background-tertiary px-2 py-1 rounded">
          {completedCount}/{totalCount} steps
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-4">
        <div
          className={cn(
            "h-full transition-all duration-500",
            isComplete
              ? "bg-accent-green"
              : "bg-gradient-to-r from-accent-cyan to-accent-green"
          )}
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* All nodes list */}
      <div className="space-y-2">
        {DEFAULT_PIPELINE.map((stage) => {
          const state = nodeStates.get(stage.id);
          const status = state?.status;
          const Icon = stage.icon;
          const isRunning = status === "running";
          const isCompleted = status === "completed";

          return (
            <div
              key={stage.id}
              className={cn(
                "flex items-center gap-3 py-1.5 px-2 rounded-md transition-all",
                isRunning && "bg-accent-cyan/10 border border-accent-cyan/30",
                isCompleted && "opacity-70"
              )}
            >
              {/* Status icon */}
              <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                {getStatusIcon(status)}
              </div>

              {/* Node icon */}
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  isRunning && "text-accent-cyan",
                  isCompleted && "text-accent-green",
                  !isRunning && !isCompleted && "text-text-muted"
                )}
              />

              {/* Node name and thought */}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    "text-sm",
                    isRunning && "text-accent-cyan font-medium",
                    isCompleted && "text-text-secondary",
                    !isRunning && !isCompleted && "text-text-muted"
                  )}
                >
                  {stage.name}
                </span>
                {isRunning && state?.thought && (
                  <p className="text-xs text-text-muted truncate mt-0.5">
                    {state.thought}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion message */}
      {isComplete && (
        <div className="mt-4 pt-3 border-t border-border-default">
          <div className="flex items-center gap-2 text-accent-green">
            <Check className="w-4 h-4" />
            <span className="text-sm font-medium">Analysis complete!</span>
          </div>
        </div>
      )}
    </div>
  );
}
