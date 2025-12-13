"""Shared state definitions for the LangGraph Master-Worker architecture."""
from typing import TypedDict, Annotated, List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum


class NodeStatus(str, Enum):
    """Status of a node in the LangGraph pipeline."""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class EventType(str, Enum):
    """Types of SSE events."""
    PROGRESS = "progress"
    NODE_UPDATE = "node_update"
    THOUGHT = "thought"
    COMPLETE = "complete"
    ERROR = "error"
    END = "end"


class NodeEvent(BaseModel):
    """Event emitted when a node status changes."""
    type: EventType = EventType.NODE_UPDATE
    node_id: str
    node_name: str
    status: NodeStatus
    progress: int = 0
    thought: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class WorkerOutput(BaseModel):
    """Output from a worker agent."""
    worker_name: str = Field(..., description="Name of the worker that produced this output")
    status: str = Field(default="pending", description="Status: pending, in_progress, completed, failed")
    progress: int = Field(default=0, ge=0, le=100, description="Progress percentage")
    data: Dict[str, Any] = Field(default_factory=dict, description="Worker output data")
    error: Optional[str] = Field(default=None, description="Error message if failed")
    thought: Optional[str] = Field(default=None, description="Current thought/status message")
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

    # Conversation Context (for query refinement)
    conversation_history: List[Dict[str, str]]  # [{role, content}]

    # Intent Understanding
    intent: str
    entities: List[str]
    is_company_query: bool
    execution_mode: str  # "full_research", "direct_patent", "mindmap_only"

    # Refined Queries (tool-specific optimized queries)
    refined_queries: Dict[str, str]  # {patent, web, vector, clinical, literature}

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


def create_initial_state(
    query: str,
    job_id: str,
    options: Dict[str, Any] = None,
    conversation_history: List[Dict[str, str]] = None,
    is_company_query: bool = False,
    execution_mode: str = "full_research"
) -> MasterState:
    """Create initial state for a new job."""
    now = datetime.utcnow().isoformat()
    return MasterState(
        query=query,
        job_id=job_id,
        options=options or {},
        conversation_history=conversation_history or [],
        intent="",
        entities=[],
        is_company_query=is_company_query,
        execution_mode=execution_mode,
        refined_queries={},
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
