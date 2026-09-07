import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.negotiation import NegotiationSession, NegotiationMessage
from app.models.agent import AgentConfiguration
from app.models.report import OutcomeReport
from app.services.report_analysis_service import ReportAnalysisService

logger = logging.getLogger("backend.report_generator")


class ReportGenerator:
    @classmethod
    async def generate_and_save_report(
        cls,
        session: NegotiationSession,
        outcome: str,
        db: AsyncSession,
    ) -> OutcomeReport:
        """Calculates performance metrics, generates dynamic intelligence analysis, and persists report in database."""
        if not session or not session.id:
            raise ValueError("Invalid negotiation session provided for report generation.")

        # 1. Eagerly load session with all relationships using explicit async query
        full_stmt = (
            select(NegotiationSession)
            .where(NegotiationSession.id == session.id)
            .options(
                selectinload(NegotiationSession.agents).selectinload(AgentConfiguration.goals),
                selectinload(NegotiationSession.agents).selectinload(AgentConfiguration.constraints),
                selectinload(NegotiationSession.messages),
            )
        )
        res = await db.execute(full_stmt)
        loaded_session = res.scalar_one_or_none()
        if loaded_session:
            session = loaded_session

        # 2. Retrieve authoritative token usage summary
        from app.services.llm_usage_service import LLMUsageService
        token_usage_summary = await LLMUsageService.get_session_token_summary(session.id, db)

        # 3. Check if report already exists for this session (exactly one report per session)
        stmt = select(OutcomeReport).where(OutcomeReport.session_id == session.id)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            # If historical report lacks full dynamic analysis or token_usage, enrich and commit it
            if not existing.analysis or "token_usage" not in (existing.analysis or {}):
                enriched_analysis = dict(existing.analysis or {})
                if not enriched_analysis:
                    enriched_analysis = ReportAnalysisService.build_report_analysis(
                        session=session,
                        outcome=existing.outcome or outcome,
                        scenario_title=existing.scenario_title,
                        token_usage=token_usage_summary,
                    )
                else:
                    enriched_analysis["token_usage"] = token_usage_summary
                existing.analysis = enriched_analysis
                await db.commit()
                await db.refresh(existing)
            return existing

        # 4. Scenario-specific title lookup
        titles = {
            "vendor-pricing": "Vendor Pricing Negotiation",
            "job-offer": "Job Offer Negotiation",
            "budget-allocation": "Project Budget Allocation",
        }
        scenario_title = titles.get(session.scenario_id, (session.scenario_id or "negotiation").replace("-", " ").title())

        # 5. Generate complete dynamic intelligence analysis
        try:
            analysis = ReportAnalysisService.build_report_analysis(
                session=session,
                outcome=outcome,
                scenario_title=scenario_title,
                token_usage=token_usage_summary,
            )
        except Exception as e:
            logger.error(f"Error generating intelligence analysis for session {session.id}: {e}", exc_info=True)
            analysis = {}

        metrics = analysis.get("metrics", {})
        summary = analysis.get("summary", "")
        recommendations = analysis.get("recommendations", "")
        rounds_count = session.current_round

        # 5. Construct and persist OutcomeReport
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
            analysis=analysis,
        )

        db.add(report)
        await db.commit()
        await db.refresh(report)
        logger.info(f"[REPORT_GENERATOR] Outcome report {report.id} generated and persisted for session {session.id} (user_id={session.user_id}).")
        return report
