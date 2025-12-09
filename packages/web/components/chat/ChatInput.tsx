"use client";

import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t border-border-default bg-background-secondary">
      <div className="flex items-end gap-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about drug discovery, patents, clinical trials..."
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 bg-background-card border border-border-default rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted resize-none focus:outline-none focus:border-accent-cyan transition-colors",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{ minHeight: "48px", maxHeight: "200px" }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className={cn(
            "w-12 h-12 flex items-center justify-center rounded-xl transition-colors",
            input.trim() && !disabled
              ? "bg-accent-cyan text-white hover:bg-accent-cyan/90"
              : "bg-background-card text-text-muted cursor-not-allowed"
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
