"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import {
  Search,
  FileText,
  Activity,
  Globe,
  BookOpen,
  Building2,
  FileOutput,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock
} from "lucide-react";

export type NodeStatus = "pending" | "running" | "completed" | "failed";

export interface AgentNodeProps {
  id: string;
  name: string;
  status: NodeStatus;
  progress?: number;
  thought?: string;
  isActive?: boolean;
}

const nodeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "intent_classifier": Search,
  "task_planner": FileText,
  "iqvia_insights": Activity,
  "iqvia_worker": Activity,
  "market_research": Activity,
  "patent_landscape": FileText,
  "patent_worker": FileText,
  "patent_finder": FileText,
  "clinical_trials": Activity,
  "clinical_worker": Activity,
  "clinical_data": Activity,
  "web_intelligence": Globe,
  "web_intel_worker": Globe,
  "scientific_literature": BookOpen,
  "literature_worker": BookOpen,
  "company_knowledge": Building2,
  "company_rag_worker": Building2,
  "synthesizer": FileOutput,
  "report_generator": FileOutput,
};

const statusColors: Record<NodeStatus, string> = {
  pending: "bg-gray-100 border-gray-300 text-gray-500",
  running: "bg-sky-50 border-accent-cyan animate-pulse text-accent-cyan",
  completed: "bg-emerald-50 border-accent-green text-accent-green",
  failed: "bg-red-50 border-red-400 text-red-500",
};

const statusIcons: Record<NodeStatus, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
};

export const AgentNode = memo(function AgentNode({
  id,
  name,
  status,
  progress = 0,
  thought,
  isActive = false,
}: AgentNodeProps) {
  const Icon = nodeIcons[id.toLowerCase().replace(/\s+/g, "_")] || FileText;
  const StatusIcon = statusIcons[status];

  return (
    <div
      className={cn(
        "relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-300 min-w-[120px]",
        statusColors[status],
        isActive && "ring-2 ring-accent-cyan ring-offset-2 ring-offset-background-primary"
      )}
    >
      {/* Node Icon */}
      <div className="relative mb-2">
        <Icon className="w-6 h-6" />
        <div className="absolute -top-1 -right-1">
          <StatusIcon
            className={cn(
              "w-4 h-4",
              status === "running" && "animate-spin"
            )}
          />
        </div>
      </div>

      {/* Node Name */}
      <span className="text-xs font-medium text-center leading-tight">
        {name}
      </span>

      {/* Progress Bar */}
      {(status === "running" || status === "completed") && (
        <div className="w-full mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              status === "completed" ? "bg-accent-green" : "bg-accent-cyan"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Thought bubble */}
      {thought && status === "running" && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <span className="text-[10px] text-text-muted bg-background-card px-2 py-1 rounded border border-border-default">
            {thought.length > 40 ? thought.substring(0, 40) + "..." : thought}
          </span>
        </div>
      )}
    </div>
  );
});

// Compact version for sidebar
export const AgentNodeCompact = memo(function AgentNodeCompact({
  name,
  status,
  progress = 0,
  thought,
}: Omit<AgentNodeProps, "id" | "isActive">) {
  const StatusIcon = statusIcons[status];

  return (
    <div className="flex items-center gap-3 py-2">
      <StatusIcon
        className={cn(
          "w-4 h-4 flex-shrink-0",
          status === "pending" && "text-gray-500",
          status === "running" && "text-accent-cyan animate-spin",
          status === "completed" && "text-accent-green",
          status === "failed" && "text-red-500"
        )}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{name}</span>
          {status !== "pending" && (
            <span className="text-xs text-text-muted ml-2">{progress}%</span>
          )}
        </div>
        {thought && status === "running" && (
          <p className="text-xs text-text-muted truncate mt-0.5">{thought}</p>
        )}
        {status === "running" && (
          <div className="w-full mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent-cyan transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
});

// Connection line between nodes
export const NodeConnection = memo(function NodeConnection({
  isActive = false,
  isComplete = false,
}: {
  isActive?: boolean;
  isComplete?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-8 h-0.5 transition-all duration-300",
        isComplete ? "bg-accent-green" : isActive ? "bg-accent-cyan" : "bg-gray-300"
      )}
    />
  );
});
