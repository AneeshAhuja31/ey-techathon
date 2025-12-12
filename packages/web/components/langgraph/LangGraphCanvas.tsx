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

// Checkpoint circle component for the progress bar - sleek minimal design
function CheckpointCircle({
  stage,
  state,
  index,
  isFirst,
  isLast,
}: {
  stage: (typeof DEFAULT_PIPELINE)[0];
  state: NodeState | undefined;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}) {
  const status = state?.status;
  const isRunning = status === "running";
  const isCompleted = status === "completed";
  const isFailed = status === "failed";
  const Icon = stage.icon;

  return (
    <div className="relative group flex flex-col items-center">
      {/* Checkpoint circle - smaller and sleeker */}
      <div
        className={cn(
          "relative w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200",
          isCompleted && "bg-accent-green",
          isRunning && "bg-accent-cyan",
          isFailed && "bg-red-500",
          !isCompleted && !isRunning && !isFailed && "bg-gray-600 border border-gray-500"
        )}
      >
        {/* Subtle pulse for running state */}
        {isRunning && (
          <span className="absolute inset-0 rounded-full bg-accent-cyan animate-ping opacity-30" />
        )}

        {/* Icon inside circle */}
        {isCompleted ? (
          <Check className="w-3 h-3 text-white" />
        ) : isRunning ? (
          <Loader2 className="w-3 h-3 text-white animate-spin" />
        ) : isFailed ? (
          <span className="text-white text-[10px] font-bold">!</span>
        ) : (
          <Icon className="w-2.5 h-2.5 text-gray-400" />
        )}
      </div>

      {/* Compact tooltip on hover */}
      <div className={cn(
        "absolute -bottom-1 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50",
        "bg-gray-900 border border-gray-700 rounded px-2 py-1 shadow-lg",
        "whitespace-nowrap pointer-events-none"
      )}>
        <span className="text-[10px] text-gray-200">{stage.name}</span>
      </div>
    </div>
  );
}

// Inline version for chat messages - sleek checkpoint progress bar
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

  // Count completed and find current running node
  const completedCount = nodes.filter((n) => n.status === "completed").length;
  const totalCount = DEFAULT_PIPELINE.length;
  const isComplete = completedCount === totalCount && totalCount > 0;

  // Find the index of the current running node (or last completed if none running)
  const currentNodeIndex = useMemo(() => {
    let runningIndex = -1;
    let lastCompletedIndex = -1;

    DEFAULT_PIPELINE.forEach((stage, index) => {
      const state = nodeStates.get(stage.id);
      if (state?.status === "running") {
        runningIndex = index;
      }
      if (state?.status === "completed") {
        lastCompletedIndex = index;
      }
    });

    return runningIndex >= 0 ? runningIndex : lastCompletedIndex;
  }, [nodeStates]);

  // Calculate progress percentage (smooth between nodes)
  const progressPercent = useMemo(() => {
    if (totalCount <= 1) return isComplete ? 100 : 0;

    // Find the running node's progress within its segment
    const runningNode = nodes.find(n => n.status === "running");
    const runningProgress = runningNode?.progress || 0;

    // Each node segment is 100 / (totalCount - 1) percent
    const segmentWidth = 100 / (totalCount - 1);

    // Base progress from completed nodes
    const baseProgress = completedCount > 0 ? (completedCount - 1) * segmentWidth : 0;

    // Add partial progress for running node
    const runningContribution = currentNodeIndex >= completedCount
      ? (runningProgress / 100) * segmentWidth
      : segmentWidth;

    return Math.min(baseProgress + runningContribution, 100);
  }, [completedCount, currentNodeIndex, nodes, totalCount, isComplete]);

  // Get current running thought for display
  const currentThought = useMemo(() => {
    const runningNode = nodes.find(n => n.status === "running");
    if (runningNode?.thought) return runningNode.thought;
    return isComplete ? "Analysis complete!" : "Starting analysis...";
  }, [nodes, isComplete]);

  return (
    <div
      className={cn(
        "bg-gray-900/50 border border-gray-700/50 rounded-lg p-3 backdrop-blur-sm",
        className
      )}
    >
      {/* Compact header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {!isComplete && (
            <Loader2 className="w-3 h-3 text-accent-cyan animate-spin" />
          )}
          {isComplete && (
            <Check className="w-3 h-3 text-accent-green" />
          )}
          <span className="text-xs font-medium text-gray-300">
            {isComplete ? "Analysis Complete" : "Analyzing"}
          </span>
        </div>
        <span className="text-[10px] text-gray-500">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Current thought - single line */}
      <p className="text-[11px] text-gray-400 truncate mb-2">
        {currentThought}
      </p>

      {/* Sleek progress bar with checkpoints */}
      <div className="relative pt-1 pb-4">
        {/* Background track - thinner */}
        <div className="absolute top-3.5 left-2.5 right-2.5 h-0.5 bg-gray-700 rounded-full" />

        {/* Filled progress track */}
        <div
          className={cn(
            "absolute top-3.5 left-2.5 h-0.5 rounded-full transition-all duration-300 ease-out",
            isComplete
              ? "bg-accent-green"
              : "bg-accent-cyan"
          )}
          style={{
            width: `calc(${progressPercent}% * (100% - 20px) / 100)`,
          }}
        />

        {/* Checkpoint circles */}
        <div className="relative flex justify-between px-0">
          {DEFAULT_PIPELINE.map((stage, index) => {
            const state = nodeStates.get(stage.id);
            return (
              <CheckpointCircle
                key={stage.id}
                stage={stage}
                state={state}
                index={index}
                isFirst={index === 0}
                isLast={index === DEFAULT_PIPELINE.length - 1}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
