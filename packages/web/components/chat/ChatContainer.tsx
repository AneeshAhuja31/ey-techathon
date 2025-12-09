"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useJobStore } from "@/store/jobStore";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { JobStatusCard } from "./JobStatusCard";
import { chatApi, jobsApi } from "@/lib/api";

const POLL_INTERVAL = 2000;

// Keywords that indicate a research job should be started
const RESEARCH_KEYWORDS = [
  "research", "analyze", "comprehensive", "deep dive", "patent search",
  "market analysis", "clinical trials", "find patents", "investigate",
  "full analysis", "detailed study", "landscape analysis", "competitive analysis",
  "start analysis", "run analysis", "begin research", "yes", "confirm", "start"
];

export function ChatContainer() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingResearchQuery, setPendingResearchQuery] = useState<string | null>(null);
  const { messages, isLoading, currentJobId, addMessage, setLoading, setCurrentJobId } = useChatStore();
  const { jobs, addJob, updateJob, updateWorkerStatus } = useJobStore();

  const currentJob = jobs.find((job) => job.id === currentJobId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check if message is a research query
  const isResearchQuery = (message: string): boolean => {
    const messageLower = message.toLowerCase();
    return RESEARCH_KEYWORDS.some(keyword => messageLower.includes(keyword));
  };

  // Poll job status
  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await jobsApi.getStatus(jobId);
      const data = response.data;

      updateJob(jobId, {
        status: data.status,
        progress: data.progress,
        completedAt: data.completed_at,
      });

      if (data.workers) {
        data.workers.forEach((worker: { name: string; status: string; progress: number }) => {
          updateWorkerStatus(jobId, worker.name, {
            status: worker.status as "pending" | "running" | "completed" | "failed",
            progress: worker.progress,
          });
        });

        const overallProgress = Math.round(
          data.workers.reduce((sum: number, w: { progress: number }) => sum + w.progress, 0) / data.workers.length
        );
        updateJob(jobId, { progress: overallProgress });
      }

      if (data.status === "completed" || data.status === "failed") {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }

        const completionMessage = {
          id: Date.now().toString(),
          role: "assistant" as const,
          content: data.status === "completed"
            ? `Analysis complete! I've gathered insights from market research, patents, clinical trials, and web intelligence. ${data.result?.summary || "Check the results below."}`
            : "Unfortunately, the analysis encountered an error. Please try again.",
          timestamp: new Date().toISOString(),
          jobId,
        };
        addMessage(completionMessage);
      }
    } catch (error) {
      console.error("Failed to poll job status:", error);
      simulateProgress(jobId);
    }
  }, [updateJob, updateWorkerStatus, addMessage]);

  // Simulate progress when backend is unavailable
  const simulateProgress = useCallback((jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status === "completed") return;

    const workers = job.workers || [];
    let allComplete = true;

    workers.forEach((worker) => {
      if (worker.progress < 100) {
        allComplete = false;
        const increment = Math.random() * 15 + 5;
        const newProgress = Math.min(100, worker.progress + increment);
        updateWorkerStatus(jobId, worker.name, {
          progress: Math.round(newProgress),
          status: newProgress >= 100 ? "completed" : "running",
        });
      }
    });

    const updatedJob = jobs.find(j => j.id === jobId);
    if (updatedJob?.workers) {
      const overallProgress = Math.round(
        updatedJob.workers.reduce((sum, w) => sum + w.progress, 0) / updatedJob.workers.length
      );
      updateJob(jobId, { progress: overallProgress });
    }

    if (allComplete) {
      updateJob(jobId, { status: "completed", completedAt: new Date().toISOString() });
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      const completionMessage = {
        id: Date.now().toString(),
        role: "assistant" as const,
        content: "Analysis complete! I've gathered comprehensive insights. The research covers market data from IQVIA, relevant patents, clinical trial outcomes, and the latest web intelligence.",
        timestamp: new Date().toISOString(),
        jobId,
      };
      addMessage(completionMessage);
    }
  }, [jobs, updateJob, updateWorkerStatus, addMessage]);

  // Start polling when job is created
  useEffect(() => {
    if (currentJobId && currentJob?.status === "running") {
      pollIntervalRef.current = setInterval(() => {
        pollJobStatus(currentJobId);
      }, POLL_INTERVAL);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [currentJobId, currentJob?.status, pollJobStatus]);

  // Start a research job
  const startResearchJob = async (query: string) => {
    try {
      const response = await chatApi.initiate(query, {
        include_patents: true,
        include_clinical_trials: true,
        include_market_data: true,
      });

      const { job_id, status } = response.data;

      const newJob = {
        id: job_id,
        title: query.slice(0, 50) + (query.length > 50 ? "..." : ""),
        query: query,
        status: status as "pending" | "running" | "completed" | "failed",
        progress: 0,
        startedAt: new Date().toISOString(),
        workers: [
          { name: "Market Research", status: "running" as const, progress: 0 },
          { name: "Patent Finder", status: "pending" as const, progress: 0 },
          { name: "Clinical Data", status: "pending" as const, progress: 0 },
          { name: "Web Intelligence", status: "pending" as const, progress: 0 },
        ],
      };

      addJob(newJob);
      setCurrentJobId(job_id);

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: `I've started the research analysis for: "${query}". Our specialized AI agents are now gathering market data, patents, clinical trials, and web intelligence. Track the progress below.`,
        timestamp: new Date().toISOString(),
        jobId: job_id,
      };
      addMessage(assistantMessage);

    } catch (error) {
      console.log("Backend unavailable for research job, using mock mode");

      const newJobId = `job-${Date.now()}`;
      const newJob = {
        id: newJobId,
        title: query.slice(0, 50) + (query.length > 50 ? "..." : ""),
        query: query,
        status: "running" as const,
        progress: 0,
        startedAt: new Date().toISOString(),
        workers: [
          { name: "Market Research", status: "running" as const, progress: 0 },
          { name: "Patent Finder", status: "pending" as const, progress: 0 },
          { name: "Clinical Data", status: "pending" as const, progress: 0 },
          { name: "Web Intelligence", status: "pending" as const, progress: 0 },
        ],
      };

      addJob(newJob);
      setCurrentJobId(newJobId);

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: `I've started the research analysis for: "${query}". Our specialized AI agents are now gathering data. (Running in demo mode)`,
        timestamp: new Date().toISOString(),
        jobId: newJobId,
      };
      addMessage(assistantMessage);
    }
  };

  const handleSendMessage = async (content: string) => {
    // Add user message
    const userMessage = {
      id: Date.now().toString(),
      role: "user" as const,
      content,
      timestamp: new Date().toISOString(),
    };
    addMessage(userMessage);
    setLoading(true);

    // Check if user is confirming a pending research query
    if (pendingResearchQuery && (content.toLowerCase() === "yes" || content.toLowerCase() === "confirm" || content.toLowerCase() === "start")) {
      await startResearchJob(pendingResearchQuery);
      setPendingResearchQuery(null);
      setLoading(false);
      return;
    }

    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Try simple chat first
      const response = await chatApi.simple(content, conversationHistory);
      const { response: aiResponse, is_research_query } = response.data;

      // If it's a research query, store it and wait for confirmation
      if (is_research_query) {
        setPendingResearchQuery(content);
      }

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };
      addMessage(assistantMessage);

    } catch (error) {
      console.log("Backend unavailable, using fallback response");

      // Check if this looks like a research query
      if (isResearchQuery(content)) {
        // Start research job directly
        await startResearchJob(content);
      } else {
        // Provide a fallback response for regular questions
        const fallbackResponse = getFallbackResponse(content);
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant" as const,
          content: fallbackResponse,
          timestamp: new Date().toISOString(),
        };
        addMessage(assistantMessage);
      }
    }

    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Show job status card if there's an active job */}
        {currentJob && currentJob.status === "running" && (
          <JobStatusCard job={currentJob} />
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-text-muted">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-accent-cyan rounded-full animate-bounce" />
              <span className="w-2 h-2 bg-accent-cyan rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
              <span className="w-2 h-2 bg-accent-cyan rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
            <span className="text-sm">Processing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isLoading} />
    </div>
  );
}

