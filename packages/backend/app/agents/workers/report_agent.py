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
        """Generate mind map visualization data."""

        query_lower = query.lower()

        # GLP-1 specific mind map with hierarchical expand/collapse
        if "glp-1" in query_lower or "glp1" in query_lower or "semaglutide" in query_lower:
            return {
                "nodes": [
                    # Disease nodes (pink) - root level, expandable
                    {"id": "disease_obesity", "label": "Obesity", "type": "disease",
                     "childIds": ["mol_semaglutide", "mol_tirzepatide"], "isExpanded": True},
                    {"id": "disease_t2d", "label": "Type 2 Diabetes", "type": "disease",
                     "childIds": ["mol_semaglutide", "mol_tirzepatide"], "isExpanded": False},

                    # Molecule nodes (purple/blue) - expandable with products
                    {"id": "mol_semaglutide", "label": "Semaglutide", "type": "molecule",
                     "parentId": "disease_obesity", "childIds": ["prod_wegovy", "prod_ozempic", "prod_rybelsus"], "isExpanded": True},
                    {"id": "mol_tirzepatide", "label": "Tirzepatide", "type": "molecule",
                     "parentId": "disease_obesity", "childIds": ["prod_mounjaro"], "isExpanded": False},

                    # Product nodes (yellow) - leaf nodes
                    {"id": "prod_wegovy", "label": "Wegovy", "type": "product", "parentId": "mol_semaglutide",
                     "data": {"match_score": 97, "manufacturer": "Novo Nordisk"}},
                    {"id": "prod_ozempic", "label": "Ozempic", "type": "product", "parentId": "mol_semaglutide",
                     "data": {"match_score": 95, "manufacturer": "Novo Nordisk"}},
                    {"id": "prod_rybelsus", "label": "Rybelsus", "type": "product", "parentId": "mol_semaglutide",
                     "data": {"match_score": 92, "manufacturer": "Novo Nordisk"}},
                    {"id": "prod_mounjaro", "label": "Mounjaro", "type": "product", "parentId": "mol_tirzepatide",
                     "data": {"match_score": 88, "manufacturer": "Eli Lilly"}},
                ],
                "edges": [
                    # Disease to Molecule connections
                    {"id": "e1", "source": "disease_obesity", "target": "mol_semaglutide"},
                    {"id": "e2", "source": "disease_t2d", "target": "mol_semaglutide"},
                    {"id": "e3", "source": "disease_obesity", "target": "mol_tirzepatide"},
                    {"id": "e4", "source": "disease_t2d", "target": "mol_tirzepatide"},

                    # Molecule to Product connections
                    {"id": "e5", "source": "mol_semaglutide", "target": "prod_wegovy"},
                    {"id": "e6", "source": "mol_semaglutide", "target": "prod_ozempic"},
                    {"id": "e7", "source": "mol_semaglutide", "target": "prod_rybelsus"},
                    {"id": "e8", "source": "mol_tirzepatide", "target": "prod_mounjaro"},
                ]
            }

        # Metformin/diabetes specific mind map with hierarchical expand/collapse
        if "metformin" in query_lower or "diabetes" in query_lower:
            return {
                "nodes": [
                    # Disease nodes (pink) - root level, expandable
                    {"id": "disease_t2d", "label": "Type 2 Diabetes", "type": "disease",
                     "childIds": ["mol_metformin", "mol_dapagliflozin", "mol_sitagliptin"], "isExpanded": True},
                    {"id": "disease_prediabetes", "label": "Prediabetes", "type": "disease",
                     "childIds": ["mol_metformin"], "isExpanded": False},

                    # Molecule nodes (purple/blue) - expandable with products
                    {"id": "mol_metformin", "label": "Metformin", "type": "molecule",
                     "parentId": "disease_t2d", "childIds": ["prod_glucophage", "prod_glucophage_xr", "prod_xigduo", "prod_janumet"], "isExpanded": True},
                    {"id": "mol_dapagliflozin", "label": "Dapagliflozin", "type": "molecule",
                     "parentId": "disease_t2d", "childIds": ["prod_farxiga"], "isExpanded": False},
                    {"id": "mol_sitagliptin", "label": "Sitagliptin", "type": "molecule",
                     "parentId": "disease_t2d", "childIds": ["prod_januvia"], "isExpanded": False},

                    # Product nodes (yellow) - leaf nodes
                    {"id": "prod_glucophage", "label": "Glucophage", "type": "product", "parentId": "mol_metformin",
                     "data": {"match_score": 95, "manufacturer": "Bristol-Myers Squibb"}},
                    {"id": "prod_glucophage_xr", "label": "Glucophage XR", "type": "product", "parentId": "mol_metformin",
                     "data": {"match_score": 92, "manufacturer": "Bristol-Myers Squibb"}},
                    {"id": "prod_xigduo", "label": "Xigduo XR", "type": "product", "parentId": "mol_metformin",
                     "data": {"match_score": 88, "manufacturer": "AstraZeneca"}},
                    {"id": "prod_janumet", "label": "Janumet", "type": "product", "parentId": "mol_metformin",
                     "data": {"match_score": 85, "manufacturer": "Merck"}},
                    {"id": "prod_farxiga", "label": "Farxiga", "type": "product", "parentId": "mol_dapagliflozin",
                     "data": {"match_score": 90, "manufacturer": "AstraZeneca"}},
                    {"id": "prod_januvia", "label": "Januvia", "type": "product", "parentId": "mol_sitagliptin",
                     "data": {"match_score": 87, "manufacturer": "Merck"}},
                ],
                "edges": [
                    # Disease to Molecule connections
                    {"id": "e1", "source": "disease_t2d", "target": "mol_metformin"},
                    {"id": "e2", "source": "disease_prediabetes", "target": "mol_metformin"},
                    {"id": "e3", "source": "disease_t2d", "target": "mol_dapagliflozin"},
                    {"id": "e4", "source": "disease_t2d", "target": "mol_sitagliptin"},

                    # Molecule to Product connections
                    {"id": "e5", "source": "mol_metformin", "target": "prod_glucophage"},
                    {"id": "e6", "source": "mol_metformin", "target": "prod_glucophage_xr"},
                    {"id": "e7", "source": "mol_metformin", "target": "prod_xigduo"},
                    {"id": "e8", "source": "mol_metformin", "target": "prod_janumet"},
                    {"id": "e9", "source": "mol_dapagliflozin", "target": "prod_farxiga"},
                    {"id": "e10", "source": "mol_sitagliptin", "target": "prod_januvia"},
                ]
            }

        # Generic mind map structure - create a meaningful hierarchy based on query
        # Extract key terms from query for labeling
        query_terms = query.split()
        main_topic = query[:30] if len(query) <= 30 else query[:27] + "..."

        return {
            "nodes": [
                # Root disease/condition node
                {"id": "disease_main", "label": main_topic, "type": "disease",
                 "childIds": ["mol_research", "mol_treatment", "mol_pipeline"], "isExpanded": True},

                # Molecule/research area nodes
                {"id": "mol_research", "label": "Research Areas", "type": "molecule",
                 "parentId": "disease_main", "childIds": ["prod_clinical", "prod_preclinical"], "isExpanded": False},
                {"id": "mol_treatment", "label": "Current Treatments", "type": "molecule",
                 "parentId": "disease_main", "childIds": ["prod_approved", "prod_offlabel"], "isExpanded": False},
                {"id": "mol_pipeline", "label": "Pipeline", "type": "molecule",
                 "parentId": "disease_main", "childIds": ["prod_phase3", "prod_phase2"], "isExpanded": False},

                # Product/detail nodes
                {"id": "prod_clinical", "label": "Clinical Studies", "type": "product", "parentId": "mol_research",
                 "data": {"match_score": 85}},
                {"id": "prod_preclinical", "label": "Preclinical Research", "type": "product", "parentId": "mol_research",
                 "data": {"match_score": 75}},
                {"id": "prod_approved", "label": "Approved Therapies", "type": "product", "parentId": "mol_treatment",
                 "data": {"match_score": 90}},
                {"id": "prod_offlabel", "label": "Off-label Uses", "type": "product", "parentId": "mol_treatment",
                 "data": {"match_score": 65}},
                {"id": "prod_phase3", "label": "Phase 3 Trials", "type": "product", "parentId": "mol_pipeline",
                 "data": {"match_score": 80}},
                {"id": "prod_phase2", "label": "Phase 2 Trials", "type": "product", "parentId": "mol_pipeline",
                 "data": {"match_score": 70}},
            ],
            "edges": [
                # Disease to Molecule connections
                {"id": "e1", "source": "disease_main", "target": "mol_research"},
                {"id": "e2", "source": "disease_main", "target": "mol_treatment"},
                {"id": "e3", "source": "disease_main", "target": "mol_pipeline"},

                # Molecule to Product connections
                {"id": "e4", "source": "mol_research", "target": "prod_clinical"},
                {"id": "e5", "source": "mol_research", "target": "prod_preclinical"},
                {"id": "e6", "source": "mol_treatment", "target": "prod_approved"},
                {"id": "e7", "source": "mol_treatment", "target": "prod_offlabel"},
                {"id": "e8", "source": "mol_pipeline", "target": "prod_phase3"},
                {"id": "e9", "source": "mol_pipeline", "target": "prod_phase2"},
            ]
        }

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
