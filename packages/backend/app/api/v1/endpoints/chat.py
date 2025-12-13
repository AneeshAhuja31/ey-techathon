"""Chat initiation endpoint with LLM-based explicit intent detection."""
import json
import re
import logging
from typing import Optional, Tuple, List, Dict, Any
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
logger = logging.getLogger(__name__)

# System prompt for the AI assistant
SYSTEM_PROMPT = """You are DrugAI, an intelligent assistant specialized in drug discovery and pharmaceutical research.
You help researchers with:
- Understanding drug mechanisms, molecules, and compounds
- Explaining pharmaceutical concepts and terminology
- Discussing clinical trials and regulatory processes
- Providing insights on market trends and patent landscapes
- Answering questions about diseases and therapeutic targets

You are knowledgeable, helpful, and provide accurate scientific information.
When users explicitly request comprehensive research, analysis, or mindmaps, suggest they use clear commands like "research [topic]" or "create mindmap for [topic]".

Keep responses concise but informative. Use scientific terminology appropriately."""

# Intent classification prompt for explicit detection
INTENT_CLASSIFICATION_PROMPT = """You are an intent classifier for a pharmaceutical research platform. Analyze the user's message to determine what they want.

CONVERSATION HISTORY:
{conversation_history}

CURRENT USER MESSAGE: "{message}"

DOCUMENT CONTEXT:{doc_context}

Classify the intent into ONE of these categories:

1. **DIRECT_ANSWER**: Questions that can be answered directly. THIS IS THE DEFAULT.
   - "What is X?", "How does X work?", "Explain X", "Tell me about X"
   - "Analyze X" or "Based on Y, analyze X" → DIRECT_ANSWER (just wants explanation)
   - Any question that doesn't explicitly request research/mindmap

2. **FULL_RESEARCH**: ONLY when user uses these EXACT command phrases:
   - "do research on [topic]" / "do research about [topic]"
   - "create mindmap for [topic]" / "create a mindmap"
   - "run full analysis on [topic]"
   - "conduct comprehensive research"

   CRITICAL: These do NOT trigger FULL_RESEARCH:
   - "analyze X" → DIRECT_ANSWER
   - "what's the research on X" → DIRECT_ANSWER
   - "I'm researching X" → DIRECT_ANSWER
   - "tell me about X" → DIRECT_ANSWER
   - "based on X, analyze Y" → DIRECT_ANSWER

3. **DIRECT_PATENT**: User specifically wants patent search.
   - "show patents for X", "find patents about X", "list patents"
   - Specific patent: "show patent US10456789"

4. **COMPANY_DATA**: User wants to query their uploaded documents.
   - "what do our documents say about X"
   - "search our company files for X"
   - Contains: "our documents", "our files", "company data", "uploaded files"

RULES:
- Default is ALWAYS DIRECT_ANSWER
- FULL_RESEARCH requires EXPLICIT command phrases like "do research on" or "create mindmap for"
- "Analyze", "investigate", "look into" alone → DIRECT_ANSWER
- When in doubt → DIRECT_ANSWER

Respond in JSON:
{{
    "intent": "DIRECT_ANSWER|FULL_RESEARCH|DIRECT_PATENT|COMPANY_DATA",
    "confidence": 0.0-1.0,
    "patent_id": null,
    "reasoning": "brief explanation"
}}"""

# Keywords for company-specific data (used for context, not primary classification)
COMPANY_KEYWORDS = [
    "company data", "our documents", "internal", "uploaded",
    "company files", "our files", "my documents", "proprietary",
    "from our", "in our", "company's", "organization"
]


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


