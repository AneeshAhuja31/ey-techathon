"use client";

import { ChatContainer } from "@/components/chat/ChatContainer";
import { MindMapSidebar, MindMapToggleButton } from "@/components/mindmap/MindMapSidebar";
import { useSidebarStore } from "@/store/sidebarStore";

export default function ChatPage() {
  const { isMindMapOpen, toggleMindMap, pipelineNodes, mindMapData } = useSidebarStore();

  return (
    <div className="h-full flex">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-6 border-b border-border-default flex items-center justify-between">
          <div>
            {/* <h1 className="text-2xl font-bold text-text-primary">Master Chatbot</h1> */}
            <p className="text-text-secondary mt-1">
              Ask questions about drug discovery, patents, and market analysis
            </p>
          </div>
          <MindMapToggleButton
            isOpen={isMindMapOpen}
            onClick={toggleMindMap}
            hasActivity={pipelineNodes.some((n) => n.status === "running")}
          />
        </div>
        <ChatContainer />
      </div>

      {/* Toggleable mind map sidebar */}
      <MindMapSidebar
        isOpen={isMindMapOpen}
        onToggle={toggleMindMap}
        nodes={pipelineNodes}
        mindMapData={mindMapData || undefined}
      />
    </div>
  );
}
