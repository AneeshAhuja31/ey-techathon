import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Chat API
export const chatApi = {
  // Simple chat for regular questions
  simple: (message: string, conversationHistory?: Array<{ role: string; content: string }>) =>
    api.post("/api/v1/chat/simple", { message, conversation_history: conversationHistory }),

  // Initiate research job
  initiate: (query: string, options?: Record<string, boolean>) =>
    api.post("/api/v1/chat/initiate", { query, options }),

  message: (jobId: string, message: string) =>
    api.post("/api/v1/chat/message", { job_id: jobId, message }),
};

// Jobs API
export const jobsApi = {
  getStatus: (jobId: string) => api.get(`/api/v1/jobs/${jobId}/status`),

  getResult: (jobId: string) => api.get(`/api/v1/jobs/${jobId}/result`),

  list: () => api.get("/api/v1/jobs"),

  cancel: (jobId: string) => api.delete(`/api/v1/jobs/${jobId}`),

  // Get SSE stream URL
  getStreamUrl: (jobId: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    return `${baseUrl}/api/v1/stream/jobs/${jobId}/stream`;
  },
};

// Documents API
export const documentsApi = {
  upload: (file: File, userId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (userId) {
      formData.append("user_id", userId);
    }
    return api.post("/api/v1/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  list: (userId?: string) =>
    api.get("/api/v1/documents", { params: userId ? { user_id: userId } : {} }),

  get: (docId: string) => api.get(`/api/v1/documents/${docId}`),

  delete: (docId: string) => api.delete(`/api/v1/documents/${docId}`),

  search: (query: string, userId?: string, limit?: number) =>
    api.post("/api/v1/documents/search", { query, user_id: userId, limit: limit || 5 }),

  getStats: () => api.get("/api/v1/documents/stats/collection"),
};

// Patents API
export const patentsApi = {
  search: (query: string, filters?: Record<string, unknown>) =>
    api.get("/api/v1/patents/search", { params: { q: query, ...filters } }),

  getDetails: (id: string) => api.get(`/api/v1/patents/${id}`),

  analyze: (id: string, analysisType: string) =>
    api.post(`/api/v1/patents/${id}/analyze`, { type: analysisType }),
};

// Graph API
export const graphApi = {
  visualize: (context: string) =>
    api.get("/api/v1/graph/visualize", { params: { context } }),

  getNodeDetails: (nodeId: string) => api.get(`/api/v1/graph/node/${nodeId}`),
};

export default api;
