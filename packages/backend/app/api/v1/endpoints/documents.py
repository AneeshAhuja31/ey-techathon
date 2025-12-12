"""Document upload and management endpoints."""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.db.database import get_db
from app.services.document_service import DocumentService
from app.services.vector_store import get_vector_store

router = APIRouter()


class DocumentResponse(BaseModel):
    """Response model for document operations."""
    id: str
    filename: str
    original_filename: Optional[str] = None
    file_type: str
    file_size: int
    chunk_count: int = 0
    status: str
    error: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class SearchRequest(BaseModel):
    """Request model for document search."""
    query: str
    user_id: Optional[str] = None
    limit: int = 5


class SearchResult(BaseModel):
    """Search result model."""
    text: str
    doc_id: str
    filename: Optional[str] = None
    chunk_index: int
    score: float


class UploadResponse(BaseModel):
    """Response for upload operation."""
    id: str
    filename: str
    file_type: str
    file_size: int
    status: str
    message: str


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    user_id: Optional[str] = Query(None, description="User ID for document ownership"),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a document for vectorization.

    Supported formats: PDF, DOCX, XLSX, TXT
    Maximum file size: 50MB (configurable)

    The document will be processed asynchronously:
    1. Text extraction
    2. Chunking
    3. Embedding generation
    4. Storage in Qdrant

    Use GET /documents/{doc_id} to check processing status.
    """
    try:
        service = DocumentService(db)
        result = await service.process_upload(file, user_id)
        return UploadResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List uploaded documents.

    Optionally filter by user_id to get only documents owned by a specific user.
    """
    service = DocumentService(db)
    documents = await service.list_documents(user_id=user_id, limit=limit)
    return [DocumentResponse(**doc) for doc in documents]


@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get document details and processing status.

    Status can be:
    - processing: Document is being processed
    - ready: Document is vectorized and searchable
    - failed: Processing failed (check error field)
    """
    service = DocumentService(db)
    document = await service.get_document(doc_id)

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return DocumentResponse(**document)


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a document and its vectors.

    This will:
    1. Remove vectors from Qdrant
    2. Delete the uploaded file
    3. Remove the database record
    """
    service = DocumentService(db)
    success = await service.delete_document(doc_id)

    if not success:
        raise HTTPException(status_code=404, detail="Document not found")

    return {"status": "deleted", "doc_id": doc_id}


@router.post("/search", response_model=List[SearchResult])
async def search_documents(
    request: SearchRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Search across uploaded documents using semantic similarity.

    The search uses vector embeddings to find relevant document chunks
    based on meaning, not just keyword matching.

    Returns the most relevant chunks with their source documents and scores.
    """
    service = DocumentService(db)
    results = await service.search_documents(
        query=request.query,
        user_id=request.user_id,
        limit=request.limit
    )

    return [SearchResult(
        text=r["text"],
        doc_id=r["doc_id"],
        filename=r.get("filename"),
        chunk_index=r.get("chunk_index", 0),
        score=r["score"]
    ) for r in results]


@router.get("/stats/collection")
async def get_collection_stats():
    """
    Get statistics about the vector collection.

    Returns information about the number of vectors stored,
    collection status, etc.
    """
    vector_store = get_vector_store()
    stats = await vector_store.get_collection_stats()
    return stats
