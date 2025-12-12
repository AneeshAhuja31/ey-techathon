"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send, Paperclip, X, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentUpload } from "@/components/documents";
import { useDocumentStore } from "@/store/documentStore";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { documents, isUploading, fetchDocuments } = useDocumentStore();

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowUploadPanel(false);
      }
    };

    if (showUploadPanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUploadPanel]);

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
    <div className="relative border-t border-border-default bg-background-secondary">
      {/* Upload Panel */}
      {showUploadPanel && (
        <div
          ref={panelRef}
          className="absolute bottom-full left-0 right-0 bg-background-card border border-border-default rounded-t-xl shadow-lg p-4 mb-0"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">
              Company Documents
            </h3>
            <button
              onClick={() => setShowUploadPanel(false)}
              className="p-1 rounded-md hover:bg-background-secondary"
            >
              <X className="w-4 h-4 text-text-muted" />
            </button>
          </div>
          <DocumentUpload />
          <p className="mt-3 text-xs text-text-muted">
            Upload company documents to enable company-specific analysis with RAG.
          </p>
        </div>
      )}

      <div className="p-4">
        {/* Document indicators */}
        {documents.length > 0 && !showUploadPanel && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-text-muted">
              {documents.length} document{documents.length !== 1 ? "s" : ""} available for analysis
            </span>
            <button
              onClick={() => setShowUploadPanel(true)}
              className="text-xs text-accent-cyan hover:underline"
            >
              Manage
            </button>
          </div>
        )}

        <div className="flex items-end gap-3">
          {/* Upload button */}
          <button
            onClick={() => setShowUploadPanel(!showUploadPanel)}
            disabled={isUploading}
            className={cn(
              "relative w-10 h-10 flex items-center justify-center rounded-xl transition-colors flex-shrink-0",
              "bg-background-card hover:bg-background-secondary border border-border-default",
              showUploadPanel && "bg-background-secondary border-accent-cyan",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
            title="Upload company documents"
          >
            {showUploadPanel ? (
              <ChevronUp className="w-5 h-5 text-accent-cyan" />
            ) : (
              <Paperclip className="w-5 h-5 text-text-muted" />
            )}
            {documents.length > 0 && !showUploadPanel && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent-cyan rounded-full text-[10px] font-medium text-white flex items-center justify-center">
                {documents.length}
              </span>
            )}
          </button>

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
              "w-12 h-12 flex items-center justify-center rounded-xl transition-colors flex-shrink-0",
              input.trim() && !disabled
                ? "bg-accent-cyan text-white hover:bg-accent-cyan/90"
                : "bg-background-card text-text-muted cursor-not-allowed"
            )}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
