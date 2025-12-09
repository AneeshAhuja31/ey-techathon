"""Graph visualization schemas for Mind Map."""
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class GraphNode(BaseModel):
    """Schema for a mind map node."""
    id: str = Field(..., description="Unique node identifier")
    label: str = Field(..., description="Display label")
    type: str = Field(..., description="Node type: disease, molecule, product")
    x: Optional[float] = Field(default=None, description="X coordinate for layout")
    y: Optional[float] = Field(default=None, description="Y coordinate for layout")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Additional node data")
    match_score: Optional[float] = Field(default=None, description="Relevance/match score")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "mol_semaglutide",
                "label": "Semaglutide",
                "type": "molecule",
                "x": 250,
                "y": 200,
                "data": {
                    "mechanism": "GLP-1 receptor agonist",
                    "drug_class": "Incretin mimetics"
                },
                "match_score": 97
            }
        }


class GraphEdge(BaseModel):
    """Schema for a mind map edge/connection."""
    id: str = Field(..., description="Unique edge identifier")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    label: Optional[str] = Field(default=None, description="Edge label")
    weight: Optional[float] = Field(default=1.0, description="Edge weight/strength")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "edge_obesity_semaglutide",
                "source": "disease_obesity",
                "target": "mol_semaglutide",
                "label": "treated_by",
                "weight": 0.95
            }
        }


class GraphVisualizationResponse(BaseModel):
    """Response schema for graph visualization data."""
    nodes: List[GraphNode] = Field(default=[], description="List of nodes")
    edges: List[GraphEdge] = Field(default=[], description="List of edges")
    context: str = Field(..., description="Query context used to generate graph")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "nodes": [
                    {"id": "disease_obesity", "label": "Obesity", "type": "disease", "x": 400, "y": 100},
                    {"id": "disease_t2d", "label": "Type 2 Diabetes", "type": "disease", "x": 400, "y": 300},
                    {"id": "mol_semaglutide", "label": "Semaglutide", "type": "molecule", "x": 250, "y": 200},
                    {"id": "prod_wegovy", "label": "Wegovy", "type": "product", "x": 100, "y": 120},
                    {"id": "prod_ozempic", "label": "Ozempic", "type": "product", "x": 100, "y": 200},
                    {"id": "prod_rybelsus", "label": "Rybelsus", "type": "product", "x": 100, "y": 280}
                ],
                "edges": [
                    {"id": "e1", "source": "disease_obesity", "target": "mol_semaglutide"},
                    {"id": "e2", "source": "disease_t2d", "target": "mol_semaglutide"},
                    {"id": "e3", "source": "mol_semaglutide", "target": "prod_wegovy"},
                    {"id": "e4", "source": "mol_semaglutide", "target": "prod_ozempic"},
                    {"id": "e5", "source": "mol_semaglutide", "target": "prod_rybelsus"}
                ],
                "context": "GLP-1",
                "metadata": {"total_nodes": 6, "total_edges": 5}
            }
        }


class NodeDetailRequest(BaseModel):
    """Request for node details."""
    node_id: str = Field(..., description="Node ID to get details for")


class NodeDetailResponse(BaseModel):
    """Response with detailed node information."""
    node: GraphNode
    related_nodes: List[GraphNode] = []
    additional_info: Optional[Dict[str, Any]] = None
