"""Worker agents for the Master-Worker architecture."""
from .base_worker import BaseWorker
from .iqvia_agent import IQVIAInsightsWorker
from .patent_agent import PatentLandscapeWorker
from .clinical_agent import ClinicalTrialsWorker
from .web_intel_agent import WebIntelligenceWorker
from .report_agent import ReportGeneratorWorker
from .company_rag_agent import CompanyKnowledgeAgent
from .literature_agent import ScientificLiteratureAgent

__all__ = [
    "BaseWorker",
    "IQVIAInsightsWorker",
    "PatentLandscapeWorker",
    "ClinicalTrialsWorker",
    "WebIntelligenceWorker",
    "ReportGeneratorWorker",
    "CompanyKnowledgeAgent",
    "ScientificLiteratureAgent",
]
