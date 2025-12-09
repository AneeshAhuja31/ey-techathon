"""LangGraph StateGraph construction for Master-Worker orchestration."""
from typing import Dict, Any, List, Literal
from datetime import datetime

from langgraph.graph import StateGraph, END

from app.agents.state import MasterState, WorkerOutput, create_initial_state
from app.agents.workers.iqvia_agent import IQVIAInsightsWorker
from app.agents.workers.patent_agent import PatentLandscapeWorker
from app.agents.workers.clinical_agent import ClinicalTrialsWorker
from app.agents.workers.web_intel_agent import WebIntelligenceWorker
from app.agents.workers.report_agent import ReportGeneratorWorker


# Initialize worker instances
iqvia_worker = IQVIAInsightsWorker()
patent_worker = PatentLandscapeWorker()
clinical_worker = ClinicalTrialsWorker()
web_intel_worker = WebIntelligenceWorker()
report_worker = ReportGeneratorWorker()


async def intent_classifier(state: MasterState) -> Dict[str, Any]:
    """
    Classify user intent and extract key entities.

    This node analyzes the query to understand what the user wants
    and extracts relevant entities (molecules, diseases, etc.).
    """
    query = state["query"].lower()

    # Simple intent classification (in production, use LLM)
    intent = "drug_research"  # Default intent

    if "patent" in query:
        intent = "patent_search"
    elif "clinical" in query or "trial" in query:
        intent = "clinical_analysis"
    elif "market" in query or "sales" in query:
        intent = "market_analysis"
    elif "compare" in query:
        intent = "comparison"

    # Extract entities (simple keyword extraction)
    entities = []
    keywords = ["glp-1", "glp1", "semaglutide", "tirzepatide", "obesity",
                "diabetes", "wegovy", "ozempic", "mounjaro", "rybelsus"]

    for keyword in keywords:
        if keyword in query:
            entities.append(keyword)

    return {
        "intent": intent,
        "entities": entities,
        "status": "processing",
        "progress": 10,
        "updated_at": datetime.utcnow().isoformat()
    }


async def task_planner(state: MasterState) -> Dict[str, Any]:
    """
    Plan subtasks based on intent and options.

    Creates a list of subtasks to be executed by worker agents.
    """
    options = state.get("options", {})
    intent = state.get("intent", "drug_research")

    subtasks = []

    # Always include relevant workers based on options
    if options.get("include_market_data", True):
        subtasks.append({
            "id": "task_iqvia",
            "worker_type": "iqvia",
            "description": "Gather market intelligence and sales data",
            "priority": 1
        })

    if options.get("include_patents", True):
        subtasks.append({
            "id": "task_patent",
            "worker_type": "patent",
            "description": "Search patent databases and analyze IP landscape",
            "priority": 1
        })

    if options.get("include_clinical_trials", True):
        subtasks.append({
            "id": "task_clinical",
            "worker_type": "clinical",
            "description": "Search and analyze clinical trials",
            "priority": 1
        })

    if options.get("include_web_intel", True):
        subtasks.append({
            "id": "task_web",
            "worker_type": "web_intel",
            "description": "Gather news and sentiment data",
            "priority": 2
        })

    # Always add report generation
    subtasks.append({
        "id": "task_report",
        "worker_type": "report",
        "description": "Synthesize findings into comprehensive report",
        "priority": 3  # Run after other workers
    })

    return {
        "subtasks": subtasks,
        "progress": 15,
        "updated_at": datetime.utcnow().isoformat()
    }


async def iqvia_node(state: MasterState) -> Dict[str, Any]:
    """Execute IQVIA Insights worker."""
    result = await iqvia_worker.run(state)
    return {
        **result,
        "progress": 35,
        "updated_at": datetime.utcnow().isoformat()
    }


async def patent_node(state: MasterState) -> Dict[str, Any]:
    """Execute Patent Landscape worker."""
    result = await patent_worker.run(state)
    return {
        **result,
        "progress": 50,
        "updated_at": datetime.utcnow().isoformat()
    }


