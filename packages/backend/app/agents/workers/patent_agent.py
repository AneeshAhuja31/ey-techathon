"""Patent Landscape Worker Agent - IP databases, technology gaps analysis."""
from typing import Dict, Any, List
import asyncio

from app.agents.workers.base_worker import BaseWorker
from app.agents.state import MasterState


class PatentLandscapeWorker(BaseWorker):
    """
    Worker agent for patent landscape analysis.

    Analyzes:
    - Patent databases search
    - IP landscape mapping
    - Technology gaps identification
    - Freedom to operate analysis
    """

    def __init__(self):
        super().__init__("Patent Landscape")

    async def execute(self, state: MasterState) -> Dict[str, Any]:
        """
        Execute patent landscape analysis.

        For MVP, returns mock patent data. In production, would integrate
        with patent databases (USPTO, EPO, WIPO).
        """
        query = state["query"].lower()

        await self.update_progress(15)
        await asyncio.sleep(0.5)

        await self.update_progress(40)
        await asyncio.sleep(0.5)

        # Generate mock patent data based on query
        patents = self._search_patents(query)

        await self.update_progress(75)
        await asyncio.sleep(0.5)

        landscape = self._analyze_landscape(patents)

        await self.update_progress(100)

        return {
            "patents": patents,
            "landscape_analysis": landscape
        }

    def _search_patents(self, query: str) -> List[Dict[str, Any]]:
        """Search for relevant patents (mock implementation)."""

        # GLP-1 related patents (matches spec exactly)
        if "glp-1" in query or "glp1" in query or "semaglutide" in query:
            return [
                {
                    "patent_id": "US10,456,789",
                    "title": "GLP-1 Receptor Agonist Formulation with Extended Release",
                    "abstract": "Novel formulation for semaglutide delivery with improved bioavailability and extended release characteristics for once-weekly dosing.",
                    "assignee": "Novo Nordisk A/S",
                    "filing_date": "2019-03-15",
                    "publication_date": "2020-10-27",
                    "expiration_date": "2039-03-15",
                    "relevance_score": 94,
                    "molecule": "semaglutide",
                    "claims_summary": "Claims cover formulation, delivery device, and dosing regimen"
                },
                {
                    "patent_id": "US1338,734,547",
                    "title": "Modified Peptide Therapeutics for Metabolic Disorders",
                    "abstract": "Novel peptide modifications for improved stability and receptor binding affinity in GLP-1 class molecules.",
                    "assignee": "Eli Lilly and Company",
                    "filing_date": "2020-08-22",
                    "publication_date": "2022-01-15",
                    "expiration_date": "2040-08-22",
                    "relevance_score": 41,
                    "molecule": "tirzepatide",
                    "claims_summary": "Claims cover peptide structure and synthesis methods"
                },
                {
                    "patent_id": "US11,234,567",
                    "title": "Oral GLP-1 Receptor Agonist Compositions",
                    "abstract": "Oral formulation technology enabling absorption of peptide therapeutics through gastrointestinal tract.",
                    "assignee": "Novo Nordisk A/S",
                    "filing_date": "2018-06-10",
                    "publication_date": "2021-03-02",
                    "expiration_date": "2038-06-10",
                    "relevance_score": 78,
                    "molecule": "semaglutide",
                    "claims_summary": "Claims cover absorption enhancer technology and formulation"
                }
            ]

        # Generic patents for other queries
        return [
            {
                "patent_id": "SAMPLE-001",
                "title": "Sample Patent - Provide specific query for relevant results",
                "abstract": "This is a placeholder. Search for specific molecules or therapeutic areas.",
                "assignee": "Example Corp",
                "filing_date": "2023-01-01",
                "relevance_score": 50,
                "claims_summary": "N/A"
            }
        ]

    def _analyze_landscape(self, patents: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze patent landscape."""

        if not patents:
            return {"status": "No patents found for analysis"}

        # Group by assignee
        assignees = {}
        for p in patents:
            assignee = p.get("assignee", "Unknown")
            if assignee not in assignees:
                assignees[assignee] = 0
            assignees[assignee] += 1

        return {
            "total_patents": len(patents),
            "top_assignees": [
                {"name": k, "patent_count": v}
                for k, v in sorted(assignees.items(), key=lambda x: -x[1])[:5]
            ],
            "technology_gaps": [
                "Oral delivery optimization",
                "Combination therapies",
                "Long-acting formulations (monthly+)",
                "Pediatric formulations"
            ],
            "ip_concentration": "High - Top 2 assignees hold majority of key patents",
            "freedom_to_operate": {
                "risk_level": "Medium",
                "key_blockers": ["US10,456,789 - Core formulation patent"],
                "recommendations": [
                    "Consider licensing for formulation technology",
                    "Explore novel delivery mechanisms",
                    "Monitor patent expirations"
                ]
            }
        }
