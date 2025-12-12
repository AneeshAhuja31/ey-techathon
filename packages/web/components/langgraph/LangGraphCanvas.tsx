"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { AgentNode, AgentNodeCompact, NodeConnection, NodeStatus } from "./AgentNodes";
import { NodeState } from "@/hooks/useSSE";
import { ChevronRight } from "lucide-react";

interface LangGraphCanvasProps {
  nodes: NodeState[];
  isCompact?: boolean;
  className?: string;
}

// Default pipeline stages
const DEFAULT_PIPELINE = [
  { id: "intent_classifier", name: "Query Analyzer" },
  { id: "task_planner", name: "Task Router" },
  { id: "iqvia_worker", name: "Market Research" },
  { id: "patent_worker", name: "Patent Search" },
  { id: "clinical_worker", name: "Clinical Trials" },
  { id: "web_intel_worker", name: "Web Intel" },
  { id: "literature_worker", name: "Literature" },
  { id: "company_rag_worker", name: "Company Data" },
  { id: "synthesizer", name: "Report" },
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

// Inline version for chat messages
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

  // Find the currently active node
  const activeNode = useMemo(() => {
    for (const stage of DEFAULT_PIPELINE) {
      const state = nodeStates.get(stage.id);
      if (state?.status === "running") {
        return { ...stage, state };
      }
    }
    return null;
  }, [nodeStates]);

  // Count completed and total
  const completedCount = nodes.filter((n) => n.status === "completed").length;
  const totalCount = DEFAULT_PIPELINE.length;

  return (
    <div
      className={cn(
        "bg-background-card border border-border-default rounded-lg p-4 shadow-sm",
        className
      )}
    >
      {/* Progress header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text-primary">
          Analysis Progress
        </span>
        <span className="text-xs text-text-muted">
          {completedCount}/{totalCount} steps
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-accent-cyan to-accent-green transition-all duration-500"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Active node indicator */}
      {activeNode && (
        <div className="flex items-center gap-2 text-accent-cyan">
          <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
          <span className="text-sm font-medium">{activeNode.name}</span>
          {activeNode.state.thought && (
            <span className="text-xs text-text-muted truncate">
              - {activeNode.state.thought}
            </span>
          )}
        </div>
      )}

      {/* Completed nodes summary */}
      {completedCount > 0 && !activeNode && (
        <div className="text-sm text-accent-green">
          Analysis complete!
        </div>
      )}
    </div>
  );
}
