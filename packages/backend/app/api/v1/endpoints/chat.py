"""Chat initiation endpoint with dual query mode detection."""
import json
from typing import Optional, Tuple, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from openai import OpenAI

from app.db.database import get_db, AsyncSessionLocal
from app.schemas.chat import (
    ChatInitiateRequest,
    ChatInitiateResponse,
    SimpleChatRequest,
    SimpleChatResponse,
)
from app.services.job_service import JobService
from app.services.vector_store import get_vector_store
from app.models.document import Document
from app.core.config import settings

router = APIRouter()

# System prompt for the AI assistant
SYSTEM_PROMPT = """You are DrugAI, an intelligent assistant specialized in drug discovery and pharmaceutical research.
You help researchers with:
- Understanding drug mechanisms, molecules, and compounds
- Explaining pharmaceutical concepts and terminology
- Discussing clinical trials and regulatory processes
- Providing insights on market trends and patent landscapes
- Answering questions about diseases and therapeutic targets

You are knowledgeable, helpful, and provide accurate scientific information.
When users ask for comprehensive research, patent analysis, or market studies, suggest they use the research feature which will deploy specialized AI agents for in-depth analysis.

Keep responses concise but informative. Use scientific terminology appropriately."""

# Keywords that indicate a research job should be started
RESEARCH_KEYWORDS = [
    "research", "analyze", "comprehensive", "deep dive", "patent search",
    "market analysis", "clinical trials", "find patents", "investigate",
    "full analysis", "detailed study", "landscape analysis", "competitive analysis",
    "start analysis", "run analysis", "begin research"
]

# Keywords that indicate company-specific data is requested
COMPANY_KEYWORDS = [
    "company data", "our documents", "internal", "uploaded",
    "company files", "our files", "my documents", "proprietary",
    "from our", "in our", "company's", "organization", "document"
]


def is_research_query(message: str) -> bool:
    """Determine if the message is requesting a research job."""
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in RESEARCH_KEYWORDS)


def is_company_specific_query(message: str) -> bool:
    """Determine if the message is asking for company-specific data."""
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in COMPANY_KEYWORDS)


async def check_documents_and_relevance(message: str) -> Tuple[bool, int, List[dict]]:
    """
    Check if documents exist and if any are relevant to the query via vector search.

    Returns:
        Tuple of (has_documents, doc_count, relevant_results)
    """
    has_documents = False
    doc_count = 0
    relevant_results = []

    try:
        # Check database for ready documents
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(func.count(Document.id)).where(Document.status == "ready")
            )
            doc_count = result.scalar() or 0
            has_documents = doc_count > 0

        # If documents exist, do vector search to check relevance
        if has_documents:
            vector_store = get_vector_store()
            search_results = await vector_store.search(
                query=message,
                limit=5,
                score_threshold=0.35  # Moderate threshold for relevance
            )
            relevant_results = search_results if search_results else []

    except Exception as e:
        print(f"Error checking documents: {e}")

    return has_documents, doc_count, relevant_results


