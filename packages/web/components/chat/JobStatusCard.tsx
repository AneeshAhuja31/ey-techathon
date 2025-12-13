"use client";

import { Job } from "@/types";
import { cn } from "@/lib/utils";
import { Loader2, CheckCircle, Clock } from "lucide-react";

interface JobStatusCardProps {
  job: Job;
}

export function JobStatusCard({ job }: JobStatusCardProps) {
  const isComplete = job.progress === 100;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-md shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Analysis Progress</h3>
        <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin" />
          Running
        </span>
      </div>

      {/* Overall Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Overall Progress</span>
          <span className="text-gray-900 font-medium">{job.progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              isComplete
                ? "bg-gray-900"
                : "bg-gradient-to-r from-emerald-500 to-gray-700"
            )}
            style={{ width: `${job.progress}%` }}
          />
        </div>
      </div>

      {/* Worker Progress */}
      {job.workers && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Agent Status
          </p>
          {job.workers.map((worker) => (
            <div key={worker.name} className="flex items-center gap-3">
              <div className="w-5 h-5 flex items-center justify-center">
                {worker.status === "completed" ? (
                  <CheckCircle className="w-4 h-4 text-gray-900" />
                ) : worker.status === "running" ? (
                  <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
                ) : (
                  <Clock className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span
                    className={cn(
                      worker.status === "completed"
                        ? "text-gray-900 font-medium"
                        : worker.status === "running"
                        ? "text-gray-800"
                        : "text-gray-500"
                    )}
                  >
                    {worker.name}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {worker.progress}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500",
                      worker.status === "completed"
                        ? "bg-gray-900"
                        : worker.status === "running"
                        ? "bg-gradient-to-r from-emerald-500 to-gray-600"
                        : "bg-gray-300"
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
