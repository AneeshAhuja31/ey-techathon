"""Clinical Trials Worker Agent - Global trial status and outcomes."""
from typing import Dict, Any, List
import asyncio

from app.agents.workers.base_worker import BaseWorker
from app.agents.state import MasterState


class ClinicalTrialsWorker(BaseWorker):
    """
    Worker agent for clinical trials intelligence.

    Analyzes:
    - Active and completed clinical trials
    - Trial outcomes and efficacy data
    - Safety profiles
    - Competitive trial landscape
    """

    def __init__(self):
        super().__init__("Clinical Trials")

    async def execute(self, state: MasterState) -> Dict[str, Any]:
        """
        Execute clinical trials analysis.

        For MVP, returns mock data. In production, would integrate
        with ClinicalTrials.gov, EudraCT, and other registries.
        """
        query = state["query"].lower()

        await self.update_progress(20)
        await asyncio.sleep(0.5)

        trials = self._search_trials(query)

        await self.update_progress(50)
        await asyncio.sleep(0.5)

        summary = self._summarize_trials(trials)

        await self.update_progress(100)

        return {
            "trials": trials,
            "summary": summary
        }

    def _search_trials(self, query: str) -> List[Dict[str, Any]]:
        """Search for relevant clinical trials (mock implementation)."""

        if "glp-1" in query or "glp1" in query or "semaglutide" in query or "obesity" in query:
            return [
                {
                    "nct_id": "NCT04074161",
                    "title": "STEP 1: Semaglutide Treatment Effect in People with Obesity",
                    "status": "Completed",
                    "phase": "Phase 3",
                    "sponsor": "Novo Nordisk",
                    "enrollment": 1961,
                    "start_date": "2018-06-01",
                    "completion_date": "2020-03-15",
                    "primary_outcome": "Weight loss from baseline",
                    "results_summary": {
                        "efficacy": "14.9% mean weight loss vs 2.4% placebo",
                        "statistical_significance": "p < 0.0001",
                        "responders": "86% achieved ≥5% weight loss"
                    },
                    "safety_profile": {
                        "common_aes": ["Nausea (44%)", "Diarrhea (31%)", "Vomiting (25%)"],
                        "serious_aes": "Rare (<1%)",
                        "discontinuation_rate": "7% due to AEs"
                    }
                },
                {
                    "nct_id": "NCT03548935",
                    "title": "SUSTAIN 6: Cardiovascular Outcomes with Semaglutide",
                    "status": "Completed",
                    "phase": "Phase 3",
                    "sponsor": "Novo Nordisk",
                    "enrollment": 3297,
                    "start_date": "2013-02-01",
                    "completion_date": "2016-03-01",
                    "primary_outcome": "Major adverse cardiovascular events (MACE)",
                    "results_summary": {
                        "efficacy": "26% reduction in MACE",
                        "statistical_significance": "p < 0.001",
                        "hr": "HR 0.74 (95% CI: 0.58-0.95)"
                    }
                },
                {
                    "nct_id": "NCT05035095",
                    "title": "Semaglutide in NASH with Liver Fibrosis",
                    "status": "Recruiting",
                    "phase": "Phase 3",
                    "sponsor": "Novo Nordisk",
                    "enrollment": 1200,
                    "start_date": "2021-10-01",
                    "estimated_completion": "2026-06-01",
                    "primary_outcome": "Resolution of NASH without worsening fibrosis"
                },
                {
                    "nct_id": "NCT04881760",
                    "title": "SURMOUNT-1: Tirzepatide for Obesity",
                    "status": "Completed",
                    "phase": "Phase 3",
                    "sponsor": "Eli Lilly",
                    "enrollment": 2539,
                    "completion_date": "2022-04-01",
                    "results_summary": {
                        "efficacy": "20.9% mean weight loss (highest dose)",
                        "statistical_significance": "p < 0.001"
                    }
                }
            ]

        # Metformin/diabetes trials
        if "metformin" in query or "diabetes" in query:
            return [
                {
                    "nct_id": "NCT02099422",
                    "title": "TAME: Targeting Aging with Metformin",
                    "status": "Recruiting",
                    "phase": "Phase 3",
                    "sponsor": "American Federation for Aging Research",
                    "enrollment": 3000,
                    "start_date": "2023-01-01",
                    "estimated_completion": "2027-12-01",
                    "primary_outcome": "Time to new age-related chronic disease",
                    "description": "Landmark study investigating metformin for anti-aging effects"
                },
                {
                    "nct_id": "NCT00790205",
                    "title": "UKPDS: UK Prospective Diabetes Study - Long-term Follow-up",
                    "status": "Completed",
                    "phase": "Phase 4",
                    "sponsor": "University of Oxford",
                    "enrollment": 5102,
                    "completion_date": "2007-09-01",
                    "primary_outcome": "All-cause mortality and diabetes complications",
                    "results_summary": {
                        "efficacy": "36% reduction in all-cause mortality with metformin",
                        "statistical_significance": "p < 0.01",
                        "legacy_effect": "Sustained benefit 10 years post-trial"
                    }
                },
                {
                    "nct_id": "NCT01243424",
                    "title": "Metformin in Prediabetes: Prevention of Type 2 Diabetes",
                    "status": "Completed",
                    "phase": "Phase 3",
                    "sponsor": "NIH/NIDDK",
                    "enrollment": 3234,
                    "completion_date": "2019-03-01",
                    "primary_outcome": "Incidence of Type 2 diabetes",
                    "results_summary": {
                        "efficacy": "31% reduction in diabetes incidence vs placebo",
                        "statistical_significance": "p < 0.001",
                        "nnt": "7 patients for 3 years to prevent 1 case"
                    }
                },
                {
                    "nct_id": "NCT03516084",
                    "title": "Metformin-GLP1 Combination in Early Type 2 Diabetes",
                    "status": "Completed",
                    "phase": "Phase 4",
                    "sponsor": "Novo Nordisk",
                    "enrollment": 1879,
                    "completion_date": "2022-08-01",
                    "primary_outcome": "HbA1c reduction from baseline",
                    "results_summary": {
                        "efficacy": "1.8% HbA1c reduction with combination",
                        "weight_effect": "4.2 kg weight loss",
                        "statistical_significance": "p < 0.001"
                    }
                }
            ]

        return [
            {
                "nct_id": "SAMPLE",
                "title": "Sample Trial - Provide specific query for relevant results",
                "status": "N/A",
                "phase": "N/A",
                "sponsor": "N/A"
            }
        ]

    def _summarize_trials(self, trials: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Summarize clinical trial landscape."""

        if not trials or trials[0].get("nct_id") == "SAMPLE":
            return {"status": "No relevant trials found"}

        # Count by status
        status_counts = {}
        phases = {}
        sponsors = {}

        for trial in trials:
            status = trial.get("status", "Unknown")
            status_counts[status] = status_counts.get(status, 0) + 1

            phase = trial.get("phase", "Unknown")
            phases[phase] = phases.get(phase, 0) + 1

            sponsor = trial.get("sponsor", "Unknown")
            sponsors[sponsor] = sponsors.get(sponsor, 0) + 1

        return {
            "total_trials": len(trials),
            "by_status": status_counts,
            "by_phase": phases,
            "top_sponsors": [
                {"name": k, "trial_count": v}
                for k, v in sorted(sponsors.items(), key=lambda x: -x[1])[:5]
            ],
            "key_findings": [
                "Strong efficacy signals in obesity and T2D",
                "Expanding into NASH and cardiovascular protection",
                "GI side effects are primary tolerability concern",
                "Competitive landscape intensifying with tirzepatide"
            ],
            "emerging_indications": [
                "Non-alcoholic steatohepatitis (NASH)",
                "Heart failure with preserved EF",
                "Chronic kidney disease",
                "Alzheimer's disease (exploratory)"
            ]
        }
