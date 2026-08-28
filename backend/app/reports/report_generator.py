import logging
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.negotiation import NegotiationSession, NegotiationMessage
from app.models.report import OutcomeReport

logger = logging.getLogger("backend.report_generator")


class ReportGenerator:
    @staticmethod
    async def generate_and_save_report(
        session: NegotiationSession,
        outcome: str,
        db: AsyncSession,
    ) -> OutcomeReport:
        """Calculates performance metrics, generates summary analysis, and persists report in database."""
        # Check if report already generated
        stmt = select(OutcomeReport).where(OutcomeReport.session_id == session.id)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        messages = session.messages or []
        rounds_count = session.current_round

        # Calculate metrics based on negotiation dynamics
        is_agreement = (outcome == "Agreement Reached")
        concession_score = 85 if is_agreement else 60
        argument_score = min(95, 70 + len(messages) * 3)
        active_listening_score = 80 if is_agreement else 65
        deal_progress_score = 95 if is_agreement else (40 if outcome == "Deadlock" else 50)

        metrics = {
            "concessionControl": concession_score,
            "argumentStrength": argument_score,
            "activeListening": active_listening_score,
            "dealProgress": deal_progress_score,
            "totalRounds": rounds_count,
            "jointUtility": 88 if is_agreement else 45,
            "paretoEfficiency": 92 if is_agreement else 50,
        }

        # Scenario-specific title lookups
        titles = {
            "vendor-pricing": "Vendor Pricing Negotiation",
            "job-offer": "Job Offer Negotiation",
            "budget-allocation": "Project Budget Allocation",
        }
        scenario_title = titles.get(session.scenario_id, session.scenario_id)

        # Generate summary text
        summary = (
            f"The negotiation session for '{scenario_title}' concluded with an outcome of '{outcome}' "
            f"after {rounds_count} round(s) and {len(messages)} message exchange(s). "
        )
        if is_agreement and session.final_terms:
            terms_str = ", ".join([f"{k}: {v}" for k, v in session.final_terms.items()])
            summary += f"Agreed commercial terms established: {terms_str}."
        elif outcome == "Deadlock":
            summary += "The parties reached a deadlock state due to unresolvable constraint boundaries."
        else:
            summary += "The session was terminated before reaching a complete agreement."

        # Strategic recommendations
        recommendations = (
            "1. Focus on opening with defensible multi-issue anchors to establish early leverage.\n"
            "2. Anchor trade-offs across non-price dimensions (e.g. payment terms or support tiers) to unlock concessions.\n"
            "3. Monitor concession pacing to prevent premature value leakage before receiving reciprocal terms."
        )

        report = OutcomeReport(
            session_id=session.id,
            user_id=session.user_id,
            scenario_id=session.scenario_id,
            scenario_title=scenario_title,
            mode=session.mode,
            outcome=outcome,
            rounds_completed=rounds_count,
            final_terms=session.final_terms or {},
            metrics=metrics,
            summary=summary,
            recommendations=recommendations,
        )

        db.add(report)
        await db.commit()
        await db.refresh(report)
        logger.info(f"Outcome report generated and persisted for session {session.id}.")
        return report
