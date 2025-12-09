"use client";

import { useEffect, useCallback } from "react";
import { useJobStore } from "@/store/jobStore";
import { jobsApi } from "@/lib/api";

const POLL_INTERVAL = 2000; // 2 seconds

export function useJob(jobId: string | null) {
  const { jobs, updateJob, updateWorkerStatus } = useJobStore();

  const job = jobs.find((j) => j.id === jobId);

  const pollJobStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const response = await jobsApi.getStatus(jobId);
      const data = response.data;

      updateJob(jobId, {
        status: data.status,
        progress: data.progress,
        completedAt: data.completed_at,
      });

      // Update worker statuses
      if (data.workers) {
        data.workers.forEach((worker: { name: string; status: string; progress: number }) => {
          updateWorkerStatus(jobId, worker.name, {
            status: worker.status as "pending" | "running" | "completed" | "failed",
            progress: worker.progress,
          });
        });
      }
    } catch (error) {
      console.error("Failed to poll job status:", error);
    }
  }, [jobId, updateJob, updateWorkerStatus]);

  useEffect(() => {
    if (!jobId || !job || job.status === "completed" || job.status === "failed") {
      return;
    }

    const intervalId = setInterval(pollJobStatus, POLL_INTERVAL);

    return () => clearInterval(intervalId);
  }, [jobId, job, pollJobStatus]);

  return { job, isLoading: job?.status === "running" || job?.status === "pending" };
}
