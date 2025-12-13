"""API v1 Router - aggregates all endpoint routers."""
from fastapi import APIRouter

from app.api.v1.endpoints import chat, jobs, patents, graph, stream, documents, patent_search

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    chat.router,
    prefix="/chat",
    tags=["Chat"]
)

api_router.include_router(
    jobs.router,
    prefix="/jobs",
    tags=["Jobs"]
)

api_router.include_router(
    patents.router,
    prefix="/patents",
    tags=["Patents"]
)

# Direct patent search endpoint (bypasses full research pipeline)
api_router.include_router(
    patent_search.router,
    prefix="/patents/direct",
    tags=["Direct Patent Search"]
)

api_router.include_router(
    graph.router,
    prefix="/graph",
    tags=["Graph"]
)

api_router.include_router(
    stream.router,
    prefix="/stream",
    tags=["Stream"]
)

api_router.include_router(
    documents.router,
    prefix="/documents",
    tags=["Documents"]
)
