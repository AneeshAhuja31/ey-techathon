"use client";

import { Job } from "@/types";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, Clock } from "lucide-react";

interface JobStatusCardProps {
  job: Job;
}

export function JobStatusCard({ job }: JobStatusCardProps) {
  return (
    <div className="bg-background-card border border-border-default rounded-xl p-4 max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-text-primary">Analysis Progress</h3>
        <span className="flex items-center gap-1.5 text-accent-cyan text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Running
        </span>
      </div>

      {/* Overall Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-text-secondary">Overall Progress</span>
          <span className="text-text-primary font-medium">{job.progress}%</span>
        </div>
        <div className="w-full bg-background-tertiary rounded-full h-2">
          <div
            className="bg-accent-cyan h-2 rounded-full transition-all duration-500"
            style={{ width: `${job.progress}%` }}
          />
        </div>
      </div>

      {/* Worker Progress */}
      {job.workers && (
        <div className="space-y-3">
          <p className="text-xs text-text-muted uppercase tracking-wide">
            Agent Status
          </p>
          {job.workers.map((worker) => (
            <div key={worker.name} className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                {worker.status === "completed" ? (
                  <CheckCircle className="w-4 h-4 text-accent-green" />
                ) : worker.status === "running" ? (
                  <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />
                ) : (
                  <Clock className="w-4 h-4 text-text-muted" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span
                    className={cn(
                      worker.status === "completed"
                        ? "text-accent-green"
                        : worker.status === "running"
                        ? "text-text-primary"
                        : "text-text-muted"
                    )}
                  >
                    {worker.name}
                  </span>
                  <span className="text-text-muted text-xs">
                    {worker.progress}%
                  </span>
                </div>
                <div className="w-full bg-background-tertiary rounded-full h-1.5">
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      worker.status === "completed"
                        ? "bg-accent-green"
                        : worker.status === "running"
                        ? "bg-accent-cyan"
                        : "bg-text-muted/30"
                    )}
                    style={{ width: `${worker.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
