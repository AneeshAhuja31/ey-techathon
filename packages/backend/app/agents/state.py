"""Shared state definitions for the LangGraph Master-Worker architecture."""
from typing import TypedDict, Annotated, List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class WorkerOutput(BaseModel):
    """Output from a worker agent."""
    worker_name: str = Field(..., description="Name of the worker that produced this output")
    status: str = Field(default="pending", description="Status: pending, in_progress, completed, failed")
    progress: int = Field(default=0, ge=0, le=100, description="Progress percentage")
    data: Dict[str, Any] = Field(default_factory=dict, description="Worker output data")
    error: Optional[str] = Field(default=None, description="Error message if failed")
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class SubTask(BaseModel):
    """A subtask assigned to a worker."""
    id: str
    worker_type: str  # iqvia, patent, clinical, web_intel
    description: str
    priority: int = 1
    parameters: Dict[str, Any] = Field(default_factory=dict)


class MindMapNode(BaseModel):
    """Node for mind map visualization."""
    id: str
    label: str
    type: str  # disease, molecule, product
    x: Optional[float] = None
    y: Optional[float] = None
    data: Dict[str, Any] = Field(default_factory=dict)


class MindMapEdge(BaseModel):
    """Edge for mind map visualization."""
    id: str
    source: str
    target: str
    label: Optional[str] = None


class MindMapData(BaseModel):
    """Mind map visualization data."""
    nodes: List[MindMapNode] = Field(default_factory=list)
    edges: List[MindMapEdge] = Field(default_factory=list)


def merge_worker_outputs(existing: List[WorkerOutput], new: List[WorkerOutput]) -> List[WorkerOutput]:
    """Merge worker outputs, updating existing entries or adding new ones."""
    output_dict = {w.worker_name: w for w in existing}
    for w in new:
        output_dict[w.worker_name] = w
    return list(output_dict.values())


class MasterState(TypedDict):
    """
    Shared state for the Master-Worker graph.

    This state is passed through all nodes in the LangGraph and allows
    workers to share information with the master agent.
    """
    # Input
    query: str
    job_id: str
    options: Dict[str, Any]

    # Intent Understanding
    intent: str
    entities: List[str]

    # Task Planning
    subtasks: List[Dict[str, Any]]

    # Worker Outputs (uses custom reducer for merging)
    worker_outputs: Annotated[List[WorkerOutput], merge_worker_outputs]

    # Synthesis Results
    final_report: Optional[str]
    mind_map_data: Optional[Dict[str, Any]]

    # Metadata
    status: str
    progress: int
    error: Optional[str]
    created_at: str
    updated_at: str


def create_initial_state(query: str, job_id: str, options: Dict[str, Any] = None) -> MasterState:
    """Create initial state for a new job."""
    now = datetime.utcnow().isoformat()
    return MasterState(
        query=query,
        job_id=job_id,
        options=options or {},
        intent="",
        entities=[],
        subtasks=[],
        worker_outputs=[],
        final_report=None,
        mind_map_data=None,
        status="pending",
        progress=0,
        error=None,
        created_at=now,
        updated_at=now,
    )
