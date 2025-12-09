/**
 * Patents hook for searching and managing patent data
 */
import { useState, useCallback } from 'react';
import { patentService, Patent, PatentSearchResponse } from '@/services/patentService';
import { MOCK_PATENTS } from '@/constants/mockData';

interface UsePatentsReturn {
  patents: Patent[];
  isLoading: boolean;
  error: string | null;
  total: number;
  searchPatents: (query?: string, molecule?: string) => Promise<void>;
  getRecommended: (context?: string) => Promise<void>;
  analyzePatent: (patentId: string, action: string) => Promise<any>;
  useMockData: () => void;
}

export function usePatents(): UsePatentsReturn {
  const [patents, setPatents] = useState<Patent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const searchPatents = useCallback(async (query?: string, molecule?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await patentService.searchPatents({
        q: query,
        molecule,
        limit: 20,
      });
      setPatents(response.patents);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search patents');
      // Fallback to mock data
      setPatents(MOCK_PATENTS as Patent[]);
      setTotal(MOCK_PATENTS.length);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRecommended = useCallback(async (context: string = 'GLP-1') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await patentService.getRecommendedPatents(context);
      setPatents(response.patents);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get recommended patents');
      // Fallback to mock data
      setPatents(MOCK_PATENTS as Patent[]);
      setTotal(MOCK_PATENTS.length);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzePatent = useCallback(async (patentId: string, action: string) => {
    try {
      const result = await patentService.analyzePatent(patentId, action);
      return result;
    } catch (err) {
      throw err;
    }
  }, []);

  const useMockData = useCallback(() => {
    setPatents(MOCK_PATENTS as Patent[]);
    setTotal(MOCK_PATENTS.length);
    setError(null);
  }, []);

  return {
    patents,
    isLoading,
    error,
    total,
    searchPatents,
    getRecommended,
    analyzePatent,
    useMockData,
  };
}

export default usePatents;
