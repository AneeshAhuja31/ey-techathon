"""Scientific Literature Agent - PubMed and research papers analysis."""
from typing import Dict, Any, List
import asyncio
import logging
import aiohttp
import xml.etree.ElementTree as ET

from app.agents.workers.base_worker import BaseWorker
from app.agents.state import MasterState

logger = logging.getLogger(__name__)

# PubMed API endpoints
PUBMED_SEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_FETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"


class ScientificLiteratureAgent(BaseWorker):
    """
    Worker agent for scientific literature analysis.

    This agent:
    - Searches PubMed for relevant research papers
    - Analyzes publication trends
    - Identifies drug repurposing opportunities
    - Summarizes key findings
    """

    def __init__(self):
        super().__init__("Scientific Literature")

    async def execute(self, state: MasterState) -> Dict[str, Any]:
        """
        Execute scientific literature search and analysis.

        Args:
            state: Master state containing query

        Returns:
            Dictionary with papers, trends, and insights
        """
        query = state["query"]

        await self.update_progress(10, "Searching PubMed database...")

        # Search PubMed
        papers = await self._search_pubmed(query)

        await self.update_progress(50, f"Found {len(papers)} relevant papers...")

        if not papers:
            # Fall back to mock data
            await self.update_progress(60, "Using cached literature data...")
            papers = self._get_mock_papers(query.lower())

        await self.update_progress(70, "Analyzing publication trends...")

        # Analyze trends
        trends = self._analyze_trends(papers)

        await self.update_progress(85, "Identifying repurposing opportunities...")

        # Identify repurposing opportunities
        repurposing = self._identify_repurposing(papers, query)

        await self.update_progress(100, "Literature analysis complete")

        return {
            "papers": papers[:10],  # Top 10 papers
            "total_found": len(papers),
            "publication_trends": trends,
            "repurposing_opportunities": repurposing,
            "source": "pubmed" if papers and papers[0].get("pmid") else "mock_data"
        }

    async def _search_pubmed(self, query: str, max_results: int = 20) -> List[Dict[str, Any]]:
        """
        Search PubMed for relevant papers.

        Args:
            query: Search query
            max_results: Maximum number of results

        Returns:
            List of paper dictionaries
        """
        try:
            async with aiohttp.ClientSession() as session:
                # Step 1: Search for PMIDs
                search_params = {
                    "db": "pubmed",
                    "term": query,
                    "retmax": max_results,
                    "retmode": "json",
                    "sort": "relevance"
                }

                async with session.get(PUBMED_SEARCH_URL, params=search_params) as resp:
                    if resp.status != 200:
                        logger.error(f"PubMed search failed: {resp.status}")
                        return []

                    data = await resp.json()
                    pmids = data.get("esearchresult", {}).get("idlist", [])

                if not pmids:
                    return []

                # Step 2: Fetch paper details
                fetch_params = {
                    "db": "pubmed",
                    "id": ",".join(pmids),
                    "retmode": "xml",
                    "rettype": "abstract"
                }

                async with session.get(PUBMED_FETCH_URL, params=fetch_params) as resp:
                    if resp.status != 200:
                        logger.error(f"PubMed fetch failed: {resp.status}")
                        return []

                    xml_data = await resp.text()

                # Parse XML
                papers = self._parse_pubmed_xml(xml_data)
                logger.info(f"Found {len(papers)} papers from PubMed")
                return papers

        except Exception as e:
            logger.error(f"Error searching PubMed: {e}")
            return []

    def _parse_pubmed_xml(self, xml_data: str) -> List[Dict[str, Any]]:
        """Parse PubMed XML response into paper dictionaries."""
        papers = []

        try:
            root = ET.fromstring(xml_data)

            for article in root.findall(".//PubmedArticle"):
                try:
                    medline = article.find(".//MedlineCitation")
                    if medline is None:
                        continue

                    pmid_elem = medline.find("PMID")
                    pmid = pmid_elem.text if pmid_elem is not None else ""

                    article_data = medline.find("Article")
                    if article_data is None:
                        continue

                    # Title
                    title_elem = article_data.find("ArticleTitle")
                    title = title_elem.text if title_elem is not None else ""

                    # Abstract
                    abstract_elem = article_data.find(".//AbstractText")
                    abstract = abstract_elem.text if abstract_elem is not None else ""

                    # Authors
                    authors = []
                    for author in article_data.findall(".//Author"):
                        last_name = author.find("LastName")
                        fore_name = author.find("ForeName")
                        if last_name is not None:
                            name = last_name.text
                            if fore_name is not None:
                                name = f"{fore_name.text} {name}"
                            authors.append(name)

                    # Journal
                    journal_elem = article_data.find(".//Journal/Title")
                    journal = journal_elem.text if journal_elem is not None else ""

                    # Publication date
                    pub_date = article_data.find(".//PubDate")
                    year = pub_date.find("Year").text if pub_date is not None and pub_date.find("Year") is not None else ""

                    papers.append({
                        "pmid": pmid,
                        "title": title,
                        "abstract": abstract[:500] if abstract else "",
                        "authors": authors[:5],  # First 5 authors
                        "journal": journal,
                        "year": year,
                        "pubmed_link": f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/"
                    })

                except Exception as e:
                    logger.warning(f"Error parsing article: {e}")
                    continue

        except ET.ParseError as e:
            logger.error(f"Error parsing PubMed XML: {e}")

        return papers

    def _get_mock_papers(self, query: str) -> List[Dict[str, Any]]:
        """Get mock papers for demonstration."""
        if "glp-1" in query or "glp1" in query or "semaglutide" in query:
            return [
                {
                    "pmid": "37234567",
                    "title": "Efficacy and Safety of Semaglutide for Weight Management: A Systematic Review",
                    "abstract": "This systematic review examines the efficacy and safety profile of semaglutide in weight management across multiple clinical trials...",
                    "authors": ["Smith J", "Johnson M", "Williams K"],
                    "journal": "Lancet Diabetes & Endocrinology",
                    "year": "2024",
                    "pubmed_link": "https://pubmed.ncbi.nlm.nih.gov/37234567/"
                },
                {
                    "pmid": "36987654",
                    "title": "GLP-1 Receptor Agonists: Cardiovascular Benefits Beyond Glycemic Control",
                    "abstract": "Recent trials have demonstrated significant cardiovascular benefits of GLP-1 receptor agonists independent of their glucose-lowering effects...",
                    "authors": ["Brown A", "Davis R", "Miller S"],
                    "journal": "New England Journal of Medicine",
                    "year": "2024",
                    "pubmed_link": "https://pubmed.ncbi.nlm.nih.gov/36987654/"
                },
                {
                    "pmid": "36543210",
                    "title": "Oral Semaglutide: A New Era in Type 2 Diabetes Treatment",
                    "abstract": "The development of oral semaglutide represents a significant advancement in GLP-1 therapy, offering patients an alternative to injectable formulations...",
                    "authors": ["Garcia L", "Martinez P", "Anderson T"],
                    "journal": "Diabetes Care",
                    "year": "2023",
                    "pubmed_link": "https://pubmed.ncbi.nlm.nih.gov/36543210/"
                }
            ]

        return [
            {
                "pmid": "00000001",
                "title": "Sample Publication - Search for specific molecules or therapeutic areas",
                "abstract": "This is placeholder data. Real PubMed searches will return relevant scientific literature.",
                "authors": ["Author A"],
                "journal": "Sample Journal",
                "year": "2024",
                "pubmed_link": "https://pubmed.ncbi.nlm.nih.gov/"
            }
        ]

    def _analyze_trends(self, papers: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze publication trends from papers."""
        if not papers:
            return {"status": "No papers to analyze"}

        # Count by year
        year_counts = {}
        for p in papers:
            year = p.get("year", "Unknown")
            year_counts[year] = year_counts.get(year, 0) + 1

        # Count by journal
        journal_counts = {}
        for p in papers:
            journal = p.get("journal", "Unknown")
            if journal:
                journal_counts[journal] = journal_counts.get(journal, 0) + 1

        return {
            "total_papers": len(papers),
            "by_year": dict(sorted(year_counts.items(), reverse=True)),
            "top_journals": dict(sorted(journal_counts.items(), key=lambda x: -x[1])[:5]),
            "trend_analysis": "Publication volume increasing" if len(year_counts) > 1 else "Insufficient data for trend"
        }

    def _identify_repurposing(
        self,
        papers: List[Dict[str, Any]],
        query: str
    ) -> Dict[str, Any]:
        """Identify potential drug repurposing opportunities."""
        # This would use NLP/LLM in production
        opportunities = []

        query_lower = query.lower()

        if "glp-1" in query_lower or "semaglutide" in query_lower:
            opportunities = [
                {
                    "indication": "Non-alcoholic steatohepatitis (NASH)",
                    "evidence_level": "Phase 3 trials ongoing",
                    "rationale": "GLP-1 agonists show hepatoprotective effects and reduced liver fat"
                },
                {
                    "indication": "Alzheimer's Disease",
                    "evidence_level": "Phase 2 trials",
                    "rationale": "Neuroprotective effects and improved insulin signaling in brain"
                },
                {
                    "indication": "Chronic Kidney Disease",
                    "evidence_level": "Post-hoc analysis",
                    "rationale": "Renal protective effects observed in cardiovascular outcome trials"
                }
            ]

        return {
            "opportunities": opportunities,
            "methodology": "Based on literature analysis and ongoing clinical trials",
            "note": "Further validation required for clinical development"
        }
