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
        """Generate enhanced mind map with intelligent categorization.

        Features:
        - Patents grouped by assignee (company)
        - Clinical trials grouped by phase
        - News grouped by theme (regulatory, market, research)
        """

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
        literature_data = {}
        company_data = {}

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
            elif "Literature" in worker_name:
                literature_data = data
            elif "Company" in worker_name:
                company_data = data

        # Root node - the query topic
        main_topic = query[:30] if len(query) <= 30 else query[:27] + "..."
        root_id = "root_query"
        category_ids = []

        # === MARKET DATA CATEGORY ===
        market_products = market_data.get("top_products", [])
        if market_products:
            market_cat_id = "cat_market"
            product_ids = []

            for i, product in enumerate(market_products[:5]):
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
                    "label": f"Market ({len(market_products)})",
                    "type": "molecule",
                    "parentId": root_id,
                    "childIds": product_ids,
                    "isExpanded": False
                })
                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": root_id, "target": market_cat_id})

        # === PATENTS BY ASSIGNEE ===
        patents = patent_data.get("patents", [])
        if patents:
            patent_cat_id = "cat_patents"

            # Group patents by assignee
            patents_by_assignee = {}
            for patent in patents:
                assignee = patent.get("assignee", "Unknown")[:20]
                if assignee not in patents_by_assignee:
                    patents_by_assignee[assignee] = []
                patents_by_assignee[assignee].append(patent)

            assignee_ids = []
            for assignee, assignee_patents in patents_by_assignee.items():
                assignee_id = safe_id("assignee", assignee)
                assignee_ids.append(assignee_id)
                patent_child_ids = []

                for i, patent in enumerate(assignee_patents[:3]):  # Max 3 per assignee
                    patent_node_id = f"pat_{assignee_id}_{i}"
                    patent_child_ids.append(patent_node_id)

                    nodes.append({
                        "id": patent_node_id,
                        "label": patent.get("title", "")[:25],
                        "type": "product",
                        "parentId": assignee_id,
                        "data": {
                            "match_score": patent.get("relevance_score", 80),
                            "patent_id": patent.get("patent_id", ""),
                            "expiration": patent.get("expiration_date", "")
                        }
                    })
                    edge_id += 1
                    edges.append({"id": f"e{edge_id}", "source": assignee_id, "target": patent_node_id})

                # Assignee node
                nodes.append({
                    "id": assignee_id,
                    "label": f"{assignee} ({len(assignee_patents)})",
                    "type": "company",
                    "parentId": patent_cat_id,
                    "childIds": patent_child_ids,
                    "isExpanded": False,
                    "data": {"patent_count": len(assignee_patents)}
                })
                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": patent_cat_id, "target": assignee_id})

            if assignee_ids:
                category_ids.append(patent_cat_id)
                nodes.append({
                    "id": patent_cat_id,
                    "label": f"Patents ({len(patents)})",
                    "type": "molecule",
                    "parentId": root_id,
                    "childIds": assignee_ids,
                    "isExpanded": False
                })
                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": root_id, "target": patent_cat_id})

        # === CLINICAL TRIALS BY PHASE ===
        trials = clinical_data.get("trials", [])
        if trials:
            clinical_cat_id = "cat_clinical"

            # Group trials by phase
            trials_by_phase = {}
            for trial in trials:
                phase = trial.get("phase", "Unknown Phase")
                if phase not in trials_by_phase:
                    trials_by_phase[phase] = []
                trials_by_phase[phase].append(trial)

            # Sort phases
            phase_order = ["Phase 1", "Phase 2", "Phase 3", "Phase 4", "Unknown Phase"]
            sorted_phases = sorted(trials_by_phase.keys(), key=lambda x: phase_order.index(x) if x in phase_order else 99)

            phase_ids = []
            for phase in sorted_phases:
                phase_trials = trials_by_phase[phase]
                phase_id = safe_id("phase", phase)
                phase_ids.append(phase_id)
                trial_child_ids = []

                for i, trial in enumerate(phase_trials[:3]):  # Max 3 per phase
                    trial_node_id = f"trial_{phase_id}_{i}"
                    trial_child_ids.append(trial_node_id)

                    status = trial.get("status", "Unknown")
                    score = 70
                    if "Phase 3" in phase:
                        score = 90
                    elif "Phase 2" in phase:
                        score = 75
                    if status == "Completed":
                        score += 5

                    nodes.append({
                        "id": trial_node_id,
                        "label": trial.get("title", "")[:25],
                        "type": "product",
                        "parentId": phase_id,
                        "data": {
                            "match_score": min(score, 99),
                            "nct_id": trial.get("nct_id", ""),
                            "status": status,
                            "sponsor": trial.get("sponsor", "")
                        }
                    })
                    edge_id += 1
                    edges.append({"id": f"e{edge_id}", "source": phase_id, "target": trial_node_id})

                # Phase node
                nodes.append({
                    "id": phase_id,
                    "label": f"{phase} ({len(phase_trials)})",
                    "type": "category",
                    "parentId": clinical_cat_id,
                    "childIds": trial_child_ids,
                    "isExpanded": False
                })
                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": clinical_cat_id, "target": phase_id})

            if phase_ids:
                category_ids.append(clinical_cat_id)
                nodes.append({
                    "id": clinical_cat_id,
                    "label": f"Clinical Trials ({len(trials)})",
                    "type": "molecule",
                    "parentId": root_id,
                    "childIds": phase_ids,
                    "isExpanded": False
                })
                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": root_id, "target": clinical_cat_id})

        # === WEB/NEWS BY THEME ===
        news = web_data.get("news", [])
        if news:
            news_cat_id = "cat_news"

            # Categorize by theme
            news_by_theme = {
                "regulatory": [],
                "market": [],
                "research": [],
                "other": []
            }

            for article in news:
                title_lower = article.get("title", "").lower()
                if any(word in title_lower for word in ["fda", "ema", "approval", "regulatory", "approved"]):
                    news_by_theme["regulatory"].append(article)
                elif any(word in title_lower for word in ["market", "sales", "revenue", "demand", "supply"]):
                    news_by_theme["market"].append(article)
                elif any(word in title_lower for word in ["study", "trial", "research", "clinical", "data"]):
                    news_by_theme["research"].append(article)
                else:
                    news_by_theme["other"].append(article)

            theme_labels = {
                "regulatory": "Regulatory News",
                "market": "Market Updates",
                "research": "Research News",
                "other": "General News"
            }

            theme_ids = []
            for theme, articles in news_by_theme.items():
                if not articles:
                    continue

                theme_id = safe_id("theme", theme)
                theme_ids.append(theme_id)
                article_ids = []

                for i, article in enumerate(articles[:3]):  # Max 3 per theme
                    article_id = f"news_{theme_id}_{i}"
                    article_ids.append(article_id)

                    nodes.append({
                        "id": article_id,
                        "label": article.get("title", "")[:25],
                        "type": "product",
                        "parentId": theme_id,
                        "data": {
                            "match_score": int(article.get("score", 0.7) * 100),
                            "source": article.get("source", ""),
                            "date": article.get("published_date", ""),
                            "url": article.get("url", "")
                        }
                    })
                    edge_id += 1
                    edges.append({"id": f"e{edge_id}", "source": theme_id, "target": article_id})

                # Theme node
                nodes.append({
                    "id": theme_id,
                    "label": f"{theme_labels.get(theme, theme)} ({len(articles)})",
                    "type": "category",
                    "parentId": news_cat_id,
                    "childIds": article_ids,
                    "isExpanded": False
                })
                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": news_cat_id, "target": theme_id})

            if theme_ids:
                category_ids.append(news_cat_id)
                nodes.append({
                    "id": news_cat_id,
                    "label": f"News & Updates ({len(news)})",
                    "type": "molecule",
                    "parentId": root_id,
                    "childIds": theme_ids,
                    "isExpanded": False
                })
                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": root_id, "target": news_cat_id})

        # === COMPANY DOCUMENTS ===
        if company_data.get("has_documents"):
            company_cat_id = "cat_company"
            doc_ids = []

            documents = company_data.get("documents", [])
            for i, doc in enumerate(documents[:5]):
                doc_id = safe_id("doc", f"{i}")
                doc_ids.append(doc_id)

                nodes.append({
                    "id": doc_id,
                    "label": doc.get("filename", f"Document {i+1}")[:25],
                    "type": "product",
                    "parentId": company_cat_id,
                    "data": {
                        "doc_id": doc.get("doc_id", ""),
                        "chunks": len(doc.get("chunks", []))
                    }
                })
                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": company_cat_id, "target": doc_id})

            if doc_ids:
                category_ids.append(company_cat_id)
                nodes.append({
                    "id": company_cat_id,
                    "label": f"Company Docs ({len(documents)})",
                    "type": "molecule",
                    "parentId": root_id,
                    "childIds": doc_ids,
                    "isExpanded": False
                })
                edge_id += 1
                edges.append({"id": f"e{edge_id}", "source": root_id, "target": company_cat_id})

        # Handle empty results
        if not category_ids:
            category_ids = ["cat_no_data"]
            nodes.append({
                "id": "cat_no_data",
                "label": "No data found",
                "type": "molecule",
                "parentId": root_id
            })
            edges.append({"id": "e1", "source": root_id, "target": "cat_no_data"})

        # Add root node
        nodes.insert(0, {
            "id": root_id,
            "label": main_topic,
            "type": "disease",
            "childIds": category_ids,
            "isExpanded": True
        })

        return {"nodes": nodes, "edges": edges}

    def _generate_summary(self, query: str, outputs: List[WorkerOutput]) -> str:
        """Generate a simple completion message - mindmap contains all the data."""

        # Count what data was found
        patent_count = 0
        trial_count = 0
        news_count = 0
        has_market = False
        has_company_docs = False

        for output in outputs:
            if isinstance(output, dict):
                worker_name = output.get("worker_name", "")
                data = output.get("data", {})
            else:
                worker_name = getattr(output, "worker_name", "")
                data = getattr(output, "data", {})

            if not data:
                continue

            if "Patent" in worker_name:
                patent_count = len(data.get("patents", []))
            elif "Clinical" in worker_name:
                trial_count = len(data.get("trials", []))
            elif "Web" in worker_name or "Intelligence" in worker_name:
                news_count = len(data.get("news", []))
            elif "IQVIA" in worker_name or "Market" in worker_name:
                has_market = bool(data.get("top_products"))
            elif "Company" in worker_name:
                has_company_docs = data.get("has_documents", False)

        # Build a simple natural message
        findings = []
        if patent_count > 0:
            findings.append(f"{patent_count} patents")
        if trial_count > 0:
            findings.append(f"{trial_count} clinical trials")
        if news_count > 0:
            findings.append(f"{news_count} news articles")
        if has_market:
            findings.append("market data")
        if has_company_docs:
            findings.append("your company documents")

        if findings:
            findings_str = ", ".join(findings[:-1]) + (" and " + findings[-1] if len(findings) > 1 else findings[0])
            return f"Research complete for **{query}**. I found {findings_str}. Explore the interactive mindmap to dive into the details."
        else:
            return f"Research complete for **{query}**. The mindmap is ready - click on nodes to explore the findings."

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
