"""Patent search service."""
from typing import Optional, List, Dict, Any


class PatentService:
    """Service for patent search and analysis."""

    # Mock patent database
    MOCK_PATENTS = [
        {
            "id": "pat_001",
            "patent_id": "US10,456,789",
            "title": "GLP-1 Receptor Agonist Formulation with Extended Release",
            "abstract": "Novel formulation for semaglutide delivery with improved bioavailability and extended release characteristics for once-weekly dosing. The composition includes stabilizing agents and absorption enhancers.",
            "assignee": "Novo Nordisk A/S",
            "filing_date": "2019-03-15",
            "publication_date": "2020-10-27",
            "expiration_date": "2039-03-15",
            "relevance_score": 94,
            "molecule": "semaglutide",
            "claims": "1. A pharmaceutical composition comprising semaglutide...\n2. The composition of claim 1, further comprising..."
        },
        {
            "id": "pat_002",
            "patent_id": "US1338,734,547",
            "title": "Modified Peptide Therapeutics for Metabolic Disorders",
            "abstract": "Novel peptide modifications for improved stability and receptor binding affinity in GLP-1 class molecules. Covers dual GIP/GLP-1 receptor agonist designs.",
            "assignee": "Eli Lilly and Company",
            "filing_date": "2020-08-22",
            "publication_date": "2022-01-15",
            "expiration_date": "2040-08-22",
            "relevance_score": 41,
            "molecule": "tirzepatide",
            "claims": "1. A modified peptide compound comprising...\n2. A method of treating Type 2 diabetes..."
        },
        {
            "id": "pat_003",
            "patent_id": "US11,234,567",
            "title": "Oral GLP-1 Receptor Agonist Compositions",
            "abstract": "Oral formulation technology enabling absorption of peptide therapeutics through gastrointestinal tract using SNAC absorption enhancer.",
            "assignee": "Novo Nordisk A/S",
            "filing_date": "2018-06-10",
            "publication_date": "2021-03-02",
            "expiration_date": "2038-06-10",
            "relevance_score": 78,
            "molecule": "semaglutide",
            "claims": "1. An oral pharmaceutical composition comprising a GLP-1 agonist...\n2. The composition of claim 1 wherein the absorption enhancer is SNAC..."
        },
        {
            "id": "pat_004",
            "patent_id": "US10,987,654",
            "title": "Device for Subcutaneous Delivery of Peptide Drugs",
            "abstract": "Auto-injector device design for weekly self-administration of GLP-1 receptor agonists with dose-counting mechanism.",
            "assignee": "Novo Nordisk A/S",
            "filing_date": "2017-11-20",
            "publication_date": "2020-05-15",
            "expiration_date": "2037-11-20",
            "relevance_score": 65,
            "molecule": "semaglutide",
            "claims": "1. An auto-injection device comprising...\n2. The device of claim 1 further comprising a dose counter..."
        },
        {
            "id": "pat_005",
            "patent_id": "US11,456,789",
            "title": "Combination Therapy for Obesity Treatment",
            "abstract": "Combination of GLP-1 receptor agonist with appetite suppressant for enhanced weight loss outcomes.",
            "assignee": "Pfizer Inc.",
            "filing_date": "2021-04-15",
            "publication_date": "2023-02-28",
            "expiration_date": "2041-04-15",
            "relevance_score": 55,
            "molecule": "semaglutide",
            "claims": "1. A combination therapy comprising...\n2. A method of treating obesity..."
        }
    ]

    def search_patents(
        self,
        molecule: Optional[str] = None,
        query: Optional[str] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Search patents by molecule or keyword.

        Args:
            molecule: Filter by molecule name
            query: Search query string
            limit: Maximum results to return

        Returns:
            Patent search results
        """
        results = []

        for patent in self.MOCK_PATENTS:
            # Filter by molecule
            if molecule:
                if molecule.lower() not in patent.get("molecule", "").lower():
                    continue

            # Filter by query
            if query:
                query_lower = query.lower()
                searchable = f"{patent['title']} {patent['abstract']} {patent.get('molecule', '')}".lower()
                if query_lower not in searchable:
                    # Check for related terms
                    if "glp-1" in query_lower or "glp1" in query_lower:
                        if "glp-1" not in searchable and "glp1" not in searchable and "semaglutide" not in searchable:
                            continue
                    else:
                        continue

            results.append(patent)

        # Sort by relevance score
        results.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)

        # Apply limit
        results = results[:limit]

        return {
            "patents": results,
            "total": len(results),
            "query": query or "",
            "molecule": molecule
        }

    def get_patent(self, patent_id: str) -> Optional[Dict[str, Any]]:
        """Get a single patent by ID."""
        for patent in self.MOCK_PATENTS:
            if patent["patent_id"] == patent_id or patent["id"] == patent_id:
                return patent
        return None

    def analyze_patent(self, patent_id: str, action: str) -> Dict[str, Any]:
        """
        Perform analysis action on a patent.

        Actions:
        - extract_claims: Extract and summarize claims
        - fto_analysis: Freedom to operate analysis
        - prior_art_search: Search for prior art
        """
        patent = self.get_patent(patent_id)

        if not patent:
            return {"error": "Patent not found", "patent_id": patent_id}

        if action == "extract_claims":
            return {
                "patent_id": patent_id,
                "action": action,
                "result": {
                    "claims_text": patent.get("claims", "No claims available"),
                    "claim_count": 2,
                    "independent_claims": 1,
                    "dependent_claims": 1,
                    "summary": f"Patent covers {patent.get('molecule', 'compound')} formulation and delivery"
                },
                "status": "completed"
            }

        elif action == "fto_analysis":
            return {
                "patent_id": patent_id,
                "action": action,
                "result": {
                    "risk_level": "Medium" if patent.get("relevance_score", 0) > 70 else "Low",
                    "blocking_claims": ["Claim 1 - Core formulation"] if patent.get("relevance_score", 0) > 70 else [],
                    "expiration": patent.get("expiration_date"),
                    "recommendation": "Consider licensing or design-around options" if patent.get("relevance_score", 0) > 70 else "Low risk, proceed with caution"
                },
                "status": "completed"
            }

        elif action == "prior_art_search":
            return {
                "patent_id": patent_id,
                "action": action,
                "result": {
                    "prior_art_found": 3,
                    "references": [
                        {"id": "PA001", "title": "Earlier formulation study", "relevance": 45},
                        {"id": "PA002", "title": "Related peptide research", "relevance": 38},
                        {"id": "PA003", "title": "Delivery mechanism prior art", "relevance": 32}
                    ],
                    "validity_assessment": "Patent claims appear novel over identified prior art"
                },
                "status": "completed"
            }

        return {"error": f"Unknown action: {action}", "patent_id": patent_id}
