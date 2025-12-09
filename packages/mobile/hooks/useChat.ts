/**
 * Chat hook for managing chat messages and job creation
 */
import { useState, useCallback } from 'react';
import { chatService, ChatInitiateRequest } from '@/services/chatService';
import { useJob } from './useJob';

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system' | 'job_status';
  content: string;
  timestamp: Date;
  jobId?: string;
  metadata?: Record<string, any>;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  currentJobId: string | null;
  jobStatus: any;
  sendMessage: (content: string, options?: ChatInitiateRequest['options']) => Promise<void>;
  clearMessages: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);

  const { jobStatus, startPolling, stopPolling } = useJob({
    onComplete: (status) => {
      // Add completion message
      addMessage({
        type: 'assistant',
        content: status.result?.summary || 'Analysis complete. Check the results.',
        metadata: { status: 'completed' },
      });
    },
  });

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendMessage = useCallback(
    async (content: string, options?: ChatInitiateRequest['options']) => {
      // Add user message
      addMessage({
        type: 'user',
        content,
      });

      setIsLoading(true);

      try {
        // Initiate chat/job
        const response = await chatService.initiateChat({
          query: content,
          options: options || {
            include_patents: true,
            include_clinical_trials: true,
            include_market_data: true,
            include_web_intel: true,
          },
        });

        setCurrentJobId(response.job_id);

        // Add job created message
        addMessage({
          type: 'job_status',
          content: `Analysis job created: ${response.job_id}`,
          jobId: response.job_id,
          metadata: {
            status: response.status,
            estimated_duration: response.estimated_duration,
          },
        });

        // Start polling for status
        startPolling(response.job_id);
      } catch (error) {
        addMessage({
          type: 'system',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to start analysis'}`,
          metadata: { error: true },
        });
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage, startPolling]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentJobId(null);
    stopPolling();
  }, [stopPolling]);

  return {
    messages,
    isLoading,
    currentJobId,
    jobStatus,
    sendMessage,
    clearMessages,
  };
}

export default useChat;
