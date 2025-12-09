/**
 * Patent search service
 */
import apiClient from './api';
import { API_ENDPOINTS } from '@/constants/api';

export interface Patent {
  id: string;
  patent_id: string;
  title: string;
  abstract?: string;
  assignee?: string;
  filing_date?: string;
  publication_date?: string;
  expiration_date?: string;
  relevance_score: number;
  molecule?: string;
  claims?: string;
}

export interface PatentSearchResponse {
  patents: Patent[];
  total: number;
  query: string;
  molecule?: string;
}

export const patentService = {
  /**
   * Search patents by molecule or keyword
   */
  async searchPatents(params: {
    molecule?: string;
    q?: string;
    limit?: number;
  }): Promise<PatentSearchResponse> {
    const response = await apiClient.get<PatentSearchResponse>(
      API_ENDPOINTS.patents.search,
      { params }
    );
    return response.data;
  },

  /**
   * Get single patent details
   */
  async getPatent(patentId: string): Promise<Patent> {
    const response = await apiClient.get<Patent>(
      API_ENDPOINTS.patents.get(patentId)
    );
    return response.data;
  },

  /**
   * Analyze patent (extract claims, FTO, prior art)
   */
  async analyzePatent(patentId: string, action: string) {
    const response = await apiClient.post(
      API_ENDPOINTS.patents.analyze(patentId),
      null,
      { params: { action } }
    );
    return response.data;
  },

  /**
   * Get recommended patents
   */
  async getRecommendedPatents(context: string = 'GLP-1', limit: number = 5) {
    const response = await apiClient.get(API_ENDPOINTS.patents.recommended, {
      params: { context, limit },
    });
    return response.data;
  },
};

export default patentService;
