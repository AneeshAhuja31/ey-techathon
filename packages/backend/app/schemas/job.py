"""Job status schemas."""
from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field


class WorkerStatusResponse(BaseModel):
    """Response schema for individual worker status."""
    name: str = Field(..., description="Worker name")
    status: str = Field(..., description="Worker status: pending, in_progress, completed, failed")
    progress: int = Field(..., ge=0, le=100, description="Progress percentage 0-100")
    started_at: Optional[str] = Field(default=None, description="Start timestamp")
    completed_at: Optional[str] = Field(default=None, description="Completion timestamp")
    error: Optional[str] = Field(default=None, description="Error message if failed")

    class Config:
        json_schema_extra = {
            "example": {
                "name": "IQVIA Insights",
                "status": "in_progress",
                "progress": 45,
                "started_at": "2024-01-15T10:30:00Z",
                "completed_at": None,
                "error": None
            }
        }


class JobResult(BaseModel):
    """Job result schema."""
    summary: Optional[str] = None
    mind_map_data: Optional[Dict[str, Any]] = None
    patents: Optional[List[Dict[str, Any]]] = None
    clinical_trials: Optional[List[Dict[str, Any]]] = None
    market_insights: Optional[Dict[str, Any]] = None


class JobStatusResponse(BaseModel):
    """Response schema for job status polling."""
    job_id: str = Field(..., description="Unique job identifier")
    query: str = Field(..., description="Original query")
    status: str = Field(..., description="Job status: pending, processing, completed, failed")
    progress: int = Field(..., ge=0, le=100, description="Overall progress percentage")
    workers: List[WorkerStatusResponse] = Field(default=[], description="Individual worker statuses")
    result: Optional[JobResult] = Field(default=None, description="Job result when completed")
    error: Optional[str] = Field(default=None, description="Error message if failed")
    created_at: Optional[str] = Field(default=None, description="Creation timestamp")
    updated_at: Optional[str] = Field(default=None, description="Last update timestamp")
    completed_at: Optional[str] = Field(default=None, description="Completion timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_abc123",
                "query": "Research GLP-1 agonists",
                "status": "processing",
                "progress": 45,
                "workers": [
                    {"name": "IQVIA Insights", "status": "completed", "progress": 100},
                    {"name": "Patent Landscape", "status": "in_progress", "progress": 52},
                    {"name": "Clinical Trials", "status": "in_progress", "progress": 30},
                    {"name": "Web Intelligence", "status": "pending", "progress": 0}
                ],
                "result": None,
                "error": None,
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:31:00Z",
                "completed_at": None
            }
        }


class JobListResponse(BaseModel):
    """Response schema for listing jobs."""
    jobs: List[JobStatusResponse]
    total: int
    page: int
    page_size: int
