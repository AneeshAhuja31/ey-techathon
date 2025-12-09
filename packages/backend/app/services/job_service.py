"""Job management service."""
from typing import Optional, Dict, Any, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.job import Job, WorkerStatus
from app.agents.master_agent import get_master_agent


class JobService:
    """Service for managing analysis jobs."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.master_agent = get_master_agent()

    async def create_job(
        self,
        query: str,
        user_id: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create and start a new analysis job.

        Args:
            query: Research query
            user_id: Optional user ID
            options: Analysis options

        Returns:
            Job creation response
        """
        # Start the job with the master agent
        job_id = await self.master_agent.start_job(
            query=query,
            user_id=user_id,
            options=options
        )

        # Create database record
        job = Job(
            id=job_id,
            user_id=user_id,
            query=query,
            status="processing",
            progress=0
        )

        # Create worker status records
        worker_names = ["IQVIA Insights", "Patent Landscape", "Clinical Trials", "Web Intelligence", "Report Generator"]
        for name in worker_names:
            worker = WorkerStatus(
                job_id=job_id,
                name=name,
                status="pending",
                progress=0
            )
            self.db.add(worker)

        self.db.add(job)
        await self.db.commit()

        return {
            "job_id": job_id,
            "status": "started",
            "message": "Analysis job created successfully",
            "estimated_duration": 30
        }

    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get current job status.

        Combines database record with live agent status.
        """
        # Get live status from master agent
        agent_status = self.master_agent.get_job_status(job_id)

        if agent_status:
            # Update database with latest status
            await self._sync_job_status(job_id, agent_status)
            return agent_status

        # Fallback to database
        result = await self.db.execute(
            select(Job).where(Job.id == job_id)
        )
        job = result.scalar_one_or_none()

        if not job:
            return None

        return {
            "job_id": job.id,
            "query": job.query,
            "status": job.status,
            "progress": job.progress,
            "workers": [w.to_dict() for w in job.workers],
            "result": job.result,
            "error": job.error,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "updated_at": job.updated_at.isoformat() if job.updated_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None
        }

    async def _sync_job_status(self, job_id: str, agent_status: Dict[str, Any]):
        """Sync agent status to database."""
        try:
            result = await self.db.execute(
                select(Job).where(Job.id == job_id)
            )
            job = result.scalar_one_or_none()

            if job:
                job.status = agent_status.get("status", job.status)
                job.progress = agent_status.get("progress", job.progress)
                job.updated_at = datetime.utcnow()

                if agent_status.get("status") == "completed":
                    job.completed_at = datetime.utcnow()
                    job.result = {
                        "mind_map_data": agent_status.get("mind_map_data"),
                        "summary": agent_status.get("final_report")
                    }

                if agent_status.get("error"):
                    job.error = agent_status.get("error")

                # Update worker statuses
                for worker_data in agent_status.get("workers", []):
                    for worker in job.workers:
                        if worker.name == worker_data.get("name"):
                            worker.status = worker_data.get("status", worker.status)
                            worker.progress = worker_data.get("progress", worker.progress)
                            if worker_data.get("status") == "completed":
                                worker.completed_at = datetime.utcnow()

                await self.db.commit()
        except Exception:
            # Don't fail if sync fails
            pass

    async def get_job_result(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get the final result of a completed job."""
        return self.master_agent.get_job_result(job_id)

    async def list_jobs(
        self,
        user_id: Optional[str] = None,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """List jobs, optionally filtered by user."""
        query = select(Job).order_by(Job.created_at.desc())

        if user_id:
            query = query.where(Job.user_id == user_id)

        query = query.limit(limit).offset(offset)
        result = await self.db.execute(query)
        jobs = result.scalars().all()

        return [job.to_dict() for job in jobs]

    async def cancel_job(self, job_id: str) -> bool:
        """Cancel a running job."""
        success = self.master_agent.cancel_job(job_id)

        if success:
            result = await self.db.execute(
                select(Job).where(Job.id == job_id)
            )
            job = result.scalar_one_or_none()
            if job:
                job.status = "cancelled"
                job.updated_at = datetime.utcnow()
                await self.db.commit()

        return success
