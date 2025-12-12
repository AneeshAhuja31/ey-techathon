"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface NodeState {
  nodeId: string;
  nodeName: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  thought?: string;
}

export interface SSEEvent {
  type: "progress" | "node_update" | "complete" | "error" | "end";
  job_id?: string;
  status?: string;
  progress?: number;
  node_id?: string;
  node_name?: string;
  thought?: string;
  mind_map_data?: unknown;
  final_report?: string;
  error?: string;
  intent?: string;
  entities?: string[];
}

interface UseJobStreamOptions {
  onProgress?: (progress: number, status: string) => void;
  onNodeUpdate?: (node: NodeState) => void;
  onComplete?: (data: { mindMapData?: unknown; finalReport?: string }) => void;
  onError?: (error: string) => void;
}

export function useJobStream(jobId: string | null, options: UseJobStreamOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [nodes, setNodes] = useState<Map<string, NodeState>>(new Map());
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("pending");
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Store options in a ref to avoid re-running effect when callbacks change
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!jobId) {
      disconnect();
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const url = `${apiUrl}/api/v1/stream/jobs/${jobId}/stream`;

    try {
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEEvent = JSON.parse(event.data);

          switch (data.type) {
            case "progress":
              setProgress(data.progress || 0);
              setStatus(data.status || "processing");
              optionsRef.current.onProgress?.(data.progress || 0, data.status || "processing");
              break;

            case "node_update":
              if (data.node_id) {
                const nodeState: NodeState = {
                  nodeId: data.node_id,
                  nodeName: data.node_name || data.node_id,
                  status: (data.status as NodeState["status"]) || "pending",
                  progress: data.progress || 0,
                  thought: data.thought,
                };

                setNodes((prev) => {
                  const next = new Map(prev);
                  next.set(data.node_id!, nodeState);
                  return next;
                });

                optionsRef.current.onNodeUpdate?.(nodeState);
              }
              break;

            case "complete":
              setStatus("completed");
              setProgress(100);
              setIsComplete(true);
              optionsRef.current.onComplete?.({
                mindMapData: data.mind_map_data,
                finalReport: data.final_report,
              });
              disconnect();
              break;

            case "error":
              setError(data.error || "An error occurred");
              setStatus("failed");
              optionsRef.current.onError?.(data.error || "An error occurred");
              break;

            case "end":
              disconnect();
              break;
          }
        } catch (e) {
          console.error("Error parsing SSE event:", e);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        // Don't set error on connection close if job is complete
        if (!isComplete) {
          setError("Connection lost. Reconnecting...");
        }
      };

      return () => {
        disconnect();
      };
    } catch (e) {
      setError("Failed to connect to stream");
      console.error("SSE connection error:", e);
    }
  }, [jobId, disconnect, isComplete]); // Removed 'options' from deps - using ref instead

  const nodesArray = Array.from(nodes.values());

  return {
    isConnected,
    nodes: nodesArray,
    nodesMap: nodes,
    progress,
    status,
    error,
    isComplete,
    disconnect,
  };
}

// Helper hook for simple polling fallback
export function useJobPolling(jobId: string | null, interval: number = 2000) {
  const [status, setStatus] = useState<unknown>(null);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const poll = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/v1/jobs/${jobId}/status`);
        const data = await response.json();
        setStatus(data);

        if (data.status === "completed" || data.status === "failed") {
          setIsPolling(false);
        }
      } catch (e) {
        console.error("Polling error:", e);
      }
    };

    poll();
    const intervalId = setInterval(poll, interval);

    return () => {
      clearInterval(intervalId);
      setIsPolling(false);
    };
  }, [jobId, interval]);

  return { status, isPolling };
}
