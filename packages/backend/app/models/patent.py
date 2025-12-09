"""Patent model."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, Float

from app.db.database import Base


def generate_uuid():
    return str(uuid.uuid4())


class Patent(Base):
    """Patent model - represents a pharmaceutical patent."""

    __tablename__ = "patents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patent_id = Column(String(50), unique=True, nullable=False)  # e.g., "US10,456,789"
    title = Column(String(500), nullable=False)
    abstract = Column(Text, nullable=True)
    assignee = Column(String(200), nullable=True)
    filing_date = Column(DateTime, nullable=True)
    publication_date = Column(DateTime, nullable=True)
    expiration_date = Column(DateTime, nullable=True)
    relevance_score = Column(Float, default=0.0)  # 0-100
    molecule = Column(String(200), nullable=True)
    claims = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "patent_id": self.patent_id,
            "title": self.title,
            "abstract": self.abstract,
            "assignee": self.assignee,
            "filing_date": self.filing_date.isoformat() if self.filing_date else None,
            "publication_date": self.publication_date.isoformat() if self.publication_date else None,
            "expiration_date": self.expiration_date.isoformat() if self.expiration_date else None,
            "relevance_score": self.relevance_score,
            "molecule": self.molecule,
            "claims": self.claims,
        }