async def clinical_node(state: MasterState) -> Dict[str, Any]:
    """Execute Clinical Trials worker."""
    result = await clinical_worker.run(state)
    return {
        **result,
        "progress": 65,
        "updated_at": datetime.utcnow().isoformat()
    }


async def web_intel_node(state: MasterState) -> Dict[str, Any]:
    """Execute Web Intelligence worker."""
    result = await web_intel_worker.run(state)
    return {
        **result,
        "progress": 80,
        "updated_at": datetime.utcnow().isoformat()
    }


async def synthesizer_node(state: MasterState) -> Dict[str, Any]:
    """Execute Report Generator to synthesize all outputs."""
    result = await report_worker.run(state)

    # Extract mind map and report from worker output
    worker_outputs = result.get("worker_outputs", [])
    report_output = None
    for output in worker_outputs:
        if isinstance(output, WorkerOutput) and output.worker_name == "Report Generator":
            report_output = output.data
            break
        elif isinstance(output, dict) and output.get("worker_name") == "Report Generator":
            report_output = output.get("data", {})
            break

    mind_map_data = report_output.get("mind_map_data") if report_output else None
    final_report = report_output.get("summary") if report_output else None

    return {
        **result,
        "mind_map_data": mind_map_data,
        "final_report": final_report,
        "status": "completed",
        "progress": 100,
        "updated_at": datetime.utcnow().isoformat()
    }


def should_run_workers(state: MasterState) -> Literal["parallel_workers", "synthesizer"]:
    """Determine if we should run workers or skip to synthesis."""
    subtasks = state.get("subtasks", [])
    worker_outputs = state.get("worker_outputs", [])

    # Check if we have worker tasks to run
    worker_tasks = [t for t in subtasks if t.get("worker_type") != "report"]

    if not worker_tasks:
        return "synthesizer"

    # Check if workers have completed
    completed_workers = set()
    for output in worker_outputs:
        if isinstance(output, WorkerOutput):
            if output.status == "completed":
                completed_workers.add(output.worker_name)
        elif isinstance(output, dict):
            if output.get("status") == "completed":
                completed_workers.add(output.get("worker_name"))

    expected_workers = {"IQVIA Insights", "Patent Landscape", "Clinical Trials", "Web Intelligence"}
    if completed_workers >= expected_workers:
        return "synthesizer"

    return "parallel_workers"


def create_drug_discovery_graph() -> StateGraph:
    """
    Create the LangGraph StateGraph for drug discovery analysis.

    Architecture:
    1. Intent Classifier -> Task Planner
    2. Task Planner -> Parallel Workers (IQVIA, Patent, Clinical, Web Intel)
    3. All Workers -> Synthesizer
    4. Synthesizer -> END

    For MVP, workers run sequentially. In production, use Send API for parallel.
    """
    # Create the graph
    graph = StateGraph(MasterState)

    # Add nodes
    graph.add_node("intent_classifier", intent_classifier)
    graph.add_node("task_planner", task_planner)
    graph.add_node("iqvia_worker", iqvia_node)
    graph.add_node("patent_worker", patent_node)
    graph.add_node("clinical_worker", clinical_node)
    graph.add_node("web_intel_worker", web_intel_node)
    graph.add_node("synthesizer", synthesizer_node)

    # Set entry point
    graph.set_entry_point("intent_classifier")

    # Add edges - Sequential flow for MVP
    graph.add_edge("intent_classifier", "task_planner")
    graph.add_edge("task_planner", "iqvia_worker")
    graph.add_edge("iqvia_worker", "patent_worker")
    graph.add_edge("patent_worker", "clinical_worker")
    graph.add_edge("clinical_worker", "web_intel_worker")
    graph.add_edge("web_intel_worker", "synthesizer")
    graph.add_edge("synthesizer", END)

    return graph


def compile_graph():
    """Compile the graph for execution."""
    graph = create_drug_discovery_graph()
    return graph.compile()


# Pre-compiled graph for reuse
compiled_graph = None


def get_compiled_graph():
    """Get or create the compiled graph (singleton pattern)."""
    global compiled_graph
    if compiled_graph is None:
        compiled_graph = compile_graph()
    return compiled_graph