async def classify_intent_with_llm(
    message: str,
    conversation_history: List[Dict[str, str]] = None,
    has_documents: bool = False,
    relevant_results: List[dict] = None
) -> Dict[str, Any]:
    """
    Use LLM to classify user intent with explicit detection.
    Only triggers research/mindmap when user EXPLICITLY requests it.

    Returns:
        Dict with intent, confidence, patent_id (if applicable), reasoning
    """
    # First check for specific patent ID in message
    patent_id_match = re.search(r'(US[\d,]+|EP[\d]+|WO[\d/]+|CN[\d]+[A-Z]?)', message, re.IGNORECASE)

    # If no API key, use fallback detection
    if not settings.openai_api_key:
        return _fallback_intent_classification(message, patent_id_match)

    try:
        client = OpenAI(api_key=settings.openai_api_key)

        # Format conversation history
        history_text = "None"
        if conversation_history:
            history_lines = []
            for msg in conversation_history[-5:]:  # Last 5 messages
                role = msg.get("role", "user")
                content = msg.get("content", "")[:200]  # Truncate
                history_lines.append(f"{role.upper()}: {content}")
            history_text = "\n".join(history_lines)

        # Build document context
        doc_context = ""
        if relevant_results and len(relevant_results) > 0:
            snippets = [f'- "{r["text"][:100]}..."' for r in relevant_results[:2]]
            doc_context = f"\nUser has uploaded documents. Relevant snippets found:\n{chr(10).join(snippets)}"
        elif has_documents:
            doc_context = "\nUser has uploaded company documents (not directly relevant to this query)."
        else:
            doc_context = "\nNo company documents uploaded."

        prompt = INTENT_CLASSIFICATION_PROMPT.format(
            conversation_history=history_text,
            message=message,
            doc_context=doc_context
        )

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an intent classifier. Respond only with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=200,
            temperature=0,
        )

        result_text = response.choices[0].message.content.strip()
        # Handle markdown code blocks
        if result_text.startswith("```"):
            result_text = result_text.split("```")[1]
            if result_text.startswith("json"):
                result_text = result_text[4:]

        result = json.loads(result_text)

        # Override patent_id if we found one in message
        if patent_id_match and result.get("intent") == "DIRECT_PATENT":
            result["patent_id"] = patent_id_match.group(1)

        logger.info(f"Intent classification: {result}")
        return result

    except Exception as e:
        logger.error(f"Intent classification error: {e}")
        return _fallback_intent_classification(message, patent_id_match)


async def generate_rag_response(
    message: str,
    document_context: str,
    conversation_history: List[Dict[str, str]] = None
) -> str:
    """
    Generate an LLM response using document context (RAG).
    This is used for COMPANY_DATA queries - simple RAG, not full research pipeline.
    """
    if not settings.openai_api_key:
        return f"Based on your company documents, I found relevant information about your query. However, I need an API key to synthesize a proper response. Please configure OpenAI API key."

    try:
        client = OpenAI(api_key=settings.openai_api_key)

        rag_system_prompt = """You are DrugAI, an intelligent assistant for pharmaceutical research.
You have access to the user's company documents. Use the provided document context to answer their question.

IMPORTANT:
- Base your answer primarily on the document context provided
- If the context doesn't contain relevant information, say so clearly
- Be concise but thorough
- Cite specific information from the documents when possible"""

        messages = [{"role": "system", "content": rag_system_prompt}]

        # Add conversation history
        if conversation_history:
            for msg in conversation_history[-5:]:
                messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })

        # Add document context and user message
        user_content = f"""DOCUMENT CONTEXT:
{document_context}

USER QUESTION: {message}

Please answer based on the document context above."""

        messages.append({"role": "user", "content": user_content})

        response = client.chat.completions.create(
            model=settings.llm_model,
            messages=messages,
            max_tokens=1000,
            temperature=0.7,
        )

        return response.choices[0].message.content

    except Exception as e:
        logger.error(f"RAG response error: {e}")
        return f"I found relevant information in your documents but encountered an error generating the response. Please try again."


def _fallback_intent_classification(message: str, patent_id_match=None) -> Dict[str, Any]:
    """Fallback intent classification when LLM is unavailable. Very strict - defaults to DIRECT_ANSWER."""
    message_lower = message.lower()

    # Check for specific patent ID
    if patent_id_match:
        return {
            "intent": "DIRECT_PATENT",
            "confidence": 0.9,
            "patent_id": patent_id_match.group(1),
            "reasoning": "Specific patent ID detected"
        }

    # Check for explicit patent search triggers
    PATENT_TRIGGERS = [
        "show patents", "find patents", "list patents", "search patents",
        "patents about", "patents for", "patent search", "get patent"
    ]
    if any(trigger in message_lower for trigger in PATENT_TRIGGERS):
        return {
            "intent": "DIRECT_PATENT",
            "confidence": 0.85,
            "patent_id": None,
            "reasoning": "Patent search keywords detected"
        }

    # Check for VERY EXPLICIT research/mindmap triggers ONLY
    # These must be command phrases, not just keywords
    RESEARCH_TRIGGERS = [
        "do research on", "do research about",
        "create mindmap", "create a mindmap", "make mindmap", "generate mindmap",
        "run full analysis on", "conduct comprehensive research"
    ]
    if any(trigger in message_lower for trigger in RESEARCH_TRIGGERS):
        return {
            "intent": "FULL_RESEARCH",
            "confidence": 0.85,
            "patent_id": None,
            "reasoning": "Explicit research/mindmap command detected"
        }

    # Check for company data keywords - but this will do RAG, not full research
    if is_company_specific_query(message):
        return {
            "intent": "COMPANY_DATA",
            "confidence": 0.8,
            "patent_id": None,
            "reasoning": "Company data keywords detected - will do RAG query"
        }

    # Default to direct answer (this is the most common case)
    return {
        "intent": "DIRECT_ANSWER",
        "confidence": 0.7,
        "patent_id": None,
        "reasoning": "Default to direct answer - no explicit research command found"
    }


