"""Server-Sent Events (SSE) streaming endpoint for real-time job progress."""
import json
import asyncio
from typing import AsyncGenerator
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.agents.master_agent import get_master_agent
from app.agents.state import MasterState

router = APIRouter()


async def generate_job_events(job_id: str) -> AsyncGenerator[str, None]:
    """
    Generate SSE events for job progress.

    Yields events in the format:
    data: {"type": "node_update", "node_id": "...", "status": "...", ...}
    """
    master_agent = get_master_agent()
    last_progress = -1
    last_worker_states = {}
    retry_count = 0
    max_retries = 300  # 5 minutes at 1 second intervals
    setup_nodes_emitted = False

    while retry_count < max_retries:
        status = master_agent.get_job_status(job_id)

        if not status:
            yield f"data: {json.dumps({'type': 'error', 'message': 'Job not found'})}\n\n"
            break

        # Emit setup nodes at the start (query_analyzer, document_check, chat_context, task_planner)
        # Show each node as "running" briefly, then "completed" for realistic progress
        if not setup_nodes_emitted:
            setup_nodes = [
                ("query_analyzer", "Analyzing Query"),
                ("document_check", "Checking Documents"),
                ("chat_context", "Loading Context"),
                ("task_planner", "Planning Tasks"),
            ]
            for node_id, node_name in setup_nodes:
                # First emit as "running"
                running_event = {
                    "type": "node_update",
                    "node_id": node_id,
                    "node_name": node_name,
                    "status": "running",
                    "progress": 50,
                    "thought": get_worker_thought(node_id, "running", 50),
                }
                yield f"data: {json.dumps(running_event)}\n\n"
                await asyncio.sleep(0.15)  # Brief delay to show running state

                # Then emit as "completed"
                completed_event = {
                    "type": "node_update",
                    "node_id": node_id,
                    "node_name": node_name,
                    "status": "completed",
                    "progress": 100,
                    "thought": get_worker_thought(node_id, "completed", 100),
                }
                yield f"data: {json.dumps(completed_event)}\n\n"
                await asyncio.sleep(0.1)  # Small delay before next node

            setup_nodes_emitted = True

        # Send overall progress update if changed
        current_progress = status.get("progress", 0)
        if current_progress != last_progress:
            event = {
                "type": "progress",
                "job_id": job_id,
                "status": status.get("status", "unknown"),
                "progress": current_progress,
                "intent": status.get("intent"),
                "entities": status.get("entities", []),
            }
            yield f"data: {json.dumps(event)}\n\n"
            last_progress = current_progress

        # Send worker/node updates
        workers = status.get("workers", [])
        for worker in workers:
            worker_name = worker.get("name", "")
            worker_status = worker.get("status", "pending")
            worker_progress = worker.get("progress", 0)

            # Map worker names to frontend node IDs
            node_id_mapping = {
                "IQVIA Insights": "iqvia_worker",
                "Patent Landscape": "patent_worker",
                "Clinical Trials": "clinical_worker",
                "Web Intelligence": "web_intel_worker",
                "Scientific Literature": "literature_worker",
                "Company Knowledge": "company_rag_worker",
                "Report Generator": "synthesizer",
            }
            node_id = node_id_mapping.get(worker_name, worker_name.lower().replace(" ", "_"))

            worker_key = f"{node_id}_{worker_status}_{worker_progress}"

            if worker_key != last_worker_states.get(node_id):
                node_event = {
                    "type": "node_update",
                    "node_id": node_id,
                    "node_name": worker_name,
                    "status": worker_status,
                    "progress": worker_progress,
                    "error": worker.get("error"),
                    "thought": get_worker_thought(node_id, worker_status, worker_progress),
                }
                yield f"data: {json.dumps(node_event)}\n\n"
                last_worker_states[node_id] = worker_key

        # Check if job is complete
        job_status = status.get("status", "")
        if job_status in ["completed", "failed", "cancelled"]:
            # Send final event with results
            final_event = {
                "type": "complete",
                "job_id": job_id,
                "status": job_status,
                "mind_map_data": status.get("mind_map_data"),
                "final_report": status.get("final_report"),
                "error": status.get("error"),
            }
            yield f"data: {json.dumps(final_event)}\n\n"
            break

        await asyncio.sleep(0.5)  # Poll every 500ms
        retry_count += 1

    # Send end event
    yield f"data: {json.dumps({'type': 'end'})}\n\n"


