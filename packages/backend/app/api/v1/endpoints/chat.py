"""Chat initiation endpoint."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.chat import ChatInitiateRequest, ChatInitiateResponse
from app.services.job_service import JobService

router = APIRouter()


@router.post("/initiate", response_model=ChatInitiateResponse)
async def initiate_chat(
    request: ChatInitiateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate a new drug discovery analysis job.

    This endpoint creates a new analysis job and starts the Master Agent
    to orchestrate the worker agents for comprehensive drug research.

    - **query**: The research query (e.g., "Research GLP-1 agonists")
    - **user_id**: Optional user identifier for tracking
    - **options**: Analysis options (which workers to include)

    Returns:
    - **job_id**: Unique identifier to poll for status
    - **status**: Initial status ("started")
    - **estimated_duration**: Estimated completion time in seconds
    """
    try:
        job_service = JobService(db)

        # Extract options if provided
        options = None
        if request.options:
            options = {
                "include_patents": request.options.include_patents,
                "include_clinical_trials": request.options.include_clinical_trials,
                "include_market_data": request.options.include_market_data,
                "include_web_intel": request.options.include_web_intel
            }

        result = await job_service.create_job(
            query=request.query,
            user_id=request.user_id,
            options=options
        )

        return ChatInitiateResponse(
            job_id=result["job_id"],
            status=result["status"],
            message=result["message"],
            estimated_duration=result.get("estimated_duration", 30)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create analysis job: {str(e)}"
        )


@router.post("/message")
async def send_message(
    job_id: str,
    message: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Send a follow-up message to an existing job.

    This allows for interactive refinement of the analysis.
    """
    # For MVP, return a placeholder response
    # In production, this would feed into the agent conversation
    return {
        "job_id": job_id,
        "response": f"Received message: {message}. Follow-up queries will be supported in future versions.",
        "status": "acknowledged"
    }
