"""IQVIA Insights Worker Agent - Market data, sales trends, competitor insights."""
from typing import Dict, Any
import asyncio

from app.agents.workers.base_worker import BaseWorker
from app.agents.state import MasterState


class IQVIAInsightsWorker(BaseWorker):
    """
    Worker agent for IQVIA market intelligence.

    Analyzes:
    - Market size and growth trends
    - Sales data and revenue projections
    - Competitor landscape
    - Market share analysis
    """

    def __init__(self):
        super().__init__("IQVIA Insights")

    async def execute(self, state: MasterState) -> Dict[str, Any]:
        """
        Execute market analysis.

        For MVP, returns mock data. In production, would integrate
        with IQVIA APIs or internal data sources.
        """
        query = state["query"].lower()

        # Simulate processing time with progress updates
        await self.update_progress(10)
        await asyncio.sleep(0.5)

        await self.update_progress(30)
        await asyncio.sleep(0.5)

        # Generate mock market insights based on query
        insights = self._generate_insights(query)

        await self.update_progress(70)
        await asyncio.sleep(0.5)

        await self.update_progress(100)

        return insights

    def _generate_insights(self, query: str) -> Dict[str, Any]:
        """Generate mock market insights."""

        # Default GLP-1 insights (matches the spec)
        if "glp-1" in query or "glp1" in query or "semaglutide" in query:
            return {
                "market_overview": {
                    "segment": "GLP-1 Receptor Agonists",
                    "market_size_2024": "$25.4 billion",
                    "cagr": "15.2%",
                    "projected_2030": "$62.8 billion"
                },
                "top_products": [
                    {
                        "name": "Ozempic",
                        "manufacturer": "Novo Nordisk",
                        "revenue_2024": "$14.2 billion",
                        "market_share": "55.9%",
                        "indication": "Type 2 Diabetes"
                    },
                    {
                        "name": "Wegovy",
                        "manufacturer": "Novo Nordisk",
                        "revenue_2024": "$4.5 billion",
                        "market_share": "17.7%",
                        "indication": "Obesity"
                    },
                    {
                        "name": "Mounjaro",
                        "manufacturer": "Eli Lilly",
                        "revenue_2024": "$5.2 billion",
                        "market_share": "20.5%",
                        "indication": "Type 2 Diabetes, Obesity"
                    }
                ],
                "trends": [
                    "Increasing demand for obesity treatments",
                    "Supply constraints driving market dynamics",
                    "Expanding indications (cardiovascular, NASH)",
                    "Oral formulations gaining traction"
                ],
                "competitive_landscape": {
                    "market_leaders": ["Novo Nordisk", "Eli Lilly"],
                    "emerging_players": ["Pfizer", "Amgen", "AstraZeneca"],
                    "pipeline_activity": "High - 15+ candidates in Phase 2/3"
                }
            }

        # Metformin/diabetes insights
        if "metformin" in query or "diabetes" in query:
            return {
                "market_overview": {
                    "segment": "Diabetes Therapeutics",
                    "market_size_2024": "$72.3 billion",
                    "cagr": "8.4%",
                    "projected_2030": "$118.5 billion"
                },
                "top_products": [
                    {
                        "name": "Glucophage (Metformin)",
                        "manufacturer": "Multiple (Generic)",
                        "revenue_2024": "$3.2 billion",
                        "market_share": "4.4%",
                        "indication": "Type 2 Diabetes (First-line)"
                    },
                    {
                        "name": "Jardiance",
                        "manufacturer": "Boehringer Ingelheim / Eli Lilly",
                        "revenue_2024": "$7.4 billion",
                        "market_share": "10.2%",
                        "indication": "Type 2 Diabetes, Heart Failure"
                    },
                    {
                        "name": "Trulicity",
                        "manufacturer": "Eli Lilly",
                        "revenue_2024": "$6.5 billion",
                        "market_share": "9.0%",
                        "indication": "Type 2 Diabetes"
                    },
                    {
                        "name": "Ozempic",
                        "manufacturer": "Novo Nordisk",
                        "revenue_2024": "$14.2 billion",
                        "market_share": "19.6%",
                        "indication": "Type 2 Diabetes"
                    }
                ],
                "trends": [
                    "GLP-1 agonists gaining market share from traditional therapies",
                    "Metformin remains first-line despite newer agents",
                    "Combination therapies increasing adoption",
                    "Focus on cardiovascular and renal outcomes"
                ],
                "competitive_landscape": {
                    "market_leaders": ["Novo Nordisk", "Eli Lilly", "Boehringer Ingelheim"],
                    "emerging_players": ["Pfizer", "AstraZeneca"],
                    "pipeline_activity": "Moderate - Focus on combinations and new mechanisms"
                }
            }

        # Generic insights for other queries
        return {
            "market_overview": {
                "segment": "Pharmaceutical Market Analysis",
                "market_size_2024": "$1.48 trillion (Global)",
                "cagr": "6.2%",
                "projected_2030": "$2.13 trillion"
            },
            "top_products": [],
            "trends": [
                "Personalized medicine growth",
                "Biologics market expansion",
                "Digital health integration"
            ],
            "competitive_landscape": {
                "market_leaders": ["Pfizer", "Roche", "Johnson & Johnson", "Novartis"],
                "note": "Specify therapeutic area for detailed competitor analysis"
            }
        }
