"use client";

import { Job } from "@/types";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface JobCardProps {
  job: Job;
}

const statusConfig = {
  pending: {
    icon: Clock,
    color: "text-text-muted",
    bgColor: "bg-text-muted/10",
    label: "Pending",
  },
  running: {
    icon: Loader2,
    color: "text-accent-cyan",
    bgColor: "bg-accent-cyan/10",
    label: "Running",
  },
  completed: {
    icon: CheckCircle,
    color: "text-accent-green",
    bgColor: "bg-accent-green/10",
    label: "Completed",
  },
  failed: {
    icon: XCircle,
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    label: "Failed",
  },
};

export function JobCard({ job }: JobCardProps) {
  const config = statusConfig[job.status];
  const StatusIcon = config.icon;

  return (
    <div className="p-4 bg-background-secondary rounded-lg border border-border-default">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-text-primary">{job.title}</h3>
        <span
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-xs",
            config.bgColor,
            config.color
          )}
        >
          <StatusIcon
            className={cn("w-3 h-3", job.status === "running" && "animate-spin")}
          />
          {config.label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-background-tertiary rounded-full h-2 mb-2">
        <div
          className="bg-accent-cyan h-2 rounded-full transition-all duration-300"
          style={{ width: `${job.progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted">{job.progress}% complete</span>
        <span className="text-text-muted">
          {new Date(job.startedAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Worker Progress */}
      {job.workers && job.workers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border-default space-y-2">
          {job.workers.map((worker) => (
            <div key={worker.name} className="flex items-center gap-2">
              <span className="text-xs text-text-muted w-28 truncate">
                {worker.name}
              </span>
              <div className="flex-1 bg-background-tertiary rounded-full h-1.5">
                <div
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    worker.status === "completed"
                      ? "bg-accent-green"
                      : worker.status === "running"
                      ? "bg-accent-cyan"
                      : "bg-text-muted"
                  )}
                  style={{ width: `${worker.progress}%` }}
                />
              </div>
              <span className="text-xs text-text-muted w-10">
                {worker.progress}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
