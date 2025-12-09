/**
 * Zustand store for global state management
 */
import { create } from 'zustand';
import { JobStatus, WorkerStatus } from '@/services/jobService';

// Job Store
interface JobState {
  activeJobs: Map<string, JobStatus>;
  addJob: (job: JobStatus) => void;
  updateJob: (jobId: string, updates: Partial<JobStatus>) => void;
  removeJob: (jobId: string) => void;
  getJob: (jobId: string) => JobStatus | undefined;
}

export const useJobStore = create<JobState>((set, get) => ({
  activeJobs: new Map(),

  addJob: (job) =>
    set((state) => {
      const newJobs = new Map(state.activeJobs);
      newJobs.set(job.job_id, job);
      return { activeJobs: newJobs };
    }),

  updateJob: (jobId, updates) =>
    set((state) => {
      const newJobs = new Map(state.activeJobs);
      const existing = newJobs.get(jobId);
      if (existing) {
        newJobs.set(jobId, { ...existing, ...updates });
      }
      return { activeJobs: newJobs };
    }),

  removeJob: (jobId) =>
    set((state) => {
      const newJobs = new Map(state.activeJobs);
      newJobs.delete(jobId);
      return { activeJobs: newJobs };
    }),

  getJob: (jobId) => get().activeJobs.get(jobId),
}));

// UI Store
interface UIState {
  isSidebarOpen: boolean;
  activeTab: 'dashboard' | 'chat' | 'patents' | 'mindmap';
  selectedPatentId: string | null;
  selectedNodeId: string | null;
  isModalOpen: boolean;
  modalContent: any;

  toggleSidebar: () => void;
  setActiveTab: (tab: UIState['activeTab']) => void;
  setSelectedPatent: (patentId: string | null) => void;
  setSelectedNode: (nodeId: string | null) => void;
  openModal: (content: any) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  activeTab: 'dashboard',
  selectedPatentId: null,
  selectedNodeId: null,
  isModalOpen: false,
  modalContent: null,

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedPatent: (patentId) => set({ selectedPatentId: patentId }),
  setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),
  openModal: (content) => set({ isModalOpen: true, modalContent: content }),
  closeModal: () => set({ isModalOpen: false, modalContent: null }),
}));

// Chat Store
interface ChatState {
  messages: Array<{
    id: string;
    type: 'user' | 'assistant' | 'system' | 'job_status';
    content: string;
    timestamp: Date;
    jobId?: string;
  }>;
  currentJobId: string | null;

  addMessage: (message: Omit<ChatState['messages'][0], 'id' | 'timestamp'>) => void;
  setCurrentJobId: (jobId: string | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  currentJobId: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: `msg_${Date.now()}`,
          timestamp: new Date(),
        },
      ],
    })),

  setCurrentJobId: (jobId) => set({ currentJobId: jobId }),

  clearMessages: () => set({ messages: [], currentJobId: null }),
}));
