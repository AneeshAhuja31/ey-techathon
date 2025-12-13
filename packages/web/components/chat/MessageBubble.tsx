"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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
            : "bg-background-card border border-border-default text-text-primary rounded-tl-sm shadow-sm"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-sm max-w-none
            prose-p:text-gray-800 prose-p:my-1
            prose-headings:text-gray-900 prose-headings:mt-3 prose-headings:mb-1
            prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-li:text-gray-800
            prose-pre:bg-gray-100 prose-pre:text-gray-800
            prose-code:text-accent-cyan prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-strong:text-gray-900 prose-strong:font-semibold
            prose-a:text-accent-cyan prose-a:no-underline hover:prose-a:underline
            prose-h1:text-gray-900 prose-h2:text-gray-900 prose-h3:text-gray-900
            [&>p]:text-gray-800 [&>ul]:text-gray-800 [&>ol]:text-gray-800
            text-gray-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
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
