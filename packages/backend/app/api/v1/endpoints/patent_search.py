"""Direct patent search endpoint - bypasses full research pipeline."""
import logging
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field

from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class PatentResult(BaseModel):
    """Individual patent result."""
    patent_id: str = Field(..., description="Patent identifier")
    title: str = Field(..., description="Patent title")
    abstract: str = Field(default="", description="Patent abstract/snippet")
    assignee: str = Field(default="Unknown", description="Patent assignee/owner")
    inventor: Optional[str] = Field(default=None, description="Inventor name(s)")
    filing_date: Optional[str] = Field(default=None, description="Filing date")
    publication_date: Optional[str] = Field(default=None, description="Publication date")
    grant_date: Optional[str] = Field(default=None, description="Grant date")
    pdf_link: Optional[str] = Field(default=None, description="Link to PDF")
    google_patents_link: Optional[str] = Field(default=None, description="Google Patents URL")
    relevance_score: Optional[int] = Field(default=None, description="Relevance score 0-100")


class DirectPatentSearchResponse(BaseModel):
    """Response for direct patent search."""
    patents: List[PatentResult] = Field(default_factory=list, description="List of patent results")
    total: int = Field(default=0, description="Total results returned")
    query: str = Field(..., description="Original search query")
    source: str = Field(default="mock", description="Data source: google_patents or mock")


class SpecificPatentResponse(BaseModel):
    """Response for specific patent lookup."""
    patent: Optional[PatentResult] = Field(default=None, description="Patent details")
    found: bool = Field(default=False, description="Whether patent was found")
    source: str = Field(default="mock", description="Data source")


@router.get("/search", response_model=DirectPatentSearchResponse)
async def direct_patent_search(
    q: str = Query(..., min_length=2, description="Patent search query"),
    assignee: Optional[str] = Query(None, description="Filter by assignee/company"),
    inventor: Optional[str] = Query(None, description="Filter by inventor"),
    before: Optional[str] = Query(None, description="Filed before date (YYYYMMDD)"),
    after: Optional[str] = Query(None, description="Filed after date (YYYYMMDD)"),
    status: Optional[str] = Query(None, description="GRANT or APPLICATION"),
    country: Optional[str] = Query(None, description="Country code filter (US, EP, WO, CN)"),
    limit: int = Query(10, ge=1, le=50, description="Max results to return")
):
    """
    Direct patent search using SerpAPI Google Patents.

    Returns patent results directly without triggering the full research pipeline.
    Ideal for quick patent lookups when user asks "show me patents about X".

    Supports filtering by:
    - assignee: Company/organization name
    - inventor: Inventor name
    - before/after: Date range (filing date)
    - status: GRANT or APPLICATION
    - country: Country code (US, EP, WO, CN)
    """
    if not settings.serpapi_key:
        logger.info("No SerpAPI key, returning mock patent data")
        mock_patents = _get_mock_patents(q)
        return DirectPatentSearchResponse(
            patents=mock_patents[:limit],
            total=len(mock_patents),
            query=q,
            source="mock"
        )

    try:
        from serpapi import GoogleSearch

        params = {
            "engine": "google_patents",
            "q": q,
            "api_key": settings.serpapi_key,
            "num": limit,
        }

        # Add optional filters
        if assignee:
            params["assignee"] = assignee
        if inventor:
            params["inventor"] = inventor
        if before:
            params["before"] = f"filing:{before}"
        if after:
            params["after"] = f"filing:{after}"
        if status:
            params["status"] = status.upper()
        if country:
            params["country"] = country.upper()

        search = GoogleSearch(params)
        results = search.get_dict()

        patents = []
        for idx, result in enumerate(results.get("organic_results", [])):
            patents.append(PatentResult(
                patent_id=result.get("patent_id", ""),
                title=result.get("title", "Untitled"),
                abstract=result.get("snippet", ""),
                assignee=result.get("assignee", "Unknown"),
                inventor=result.get("inventor"),
                filing_date=result.get("filing_date"),
                publication_date=result.get("publication_date"),
                grant_date=result.get("grant_date"),
                pdf_link=result.get("pdf"),
                google_patents_link=result.get("link"),
                relevance_score=100 - (idx * 5)  # Simple relevance based on position
            ))

        logger.info(f"Direct patent search for '{q}' returned {len(patents)} results")

        return DirectPatentSearchResponse(
            patents=patents,
            total=len(patents),
            query=q,
            source="google_patents"
        )

    except Exception as e:
        logger.error(f"Direct patent search error: {e}")
        # Fallback to mock data on error
        mock_patents = _get_mock_patents(q)
        return DirectPatentSearchResponse(
            patents=mock_patents[:limit],
            total=len(mock_patents),
            query=q,
            source="mock"
        )