def get_worker_thought(worker_name: str, status: str, progress: int) -> str:
    """Generate a thought/status message for the worker."""
    thoughts = {
        # Setup nodes
        "query_analyzer": {
            "pending": "Waiting to analyze query...",
            "in_progress": "Analyzing query intent and extracting entities...",
            "running": "Understanding your research request...",
            "completed": "Query analysis complete.",
            "failed": "Query analysis encountered an error."
        },
        "document_check": {
            "pending": "Waiting to check documents...",
            "in_progress": "Checking for uploaded company documents...",
            "running": "Searching document repository...",
            "completed": "Document check complete.",
            "failed": "Document check encountered an error."
        },
        "chat_context": {
            "pending": "Waiting to load context...",
            "in_progress": "Loading relevant conversation history...",
            "running": "Retrieving context from chat history...",
            "completed": "Context loaded.",
            "failed": "Context loading encountered an error."
        },
        "task_planner": {
            "pending": "Waiting to plan tasks...",
            "in_progress": "Planning research subtasks...",
            "running": "Creating execution plan for workers...",
            "completed": "Task planning complete.",
            "failed": "Task planning encountered an error."
        },
        # Worker nodes
        "iqvia_worker": {
            "pending": "Waiting to start market analysis...",
            "in_progress": "Analyzing pharmaceutical market data and sales trends...",
            "running": "Gathering IQVIA market intelligence data...",
            "completed": "Market analysis complete.",
            "failed": "Market analysis encountered an error."
        },
        "patent_worker": {
            "pending": "Waiting to search patents...",
            "in_progress": "Searching Google Patents and USPTO databases...",
            "running": "Analyzing patent landscape and IP filings...",
            "completed": "Patent search complete.",
            "failed": "Patent search encountered an error."
        },
        "clinical_worker": {
            "pending": "Waiting to search clinical trials...",
            "in_progress": "Querying ClinicalTrials.gov for relevant studies...",
            "running": "Analyzing clinical trial outcomes and phases...",
            "completed": "Clinical trials analysis complete.",
            "failed": "Clinical trials search encountered an error."
        },
        "company_rag_worker": {
            "pending": "Waiting to search company documents...",
            "in_progress": "Querying vector store for relevant documents...",
            "running": "Analyzing company document embeddings...",
            "completed": "Company document search complete.",
            "failed": "Company document search encountered an error."
        },
        "web_intel_worker": {
            "pending": "Waiting to gather web intelligence...",
            "in_progress": "Searching with Tavily for latest news...",
            "running": "Analyzing sentiment and recent developments...",
            "completed": "Web intelligence gathering complete.",
            "failed": "Web intelligence gathering encountered an error."
        },
        "literature_worker": {
            "pending": "Waiting to search literature...",
            "in_progress": "Searching PubMed for scientific papers...",
            "running": "Analyzing research publications...",
            "completed": "Literature search complete.",
            "failed": "Literature search encountered an error."
        },
        "synthesizer": {
            "pending": "Waiting to synthesize results...",
            "in_progress": "Synthesizing findings from all agents...",
            "running": "Generating comprehensive analysis report...",
            "completed": "Report generation complete.",
            "failed": "Report generation encountered an error."
        },
        # Legacy names (for backwards compatibility)
        "IQVIA Insights": {
            "pending": "Waiting to start market analysis...",
            "in_progress": "Analyzing pharmaceutical market data and sales trends...",
            "running": "Gathering IQVIA market intelligence data...",
            "completed": "Market analysis complete.",
            "failed": "Market analysis encountered an error."
        },
        "Patent Landscape": {
            "pending": "Waiting to search patents...",
            "in_progress": "Searching Google Patents and USPTO databases...",
            "running": "Analyzing patent landscape and IP filings...",
            "completed": "Patent search complete.",
            "failed": "Patent search encountered an error."
        },
        "Clinical Trials": {
            "pending": "Waiting to search clinical trials...",
            "in_progress": "Querying ClinicalTrials.gov for relevant studies...",
            "running": "Analyzing clinical trial outcomes and phases...",
            "completed": "Clinical trials analysis complete.",
            "failed": "Clinical trials search encountered an error."
        },
        "Web Intelligence": {
            "pending": "Waiting to gather web intelligence...",
            "in_progress": "Scanning news sources and research publications...",
            "running": "Analyzing sentiment and recent developments...",
            "completed": "Web intelligence gathering complete.",
            "failed": "Web intelligence gathering encountered an error."
        },
        "Report Generator": {
            "pending": "Waiting to synthesize results...",
            "in_progress": "Synthesizing findings from all agents...",
            "running": "Generating comprehensive analysis report...",
            "completed": "Report generation complete.",
            "failed": "Report generation encountered an error."
        },
    }

    worker_thoughts = thoughts.get(worker_name, {
        "pending": "Waiting...",
        "in_progress": "Processing...",
        "running": "Working...",
        "completed": "Done.",
        "failed": "Error occurred."
    })

    # Map status to thought
    if status in worker_thoughts:
        return worker_thoughts[status]
    elif progress > 0 and progress < 100:
        return worker_thoughts.get("running", "Processing...")
    else:
        return worker_thoughts.get("pending", "Waiting...")


@router.get("/jobs/{job_id}/stream")
async def stream_job_progress(job_id: str):
    """
    Stream real-time progress updates for a job using Server-Sent Events.

    This endpoint provides real-time updates as the LangGraph pipeline executes,
    including individual node/agent status, progress percentage, and "thoughts".

    Event types:
    - progress: Overall job progress update
    - node_update: Individual agent/node status update
    - complete: Job completed with final results
    - error: An error occurred
    - end: Stream ended
    """
    master_agent = get_master_agent()

    # Verify job exists
    status = master_agent.get_job_status(job_id)
    if not status:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    return StreamingResponse(
        generate_job_events(job_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.post("/jobs/stream")
async def create_and_stream_job(
    query: str,
    include_patents: bool = True,
    include_clinical_trials: bool = True,
    include_market_data: bool = True,
    include_web_intel: bool = True,
):
    """
    Create a new job and immediately stream its progress.

    This is a convenience endpoint that combines job creation with streaming.
    """
    master_agent = get_master_agent()

    options = {
        "include_patents": include_patents,
        "include_clinical_trials": include_clinical_trials,
        "include_market_data": include_market_data,
        "include_web_intel": include_web_intel,
    }

    # Start the job
    job_id = await master_agent.start_job(query=query, options=options)

    # Return streaming response
    return StreamingResponse(
        generate_job_events(job_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
