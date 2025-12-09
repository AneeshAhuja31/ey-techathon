/**
 * Job status service for polling and tracking analysis jobs
 */
import apiClient from './api';
import { API_ENDPOINTS } from '@/constants/api';

export interface WorkerStatus {
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  started_at?: string;
  completed_at?: string;
  error?: string;
}

export interface JobResult {
  summary?: string;
  mind_map_data?: any;
  patents?: any[];
  clinical_trials?: any[];
  market_insights?: any;
}

export interface JobStatus {
  job_id: string;
  query: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  workers: WorkerStatus[];
  result?: JobResult;
  error?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
}

export const jobService = {
  /**
   * Get job status for polling
   */
  async getJobStatus(jobId: string): Promise<JobStatus> {
    const response = await apiClient.get<JobStatus>(
      API_ENDPOINTS.jobs.status(jobId)
    );
    return response.data;
  },

  /**
   * Get final job result
   */
  async getJobResult(jobId: string) {
    const response = await apiClient.get(API_ENDPOINTS.jobs.result(jobId));
    return response.data;
  },

  /**
   * List all jobs
   */
  async listJobs(params?: { user_id?: string; limit?: number; offset?: number }) {
    const response = await apiClient.get(API_ENDPOINTS.jobs.list, { params });
    return response.data;
  },

  /**
   * Cancel a running job
   */
  async cancelJob(jobId: string) {
    const response = await apiClient.delete(API_ENDPOINTS.jobs.cancel(jobId));
    return response.data;
  },
};

export default jobService;