@router.get("/lookup/{patent_id}", response_model=SpecificPatentResponse)
async def lookup_specific_patent(patent_id: str):
    """
    Look up a specific patent by ID (e.g., US10456789, EP1234567, WO2020123456).

    Returns detailed patent information for the specific patent number.
    """
    if not settings.serpapi_key:
        logger.info(f"No SerpAPI key, cannot lookup specific patent {patent_id}")
        return SpecificPatentResponse(
            patent=None,
            found=False,
            source="mock"
        )

    try:
        from serpapi import GoogleSearch

        # Search for specific patent ID
        params = {
            "engine": "google_patents",
            "q": patent_id,
            "api_key": settings.serpapi_key,
            "num": 1,
        }

        search = GoogleSearch(params)
        results = search.get_dict()

        organic = results.get("organic_results", [])
        if organic:
            result = organic[0]
            patent = PatentResult(
                patent_id=result.get("patent_id", patent_id),
                title=result.get("title", ""),
                abstract=result.get("snippet", ""),
                assignee=result.get("assignee", "Unknown"),
                inventor=result.get("inventor"),
                filing_date=result.get("filing_date"),
                publication_date=result.get("publication_date"),
                grant_date=result.get("grant_date"),
                pdf_link=result.get("pdf"),
                google_patents_link=result.get("link"),
                relevance_score=100
            )

            logger.info(f"Found patent {patent_id}: {patent.title}")

            return SpecificPatentResponse(
                patent=patent,
                found=True,
                source="google_patents"
            )

        logger.info(f"Patent {patent_id} not found")
        return SpecificPatentResponse(
            patent=None,
            found=False,
            source="google_patents"
        )

    except Exception as e:
        logger.error(f"Patent lookup error for {patent_id}: {e}")
        return SpecificPatentResponse(
            patent=None,
            found=False,
            source="error"
        )


def _get_mock_patents(query: str) -> List[PatentResult]:
    """Return mock patents for testing without API key."""
    query_lower = query.lower()

    # GLP-1 / Semaglutide related patents
    if any(term in query_lower for term in ["glp-1", "glp1", "semaglutide", "wegovy", "ozempic"]):
        return [
            PatentResult(
                patent_id="US10456789",
                title="GLP-1 Receptor Agonist Formulation with Extended Release",
                abstract="Novel formulation for semaglutide delivery with improved bioavailability and extended release profile for once-weekly administration.",
                assignee="Novo Nordisk A/S",
                inventor="Lars Christiansen",
                filing_date="2019-03-15",
                publication_date="2020-06-20",
                relevance_score=95
            ),
            PatentResult(
                patent_id="US11234567",
                title="Oral GLP-1 Receptor Agonist Compositions",
                abstract="Oral formulation technology enabling peptide therapeutics absorption through gastrointestinal tract using SNAC enhancer.",
                assignee="Novo Nordisk A/S",
                inventor="Michael Hansen",
                filing_date="2018-06-10",
                publication_date="2019-12-15",
                relevance_score=88
            ),
            PatentResult(
                patent_id="EP3456789",
                title="Semaglutide Analogues for Weight Management",
                abstract="Novel semaglutide analogues with enhanced selectivity for GLP-1 receptors in hypothalamus for improved weight loss efficacy.",
                assignee="Novo Nordisk A/S",
                filing_date="2020-01-20",
                publication_date="2021-07-25",
                relevance_score=82
            ),
            PatentResult(
                patent_id="WO2021123456",
                title="Combination Therapy with GLP-1 and GIP Agonists",
                abstract="Dual agonist formulations combining GLP-1 and GIP receptor activation for synergistic metabolic effects.",
                assignee="Eli Lilly and Company",
                inventor="John Smith",
                filing_date="2020-09-01",
                relevance_score=78
            ),
        ]

    # Tirzepatide / Mounjaro related
    if any(term in query_lower for term in ["tirzepatide", "mounjaro", "gip"]):
        return [
            PatentResult(
                patent_id="US10789012",
                title="Dual GIP and GLP-1 Receptor Agonist Compounds",
                abstract="Novel dual incretin mimetic compounds with balanced GIP and GLP-1 receptor activity for diabetes and obesity treatment.",
                assignee="Eli Lilly and Company",
                inventor="David Johnson",
                filing_date="2018-11-15",
                relevance_score=94
            ),
            PatentResult(
                patent_id="US11345678",
                title="Methods for Treatment of Type 2 Diabetes with Dual Agonists",
                abstract="Treatment methods using tirzepatide for glycemic control and weight management in type 2 diabetes patients.",
                assignee="Eli Lilly and Company",
                filing_date="2019-05-20",
                relevance_score=85
            ),
        ]

    # Default/generic pharmaceutical patents
    return [
        PatentResult(
            patent_id="US10111213",
            title=f"Pharmaceutical Composition Related to {query[:30]}",
            abstract=f"Novel pharmaceutical formulation and methods related to {query}.",
            assignee="Generic Pharma Inc.",
            filing_date="2020-01-01",
            relevance_score=70
        ),
        PatentResult(
            patent_id="US10222324",
            title=f"Method of Treatment Using {query[:25]} Compounds",
            abstract=f"Therapeutic methods and compositions for treating conditions related to {query}.",
            assignee="Research Labs LLC",
            filing_date="2019-06-15",
            relevance_score=65
        ),
    ]
