"""Base worker class for all specialized agents."""
from abc import ABC, abstractmethod
from typing import Dict, Any
from datetime import datetime
import asyncio

from app.agents.state import MasterState, WorkerOutput


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

    @property
    def worker_name(self) -> str:
        return self.name

    async def run(self, state: MasterState) -> Dict[str, Any]:
        """
        Main entry point for the worker.

        This method is called by LangGraph when the worker node is executed.
        It handles the lifecycle of the worker execution.
        """
        output = WorkerOutput(
            worker_name=self.name,
            status="in_progress",
            progress=0,
            started_at=datetime.utcnow()
        )

        try:
            # Update status to in_progress
            self._status = "in_progress"

            # Execute the worker's specific logic
            result = await self.execute(state)

            # Mark as completed
            output.status = "completed"
            output.progress = 100
            output.data = result
            output.completed_at = datetime.utcnow()
            self._status = "completed"
            self._progress = 100

        except Exception as e:
            output.status = "failed"
            output.error = str(e)
            output.completed_at = datetime.utcnow()
            self._status = "failed"

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

    async def update_progress(self, progress: int):
        """Update progress percentage (0-100)."""
        self._progress = min(100, max(0, progress))
        # In a real implementation, this could notify a callback
        # or update a shared state store

    def get_status(self) -> Dict[str, Any]:
        """Get current worker status."""
        return {
            "name": self.name,
            "status": self._status,
            "progress": self._progress
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
