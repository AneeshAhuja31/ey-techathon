"""Chat request/response schemas."""
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ChatOptions(BaseModel):
    """Options for chat initiation."""
    include_patents: bool = Field(default=True, description="Include patent search")
    include_clinical_trials: bool = Field(default=True, description="Include clinical trials data")
    include_market_data: bool = Field(default=True, description="Include market/IQVIA data")
    include_web_intel: bool = Field(default=True, description="Include web intelligence")
    include_literature: bool = Field(default=True, description="Include scientific literature")
    include_company_data: bool = Field(default=False, description="Include company documents (RAG)")
    company_data_only: bool = Field(default=False, description="Only run company RAG worker (no other research)")


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


class SimpleChatRequest(BaseModel):
    """Request schema for simple chat (non-research questions)."""
    message: str = Field(..., min_length=1, description="User message")
    conversation_history: Optional[list] = Field(default=None, description="Previous messages for context")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "What is GLP-1?",
                "conversation_history": []
            }
        }


class SimpleChatResponse(BaseModel):
    """Response schema for simple chat with explicit intent detection."""
    response: str = Field(..., description="AI response")
    is_research_query: bool = Field(default=False, description="Whether this should trigger a full research pipeline")
    is_patent_query: bool = Field(default=False, description="Whether this is a direct patent search request")
    patent_id: Optional[str] = Field(default=None, description="Specific patent ID if requested")
    is_company_query: bool = Field(default=False, description="Whether this is a company-specific query")
    requires_documents: bool = Field(default=False, description="Whether user needs to upload documents first")
    company_data_only: bool = Field(default=False, description="If true, only run company RAG worker (no full research)")

    class Config:
        json_schema_extra = {
            "example": {
                "response": "GLP-1 (Glucagon-like peptide-1) is a hormone...",
                "is_research_query": False,
                "is_patent_query": False,
                "patent_id": None,
                "is_company_query": False,
                "requires_documents": False
            }
        }
