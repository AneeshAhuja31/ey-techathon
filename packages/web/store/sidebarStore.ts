import { create } from "zustand";
import { NodeState } from "@/hooks/useSSE";

interface MindMapData {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    data?: Record<string, unknown>;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label?: string;
  }>;
}

interface SidebarState {
  isMindMapOpen: boolean;
  pipelineNodes: NodeState[];
  mindMapData: MindMapData | null;

  // Actions
  toggleMindMap: () => void;
  openMindMap: () => void;
  closeMindMap: () => void;
  setPipelineNodes: (nodes: NodeState[]) => void;
  updatePipelineNode: (node: NodeState) => void;
  setMindMapData: (data: MindMapData | null) => void;
  clearPipelineNodes: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isMindMapOpen: false,
  pipelineNodes: [],
  mindMapData: null,

  toggleMindMap: () => set((state) => ({ isMindMapOpen: !state.isMindMapOpen })),
  openMindMap: () => set({ isMindMapOpen: true }),
  closeMindMap: () => set({ isMindMapOpen: false }),

  setPipelineNodes: (nodes) => set({ pipelineNodes: nodes }),

  updatePipelineNode: (node) =>
    set((state) => {
      const existing = state.pipelineNodes.findIndex(
        (n) => n.nodeId === node.nodeId
      );
      if (existing >= 0) {
        const next = [...state.pipelineNodes];
        next[existing] = node;
        return { pipelineNodes: next };
      }
      return { pipelineNodes: [...state.pipelineNodes, node] };
    }),

  setMindMapData: (data) => set({ mindMapData: data }),

  clearPipelineNodes: () => set({ pipelineNodes: [] }),
}));
