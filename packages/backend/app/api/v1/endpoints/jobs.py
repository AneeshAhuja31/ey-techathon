"""Job status endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.schemas.job import JobStatusResponse, WorkerStatusResponse, JobResult
from app.services.job_service import JobService

router = APIRouter()


@router.get("/{job_id}/status", response_model=JobStatusResponse)
async def get_job_status(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current status of an analysis job.

    This is the polling endpoint for tracking job progress.
    Call this endpoint every 2 seconds to get live updates.

    Returns:
    - **job_id**: The job identifier
    - **status**: Current status (pending, processing, completed, failed)
    - **progress**: Overall progress percentage (0-100)
    - **workers**: Individual worker agent statuses
    - **result**: Final result (only when completed)
    - **error**: Error message (only when failed)
    """
    job_service = JobService(db)
    status = await job_service.get_job_status(job_id)

    if not status:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}"
        )

    # Convert worker statuses
    workers = []
    for w in status.get("workers", []):
        workers.append(WorkerStatusResponse(
            name=w.get("name", "Unknown"),
            status=w.get("status", "unknown"),
            progress=w.get("progress", 0),
            started_at=w.get("started_at"),
            completed_at=w.get("completed_at"),
            error=w.get("error")
        ))

    # Build result if completed
    result = None
    if status.get("status") == "completed":
        result = JobResult(
            summary=status.get("final_report"),
            mind_map_data=status.get("mind_map_data")
        )

    return JobStatusResponse(
        job_id=status.get("job_id", job_id),
        query=status.get("query", ""),
        status=status.get("status", "unknown"),
        progress=status.get("progress", 0),
        workers=workers,
        result=result,
        error=status.get("error"),
        created_at=status.get("created_at"),
        updated_at=status.get("updated_at"),
        completed_at=status.get("completed_at")
    )


@router.get("/{job_id}/result")
async def get_job_result(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get the final result of a completed job.

    Returns the full analysis result including:
    - Executive summary
    - Mind map data
    - Worker-specific results (market, patents, clinical, web intel)
    """
    job_service = JobService(db)
    result = await job_service.get_job_result(job_id)

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found: {job_id}"
        )

    if result.get("status") != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job not yet completed. Current status: {result.get('status')}"
        )

    return result


@router.get("")
async def list_jobs(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    limit: int = Query(10, ge=1, le=100, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Pagination offset"),
    db: AsyncSession = Depends(get_db)
):
    """
    List analysis jobs.

    Optionally filter by user ID for multi-tenant scenarios.
    """
    job_service = JobService(db)
    jobs = await job_service.list_jobs(
        user_id=user_id,
        limit=limit,
        offset=offset
    )

    return {
        "jobs": jobs,
        "total": len(jobs),
        "limit": limit,
        "offset": offset
    }


@router.delete("/{job_id}")
async def cancel_job(
    job_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel a running job.

    This will stop the job execution and mark it as cancelled.
    """
    job_service = JobService(db)
    success = await job_service.cancel_job(job_id)

    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Job not found or already completed: {job_id}"
        )

    return {
        "job_id": job_id,
        "status": "cancelled",
        "message": "Job cancelled successfully"
    }
