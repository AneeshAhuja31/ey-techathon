"""Web Intelligence Worker Agent - Real-time news and external developments."""
from typing import Dict, Any, List
import asyncio
from datetime import datetime, timedelta

from app.agents.workers.base_worker import BaseWorker
from app.agents.state import MasterState


class WebIntelligenceWorker(BaseWorker):
    """
    Worker agent for web intelligence and news monitoring.

    Analyzes:
    - Real-time news and press releases
    - Regulatory updates
    - Conference presentations
    - Social media sentiment
    """

    def __init__(self):
        super().__init__("Web Intelligence")

    async def execute(self, state: MasterState) -> Dict[str, Any]:
        """
        Execute web intelligence gathering.

        For MVP, returns mock news data. In production, would integrate
        with news APIs, RSS feeds, and social media monitoring.
        """
        query = state["query"].lower()

        await self.update_progress(25)
        await asyncio.sleep(0.5)

        news = self._gather_news(query)

        await self.update_progress(60)
        await asyncio.sleep(0.3)

        regulatory = self._get_regulatory_updates(query)

        await self.update_progress(85)
        await asyncio.sleep(0.3)

        sentiment = self._analyze_sentiment(query)

        await self.update_progress(100)

        return {
            "news": news,
            "regulatory_updates": regulatory,
            "sentiment_analysis": sentiment
        }

    def _gather_news(self, query: str) -> List[Dict[str, Any]]:
        """Gather relevant news articles (mock implementation)."""

        today = datetime.utcnow()

        if "glp-1" in query or "glp1" in query or "semaglutide" in query or "obesity" in query:
            return [
                {
                    "title": "Novo Nordisk Reports Record Demand for Wegovy",
                    "source": "Reuters",
                    "date": (today - timedelta(days=2)).strftime("%Y-%m-%d"),
                    "summary": "Novo Nordisk announced record Q3 sales driven by unprecedented demand for its obesity treatment Wegovy, with supply constraints continuing to limit availability.",
                    "url": "https://example.com/news/1",
                    "relevance": 95,
                    "sentiment": "positive"
                },
                {
                    "title": "FDA Approves Expanded Cardiovascular Indication for Wegovy",
                    "source": "FDA News",
                    "date": (today - timedelta(days=5)).strftime("%Y-%m-%d"),
                    "summary": "The FDA has approved Wegovy for reducing cardiovascular risk in adults with obesity and established cardiovascular disease, marking a significant label expansion.",
                    "url": "https://example.com/news/2",
                    "relevance": 98,
                    "sentiment": "positive"
                },
                {
                    "title": "Eli Lilly's Mounjaro Supply Improves Amid Strong Demand",
                    "source": "Bloomberg",
                    "date": (today - timedelta(days=7)).strftime("%Y-%m-%d"),
                    "summary": "Eli Lilly reports improved manufacturing capacity for tirzepatide products, with availability expected to normalize by end of quarter.",
                    "url": "https://example.com/news/3",
                    "relevance": 82,
                    "sentiment": "positive"
                },
                {
                    "title": "Concerns Rise Over Long-term GLP-1 Use",
                    "source": "JAMA Network",
                    "date": (today - timedelta(days=14)).strftime("%Y-%m-%d"),
                    "summary": "Medical researchers call for more long-term safety data on GLP-1 receptor agonists as usage expands beyond diabetes to obesity treatment.",
                    "url": "https://example.com/news/4",
                    "relevance": 75,
                    "sentiment": "neutral"
                }
            ]

        return [
            {
                "title": "No specific news found",
                "source": "N/A",
                "date": today.strftime("%Y-%m-%d"),
                "summary": "Provide a more specific query for relevant news results.",
                "relevance": 0
            }
        ]

    def _get_regulatory_updates(self, query: str) -> List[Dict[str, Any]]:
        """Get regulatory updates (mock implementation)."""

        if "glp-1" in query or "glp1" in query or "semaglutide" in query:
            return [
                {
                    "agency": "FDA",
                    "type": "Label Expansion",
                    "drug": "Wegovy (semaglutide)",
                    "date": "2024-03-08",
                    "description": "Approved for cardiovascular risk reduction in adults with obesity and CVD",
                    "impact": "High - Expands addressable market significantly"
                },
                {
                    "agency": "EMA",
                    "type": "Positive Opinion",
                    "drug": "Wegovy",
                    "date": "2024-01-25",
                    "description": "CHMP recommends approval for pediatric obesity (12+ years)",
                    "impact": "Medium - New population access"
                },
                {
                    "agency": "FDA",
                    "type": "Safety Communication",
                    "drug": "GLP-1 Class",
                    "date": "2023-10-05",
                    "description": "Updated label warnings for intestinal obstruction risk",
                    "impact": "Low - Label update, no usage restrictions"
                }
            ]

        return []

    def _analyze_sentiment(self, query: str) -> Dict[str, Any]:
        """Analyze market sentiment (mock implementation)."""

        if "glp-1" in query or "glp1" in query or "semaglutide" in query:
            return {
                "overall_sentiment": "Very Positive",
                "sentiment_score": 0.82,
                "key_themes": [
                    {"theme": "Efficacy", "sentiment": "Very Positive", "volume": "High"},
                    {"theme": "Supply", "sentiment": "Negative", "volume": "High"},
                    {"theme": "Pricing", "sentiment": "Negative", "volume": "Medium"},
                    {"theme": "Safety", "sentiment": "Neutral", "volume": "Medium"},
                    {"theme": "Innovation", "sentiment": "Positive", "volume": "Medium"}
                ],
                "trending_topics": [
                    "#Wegovy", "#Ozempic", "#WeightLoss", "#GLP1", "#Tirzepatide"
                ],
                "analyst_consensus": {
                    "recommendation": "Bullish",
                    "price_targets": "Raised across the board",
                    "key_concern": "Supply constraints limiting near-term revenue"
                }
            }

        return {
            "overall_sentiment": "Neutral",
            "sentiment_score": 0.5,
            "note": "Provide specific query for detailed sentiment analysis"
        }
