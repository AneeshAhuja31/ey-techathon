"""Company Knowledge RAG Agent - Retrieves relevant company documents."""
from typing import Dict, Any, List, Optional
import asyncio
import logging

from app.agents.workers.base_worker import BaseWorker
from app.agents.state import MasterState
from app.services.vector_store import get_vector_store

logger = logging.getLogger(__name__)


class CompanyKnowledgeAgent(BaseWorker):
    """
    Worker agent for retrieving relevant company documents using RAG.

    This agent:
    - Searches the Qdrant vector store for relevant documents
    - Retrieves and ranks chunks by semantic similarity
    - Synthesizes information from company documents
    """

    def __init__(self):
        super().__init__("Company Knowledge")
        self.vector_store = get_vector_store()

    async def execute(self, state: MasterState) -> Dict[str, Any]:
        """
        Execute company document retrieval and analysis.

        Args:
            state: Master state containing query and user_id

        Returns:
            Dictionary with relevant documents and synthesized insights
        """
        query = state["query"]
        user_id = state.get("options", {}).get("user_id")

        await self.update_progress(10, "Searching company documents...")

        # Search for relevant document chunks
        try:
            results = await self.vector_store.search(
                query=query,
                user_id=user_id,
                limit=10,
                score_threshold=0.4
            )
        except Exception as e:
            logger.error(f"Error searching vector store: {e}")
            results = []

        await self.update_progress(50, f"Found {len(results)} relevant sections...")

        if not results:
            await self.update_progress(100, "No company documents found")
            return {
                "has_documents": False,
                "message": "No relevant company documents found. Please upload documents for company-specific analysis.",
                "relevant_chunks": [],
                "synthesized_insights": None
            }

        await self.update_progress(70, "Synthesizing insights...")

        # Group by document
        docs_by_id = {}
        for r in results:
            doc_id = r.get("doc_id", "unknown")
            if doc_id not in docs_by_id:
                docs_by_id[doc_id] = {
                    "doc_id": doc_id,
                    "filename": r.get("filename", "Unknown"),
                    "chunks": []
                }
            docs_by_id[doc_id]["chunks"].append({
                "text": r.get("text", ""),
                "score": r.get("score", 0),
                "chunk_index": r.get("chunk_index", 0)
            })

        # Synthesize insights
        insights = self._synthesize_insights(query, results)

        await self.update_progress(100, "Company document analysis complete")

        return {
            "has_documents": True,
            "document_count": len(docs_by_id),
            "documents": list(docs_by_id.values()),
            "relevant_chunks": [
                {
                    "text": r.get("text", "")[:500],  # Truncate for response
                    "filename": r.get("filename"),
                    "score": round(r.get("score", 0), 3),
                }
                for r in results[:5]  # Top 5 chunks
            ],
            "synthesized_insights": insights
        }

    def _synthesize_insights(
        self,
        query: str,
        chunks: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Synthesize insights from retrieved document chunks.

        In production, this would use an LLM to generate insights.
        For now, provides structured summary of retrieved content.
        """
        if not chunks:
            return None

        # Extract key information
        total_chunks = len(chunks)
        avg_score = sum(c.get("score", 0) for c in chunks) / total_chunks if total_chunks > 0 else 0

        # Get unique filenames
        filenames = list(set(c.get("filename", "Unknown") for c in chunks))

        # Combine text for summary
        combined_text = " ".join(c.get("text", "") for c in chunks[:3])
        summary_preview = combined_text[:500] + "..." if len(combined_text) > 500 else combined_text

        return {
            "relevance_summary": f"Found {total_chunks} relevant sections with average relevance score of {avg_score:.2f}",
            "source_documents": filenames,
            "key_content_preview": summary_preview,
            "analysis_notes": [
                f"Query: {query}",
                f"Documents analyzed: {len(filenames)}",
                f"Relevant sections: {total_chunks}",
                "Note: For detailed analysis, an LLM integration would synthesize these findings."
            ]
        }

    async def check_has_documents(self, user_id: Optional[str] = None) -> bool:
        """
        Check if user has any uploaded documents.

        Args:
            user_id: Optional user identifier

        Returns:
            True if documents exist, False otherwise
        """
        try:
            # Do a broad search to see if any documents exist
            results = await self.vector_store.search(
                query="*",  # Wildcard-like search
                user_id=user_id,
                limit=1,
                score_threshold=0.0
            )
            return len(results) > 0
        except Exception as e:
            logger.error(f"Error checking documents: {e}")
            return False
