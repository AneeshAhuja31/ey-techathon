/**
 * Job polling hook for real-time status updates
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { jobService, JobStatus, WorkerStatus } from '@/services/jobService';
import { POLLING_INTERVAL } from '@/constants/api';

interface UseJobOptions {
  pollingInterval?: number;
  onComplete?: (result: JobStatus) => void;
  onError?: (error: Error) => void;
}

interface UseJobReturn {
  jobStatus: JobStatus | null;
  isPolling: boolean;
  error: string | null;
  startPolling: (jobId: string) => void;
  stopPolling: () => void;
  refetch: () => Promise<void>;
}

export function useJob(options: UseJobOptions = {}): UseJobReturn {
  const {
    pollingInterval = POLLING_INTERVAL,
    onComplete,
    onError,
  } = options;

  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    if (!jobId) return;

    try {
      const status = await jobService.getJobStatus(jobId);

      if (!mountedRef.current) return;

      setJobStatus(status);
      setError(null);

      // Stop polling if job is complete or failed
      if (status.status === 'completed' || status.status === 'failed') {
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        if (status.status === 'completed' && onComplete) {
          onComplete(status);
        }
      }
    } catch (err) {
      if (!mountedRef.current) return;

      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job status';
      setError(errorMessage);

      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    }
  }, [jobId, onComplete, onError]);

  const startPolling = useCallback((newJobId: string) => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setJobId(newJobId);
    setIsPolling(true);
    setError(null);

    // Fetch immediately
    fetchStatus();

    // Set up polling interval
    intervalRef.current = setInterval(fetchStatus, pollingInterval);
  }, [fetchStatus, pollingInterval]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const refetch = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update fetch when jobId changes
  useEffect(() => {
    if (jobId && isPolling) {
      fetchStatus();
    }
  }, [jobId, isPolling, fetchStatus]);

  return {
    jobStatus,
    isPolling,
    error,
    startPolling,
    stopPolling,
    refetch,
  };
}

export default useJob;
