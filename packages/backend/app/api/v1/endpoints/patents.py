"""Patent search endpoints."""
from typing import Optional
from fastapi import APIRouter, Query, HTTPException

from app.schemas.patent import PatentSearchResponse, PatentResponse, PatentActionRequest, PatentActionResponse
from app.services.patent_service import PatentService

router = APIRouter()
patent_service = PatentService()


@router.get("/search", response_model=PatentSearchResponse)
async def search_patents(
    molecule: Optional[str] = Query(None, description="Filter by molecule name (e.g., semaglutide)"),
    q: Optional[str] = Query(None, description="Search query"),
    limit: int = Query(10, ge=1, le=50, description="Maximum results")
):
    """
    Search pharmaceutical patents.

    Search by molecule name or keyword query to find relevant patents.

    Examples:
    - `/patents/search?molecule=semaglutide` - Find all semaglutide patents
    - `/patents/search?q=GLP-1` - Search for GLP-1 related patents
    """
    result = patent_service.search_patents(
        molecule=molecule,
        query=q,
        limit=limit
    )

    return PatentSearchResponse(
        patents=[PatentResponse(**p) for p in result["patents"]],
        total=result["total"],
        query=result.get("query", ""),
        molecule=result.get("molecule")
    )


@router.get("/{patent_id}", response_model=PatentResponse)
async def get_patent(patent_id: str):
    """
    Get detailed information for a specific patent.

    Returns full patent details including abstract, claims, and dates.
    """
    patent = patent_service.get_patent(patent_id)

    if not patent:
        raise HTTPException(
            status_code=404,
            detail=f"Patent not found: {patent_id}"
        )

    return PatentResponse(**patent)


@router.post("/{patent_id}/analyze", response_model=PatentActionResponse)
async def analyze_patent(
    patent_id: str,
    action: str = Query(..., description="Action: extract_claims, fto_analysis, prior_art_search")
):
    """
    Perform analysis action on a patent.

    Available actions:
    - **extract_claims**: Extract and summarize patent claims
    - **fto_analysis**: Freedom to operate analysis
    - **prior_art_search**: Search for prior art references
    """
    valid_actions = ["extract_claims", "fto_analysis", "prior_art_search"]

    if action not in valid_actions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action. Must be one of: {', '.join(valid_actions)}"
        )

    result = patent_service.analyze_patent(patent_id, action)

    if "error" in result and result["error"] == "Patent not found":
        raise HTTPException(
            status_code=404,
            detail=f"Patent not found: {patent_id}"
        )

    return PatentActionResponse(
        patent_id=result["patent_id"],
        action=result["action"],
        result=result["result"],
        status=result["status"]
    )


@router.get("")
async def list_recommended_patents(
    context: Optional[str] = Query("GLP-1", description="Research context"),
    limit: int = Query(5, ge=1, le=20)
):
    """
    Get recommended patents based on context.

    Returns a curated list of highly relevant patents for the given context.
    Ideal for the Patent Chat screen feed.
    """
    result = patent_service.search_patents(query=context, limit=limit)

    # Add recommendation metadata
    patents = []
    for p in result["patents"]:
        patent = PatentResponse(**p)
        patents.append({
            **patent.model_dump(),
            "recommended": True,
            "recommendation_reason": f"High relevance to {context} research"
        })

    return {
        "patents": patents,
        "context": context,
        "total": len(patents)
    }
