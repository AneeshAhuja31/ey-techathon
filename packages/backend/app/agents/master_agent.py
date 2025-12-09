"""Master Agent - Orchestrates the drug discovery workflow."""
import asyncio
from typing import Dict, Any, Optional, AsyncGenerator
from datetime import datetime
import uuid

from app.agents.state import MasterState, create_initial_state, WorkerOutput
from app.agents.graph_builder import get_compiled_graph


class MasterAgent:
    """
    Master Agent for orchestrating drug discovery analysis.

    This agent manages the execution of the LangGraph workflow,
    tracks job progress, and provides status updates.
    """

    def __init__(self):
        self.graph = get_compiled_graph()
        self.active_jobs: Dict[str, MasterState] = {}

    async def start_job(
        self,
        query: str,
        user_id: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Start a new analysis job.

        Args:
            query: The research query (e.g., "Research GLP-1 agonists")
            user_id: Optional user identifier
            options: Analysis options (which workers to include)

        Returns:
            job_id: Unique identifier for the job
        """
        job_id = f"job_{uuid.uuid4().hex[:12]}"

        # Set default options
        default_options = {
            "include_patents": True,
            "include_clinical_trials": True,
            "include_market_data": True,
            "include_web_intel": True
        }

        if options:
            default_options.update(options)

        # Create initial state
        initial_state = create_initial_state(
            query=query,
            job_id=job_id,
            options=default_options
        )

        # Store job state
        self.active_jobs[job_id] = initial_state

        # Start async execution
        asyncio.create_task(self._execute_job(job_id, initial_state))

        return job_id

    async def _execute_job(self, job_id: str, initial_state: MasterState):
        """Execute the job asynchronously."""
        try:
            # Run the graph
            final_state = await self.graph.ainvoke(initial_state)

            # Update stored state
            self.active_jobs[job_id] = final_state

        except Exception as e:
            # Handle errors
            error_state = self.active_jobs.get(job_id, initial_state)
            error_state["status"] = "failed"
            error_state["error"] = str(e)
            error_state["updated_at"] = datetime.utcnow().isoformat()
            self.active_jobs[job_id] = error_state

    async def stream_job(
        self,
        query: str,
        options: Optional[Dict[str, Any]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream job execution with progress updates.

        Yields status updates as the job progresses.
        """
        job_id = f"job_{uuid.uuid4().hex[:12]}"

        default_options = {
            "include_patents": True,
            "include_clinical_trials": True,
            "include_market_data": True,
            "include_web_intel": True
        }

        if options:
            default_options.update(options)

        initial_state = create_initial_state(
            query=query,
            job_id=job_id,
            options=default_options
        )

        self.active_jobs[job_id] = initial_state

        # Stream execution
        async for state in self.graph.astream(initial_state):
            # Update stored state
            if isinstance(state, dict):
                for key, value in state.items():
                    if key in self.active_jobs[job_id]:
                        self.active_jobs[job_id][key] = value

            yield {
                "job_id": job_id,
                "state": self.active_jobs[job_id],
                "timestamp": datetime.utcnow().isoformat()
            }

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the current status of a job.

        Returns:
            Job status dictionary or None if not found
        """
        state = self.active_jobs.get(job_id)

        if not state:
            return None

        # Extract worker statuses
        worker_statuses = []
        for output in state.get("worker_outputs", []):
            if isinstance(output, WorkerOutput):
                worker_statuses.append({
                    "name": output.worker_name,
                    "status": output.status,
                    "progress": output.progress,
                    "error": output.error
                })
            elif isinstance(output, dict):
                worker_statuses.append({
                    "name": output.get("worker_name", "Unknown"),
                    "status": output.get("status", "unknown"),
                    "progress": output.get("progress", 0),
                    "error": output.get("error")
                })

        return {
            "job_id": job_id,
            "query": state.get("query", ""),
            "status": state.get("status", "unknown"),
            "progress": state.get("progress", 0),
            "workers": worker_statuses,
            "intent": state.get("intent"),
            "entities": state.get("entities", []),
            "mind_map_data": state.get("mind_map_data"),
            "final_report": state.get("final_report"),
            "error": state.get("error"),
            "created_at": state.get("created_at"),
            "updated_at": state.get("updated_at")
        }

    def get_job_result(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the final result of a completed job.

        Returns:
            Job result dictionary or None if not found/not completed
        """
        status = self.get_job_status(job_id)

        if not status:
            return None

        if status.get("status") != "completed":
            return {
                "job_id": job_id,
                "status": status.get("status"),
                "message": "Job not yet completed"
            }

        state = self.active_jobs.get(job_id)

        return {
            "job_id": job_id,
            "query": state.get("query"),
            "status": "completed",
            "summary": state.get("final_report"),
            "mind_map_data": state.get("mind_map_data"),
            "worker_results": [
                {
                    "worker": output.worker_name if isinstance(output, WorkerOutput) else output.get("worker_name"),
                    "data": output.data if isinstance(output, WorkerOutput) else output.get("data")
                }
                for output in state.get("worker_outputs", [])
            ]
        }

    def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a running job.

        Returns:
            True if cancelled, False if not found
        """
        if job_id not in self.active_jobs:
            return False

        state = self.active_jobs[job_id]
        state["status"] = "cancelled"
        state["updated_at"] = datetime.utcnow().isoformat()

        return True

    def list_jobs(self, limit: int = 10) -> list:
        """List recent jobs."""
        jobs = []
        for job_id, state in list(self.active_jobs.items())[-limit:]:
            jobs.append({
                "job_id": job_id,
                "query": state.get("query", ""),
                "status": state.get("status", "unknown"),
                "progress": state.get("progress", 0),
                "created_at": state.get("created_at")
            })
        return jobs


# Singleton instance
_master_agent: Optional[MasterAgent] = None


def get_master_agent() -> MasterAgent:
    """Get or create the master agent instance."""
    global _master_agent
    if _master_agent is None:
        _master_agent = MasterAgent()
    return _master_agent
