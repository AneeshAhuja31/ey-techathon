"""Report Generator Worker Agent - Synthesizes all worker outputs."""
from typing import Dict, Any, List
import asyncio

from app.agents.workers.base_worker import BaseWorker
from app.agents.state import MasterState, WorkerOutput


class ReportGeneratorWorker(BaseWorker):
    """
    Worker agent for report synthesis.

    Synthesizes outputs from all other workers into:
    - Comprehensive analysis report
    - Mind map data structure
    - Executive summary
    """

    def __init__(self):
        super().__init__("Report Generator")

    async def execute(self, state: MasterState) -> Dict[str, Any]:
        """
        Synthesize all worker outputs into a comprehensive report.
        """
        await self.update_progress(10)

        # Collect all worker outputs
        worker_outputs = state.get("worker_outputs", [])

        await self.update_progress(30)

        # Generate mind map data
        mind_map = self._generate_mind_map(state["query"], worker_outputs)

        await self.update_progress(60)

        # Generate executive summary
        summary = self._generate_summary(state["query"], worker_outputs)

        await self.update_progress(80)

        # Compile full report
        report = self._compile_report(state["query"], worker_outputs, summary)

        await self.update_progress(100)

        return {
            "mind_map_data": mind_map,
            "summary": summary,
            "report": report
        }

    def _generate_mind_map(self, query: str, outputs: List[WorkerOutput]) -> Dict[str, Any]:
        """Generate mind map visualization data dynamically from worker outputs."""

        nodes = []
        edges = []
        edge_id = 0

        # Helper to create safe IDs
        def safe_id(prefix: str, name: str) -> str:
            return f"{prefix}_{name.lower().replace(' ', '_').replace('-', '_')[:20]}"

        # Extract data from worker outputs
        market_data = {}
        patent_data = {}
        clinical_data = {}
        web_data = {}

        for output in outputs:
            if isinstance(output, dict):
                worker_name = output.get("worker_name", "")
                data = output.get("data", {})
            else:
                worker_name = getattr(output, "worker_name", "")
                data = getattr(output, "data", {})

            if not data:
                continue

            if "IQVIA" in worker_name or "Market" in worker_name:
                market_data = data
            elif "Patent" in worker_name:
                patent_data = data
            elif "Clinical" in worker_name:
                clinical_data = data
            elif "Web" in worker_name or "Intelligence" in worker_name:
                web_data = data

        # Root node - the query topic
        main_topic = query[:30] if len(query) <= 30 else query[:27] + "..."
        root_id = "root_query"
        category_ids = []

        # === MARKET DATA CATEGORY ===
        market_products = market_data.get("top_products", [])
        if market_products:
            market_cat_id = "cat_market"
            product_ids = []

            for i, product in enumerate(market_products[:5]):  # Limit to 5
                prod_name = product.get("name", f"Product {i+1}")
                prod_id = safe_id("prod", f"market_{i}")
                product_ids.append(prod_id)

                nodes.append({
                    "id": prod_id,
                    "label": prod_name[:25],
                    "type": "product",
                    "parentId": market_cat_id,
                    "data": {
                        "match_score": 90 - (i * 5),
                        "manufacturer": product.get("manufacturer", ""),
                        "revenue": product.get("revenue_2024", ""),
                        "market_share": product.get("market_share", "")
                    }
                })

                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": market_cat_id, "target": prod_id})

            if product_ids:
                category_ids.append(market_cat_id)
                nodes.append({
                    "id": market_cat_id,
                    "label": "Market Products",
                    "type": "molecule",
                    "parentId": root_id,
                    "childIds": product_ids,
                    "isExpanded": False
                })
                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": root_id, "target": market_cat_id})

        # === PATENT DATA CATEGORY ===
        patents = patent_data.get("patents", [])
        if patents:
            patent_cat_id = "cat_patents"
            patent_ids = []

            for i, patent in enumerate(patents[:5]):  # Limit to 5
                patent_title = patent.get("title", f"Patent {i+1}")
                patent_node_id = safe_id("pat", f"{i}")
                patent_ids.append(patent_node_id)

                nodes.append({
                    "id": patent_node_id,
                    "label": patent_title[:25],
                    "type": "product",
                    "parentId": patent_cat_id,
                    "data": {
                        "match_score": patent.get("relevance_score", 80),
                        "patent_id": patent.get("patent_id", ""),
                        "assignee": patent.get("assignee", ""),
                        "expiration": patent.get("expiration_date", "")
                    }
                })

                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": patent_cat_id, "target": patent_node_id})

            if patent_ids:
                category_ids.append(patent_cat_id)
                nodes.append({
                    "id": patent_cat_id,
                    "label": "Patents",
                    "type": "molecule",
                    "parentId": root_id,
                    "childIds": patent_ids,
                    "isExpanded": False
                })
                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": root_id, "target": patent_cat_id})

        # === CLINICAL TRIALS CATEGORY ===
        trials = clinical_data.get("trials", [])
        if trials:
            clinical_cat_id = "cat_clinical"
            trial_ids = []

            for i, trial in enumerate(trials[:5]):  # Limit to 5
                trial_title = trial.get("title", f"Trial {i+1}")
                trial_id = safe_id("trial", f"{i}")
                trial_ids.append(trial_id)

                # Calculate score based on phase and status
                phase = trial.get("phase", "")
                status = trial.get("status", "")
                score = 70
                if "Phase 3" in phase:
                    score = 90
                elif "Phase 2" in phase:
                    score = 75
                if status == "Completed":
                    score += 5

                nodes.append({
                    "id": trial_id,
                    "label": trial_title[:25],
                    "type": "product",
                    "parentId": clinical_cat_id,
                    "data": {
                        "match_score": min(score, 99),
                        "nct_id": trial.get("nct_id", ""),
                        "phase": phase,
                        "status": status,
                        "sponsor": trial.get("sponsor", "")
                    }
                })

                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": clinical_cat_id, "target": trial_id})

            if trial_ids:
                category_ids.append(clinical_cat_id)
                nodes.append({
                    "id": clinical_cat_id,
                    "label": "Clinical Trials",
                    "type": "molecule",
                    "parentId": root_id,
                    "childIds": trial_ids,
                    "isExpanded": False
                })
                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": root_id, "target": clinical_cat_id})

        # === WEB/NEWS CATEGORY ===
        news = web_data.get("news", [])
        if news:
            news_cat_id = "cat_news"
            news_ids = []

            for i, article in enumerate(news[:4]):  # Limit to 4
                article_title = article.get("title", f"News {i+1}")
                news_node_id = safe_id("news", f"{i}")
                news_ids.append(news_node_id)

                nodes.append({
                    "id": news_node_id,
                    "label": article_title[:25],
                    "type": "product",
                    "parentId": news_cat_id,
                    "data": {
                        "match_score": int(article.get("score", 0.7) * 100),
                        "source": article.get("source", ""),
                        "date": article.get("published_date", ""),
                        "url": article.get("url", "")
                    }
                })

                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": news_cat_id, "target": news_node_id})

            if news_ids:
                category_ids.append(news_cat_id)
                nodes.append({
                    "id": news_cat_id,
                    "label": "Recent News",
                    "type": "molecule",
                    "parentId": root_id,
                    "childIds": news_ids,
                    "isExpanded": False
                })
                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": root_id, "target": news_cat_id})

        # If no data was found, create a minimal structure
        if not category_ids:
            category_ids = ["cat_no_data"]
            nodes.append({
                "id": "cat_no_data",
                "label": "No data found",
                "type": "molecule",
                "parentId": root_id
            })
            edges.append({"id": "e1", "source": root_id, "target": "cat_no_data"})

        # Add root node with all category children
        nodes.insert(0, {
            "id": root_id,
            "label": main_topic,
            "type": "disease",
            "childIds": category_ids,
            "isExpanded": True
        })

        return {"nodes": nodes, "edges": edges}

    def _generate_summary(self, query: str, outputs: List[WorkerOutput]) -> str:
        """Generate executive summary from worker outputs."""

        summary_parts = [f"## Executive Summary: {query}\n"]

        for output in outputs:
            if isinstance(output, dict):
                worker_name = output.get("worker_name", "Unknown")
                data = output.get("data", {})
            else:
                worker_name = output.worker_name
                data = output.data

            if worker_name == "IQVIA Insights" and data:
                market = data.get("market_overview", {})
                summary_parts.append(f"\n### Market Overview")
                summary_parts.append(f"- Market Size: {market.get('market_size_2024', 'N/A')}")
                summary_parts.append(f"- Growth Rate: {market.get('cagr', 'N/A')} CAGR")

            elif worker_name == "Patent Landscape" and data:
                landscape = data.get("landscape_analysis", {})
                summary_parts.append(f"\n### Intellectual Property")
                summary_parts.append(f"- Total Patents Identified: {landscape.get('total_patents', 0)}")
                summary_parts.append(f"- IP Concentration: {landscape.get('ip_concentration', 'N/A')}")

            elif worker_name == "Clinical Trials" and data:
                trial_summary = data.get("summary", {})
                summary_parts.append(f"\n### Clinical Development")
                summary_parts.append(f"- Active Trials: {trial_summary.get('total_trials', 0)}")

            elif worker_name == "Web Intelligence" and data:
                sentiment = data.get("sentiment_analysis", {})
                summary_parts.append(f"\n### Market Sentiment")
                summary_parts.append(f"- Overall: {sentiment.get('overall_sentiment', 'N/A')}")

        return "\n".join(summary_parts)

    def _compile_report(self, query: str, outputs: List[WorkerOutput], summary: str) -> Dict[str, Any]:
        """Compile full analysis report."""

        report = {
            "title": f"Drug Discovery Analysis: {query}",
            "executive_summary": summary,
            "sections": []
        }

        for output in outputs:
            if isinstance(output, dict):
                worker_name = output.get("worker_name", "Unknown")
                status = output.get("status", "unknown")
                data = output.get("data", {})
            else:
                worker_name = output.worker_name
                status = output.status
                data = output.data

            if status == "completed" and data:
                report["sections"].append({
                    "title": worker_name,
                    "status": status,
                    "data": data
                })

        report["generated_at"] = "auto"
        report["query"] = query

        return report
