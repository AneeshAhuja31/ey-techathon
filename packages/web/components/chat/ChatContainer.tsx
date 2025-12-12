"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useChatStore } from "@/store/chatStore";
import { useJobStore } from "@/store/jobStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { useDocumentStore } from "@/store/documentStore";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { JobStatusCard } from "./JobStatusCard";
import { LangGraphInline } from "@/components/langgraph";
import { useJobStream, NodeState } from "@/hooks/useSSE";
import { chatApi, jobsApi } from "@/lib/api";

const POLL_INTERVAL = 2000;

// Keywords that indicate a research job should be started
const RESEARCH_KEYWORDS = [
  "research", "analyze", "comprehensive", "deep dive", "patent search",
  "market analysis", "clinical trials", "find patents", "investigate",
  "full analysis", "detailed study", "landscape analysis", "competitive analysis",
  "start analysis", "run analysis", "begin research"
];

// Keywords that indicate a company-specific query
const COMPANY_KEYWORDS = [
  "company data", "our documents", "our data", "internal", "uploaded",
  "my documents", "company documents", "proprietary", "internal data",
  "our files", "uploaded files", "company files"
];

export function ChatContainer() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [streamingJobId, setStreamingJobId] = useState<string | null>(null);
  const [sseNodes, setSseNodes] = useState<NodeState[]>([]);
  const { messages, isLoading, currentJobId, addMessage, setLoading, setCurrentJobId } = useChatStore();
  const { jobs, addJob, updateJob, updateWorkerStatus } = useJobStore();
  const { documents } = useDocumentStore();

  const currentJob = jobs.find((job) => job.id === currentJobId);
  const hasDocuments = documents.some(d => d.status === "ready");

  // Sidebar store for mind map panel
  const { setPipelineNodes, setMindMapData, openMindMap, clearPipelineNodes } = useSidebarStore();

  // Use SSE for real-time updates when available
  const {
    nodes: streamNodes,
    progress: streamProgress,
    status: streamStatus,
    isComplete: streamComplete,
    isConnected,
  } = useJobStream(streamingJobId, {
    onProgress: (progress, status) => {
      if (streamingJobId) {
        updateJob(streamingJobId, { progress, status: status as "running" | "completed" | "failed" });
      }
    },
    onNodeUpdate: (node) => {
      setSseNodes((prev) => {
        const existing = prev.findIndex((n) => n.nodeId === node.nodeId);
        let next: NodeState[];
        if (existing >= 0) {
          next = [...prev];
          next[existing] = node;
        } else {
          next = [...prev, node];
        }
        // Also update sidebar store
        setPipelineNodes(next);
        return next;
      });
      // Also update job store for compatibility
      if (streamingJobId) {
        updateWorkerStatus(streamingJobId, node.nodeName, {
          status: node.status,
          progress: node.progress,
        });
      }
    },
    onComplete: (data) => {
      if (streamingJobId) {
        updateJob(streamingJobId, { status: "completed", progress: 100 });

        // Only add completion message if there's a final report from backend
        if (data.finalReport) {
          const completionMessage = {
            id: Date.now().toString(),
            role: "assistant" as const,
            content: data.finalReport,
            timestamp: new Date().toISOString(),
            jobId: streamingJobId,
          };
          addMessage(completionMessage);
        }

        // Update sidebar with mind map data if available
        if (data.mindMapData) {
          setMindMapData(data.mindMapData as {
            nodes: Array<{ id: string; label: string; type: string; data?: Record<string, unknown> }>;
            edges: Array<{ id: string; source: string; target: string; label?: string }>;
          });
        }

        setStreamingJobId(null);
        setSseNodes([]);
        clearPipelineNodes();
      }
    },
    onError: (error) => {
      console.error("SSE error:", error);
      // Fall back to polling on SSE error
      if (streamingJobId) {
        setStreamingJobId(null);
      }
    },
  });

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

  // Check if message is a company-specific query
  const isCompanyQuery = (message: string): boolean => {
    const messageLower = message.toLowerCase();
    return COMPANY_KEYWORDS.some(keyword => messageLower.includes(keyword));
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

        // Only add message if there's actual content from backend
        if (data.result?.summary || data.status === "failed") {
          const completionMessage = {
            id: Date.now().toString(),
            role: "assistant" as const,
            content: data.status === "completed" && data.result?.summary
              ? data.result.summary
              : "The analysis encountered an error. Please try again.",
            timestamp: new Date().toISOString(),
            jobId,
          };
          addMessage(completionMessage);
        }
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
      // No canned message - let the progress UI and results speak for themselves
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

  // Start a research job with SSE streaming
  const startResearchJob = async (query: string, includeCompanyData: boolean = false) => {
    try {
      const response = await chatApi.initiate(query, {
        include_patents: true,
        include_clinical_trials: true,
        include_market_data: true,
        include_literature: true,
        include_company_data: includeCompanyData,
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
          { name: "Market Research", status: "pending" as const, progress: 0 },
          { name: "Patent Search", status: "pending" as const, progress: 0 },
          { name: "Clinical Trials", status: "pending" as const, progress: 0 },
          { name: "Web Intel", status: "pending" as const, progress: 0 },
          { name: "Literature", status: "pending" as const, progress: 0 },
          ...(includeCompanyData ? [{ name: "Company Data", status: "pending" as const, progress: 0 }] : []),
        ],
      };

      addJob(newJob);
      setCurrentJobId(job_id);

      // Start SSE streaming for real-time updates
      setStreamingJobId(job_id);
      setSseNodes([]);
      clearPipelineNodes();
      openMindMap(); // Auto-open the sidebar when analysis starts
      // No canned message - the progress UI shows the analysis is running

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
          { name: "Patent Search", status: "pending" as const, progress: 0 },
          { name: "Clinical Trials", status: "pending" as const, progress: 0 },
          { name: "Web Intel", status: "pending" as const, progress: 0 },
          { name: "Literature", status: "pending" as const, progress: 0 },
        ],
      };

      addJob(newJob);
      setCurrentJobId(newJobId);
      // No canned message - the progress UI shows the analysis is running
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

    // Check if this is a company-specific query without documents
    const wantsCompanyData = isCompanyQuery(content);
    if (wantsCompanyData && !hasDocuments) {
      const promptMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant" as const,
        content: `I'd love to help analyze your company data, but you haven't uploaded any documents yet.

**To enable company-specific analysis:**
1. Click the 📎 paperclip icon in the chat input
2. Upload your company documents (PDF, DOCX, XLSX, TXT supported)
3. Wait for the documents to be processed
4. Then ask your question again!

Your documents will be securely vectorized and used for RAG-based analysis alongside our market, patent, and clinical trial data.`,
        timestamp: new Date().toISOString(),
      };
      addMessage(promptMessage);
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
      const { response: aiResponse, is_research_query, is_company_query, requires_documents } = response.data;

      // If backend says we need documents for company query
      if (is_company_query && requires_documents && !hasDocuments) {
        const promptMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant" as const,
          content: `I noticed you're interested in company-specific analysis. Please upload your company documents first using the 📎 button below.

Once uploaded, I can include your proprietary data in the analysis alongside market research, patents, and clinical trial data.`,
          timestamp: new Date().toISOString(),
        };
        addMessage(promptMessage);
        setLoading(false);
        return;
      }

      // If it's a research query, start the job directly (no confirmation needed)
      if (is_research_query) {
        await startResearchJob(content, (is_company_query || wantsCompanyData) && hasDocuments);
        setLoading(false);
        return;
      }

      // Only add message if there's actual content
      if (aiResponse) {
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant" as const,
          content: aiResponse,
          timestamp: new Date().toISOString(),
        };
        addMessage(assistantMessage);
      }

    } catch (error) {
      console.log("Backend unavailable, using fallback response");

      // Check if this looks like a research query
      if (isResearchQuery(content)) {
        // Start research job directly (include company data if available and requested)
        await startResearchJob(content, wantsCompanyData && hasDocuments);
      } else {
        // Provide a fallback response for regular questions
        const fallbackResponse = getFallbackResponse(content, wantsCompanyData, hasDocuments);
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

        {/* Show LangGraph visualization immediately when job starts */}
        {streamingJobId && (
          <LangGraphInline nodes={sseNodes} className="my-4" />
        )}

        {/* Show job status card if there's an active job (fallback for non-SSE) */}
        {currentJob && currentJob.status === "running" && !streamingJobId && (
          <JobStatusCard job={currentJob} />
        )}

        {/* SSE connection indicator */}
        {streamingJobId && isConnected && (
          <div className="flex items-center gap-2 text-accent-cyan text-sm">
            <div className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
            <span>Live streaming analysis updates...</span>
          </div>
        )}

        {isLoading && !streamingJobId && (
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
      <ChatInput onSend={handleSendMessage} disabled={isLoading || !!streamingJobId} />
    </div>
  );
}

// Fallback responses when backend is unavailable
function getFallbackResponse(message: string, isCompanyQuery: boolean = false, hasDocuments: boolean = false): string {
  const messageLower = message.toLowerCase();

  // Handle company-specific queries
  if (isCompanyQuery && !hasDocuments) {
    return `I'd love to help with your company-specific query, but you haven't uploaded any documents yet.

**To enable company data analysis:**
1. Click the 📎 paperclip icon below
2. Upload your company documents (PDF, DOCX, XLSX, TXT)
3. Wait for processing to complete
4. Then ask your question again

Once uploaded, I can combine your proprietary data with market research, patents, and clinical trials!`;
  }

  if (messageLower.includes("glp-1") || messageLower.includes("glp1")) {
    const companyAddition = hasDocuments ? "\n\nI can also include your company documents in the analysis!" : "";
    return `GLP-1 (Glucagon-like peptide-1) is an incretin hormone crucial for glucose metabolism.

**Key GLP-1 Medications:**
- **Ozempic** (semaglutide) - for diabetes
- **Wegovy** (semaglutide) - for weight loss
- **Rybelsus** (oral semaglutide) - for diabetes
- **Mounjaro** (tirzepatide) - dual GIP/GLP-1 agonist

Would you like me to run a comprehensive research analysis? Just say "research GLP-1 agonists".${companyAddition}`;
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
    const docStatus = hasDocuments
      ? "\n\n**Company Documents:** Ready for analysis!"
      : "\n\n**Tip:** Upload company documents using 📎 to enable proprietary data analysis.";
    return `Hello! I'm DrugAI, your pharmaceutical research assistant.

I can help with:
- **Drug Information** - Mechanisms, compounds, molecules
- **Market Analysis** - Industry trends and competitive landscape
- **Patent Intelligence** - IP landscape and FTO analysis
- **Clinical Trials** - Trial data and regulatory insights
- **Company Data** - Analysis of your uploaded documents (RAG)

Ask me anything, or say "research [topic]" to start a comprehensive analysis!${docStatus}`;
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
- Market intelligence (IQVIA data)
- Patent landscape analysis (Google Patents)
- Clinical trial summaries
- Scientific literature (PubMed)
- Web intelligence
${hasDocuments ? "- Company document analysis (RAG)" : ""}

**Company Data:**
${hasDocuments
  ? "Your documents are ready! Include 'company data' in your query to analyze them."
  : "Upload documents with 📎 to enable company-specific analysis."}

Example: "Research GLP-1 agonists for obesity${hasDocuments ? " using company data" : ""}"`;
  }

  return `I'm DrugAI, specialized in drug discovery and pharmaceutical research.

Ask me about:
- Drug mechanisms and molecules
- Patent landscapes
- Clinical trials
- Market analysis
${hasDocuments ? "- Your company documents" : ""}

Or say "research [topic]" to start a comprehensive analysis with our AI agents.

${!hasDocuments ? "**Tip:** Upload company documents with 📎 for proprietary data analysis.\n\n" : ""}What would you like to know?`;
}
