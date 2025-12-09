"use client";

import { useJobStore } from "@/store/jobStore";
import { JobCard } from "./JobCard";

export function ActiveJobsPanel() {
  const { jobs } = useJobStore();
  const activeJobs = jobs.filter(
    (job) => job.status === "running" || job.status === "pending"
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-text-primary mb-4">
        Active Jobs
      </h2>
      <div className="bg-background-card border border-border-default rounded-xl p-4">
        {activeJobs.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <p>No active jobs</p>
            <p className="text-sm mt-1">Start a new analysis from Quick Actions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
