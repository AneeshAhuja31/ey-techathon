import { create } from "zustand";
import { Message } from "@/types";

interface ChatStore {
  messages: Message[];
  isLoading: boolean;
  currentJobId: string | null;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  setCurrentJobId: (jobId: string | null) => void;
  clearMessages: () => void;
}

// Mock initial messages for demo
const mockMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Hello! I'm your AI research assistant. I can help you with drug discovery, patent searches, market analysis, and more. What would you like to explore today?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
];

export const useChatStore = create<ChatStore>((set) => ({
  messages: mockMessages,
  isLoading: false,
  currentJobId: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setCurrentJobId: (jobId) => set({ currentJobId: jobId }),

  clearMessages: () => set({ messages: [], currentJobId: null }),
}));
