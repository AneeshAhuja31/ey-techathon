"use client";

import { ChatContainer } from "@/components/chat/ChatContainer";

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border-default">
        <h1 className="text-2xl font-bold text-text-primary">Master Chatbot</h1>
        <p className="text-text-secondary mt-1">
          Ask questions about drug discovery, patents, and market analysis
        </p>
      </div>
      <ChatContainer />
    </div>
  );
}
