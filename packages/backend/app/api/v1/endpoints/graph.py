"""Graph visualization endpoints for Mind Map."""
from typing import Optional
from fastapi import APIRouter, Query, HTTPException

from app.schemas.graph import GraphVisualizationResponse, GraphNode, GraphEdge, NodeDetailResponse
from app.services.graph_service import GraphService

router = APIRouter()
graph_service = GraphService()


@router.get("/visualize", response_model=GraphVisualizationResponse)
async def get_visualization(
    context: str = Query(..., description="Research context (e.g., GLP-1, obesity, semaglutide)")
):
    """
    Get mind map visualization data for a given context.

    Returns nodes and edges formatted for the frontend graph library.

    Node types:
    - **disease**: Pink nodes (#EC4899) - Root level
    - **molecule**: Purple nodes (#8B5CF6) - Middle level
    - **product**: Yellow nodes (#FBBF24) - Leaf level

    Example: `/graph/visualize?context=GLP-1`
    """
    result = graph_service.get_visualization(context)

    return GraphVisualizationResponse(
        nodes=[GraphNode(**n) for n in result["nodes"]],
        edges=[GraphEdge(**e) for e in result["edges"]],
        context=result["context"],
        metadata=result.get("metadata")
    )


@router.get("/node/{node_id}", response_model=NodeDetailResponse)
async def get_node_details(node_id: str):
    """
    Get detailed information for a specific node.

    Returns the node data along with related nodes and additional information.

    Use this when a user taps on a node in the mind map.
    """
    result = graph_service.get_node_details(node_id)

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"Node not found: {node_id}"
        )

    return NodeDetailResponse(
        node=GraphNode(**result["node"]),
        related_nodes=[GraphNode(**n) for n in result.get("related_nodes", [])],
        additional_info=result.get("additional_info")
    )


@router.get("/contexts")
async def list_available_contexts():
    """
    List available visualization contexts.

    Returns contexts that have pre-built mind map data.
    """
    return {
        "contexts": [
            {
                "id": "glp-1",
                "name": "GLP-1 Receptor Agonists",
                "description": "Comprehensive view of GLP-1 drugs including semaglutide and tirzepatide",
                "node_count": 9
            },
            {
                "id": "obesity",
                "name": "Obesity Treatments",
                "description": "Drugs and molecules targeting obesity",
                "node_count": 9
            },
            {
                "id": "diabetes",
                "name": "Type 2 Diabetes",
                "description": "Type 2 diabetes treatment landscape",
                "node_count": 9
            }
        ]
    }


@router.get("/export")
async def export_graph(
    context: str = Query(..., description="Context to export"),
    format: str = Query("json", description="Export format: json, cytoscape, d3")
):
    """
    Export graph data in various formats.

    Supported formats:
    - **json**: Raw JSON format
    - **cytoscape**: Cytoscape.js compatible format
    - **d3**: D3.js force graph format
    """
    result = graph_service.get_visualization(context)

    if format == "json":
        return result

    elif format == "cytoscape":
        # Convert to Cytoscape.js format
        elements = []

        for node in result["nodes"]:
            elements.append({
                "data": {
                    "id": node["id"],
                    "label": node["label"],
                    "type": node["type"],
                    **node.get("data", {})
                },
                "position": {"x": node.get("x", 0), "y": node.get("y", 0)}
            })

        for edge in result["edges"]:
            elements.append({
                "data": {
                    "id": edge["id"],
                    "source": edge["source"],
                    "target": edge["target"],
                    "label": edge.get("label")
                }
            })

        return {"elements": elements, "context": context}

    elif format == "d3":
        # Convert to D3.js force graph format
        return {
            "nodes": [
                {
                    "id": n["id"],
                    "name": n["label"],
                    "group": n["type"],
                    "x": n.get("x"),
                    "y": n.get("y"),
                    **n.get("data", {})
                }
                for n in result["nodes"]
            ],
            "links": [
                {
                    "source": e["source"],
                    "target": e["target"],
                    "value": e.get("weight", 1)
                }
                for e in result["edges"]
            ],
            "context": context
        }

    raise HTTPException(
        status_code=400,
        detail=f"Unsupported format: {format}. Use json, cytoscape, or d3."
    )
