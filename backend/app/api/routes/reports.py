from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, ForbiddenError
from app.models.user import User
from app.models.report import OutcomeReport
from app.schemas.report import ReportResponse
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("", response_model=List[ReportResponse])
async def list_reports(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists all completed negotiation reports for the authenticated user."""
    stmt = select(OutcomeReport).where(OutcomeReport.user_id == current_user.id).order_by(OutcomeReport.created_at.desc())
    result = await db.execute(stmt)
    reports = result.scalars().all()
    return reports


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report_by_id(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves a single outcome report by report ID or session ID."""
    stmt = select(OutcomeReport).where(
        or_(OutcomeReport.id == report_id, OutcomeReport.session_id == report_id)
    ).order_by(OutcomeReport.created_at.desc())
    result = await db.execute(stmt)
    report = result.scalars().first()

    if not report:
        # Check if report_id matches a valid NegotiationSession and generate on demand
        from app.models.negotiation import NegotiationSession
        from app.orchestration.orchestrator import OrchestratorService
        from app.api.routes.negotiations import _load_full_session

        session_stmt = select(NegotiationSession).where(NegotiationSession.id == report_id)
        sess_result = await db.execute(session_stmt)
        session = sess_result.scalar_one_or_none()

        if session and session.user_id == current_user.id:
            outcome = (
                "Agreement Reached"
                if session.agreement_reached
                else ("Deadlock" if session.status == "deadlock" else "No Agreement / Deadlock")
            )
            full_session = await _load_full_session(session.id, db)
            report = await OrchestratorService.finalize_negotiation(full_session, outcome, db)
        else:
            raise ResourceNotFoundError("OutcomeReport", report_id)

    if report.user_id != current_user.id:
        raise ForbiddenError("You do not have permission to access this negotiation report.")

    from app.reports.report_generator import ReportGenerator

    # Auto-heal any historical reports that suffered from zero salary bug
    if report.scenario_id == "job-offer":
        sal_val = (report.scenario_analysis or {}).get("final_salary", "")
        if (sal_val in ["₹0", "$0", "0", "0.0", "₹0 / year", "$0 / year"] or (sal_val.strip() in ["₹0", "$0"])) and report.outcome in ["Agreement Reached", "Agreement", "Partial Agreement"]:
            from app.api.routes.negotiations import _load_full_session
            session = await _load_full_session(report.session_id, db)
            report = await ReportGenerator.generate_and_save_report(session, report.outcome, db)

    # Dynamically normalize any currency mismatch from historical sessions
    sc_curr = ReportGenerator._detect_currency(report.initial_data or {}, default="")
    if sc_curr and sc_curr != "$":
        modified = False
        if report.scenario_analysis:
            sanitized_analysis = dict(report.scenario_analysis)
            for k in ["final_salary", "initial_salary", "expected_salary", "minimum_acceptable_salary", "final_price", "price_concessions", "salary_concessions"]:
                if k in sanitized_analysis and isinstance(sanitized_analysis[k], str) and "$" in sanitized_analysis[k]:
                    sanitized_analysis[k] = sanitized_analysis[k].replace("$", sc_curr)
                    modified = True
            if modified:
                report.scenario_analysis = sanitized_analysis

        if report.final_terms:
            sanitized_terms = dict(report.final_terms)
            for k in ["salary", "price"]:
                if k in sanitized_terms and isinstance(sanitized_terms[k], str) and "$" in sanitized_terms[k]:
                    sanitized_terms[k] = sanitized_terms[k].replace("$", sc_curr)
                    modified = True
            if modified:
                report.final_terms = sanitized_terms

        if modified:
            await db.commit()
            await db.refresh(report)

    return report