async def classify_query_with_llm(
    message: str,
    has_documents: bool,
    relevant_results: List[dict]
) -> Tuple[bool, bool, str]:
    """
    Use LLM to classify query intent with context about available documents.

    Returns:
        Tuple of (is_company_query, should_run_full_analysis, reasoning)
    """
    # First check keyword-based detection
    keyword_company = is_company_specific_query(message)
    keyword_research = is_research_query(message)

    # If documents exist and we found relevant matches, likely a company query
    has_relevant_docs = has_documents and len(relevant_results) > 0

    # If no API key, use keyword + vector search based detection
    if not settings.openai_api_key:
        is_company = keyword_company or has_relevant_docs
        should_analyze = keyword_research or is_company
        return is_company, should_analyze, "keyword_vector_fallback"

    try:
        client = OpenAI(api_key=settings.openai_api_key)

        # Build context about document relevance
        doc_context = ""
        if has_relevant_docs:
            snippets = [f'- "{r["text"][:150]}..." (score: {r.get("score", 0):.2f})' for r in relevant_results[:3]]
            doc_context = f"""
The user has {len(relevant_results)} uploaded company documents that are RELEVANT to this query.
Relevant document snippets found via vector search:
{chr(10).join(snippets)}

This strongly suggests the user wants to query their company documents.
"""
        elif has_documents:
            doc_context = "\nThe user has uploaded company documents, but they don't seem directly relevant to this query."
        else:
            doc_context = "\nNo company documents have been uploaded."

        classification_prompt = f"""Analyze this user query and classify its intent.

USER QUERY: "{message}"

CONTEXT:{doc_context}

Keyword detection found:
- Company-related keywords: {keyword_company}
- Research/analysis keywords: {keyword_research}

Classify the query:
1. is_company_query: Is the user asking about or wanting to use their company/uploaded documents? (True if relevant docs found OR company keywords detected)
2. should_run_analysis: Should this trigger a comprehensive analysis pipeline? (True for company queries with docs, research requests, or complex analysis needs)

Consider:
- If relevant document snippets were found via vector search → definitely a company query that needs analysis
- If query mentions "our", "company", "uploaded", "internal", "documents" → company query
- If query asks for research, analysis, investigation → needs full analysis
- Simple greetings or basic factual questions → don't need analysis

Respond in JSON format only:
{{"is_company_query": true/false, "should_run_analysis": true/false, "reasoning": "brief explanation"}}"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Fast model for classification
            messages=[
                {"role": "system", "content": "You are a query classifier. Respond only with valid JSON."},
                {"role": "user", "content": classification_prompt}
            ],
            max_tokens=200,
            temperature=0,
        )

        result_text = response.choices[0].message.content.strip()
        # Handle potential markdown code blocks
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]
        result = json.loads(result_text)

        return (
            result.get("is_company_query", keyword_company or has_relevant_docs),
            result.get("should_run_analysis", keyword_research),
            result.get("reasoning", "llm_classification")
        )
    except Exception as e:
        print(f"LLM classification error: {e}")
        # Fallback: if we have relevant docs, treat as company query needing analysis
        is_company = keyword_company or has_relevant_docs
        should_analyze = keyword_research or has_relevant_docs
        return is_company, should_analyze, f"fallback: {str(e)}"


@router.post("/simple", response_model=SimpleChatResponse)
async def simple_chat(request: SimpleChatRequest):
    """
    Simple chat endpoint with smart query mode detection.

    Query Modes:
    1. General Mode: Uses OpenAI for simple questions (default)
    2. Research Mode: Triggers agentic pipeline for comprehensive analysis
    3. Company-Specific Mode: Triggers full analysis with company RAG included

    Uses LLM + vector search for intelligent intent classification.
    Company queries with documents now trigger the full pipeline (with progress bar).
    """
    try:
        # Step 1: Check documents and do relevance search
        has_documents, doc_count, relevant_results = await check_documents_and_relevance(request.message)

        # Step 2: Use LLM to classify intent with document context
        is_company_query, should_run_analysis, reasoning = await classify_query_with_llm(
            request.message,
            has_documents,
            relevant_results
        )

        print(f"Query classification: company={is_company_query}, analyze={should_run_analysis}, reason={reasoning}")

        # Step 3: Handle company query without documents
        if is_company_query and not has_documents:
            return SimpleChatResponse(
                response="I'd love to help analyze your company data! However, I don't see any uploaded documents yet. Please upload your company documents (PDF, DOCX, TXT) using the upload button, and then I can search and analyze your proprietary information.",
                is_research_query=False,
                is_company_query=True,
                requires_documents=True
            )

        # Step 4: Company query with documents OR research query → trigger full analysis pipeline
        # This shows the progress bar with all nodes including company RAG
        if should_run_analysis or (is_company_query and has_documents):
            return SimpleChatResponse(
                response="",  # No canned message - frontend will start job directly
                is_research_query=True,  # This triggers the job with progress bar
                is_company_query=is_company_query  # Frontend uses this to include company data
            )

        # Step 5: Simple keyword-based research check (fallback)
        if is_research_query(request.message):
            return SimpleChatResponse(
                response="",
                is_research_query=True,
                is_company_query=is_company_query
            )

        # Use OpenAI for regular chat (General Mode)
        if not settings.openai_api_key:
            # Fallback response if no API key
            return SimpleChatResponse(
                response=get_fallback_response(request.message),
                is_research_query=False
            )

        client = OpenAI(api_key=settings.openai_api_key)

        # Build messages
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add conversation history if provided
        if request.conversation_history:
            for msg in request.conversation_history[-10:]:  # Last 10 messages for context
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

        # Add current message
        messages.append({"role": "user", "content": request.message})

        # Call OpenAI
        response = client.chat.completions.create(
            model=settings.llm_model,
            messages=messages,
            max_tokens=1000,
            temperature=0.7,
        )

        ai_response = response.choices[0].message.content

        return SimpleChatResponse(
            response=ai_response,
            is_research_query=False
        )

    except Exception as e:
        print(f"Chat error: {e}")
        return SimpleChatResponse(
            response=get_fallback_response(request.message),
            is_research_query=False
        )


def get_fallback_response(message: str) -> str:
    """Generate a fallback response when OpenAI is unavailable."""
    message_lower = message.lower()

    # Simple keyword-based responses
    if "glp-1" in message_lower or "glp1" in message_lower:
        return """GLP-1 (Glucagon-like peptide-1) is an incretin hormone that plays a crucial role in glucose metabolism. It's secreted by intestinal L-cells after eating and stimulates insulin secretion while inhibiting glucagon release.