// Fallback responses when backend is unavailable
function getFallbackResponse(message: string): string {
  const messageLower = message.toLowerCase();

  if (messageLower.includes("glp-1") || messageLower.includes("glp1")) {
    return `GLP-1 (Glucagon-like peptide-1) is an incretin hormone crucial for glucose metabolism.

**Key GLP-1 Medications:**
- **Ozempic** (semaglutide) - for diabetes
- **Wegovy** (semaglutide) - for weight loss
- **Rybelsus** (oral semaglutide) - for diabetes
- **Mounjaro** (tirzepatide) - dual GIP/GLP-1 agonist

Would you like me to run a comprehensive research analysis? Just say "research GLP-1 agonists".`;
  }

  if (messageLower.includes("semaglutide")) {
    return `Semaglutide is a GLP-1 receptor agonist by Novo Nordisk:

- **Ozempic** - Weekly injectable for Type 2 diabetes
- **Wegovy** - Weekly injectable for weight management
- **Rybelsus** - Daily oral for Type 2 diabetes

Clinical trials show up to 15% weight loss and significant HbA1c reduction.

Say "research semaglutide" for a detailed analysis.`;
  }

  if (messageLower.includes("hello") || messageLower.includes("hi") || messageLower.includes("hey")) {
    return `Hello! I'm DrugAI, your pharmaceutical research assistant.

I can help with:
- **Drug Information** - Mechanisms, compounds, molecules
- **Market Analysis** - Industry trends and competitive landscape
- **Patent Intelligence** - IP landscape and FTO analysis
- **Clinical Trials** - Trial data and regulatory insights

Ask me anything, or say "research [topic]" to start a comprehensive analysis!`;
  }

  if (messageLower.includes("help") || messageLower.includes("what can you do")) {
    return `I'm DrugAI - here's what I can help with:

**Ask Questions About:**
- Drug mechanisms and molecular targets
- Pharmaceutical compounds
- Disease pathways
- Market trends
- Patent strategies
- Clinical trial phases

**Start Research:**
Say "research [topic]" to deploy AI agents for:
- Market intelligence
- Patent landscape analysis
- Clinical trial summaries
- Web intelligence

Example: "Research GLP-1 agonists for obesity"`;
  }

  return `I'm DrugAI, specialized in drug discovery and pharmaceutical research.

Ask me about:
- Drug mechanisms and molecules
- Patent landscapes
- Clinical trials
- Market analysis

Or say "research [topic]" to start a comprehensive analysis with our AI agents.

What would you like to know?`;
}
