"""Vector store service for Qdrant integration."""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from openai import OpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Service for managing vector storage with Qdrant."""

    def __init__(self):
        self._client: Optional[QdrantClient] = None
        self._openai_client: Optional[OpenAI] = None
        self._embedding_dim = 1536  # OpenAI text-embedding-3-small dimension
        self._embedding_model = "text-embedding-3-small"

    @property
    def client(self) -> QdrantClient:
        """Lazy initialization of Qdrant client."""
        if self._client is None:
            try:
                self._client = QdrantClient(
                    host=settings.qdrant_host,
                    port=settings.qdrant_port,
                )
                logger.info(f"Connected to Qdrant at {settings.qdrant_host}:{settings.qdrant_port}")
            except Exception as e:
                logger.error(f"Failed to connect to Qdrant: {e}")
                raise
        return self._client

    @property
    def openai_client(self) -> OpenAI:
        """Lazy initialization of OpenAI client."""
        if self._openai_client is None:
            try:
                self._openai_client = OpenAI(api_key=settings.openai_api_key)
                logger.info("Initialized OpenAI client for embeddings")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
                raise
        return self._openai_client

    async def ensure_collection(self, collection_name: str = None) -> bool:
        """Ensure the collection exists, create if not."""
        collection_name = collection_name or settings.qdrant_collection

        try:
            collections = self.client.get_collections().collections
            exists = any(c.name == collection_name for c in collections)

            if not exists:
                self.client.create_collection(
                    collection_name=collection_name,
                    vectors_config=VectorParams(
                        size=self._embedding_dim,
                        distance=Distance.COSINE,
                    ),
                )
                logger.info(f"Created collection: {collection_name}")

            return True
        except Exception as e:
            logger.error(f"Error ensuring collection: {e}")
            return False

    def embed_text(self, text: str) -> List[float]:
        """Generate embedding for a text using OpenAI."""
        try:
            response = self.openai_client.embeddings.create(
                input=text,
                model=self._embedding_model
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts using OpenAI."""
        try:
            # OpenAI can handle batch embeddings
            response = self.openai_client.embeddings.create(
                input=texts,
                model=self._embedding_model
            )
            # Sort by index to maintain order
            sorted_data = sorted(response.data, key=lambda x: x.index)
            return [item.embedding for item in sorted_data]
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise

    async def add_document(
        self,
        doc_id: str,
        chunks: List[str],
        metadata: Dict[str, Any],
        collection_name: str = None
    ) -> int:
        """
        Add document chunks to the vector store.

        Args:
            doc_id: Unique document identifier
            chunks: List of text chunks
            metadata: Document metadata (user_id, filename, etc.)
            collection_name: Optional collection name

        Returns:
            Number of chunks added
        """
        collection_name = collection_name or settings.qdrant_collection

        await self.ensure_collection(collection_name)

        # Generate embeddings for all chunks
        embeddings = self.embed_texts(chunks)

        # Create points
        points = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            point_id = f"{doc_id}_{i}"
            points.append(
                PointStruct(
                    id=hash(point_id) & 0x7FFFFFFFFFFFFFFF,  # Ensure positive int64
                    vector=embedding,
                    payload={
                        "doc_id": doc_id,
                        "chunk_index": i,
                        "text": chunk,
                        "user_id": metadata.get("user_id"),
                        "filename": metadata.get("filename"),
                        "file_type": metadata.get("file_type"),
                        "created_at": datetime.utcnow().isoformat(),
                        **{k: v for k, v in metadata.items() if k not in ["user_id", "filename", "file_type"]}
                    }
                )
            )

        # Upsert in batches
        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            self.client.upsert(
                collection_name=collection_name,
                points=batch,
            )

        logger.info(f"Added {len(points)} chunks for document {doc_id}")
        return len(points)

    async def search(
        self,
        query: str,
        limit: int = 5,
        user_id: str = None,
        doc_id: str = None,
        score_threshold: float = 0.5,
        collection_name: str = None
    ) -> List[Dict[str, Any]]:
        """
        Search for similar chunks in the vector store.

        Args:
            query: Search query text
            limit: Maximum number of results
            user_id: Filter by user ID
            doc_id: Filter by document ID
            score_threshold: Minimum similarity score
            collection_name: Optional collection name

        Returns:
            List of matching chunks with metadata and scores
        """
        collection_name = collection_name or settings.qdrant_collection

        # Check if collection exists
        try:
            collections = self.client.get_collections().collections
            if not any(c.name == collection_name for c in collections):
                logger.warning(f"Collection {collection_name} does not exist")
                return []
        except Exception as e:
            logger.error(f"Error checking collection: {e}")
            return []

        # Generate query embedding
        query_embedding = self.embed_text(query)

        # Build filter conditions
        filter_conditions = []
        if user_id:
            filter_conditions.append(
                models.FieldCondition(
                    key="user_id",
                    match=models.MatchValue(value=user_id),
                )
            )
        if doc_id:
            filter_conditions.append(
                models.FieldCondition(
                    key="doc_id",
                    match=models.MatchValue(value=doc_id),
                )
            )

        query_filter = None
        if filter_conditions:
            query_filter = models.Filter(
                must=filter_conditions
            )

        # Search using query_points (newer qdrant-client API)
        results = self.client.query_points(
            collection_name=collection_name,
            query=query_embedding,
            query_filter=query_filter,
            limit=limit,
            score_threshold=score_threshold,
        ).points

        # Format results
        formatted_results = []
        for result in results:
            formatted_results.append({
                "text": result.payload.get("text", ""),
                "doc_id": result.payload.get("doc_id"),
                "filename": result.payload.get("filename"),
                "chunk_index": result.payload.get("chunk_index"),
                "score": result.score,
                "metadata": {
                    k: v for k, v in result.payload.items()
                    if k not in ["text", "doc_id", "filename", "chunk_index"]
                }
            })

        return formatted_results

    async def delete_document(
        self,
        doc_id: str,
        collection_name: str = None
    ) -> bool:
        """
        Delete all chunks for a document.

        Args:
            doc_id: Document ID to delete

        Returns:
            True if successful
        """
        collection_name = collection_name or settings.qdrant_collection

        try:
            self.client.delete(
                collection_name=collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="doc_id",
                                match=models.MatchValue(value=doc_id),
                            )
                        ]
                    )
                ),
            )
            logger.info(f"Deleted chunks for document {doc_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting document chunks: {e}")
            return False

    async def get_collection_stats(self, collection_name: str = None) -> Dict[str, Any]:
        """Get statistics about the collection."""
        collection_name = collection_name or settings.qdrant_collection

        try:
            info = self.client.get_collection(collection_name)
            return {
                "name": collection_name,
                "vectors_count": info.vectors_count,
                "points_count": info.points_count,
                "status": info.status.value if hasattr(info.status, 'value') else str(info.status),
            }
        except Exception as e:
            logger.error(f"Error getting collection stats: {e}")
            return {"error": str(e)}


# Singleton instance
_vector_store: Optional[VectorStoreService] = None


def get_vector_store() -> VectorStoreService:
    """Get or create the vector store service instance."""
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStoreService()
    return _vector_store