GLP-1 receptor agonists (like semaglutide, liraglutide, and tirzepatide) are a class of medications used primarily for:
- Type 2 diabetes management
- Weight loss / Obesity treatment

Popular GLP-1 medications include:
- **Ozempic** (semaglutide) - for diabetes
- **Wegovy** (semaglutide) - for weight loss
- **Rybelsus** (oral semaglutide) - for diabetes
- **Mounjaro** (tirzepatide) - dual GIP/GLP-1 agonist

Would you like me to run a comprehensive research analysis on GLP-1 agonists?"""

    elif "semaglutide" in message_lower:
        return """Semaglutide is a GLP-1 receptor agonist developed by Novo Nordisk. It's available under several brand names:

- **Ozempic** - Injectable for Type 2 diabetes (weekly)
- **Wegovy** - Injectable for weight management (weekly)
- **Rybelsus** - Oral tablet for Type 2 diabetes (daily)

Mechanism: Semaglutide mimics the GLP-1 hormone, increasing insulin secretion, reducing appetite, and slowing gastric emptying.

Key clinical outcomes:
- Up to 15% weight loss in clinical trials
- Significant HbA1c reduction
- Cardiovascular benefits demonstrated

Would you like a detailed patent landscape or clinical trial analysis?"""

    elif "obesity" in message_lower or "weight loss" in message_lower:
        return """Obesity is a chronic disease affecting over 650 million adults worldwide. Current pharmacological treatments include:

**GLP-1 Agonists:**
- Semaglutide (Wegovy) - 15-17% weight loss
- Liraglutide (Saxenda) - 5-10% weight loss
- Tirzepatide (Zepbound) - Up to 22% weight loss

**Other Approved Medications:**
- Orlistat - Lipase inhibitor
- Phentermine/Topiramate - Appetite suppressant combination
- Naltrexone/Bupropion - Central nervous system approach

The obesity drug market is rapidly growing, with GLP-1 agonists dominating due to superior efficacy. Would you like me to analyze the market landscape or patent filings?"""

    elif "patent" in message_lower:
        return """Patents in drug discovery protect innovations in:
- New molecular entities (composition of matter)
- Formulations and delivery systems
- Methods of treatment
- Manufacturing processes

Key considerations:
- Patent term: Generally 20 years from filing
- Patent cliffs: Major revenue loss when patents expire
- Patent landscaping: Understanding competitive IP positions
- FTO (Freedom to Operate): Ensuring no infringement

