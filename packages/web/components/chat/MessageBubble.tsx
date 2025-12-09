"use client";

import { useState, useEffect } from "react";
import { Message } from "@/types";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [formattedTime, setFormattedTime] = useState<string>("");

  // Format time on client only to avoid hydration mismatch
  useEffect(() => {
    const date = new Date(message.timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    setFormattedTime(`${hours}:${minutes}`);
  }, [message.timestamp]);

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-accent-purple" : "bg-accent-cyan"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-accent-purple text-white rounded-tr-sm"
            : "bg-background-card border border-border-default text-text-primary rounded-tl-sm"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        {formattedTime && (
          <span
            className={cn(
              "text-xs mt-2 block",
              isUser ? "text-white/70" : "text-text-muted"
            )}
          >
            {formattedTime}
          </span>
        )}
      </div>
    </div>
  );
}
