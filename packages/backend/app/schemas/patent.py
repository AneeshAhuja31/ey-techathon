"""Patent schemas."""
from typing import Optional, List
from pydantic import BaseModel, Field


class PatentResponse(BaseModel):
    """Response schema for a single patent."""
    id: str = Field(..., description="Internal ID")
    patent_id: str = Field(..., description="Patent number (e.g., US10,456,789)")
    title: str = Field(..., description="Patent title")
    abstract: Optional[str] = Field(default=None, description="Patent abstract")
    assignee: Optional[str] = Field(default=None, description="Patent assignee/owner")
    filing_date: Optional[str] = Field(default=None, description="Filing date")
    publication_date: Optional[str] = Field(default=None, description="Publication date")
    expiration_date: Optional[str] = Field(default=None, description="Expiration date")
    relevance_score: float = Field(..., ge=0, le=100, description="Relevance score 0-100")
    molecule: Optional[str] = Field(default=None, description="Related molecule")
    claims: Optional[str] = Field(default=None, description="Patent claims summary")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "pat_123",
                "patent_id": "US10,456,789",
                "title": "GLP-1 Receptor Agonist Formulation with Extended Release",
                "abstract": "Novel formulation for semaglutide delivery...",
                "assignee": "Novo Nordisk A/S",
                "filing_date": "2019-03-15",
                "publication_date": "2020-06-20",
                "expiration_date": "2039-03-15",
                "relevance_score": 94,
                "molecule": "semaglutide",
                "claims": "1. A pharmaceutical composition comprising..."
            }
        }


class PatentSearchResponse(BaseModel):
    """Response schema for patent search."""
    patents: List[PatentResponse] = Field(default=[], description="List of matching patents")
    total: int = Field(..., description="Total number of results")
    query: str = Field(..., description="Search query used")
    molecule: Optional[str] = Field(default=None, description="Molecule filter if applied")

    class Config:
        json_schema_extra = {
            "example": {
                "patents": [
                    {
                        "id": "pat_123",
                        "patent_id": "US10,456,789",
                        "title": "GLP-1 Receptor Agonist Formulation",
                        "relevance_score": 94,
                        "assignee": "Novo Nordisk A/S"
                    }
                ],
                "total": 1,
                "query": "GLP-1",
                "molecule": "semaglutide"
            }
        }


class PatentActionRequest(BaseModel):
    """Request for patent actions (FTO, Prior Art, etc.)."""
    patent_id: str = Field(..., description="Patent ID to analyze")
    action: str = Field(..., description="Action: extract_claims, fto_analysis, prior_art_search")


class PatentActionResponse(BaseModel):
    """Response for patent action."""
    patent_id: str
    action: str
    result: dict
    status: str
