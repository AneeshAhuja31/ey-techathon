"""Graph visualization service for Mind Map."""
from typing import Optional, Dict, Any, List


class GraphService:
    """Service for generating mind map visualization data."""

    def get_visualization(self, context: str) -> Dict[str, Any]:
        """
        Generate mind map visualization data for a given context.

        Args:
            context: The search context (e.g., "GLP-1", "obesity")

        Returns:
            Graph visualization data with nodes and edges
        """
        context_lower = context.lower()

        # GLP-1 specific visualization (matches spec)
        if "glp-1" in context_lower or "glp1" in context_lower or "semaglutide" in context_lower:
            return self._get_glp1_graph()

        if "obesity" in context_lower:
            return self._get_obesity_graph()

        if "diabetes" in context_lower:
            return self._get_diabetes_graph()

        # Generic response
        return {
            "nodes": [
                {
                    "id": "root",
                    "label": context[:30],
                    "type": "molecule",
                    "x": 300,
                    "y": 200,
                    "data": {"note": "Provide specific query for detailed graph"}
                }
            ],
            "edges": [],
            "context": context,
            "metadata": {"total_nodes": 1, "total_edges": 0}
        }

    def _get_glp1_graph(self) -> Dict[str, Any]:
        """Get the GLP-1 specific mind map (matches spec exactly)."""
        return {
            "nodes": [
                # Disease nodes (pink - #EC4899)
                {
                    "id": "disease_obesity",
                    "label": "Obesity",
                    "type": "disease",
                    "x": 400,
                    "y": 100,
                    "data": {
                        "prevalence": "42% of US adults",
                        "icd_code": "E66",
                        "description": "Chronic metabolic disease characterized by excessive fat accumulation"
                    }
                },
                {
                    "id": "disease_t2d",
                    "label": "Type 2 Diabetes",
                    "type": "disease",
                    "x": 400,
                    "y": 300,
                    "data": {
                        "prevalence": "11.3% of US adults",
                        "icd_code": "E11",
                        "description": "Metabolic disorder characterized by insulin resistance"
                    }
                },

                # Molecule nodes (purple/blue - #8B5CF6)
                {
                    "id": "mol_semaglutide",
                    "label": "Semaglutide",
                    "type": "molecule",
                    "x": 250,
                    "y": 200,
                    "data": {
                        "mechanism": "GLP-1 receptor agonist",
                        "drug_class": "Incretin mimetics",
                        "formula": "C187H291N45O59",
                        "half_life": "~1 week"
                    }
                },
                {
                    "id": "mol_tirzepatide",
                    "label": "Tirzepatide",
                    "type": "molecule",
                    "x": 550,
                    "y": 200,
                    "data": {
                        "mechanism": "Dual GIP/GLP-1 receptor agonist",
                        "drug_class": "Incretin mimetics",
                        "formula": "C225H348N48O68",
                        "half_life": "~5 days"
                    }
                },

                # Product nodes (yellow - #FBBF24)
                {
                    "id": "prod_wegovy",
                    "label": "Wegovy",
                    "type": "product",
                    "x": 100,
                    "y": 120,
                    "data": {
                        "manufacturer": "Novo Nordisk",
                        "indication": "Chronic weight management",
                        "dosage": "2.4mg weekly",
                        "approval_date": "2021-06-04",
                        "match_score": 97
                    },
                    "match_score": 97
                },
                {
                    "id": "prod_ozempic",
                    "label": "Ozempic",
                    "type": "product",
                    "x": 100,
                    "y": 200,
                    "data": {
                        "manufacturer": "Novo Nordisk",
                        "indication": "Type 2 Diabetes",
                        "dosage": "0.5mg, 1mg, or 2mg weekly",
                        "approval_date": "2017-12-05",
                        "match_score": 95
                    },
                    "match_score": 95
                },
                {
                    "id": "prod_rybelsus",
                    "label": "Rybelsus",
                    "type": "product",
                    "x": 100,
                    "y": 280,
                    "data": {
                        "manufacturer": "Novo Nordisk",
                        "indication": "Type 2 Diabetes",
                        "dosage": "7mg or 14mg daily (oral)",
                        "approval_date": "2019-09-20",
                        "match_score": 92
                    },
                    "match_score": 92
                },
                {
                    "id": "prod_mounjaro",
                    "label": "Mounjaro",
                    "type": "product",
                    "x": 700,
                    "y": 200,
                    "data": {
                        "manufacturer": "Eli Lilly",
                        "indication": "Type 2 Diabetes, Obesity",
                        "dosage": "2.5mg to 15mg weekly",
                        "approval_date": "2022-05-13",
                        "match_score": 88
                    },
                    "match_score": 88
                },
                {
                    "id": "prod_zepbound",
                    "label": "Zepbound",
                    "type": "product",
                    "x": 700,
                    "y": 280,
                    "data": {
                        "manufacturer": "Eli Lilly",
                        "indication": "Chronic weight management",
                        "dosage": "2.5mg to 15mg weekly",
                        "approval_date": "2023-11-08",
                        "match_score": 85
                    },
                    "match_score": 85
                }
            ],
            "edges": [
                # Disease to Molecule connections
                {"id": "e1", "source": "disease_obesity", "target": "mol_semaglutide", "label": "treated_by"},
                {"id": "e2", "source": "disease_t2d", "target": "mol_semaglutide", "label": "treated_by"},
                {"id": "e3", "source": "disease_obesity", "target": "mol_tirzepatide", "label": "treated_by"},
                {"id": "e4", "source": "disease_t2d", "target": "mol_tirzepatide", "label": "treated_by"},

                # Molecule to Product connections
                {"id": "e5", "source": "mol_semaglutide", "target": "prod_wegovy", "label": "formulated_as"},
                {"id": "e6", "source": "mol_semaglutide", "target": "prod_ozempic", "label": "formulated_as"},
                {"id": "e7", "source": "mol_semaglutide", "target": "prod_rybelsus", "label": "formulated_as"},
                {"id": "e8", "source": "mol_tirzepatide", "target": "prod_mounjaro", "label": "formulated_as"},
                {"id": "e9", "source": "mol_tirzepatide", "target": "prod_zepbound", "label": "formulated_as"}
            ],
            "context": "GLP-1",
            "metadata": {
                "total_nodes": 9,
                "total_edges": 9,
                "node_types": {
                    "disease": 2,
                    "molecule": 2,
                    "product": 5
                }
            }
        }

    def _get_obesity_graph(self) -> Dict[str, Any]:
        """Get obesity-focused graph."""
        base = self._get_glp1_graph()
        base["context"] = "Obesity"
        return base

    def _get_diabetes_graph(self) -> Dict[str, Any]:
        """Get diabetes-focused graph."""
        base = self._get_glp1_graph()
        base["context"] = "Type 2 Diabetes"
        return base

    def get_node_details(self, node_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information for a specific node."""
        graph = self._get_glp1_graph()

        for node in graph["nodes"]:
            if node["id"] == node_id:
                # Find related nodes
                related = []
                for edge in graph["edges"]:
                    if edge["source"] == node_id:
                        for n in graph["nodes"]:
                            if n["id"] == edge["target"]:
                                related.append(n)
                    elif edge["target"] == node_id:
                        for n in graph["nodes"]:
                            if n["id"] == edge["source"]:
                                related.append(n)

                return {
                    "node": node,
                    "related_nodes": related,
                    "additional_info": self._get_additional_info(node)
                }

        return None

    def _get_additional_info(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """Get additional information based on node type."""
        node_type = node.get("type")

        if node_type == "disease":
            return {
                "clinical_trials_count": 150,
                "approved_treatments": 5,
                "pipeline_drugs": 12
            }
        elif node_type == "molecule":
            return {
                "patents_count": 45,
                "clinical_trials": 25,
                "publications": 500
            }
        elif node_type == "product":
            return {
                "market_share": "Variable",
                "revenue_2024": "See IQVIA data",
                "supply_status": "Limited availability"
            }

        return {}