@router.post("/simple", response_model=SimpleChatResponse)
async def simple_chat(request: SimpleChatRequest):
    """
    Simple chat endpoint with LLM-based explicit intent detection.

    Query Modes:
    1. DIRECT_ANSWER: Uses OpenAI for simple questions (default)
    2. FULL_RESEARCH: Only when user EXPLICITLY requests research/mindmap
    3. DIRECT_PATENT: When user asks for patents specifically
    4. COMPANY_DATA: When user wants to query uploaded documents

    Key principle: Only trigger research pipeline when user explicitly asks.
    "What is X" → direct answer, not research.
    "Do research on X" → triggers research pipeline.
    """
    try:
        # Step 1: Check documents and do relevance search
        has_documents, doc_count, relevant_results = await check_documents_and_relevance(request.message)

        # Step 2: Use LLM to classify intent with conversation context
        intent_result = await classify_intent_with_llm(
            message=request.message,
            conversation_history=request.conversation_history,
            has_documents=has_documents,
            relevant_results=relevant_results
        )

        intent = intent_result.get("intent", "DIRECT_ANSWER")
        patent_id = intent_result.get("patent_id")
        confidence = intent_result.get("confidence", 0.7)

        logger.info(f"Query intent: {intent} (confidence: {confidence})")

        # Step 3: Handle based on intent
        if intent == "DIRECT_PATENT":
            # Return signal to trigger direct patent search
            return SimpleChatResponse(
                response="",
                is_research_query=False,
                is_patent_query=True,
                patent_id=patent_id,
                is_company_query=False
            )

        if intent == "FULL_RESEARCH":
            # User explicitly requested research/mindmap
            is_company_query = is_company_specific_query(request.message) or (has_documents and len(relevant_results) > 0)
            return SimpleChatResponse(
                response="",
                is_research_query=True,
                is_company_query=is_company_query
            )

        if intent == "COMPANY_DATA":
            # User wants to query company documents - do RAG, NOT full research
            if not has_documents:
                return SimpleChatResponse(
                    response="I'd love to help with your company data! However, no documents have been uploaded yet. Please upload your company documents (PDF, DOCX, TXT) using the upload button.",
                    is_research_query=False,
                    is_company_query=True,
                    requires_documents=True
                )

            # Has documents - do RAG query and return LLM response directly
            # Build document context from relevant results
            if relevant_results:
                doc_context = "\n\n".join([
                    f"[From: {r.get('metadata', {}).get('filename', 'document')}]\n{r.get('text', '')}"
                    for r in relevant_results[:5]
                ])
            else:
                # No relevant results found, do a fresh search
                vector_store = get_vector_store()
                search_results = await vector_store.search(query=request.message, limit=5)
                if search_results:
                    doc_context = "\n\n".join([
                        f"[From: {r.get('metadata', {}).get('filename', 'document')}]\n{r.get('text', '')}"
                        for r in search_results[:5]
                    ])
                else:
                    doc_context = "No relevant information found in your documents for this query."

            # Generate LLM response with document context
            rag_response = await generate_rag_response(
                message=request.message,
                document_context=doc_context,
                conversation_history=request.conversation_history
            )

            return SimpleChatResponse(
                response=rag_response,
                is_research_query=False,  # NO research pipeline - just RAG response
                is_company_query=True
            )

        # Step 4: DIRECT_ANSWER - Use OpenAI for regular chat
        if not settings.openai_api_key:
            return SimpleChatResponse(
                response=get_fallback_response(request.message),
                is_research_query=False
            )

        client = OpenAI(api_key=settings.openai_api_key)

        # Build messages
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]

        # Add conversation history if provided
        if request.conversation_history:
            for msg in request.conversation_history[-10:]:
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
        logger.error(f"Chat error: {e}")
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
