"""Document model for storing uploaded company documents."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, JSON

from app.db.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Document(Base):
    """Document model - represents an uploaded company document."""

    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), nullable=True)  # Optional user association
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)  # pdf, docx, xlsx
    file_size = Column(Integer, nullable=False)  # bytes
    chunk_count = Column(Integer, default=0)
    status = Column(String(20), default="processing")  # processing, ready, failed
    error = Column(Text, nullable=True)
    doc_metadata = Column(JSON, nullable=True)  # Additional document metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "filename": self.filename,
            "original_filename": self.original_filename,
            "file_type": self.file_type,
            "file_size": self.file_size,
            "chunk_count": self.chunk_count,
            "status": self.status,
            "error": self.error,
            "metadata": self.doc_metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