For the GLP-1 space, key patent holders include Novo Nordisk, Eli Lilly, and various formulation innovators.

Would you like me to run a comprehensive patent landscape analysis?"""

    elif "clinical trial" in message_lower:
        return """Clinical trials are research studies that test medical interventions in humans. They proceed through phases:

**Phase 1:** Safety & dosing (20-100 participants)
**Phase 2:** Efficacy & side effects (100-500 participants)
**Phase 3:** Large-scale efficacy (1,000-5,000 participants)
**Phase 4:** Post-market surveillance

Key databases:
- ClinicalTrials.gov - US registry
- EU Clinical Trials Register
- WHO ICTRP - Global registry

For drug discovery, clinical trial data provides crucial insights into:
- Efficacy signals
- Safety profiles
- Competitive positioning
- Market timing

Would you like me to search clinical trials for a specific molecule or indication?"""

    elif "hello" in message_lower or "hi" in message_lower or "hey" in message_lower:
        return """Hello! I'm DrugAI, your intelligent assistant for drug discovery and pharmaceutical research.

I can help you with:
- **Drug Information** - Mechanisms, compounds, molecules
- **Market Analysis** - Industry trends and competitive landscape
- **Patent Intelligence** - IP landscape and FTO analysis
- **Clinical Trials** - Trial data and regulatory insights
- **Disease Research** - Therapeutic targets and pathways

For comprehensive research, I can deploy specialized AI agents to gather in-depth data. Just ask me to "research" or "analyze" a topic!

What would you like to explore today?"""

    elif "help" in message_lower or "what can you do" in message_lower:
        return """I'm DrugAI, your pharmaceutical research assistant. Here's what I can help with:

**Ask Me Questions About:**
- Drug mechanisms and molecular targets
- Pharmaceutical compounds and formulations
- Disease pathways and therapeutic approaches
- Market trends and competitive landscape
- Patent information and IP strategy
- Clinical trial phases and regulatory pathways

**Start Research Analysis:**
Say "research [topic]" or "analyze [topic]" to deploy our specialized AI agents for comprehensive data gathering on:
- Market intelligence (IQVIA data)
- Patent landscape analysis
- Clinical trial summaries
- Web intelligence gathering

Example: "Research GLP-1 agonists for obesity treatment"

What would you like to know?"""

    else:
        return """I'm DrugAI, specialized in drug discovery and pharmaceutical research. I can help with:

- **Drug mechanisms** and molecular information
- **Patent landscapes** and IP analysis
- **Clinical trial** insights
- **Market analysis** and competitive intelligence
- **Disease and target** information

Ask me any question about pharmaceuticals, or say "research [topic]" to start a comprehensive analysis with our specialized AI agents.

What would you like to know?"""


@router.post("/initiate", response_model=ChatInitiateResponse)
async def initiate_chat(
    request: ChatInitiateRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate a new drug discovery analysis job.

    This endpoint creates a new analysis job and starts the Master Agent
    to orchestrate the worker agents for comprehensive drug research.
    """
    try:
        job_service = JobService(db)

        options = None
        if request.options:
            options = {
                "include_patents": request.options.include_patents,
                "include_clinical_trials": request.options.include_clinical_trials,
                "include_market_data": request.options.include_market_data,
                "include_web_intel": request.options.include_web_intel
            }

        result = await job_service.create_job(
            query=request.query,
            user_id=request.user_id,
            options=options
        )

        return ChatInitiateResponse(
            job_id=result["job_id"],
            status=result["status"],
            message=result["message"],
            estimated_duration=result.get("estimated_duration", 30)
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create analysis job: {str(e)}"
        )


@router.post("/message")
async def send_message(
    job_id: str,
    message: str,
    db: AsyncSession = Depends(get_db)
):
    """Send a follow-up message to an existing job."""
    return {
        "job_id": job_id,
        "response": f"Received message: {message}. Follow-up queries will be supported in future versions.",
        "status": "acknowledged"
    }
