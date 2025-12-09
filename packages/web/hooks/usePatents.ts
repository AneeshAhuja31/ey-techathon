"use client";

import { useState, useCallback } from "react";
import { Patent } from "@/types";
import { patentsApi } from "@/lib/api";
import { mockPatents } from "@/lib/mock-data";

export function usePatents() {
  const [patents, setPatents] = useState<Patent[]>(mockPatents);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchPatents = useCallback(async (query: string) => {
    if (!query) {
      setPatents(mockPatents);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In production, use API:
      // const response = await patentsApi.search(query);
      // setPatents(response.data.patents);

      // For now, filter mock data
      const filtered = mockPatents.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.abstract.toLowerCase().includes(query.toLowerCase()) ||
          p.id.toLowerCase().includes(query.toLowerCase())
      );
      setPatents(filtered);
    } catch (err) {
      setError("Failed to search patents");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzePatent = useCallback(
    async (patentId: string, analysisType: string) => {
      setIsLoading(true);
      try {
        const response = await patentsApi.analyze(patentId, analysisType);
        return response.data;
      } catch (err) {
        setError("Failed to analyze patent");
        console.error(err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    patents,
    isLoading,
    error,
    searchPatents,
    analyzePatent,
  };
}
