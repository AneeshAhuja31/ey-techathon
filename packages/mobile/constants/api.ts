/**
 * API configuration and endpoints
 */

// Base URL - change for production
export const API_BASE_URL = __DEV__
  ? 'http://localhost:8000'
  : 'https://api.drugdiscovery.ai';

export const API_VERSION = 'v1';

export const API_ENDPOINTS = {
  // Chat endpoints
  chat: {
    initiate: `/api/${API_VERSION}/chat/initiate`,
    message: `/api/${API_VERSION}/chat/message`,
  },

  // Job endpoints
  jobs: {
    list: `/api/${API_VERSION}/jobs`,
    status: (jobId: string) => `/api/${API_VERSION}/jobs/${jobId}/status`,
    result: (jobId: string) => `/api/${API_VERSION}/jobs/${jobId}/result`,
    cancel: (jobId: string) => `/api/${API_VERSION}/jobs/${jobId}`,
  },

  // Patent endpoints
  patents: {
    search: `/api/${API_VERSION}/patents/search`,
    get: (patentId: string) => `/api/${API_VERSION}/patents/${patentId}`,
    analyze: (patentId: string) => `/api/${API_VERSION}/patents/${patentId}/analyze`,
    recommended: `/api/${API_VERSION}/patents`,
  },

  // Graph endpoints
  graph: {
    visualize: `/api/${API_VERSION}/graph/visualize`,
    nodeDetails: (nodeId: string) => `/api/${API_VERSION}/graph/node/${nodeId}`,
    contexts: `/api/${API_VERSION}/graph/contexts`,
    export: `/api/${API_VERSION}/graph/export`,
  },

  // Health check
  health: '/health',
};

// Polling configuration
export const POLLING_INTERVAL = 2000; // 2 seconds
export const MAX_POLLING_ATTEMPTS = 150; // 5 minutes max

export default API_ENDPOINTS;
