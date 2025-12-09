export interface Job {
  id: string;
  title: string;
  query: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  startedAt: string;
  completedAt?: string;
  workers?: WorkerStatus[];
  result?: JobResult;
}

export interface WorkerStatus {
  name: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
}

export interface JobResult {
  summary: string;
  insights: string[];
  recommendations: string[];
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  jobId?: string;
}

export interface Patent {
  id: string;
  title: string;
  abstract: string;
  filingDate: string;
  inventors: string[];
  assignee: string;
  relevance: number;
  claims?: string[];
}

export interface MindMapNode {
  id: string;
  type: "disease" | "molecule" | "product";
  label: string;
  score?: number;
  data?: Record<string, unknown>;
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
}

export interface GraphData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}
