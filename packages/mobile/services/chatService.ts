/**
 * Chat/Job service for initiating analysis jobs
 */
import apiClient from './api';
import { API_ENDPOINTS } from '@/constants/api';

export interface ChatInitiateRequest {
  query: string;
  user_id?: string;
  options?: {
    include_patents?: boolean;
    include_clinical_trials?: boolean;
    include_market_data?: boolean;
    include_web_intel?: boolean;
  };
}

export interface ChatInitiateResponse {
  job_id: string;
  status: string;
  message: string;
  estimated_duration: number;
}

export const chatService = {
  /**
   * Initiate a new analysis job
   */
  async initiateChat(request: ChatInitiateRequest): Promise<ChatInitiateResponse> {
    const response = await apiClient.post<ChatInitiateResponse>(
      API_ENDPOINTS.chat.initiate,
      request
    );
    return response.data;
  },

  /**
   * Send a follow-up message (future feature)
   */
  async sendMessage(jobId: string, message: string) {
    const response = await apiClient.post(API_ENDPOINTS.chat.message, {
      job_id: jobId,
      message,
    });
    return response.data;
  },
};

export default chatService;
