"""Molecule, Disease, and Product models for Mind Map."""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Text, Float, ForeignKey, Table
from sqlalchemy.orm import relationship

from app.db.database import Base


def generate_uuid():
    return str(uuid.uuid4())


# Association tables for many-to-many relationships
molecule_disease_association = Table(
    'molecule_disease',
    Base.metadata,
    Column('molecule_id', String(36), ForeignKey('molecules.id')),
    Column('disease_id', String(36), ForeignKey('diseases.id'))
)


class Disease(Base):
    """Disease model - represents a disease/condition in the mind map."""

    __tablename__ = "diseases"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icd_code = Column(String(20), nullable=True)
    prevalence = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    molecules = relationship(
        "Molecule",
        secondary=molecule_disease_association,
        back_populates="diseases"
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icd_code": self.icd_code,
            "prevalence": self.prevalence,
            "type": "disease"
        }


class Molecule(Base):
    """Molecule model - represents a drug molecule in the mind map."""

    __tablename__ = "molecules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    formula = Column(String(100), nullable=True)
    mechanism = Column(Text, nullable=True)  # Mechanism of action
    drug_class = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    diseases = relationship(
        "Disease",
        secondary=molecule_disease_association,
        back_populates="molecules"
    )
    products = relationship("Product", back_populates="molecule")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "formula": self.formula,
            "mechanism": self.mechanism,
            "drug_class": self.drug_class,
            "type": "molecule"
        }


class Product(Base):
    """Product model - represents a commercial drug product in the mind map."""

    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(200), nullable=False)
    molecule_id = Column(String(36), ForeignKey("molecules.id"), nullable=False)
    manufacturer = Column(String(200), nullable=True)
    approval_date = Column(DateTime, nullable=True)
    indication = Column(Text, nullable=True)
    dosage_form = Column(String(100), nullable=True)
    market_status = Column(String(50), nullable=True)  # approved, withdrawn, pending
    match_score = Column(Float, default=0.0)  # Relevance score 0-100
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    molecule = relationship("Molecule", back_populates="products")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "molecule_id": self.molecule_id,
            "manufacturer": self.manufacturer,
            "approval_date": self.approval_date.isoformat() if self.approval_date else None,
            "indication": self.indication,
            "dosage_form": self.dosage_form,
            "market_status": self.market_status,
            "match_score": self.match_score,
            "type": "product"
        }
