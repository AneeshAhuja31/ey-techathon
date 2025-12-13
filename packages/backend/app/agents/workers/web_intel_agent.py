"""Web Intelligence Worker Agent - Real-time news and web search using Tavily."""
import logging
from typing import Dict, Any, List
import asyncio
from datetime import datetime, timedelta

from app.agents.workers.base_worker import BaseWorker
from app.agents.state import MasterState
from app.core.config import settings

logger = logging.getLogger(__name__)


class WebIntelligenceWorker(BaseWorker):
    """
    Worker agent for web intelligence using Tavily search.

    Gathers:
    - Real-time news and articles
    - Web search results
    - Recent developments and announcements
    """

    def __init__(self):
        super().__init__("Web Intelligence")
        self.tavily_client = None
        if settings.tavily_api_key:
            try:
                from tavily import TavilyClient
                self.tavily_client = TavilyClient(api_key=settings.tavily_api_key)
                logger.info("Tavily client initialized successfully")
            except ImportError:
                logger.warning("tavily-python not installed, using mock data")
            except Exception as e:
                logger.warning(f"Failed to initialize Tavily client: {e}")

    async def execute(self, state: MasterState) -> Dict[str, Any]:
        """Execute web intelligence gathering using Tavily.

        Uses refined query if available (from query_refiner node),
        otherwise uses the original query.
        """
        # Use refined web query if available, otherwise use original
        refined_queries = state.get("refined_queries", {})
        query = refined_queries.get("web", state["query"])

        logger.info(f"Web search with query: {query}")

        await self.update_progress(10, "Starting web search...")

        if not self.tavily_client:
            logger.info("No Tavily client, using mock data")
            return await self._get_mock_results(query.lower())

        try:
            # Search for news/articles
            await self.update_progress(30, "Searching web for news and articles...")
            news_results = await self._search_tavily(query, topic="news")

            # Search for general web content
            await self.update_progress(60, "Gathering web intelligence...")
            web_results = await self._search_tavily(query, include_answer=True)

            # Analyze and structure results
            await self.update_progress(85, "Analyzing search results...")

            await self.update_progress(100, "Web intelligence complete")

            return {
                "news": news_results,
                "web_results": web_results,
                "analysis": {
                    "total_news": len(news_results),
                    "total_web_results": len(web_results.get("results", [])),
                    "has_answer": bool(web_results.get("answer")),
                    "query": query
                },
                "source": "tavily"
            }

        except Exception as e:
            logger.error(f"Tavily search error: {e}")
            return await self._get_mock_results(query.lower())

    async def _search_tavily(
        self,
        query: str,
        topic: str = "general",
        include_answer: bool = False,
        max_results: int = 5
    ) -> Any:
        """Search using Tavily API."""
        loop = asyncio.get_event_loop()

        try:
            if topic == "news":
                response = await loop.run_in_executor(
                    None,
                    lambda: self.tavily_client.search(
                        query=f"{query} news recent developments",
                        search_depth="advanced",
                        topic="news",
                        max_results=max_results
                    )
                )
                # Format news results
                news = []
                for result in response.get("results", []):
                    news.append({
                        "title": result.get("title", ""),
                        "url": result.get("url", ""),
                        "content": result.get("content", ""),
                        "score": result.get("score", 0),
                        "published_date": result.get("published_date", ""),
                        "source": self._extract_domain(result.get("url", ""))
                    })
                return news
            else:
                response = await loop.run_in_executor(
                    None,
                    lambda: self.tavily_client.search(
                        query=query,
                        search_depth="advanced",
                        max_results=max_results,
                        include_answer=include_answer
                    )
                )
                # Format general results
                results = []
                for result in response.get("results", []):
                    results.append({
                        "title": result.get("title", ""),
                        "url": result.get("url", ""),
                        "content": result.get("content", ""),
                        "score": result.get("score", 0)
                    })
                return {
                    "answer": response.get("answer", ""),
                    "results": results
                }
        except Exception as e:
            logger.error(f"Tavily search failed: {e}")
            raise

    def _extract_domain(self, url: str) -> str:
        """Extract domain name from URL for source attribution."""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc.replace("www.", "")
            return domain
        except:
            return "Unknown"

    async def _get_mock_results(self, query: str) -> Dict[str, Any]:
        """Fallback mock results when Tavily unavailable."""
        await self.update_progress(25)
        await asyncio.sleep(0.3)

        news = self._gather_mock_news(query)

        await self.update_progress(60)
        await asyncio.sleep(0.2)

        regulatory = self._get_mock_regulatory_updates(query)

        await self.update_progress(85)
        await asyncio.sleep(0.2)

        sentiment = self._analyze_mock_sentiment(query)

        await self.update_progress(100)

        return {
            "news": news,
            "regulatory_updates": regulatory,
            "sentiment_analysis": sentiment,
            "source": "mock"
        }

    def _gather_mock_news(self, query: str) -> List[Dict[str, Any]]:
        """Gather relevant news articles (mock implementation)."""
        today = datetime.utcnow()

        if "glp-1" in query or "glp1" in query or "semaglutide" in query or "obesity" in query:
            return [
                {
                    "title": "Novo Nordisk Reports Record Demand for Wegovy",
                    "source": "Reuters",
                    "published_date": (today - timedelta(days=2)).strftime("%Y-%m-%d"),
                    "content": "Novo Nordisk announced record Q3 sales driven by unprecedented demand for its obesity treatment Wegovy, with supply constraints continuing to limit availability.",
                    "url": "https://reuters.com/news/1",
                    "score": 0.95
                },
                {
                    "title": "FDA Approves Expanded Cardiovascular Indication for Wegovy",
                    "source": "FDA News",
                    "published_date": (today - timedelta(days=5)).strftime("%Y-%m-%d"),
                    "content": "The FDA has approved Wegovy for reducing cardiovascular risk in adults with obesity and established cardiovascular disease.",
                    "url": "https://fda.gov/news/2",
                    "score": 0.98
                },
                {
                    "title": "Eli Lilly's Mounjaro Supply Improves Amid Strong Demand",
                    "source": "Bloomberg",
                    "published_date": (today - timedelta(days=7)).strftime("%Y-%m-%d"),
                    "content": "Eli Lilly reports improved manufacturing capacity for tirzepatide products.",
                    "url": "https://bloomberg.com/news/3",
                    "score": 0.82
                }
            ]

        # Metformin/diabetes news
        if "metformin" in query or "diabetes" in query:
            return [
                {
                    "title": "TAME Trial: Metformin as Anti-Aging Drug Enters Phase 3",
                    "source": "Nature Medicine",
                    "published_date": (today - timedelta(days=3)).strftime("%Y-%m-%d"),
                    "content": "The landmark TAME (Targeting Aging with Metformin) trial has begun enrollment, testing whether metformin can extend healthspan and delay age-related diseases.",
                    "url": "https://nature.com/articles/tame-trial",
                    "score": 0.92
                },
                {
                    "title": "Metformin Remains First-Line Despite GLP-1 Competition",
                    "source": "JAMA",
                    "published_date": (today - timedelta(days=8)).strftime("%Y-%m-%d"),
                    "content": "ADA guidelines continue to recommend metformin as first-line therapy for Type 2 diabetes, citing cost-effectiveness and long-term safety data.",
                    "url": "https://jamanetwork.com/news",
                    "score": 0.88
                },
                {
                    "title": "New Metformin Formulations Target Improved GI Tolerability",
                    "source": "Endpoints News",
                    "published_date": (today - timedelta(days=12)).strftime("%Y-%m-%d"),
                    "content": "Several biotech companies are developing novel metformin formulations aimed at reducing gastrointestinal side effects that limit adherence.",
                    "url": "https://endpts.com/metformin",
                    "score": 0.75
                }
            ]

        return [
            {
                "title": f"Latest developments in {query}",
                "source": "Healthcare News",
                "published_date": today.strftime("%Y-%m-%d"),
                "content": f"Recent updates and developments related to {query} in the pharmaceutical industry.",
                "url": "https://example.com/news",
                "score": 0.5
            }
        ]

    def _get_mock_regulatory_updates(self, query: str) -> List[Dict[str, Any]]:
        """Get regulatory updates (mock implementation)."""
        if "glp-1" in query or "glp1" in query or "semaglutide" in query:
            return [
                {
                    "agency": "FDA",
                    "type": "Label Expansion",
                    "drug": "Wegovy (semaglutide)",
                    "date": "2024-03-08",
                    "description": "Approved for cardiovascular risk reduction",
                    "impact": "High"
                },
                {
                    "agency": "EMA",
                    "type": "Positive Opinion",
                    "drug": "Wegovy",
                    "date": "2024-01-25",
                    "description": "CHMP recommends approval for pediatric obesity",
                    "impact": "Medium"
                }
            ]
        if "metformin" in query or "diabetes" in query:
            return [
                {
                    "agency": "FDA",
                    "type": "Guidance Update",
                    "drug": "Metformin combinations",
                    "date": "2024-02-15",
                    "description": "Updated guidance on fixed-dose combination products with metformin",
                    "impact": "Medium"
                },
                {
                    "agency": "ADA",
                    "type": "Guidelines Update",
                    "drug": "Metformin",
                    "date": "2024-01-01",
                    "description": "Reaffirmed as first-line therapy for T2D with lifestyle modifications",
                    "impact": "High"
                }
            ]
        return []

    def _analyze_mock_sentiment(self, query: str) -> Dict[str, Any]:
        """Analyze market sentiment (mock implementation)."""
        if "glp-1" in query or "glp1" in query or "semaglutide" in query:
            return {
                "overall_sentiment": "Very Positive",
                "sentiment_score": 0.82,
                "key_themes": [
                    {"theme": "Efficacy", "sentiment": "Very Positive"},
                    {"theme": "Supply", "sentiment": "Negative"},
                    {"theme": "Innovation", "sentiment": "Positive"}
                ],
                "trending_topics": ["#Wegovy", "#Ozempic", "#GLP1"]
            }

        if "metformin" in query or "diabetes" in query:
            return {
                "overall_sentiment": "Positive",
                "sentiment_score": 0.68,
                "key_themes": [
                    {"theme": "Cost-effectiveness", "sentiment": "Very Positive"},
                    {"theme": "Safety Profile", "sentiment": "Positive"},
                    {"theme": "Competition from GLP-1s", "sentiment": "Negative"},
                    {"theme": "Anti-aging Research", "sentiment": "Very Positive"}
                ],
                "trending_topics": ["#Metformin", "#DiabetesCare", "#TAMETrial"]
            }

        return {
            "overall_sentiment": "Neutral",
            "sentiment_score": 0.5
        }
