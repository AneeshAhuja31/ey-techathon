import { create } from "zustand";
import { Job, WorkerStatus } from "@/types";

interface JobStore {
  jobs: Job[];
  activeJobId: string | null;
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  updateWorkerStatus: (jobId: string, workerName: string, updates: Partial<WorkerStatus>) => void;
  setActiveJob: (id: string | null) => void;
  removeJob: (id: string) => void;
}

// Mock initial jobs for demo
const mockJobs: Job[] = [
  {
    id: "job-1",
    title: "GLP-1 Agonist Research",
    query: "Research GLP-1 agonists for obesity treatment",
    status: "running",
    progress: 65,
    startedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    workers: [
      { name: "Market Research", status: "completed", progress: 100 },
      { name: "Patent Finder", status: "running", progress: 75 },
      { name: "Clinical Data", status: "running", progress: 50 },
      { name: "Web Intelligence", status: "pending", progress: 0 },
    ],
  },
];

export const useJobStore = create<JobStore>((set) => ({
  jobs: mockJobs,
  activeJobId: null,

  addJob: (job) =>
    set((state) => ({
      jobs: [job, ...state.jobs],
    })),

  updateJob: (id, updates) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, ...updates } : job
      ),
    })),

  updateWorkerStatus: (jobId, workerName, updates) =>
    set((state) => ({
      jobs: state.jobs.map((job) => {
        if (job.id !== jobId) return job;
        return {
          ...job,
          workers: job.workers?.map((worker) =>
            worker.name === workerName ? { ...worker, ...updates } : worker
          ),
        };
      }),
    })),

  setActiveJob: (id) => set({ activeJobId: id }),

  removeJob: (id) =>
    set((state) => ({
      jobs: state.jobs.filter((job) => job.id !== id),
    })),
}));
