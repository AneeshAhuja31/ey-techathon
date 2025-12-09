"""Chat request/response schemas."""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ChatOptions(BaseModel):
    """Options for chat initiation."""
    include_patents: bool = Field(default=True, description="Include patent search")
    include_clinical_trials: bool = Field(default=True, description="Include clinical trials data")
    include_market_data: bool = Field(default=True, description="Include market/IQVIA data")
    include_web_intel: bool = Field(default=True, description="Include web intelligence")


class ChatInitiateRequest(BaseModel):
    """Request schema for initiating a chat/analysis job."""
    query: str = Field(..., min_length=1, description="The research query")
    user_id: Optional[str] = Field(default=None, description="Optional user ID")
    options: Optional[ChatOptions] = Field(default=None, description="Analysis options")

    class Config:
        json_schema_extra = {
            "example": {
                "query": "Research GLP-1 agonists for obesity treatment",
                "user_id": "user_123",
                "options": {
                    "include_patents": True,
                    "include_clinical_trials": True,
                    "include_market_data": True,
                    "include_web_intel": True
                }
            }
        }


class ChatInitiateResponse(BaseModel):
    """Response schema for chat initiation."""
    job_id: str = Field(..., description="Unique job identifier")
    status: str = Field(..., description="Initial job status")
    message: str = Field(..., description="Status message")
    estimated_duration: Optional[int] = Field(default=30, description="Estimated duration in seconds")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "job_abc123",
                "status": "started",
                "message": "Analysis job created successfully",
                "estimated_duration": 30
            }
        }


class ChatMessageRequest(BaseModel):
    """Request schema for sending a chat message."""
    job_id: str = Field(..., description="Job ID to send message to")
    message: str = Field(..., description="User message")


class ChatMessageResponse(BaseModel):
    """Response schema for chat message."""
    job_id: str
    response: str
    metadata: Optional[Dict[str, Any]] = None
