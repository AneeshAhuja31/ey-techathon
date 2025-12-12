"""Base worker class for all specialized agents."""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Callable, Awaitable
from datetime import datetime
import asyncio

from app.agents.state import MasterState, WorkerOutput


# Global progress callback registry for SSE streaming
_progress_callbacks: Dict[str, Callable[[str, str, int, str], Awaitable[None]]] = {}


def register_progress_callback(job_id: str, callback: Callable[[str, str, int, str], Awaitable[None]]):
    """Register a callback for progress updates."""
    _progress_callbacks[job_id] = callback


def unregister_progress_callback(job_id: str):
    """Remove a progress callback."""
    _progress_callbacks.pop(job_id, None)


async def emit_progress(job_id: str, worker_name: str, status: str, progress: int, thought: str = ""):
    """Emit a progress event to registered callbacks."""
    callback = _progress_callbacks.get(job_id)
    if callback:
        try:
            await callback(worker_name, status, progress, thought)
        except Exception:
            pass  # Don't let callback errors break the worker


class BaseWorker(ABC):
    """
    Abstract base class for worker agents.

    All specialized workers (IQVIA, Patent, Clinical, Web Intel) inherit
    from this class and implement their specific logic.
    """

    def __init__(self, name: str):
        self.name = name
        self._progress = 0
        self._status = "pending"
        self._current_thought = ""
        self._job_id: Optional[str] = None

    @property
    def worker_name(self) -> str:
        return self.name

    async def run(self, state: MasterState) -> Dict[str, Any]:
        """
        Main entry point for the worker.

        This method is called by LangGraph when the worker node is executed.
        It handles the lifecycle of the worker execution.
        """
        self._job_id = state.get("job_id")

        output = WorkerOutput(
            worker_name=self.name,
            status="in_progress",
            progress=0,
            started_at=datetime.utcnow()
        )

        try:
            # Update status to in_progress
            self._status = "in_progress"
            await self._emit_progress("running", 0, f"Starting {self.name}...")

            # Execute the worker's specific logic
            result = await self.execute(state)

            # Mark as completed
            output.status = "completed"
            output.progress = 100
            output.data = result
            output.completed_at = datetime.utcnow()
            self._status = "completed"
            self._progress = 100
            await self._emit_progress("completed", 100, f"{self.name} complete.")

        except Exception as e:
            output.status = "failed"
            output.error = str(e)
            output.completed_at = datetime.utcnow()
            self._status = "failed"
            await self._emit_progress("failed", self._progress, f"Error: {str(e)}")

        # Return state update with worker output
        return {"worker_outputs": [output]}

    @abstractmethod
    async def execute(self, state: MasterState) -> Dict[str, Any]:
        """
        Execute the worker's specific logic.

        This method should be implemented by each specialized worker.
        It should return a dictionary with the worker's results.
        """
        pass

    async def update_progress(self, progress: int, thought: str = ""):
        """Update progress percentage (0-100) with optional thought message."""
        self._progress = min(100, max(0, progress))
        if thought:
            self._current_thought = thought
        await self._emit_progress("running", self._progress, thought or self._current_thought)

    async def _emit_progress(self, status: str, progress: int, thought: str):
        """Internal method to emit progress events."""
        if self._job_id:
            await emit_progress(self._job_id, self.name, status, progress, thought)

    def get_status(self) -> Dict[str, Any]:
        """Get current worker status."""
        return {
            "name": self.name,
            "status": self._status,
            "progress": self._progress,
            "thought": self._current_thought
        }


class MockWorker(BaseWorker):
    """
    Mock worker for testing and development.

    Simulates work by sleeping and returning mock data.
    """

    def __init__(self, name: str, mock_data: Dict[str, Any], delay: float = 2.0):
        super().__init__(name)
        self.mock_data = mock_data
        self.delay = delay

    async def execute(self, state: MasterState) -> Dict[str, Any]:
        """Simulate work with progress updates."""
        steps = 5
        for i in range(steps):
            await asyncio.sleep(self.delay / steps)
            await self.update_progress(int((i + 1) / steps * 100))

        return self.mock_data
