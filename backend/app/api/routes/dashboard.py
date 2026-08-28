import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.negotiation import NegotiationSession
from app.models.report import OutcomeReport
from app.api.dependencies import get_current_user
from pydantic import BaseModel

logger = logging.getLogger("backend.dashboard")
router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


class DashboardSummaryResponse(BaseModel):
    total_negotiations: int
    agreements_reached: int
    deadlocks_detected: int
    reports_generated: int
    current_negotiations: List[Dict[str, Any]]
    recent_negotiations: List[Dict[str, Any]]


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves real-time dashboard summary metrics and session feeds for the current user."""
    # 1. Total Negotiations Count
    total_stmt = select(func.count(NegotiationSession.id)).where(NegotiationSession.user_id == current_user.id)
    total_res = await db.execute(total_stmt)
    total_negotiations = total_res.scalar() or 0

    # 2. Total Reports Generated Count
    reports_stmt = select(func.count(OutcomeReport.id)).where(OutcomeReport.user_id == current_user.id)
    reports_res = await db.execute(reports_stmt)
    reports_generated = reports_res.scalar() or 0

    # 3. Agreements Reached Count
    agreements_stmt = select(func.count(OutcomeReport.id)).where(
        OutcomeReport.user_id == current_user.id,
        OutcomeReport.outcome == "Agreement Reached"
    )
    agreements_res = await db.execute(agreements_stmt)
    agreements_reached = agreements_res.scalar() or 0

    # 4. Deadlocks Count
    deadlocks_stmt = select(func.count(OutcomeReport.id)).where(
        OutcomeReport.user_id == current_user.id,
        OutcomeReport.outcome == "Deadlock"
    )
    deadlocks_res = await db.execute(deadlocks_stmt)
    deadlocks_detected = deadlocks_res.scalar() or 0

    # 5. Current Active Sessions
    active_stmt = (
        select(NegotiationSession)
        .where(
            NegotiationSession.user_id == current_user.id,
            NegotiationSession.status.in_(["setup", "ready", "running", "paused"])
        )
        .order_by(NegotiationSession.updated_at.desc())
        .limit(5)
    )
    active_res = await db.execute(active_stmt)
    active_sessions = active_res.scalars().all()

    current_negotiations = [
        {
            "id": s.id,
            "scenario_id": s.scenario_id,
            "mode": s.mode,
            "status": s.status,
            "current_round": s.current_round,
            "max_rounds": s.max_rounds,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        }
        for s in active_sessions
    ]

    # 6. Recent Completed Reports
    recent_reports_stmt = (
        select(OutcomeReport)
        .where(OutcomeReport.user_id == current_user.id)
        .order_by(OutcomeReport.created_at.desc())
        .limit(5)
    )
    recent_reports_res = await db.execute(recent_reports_stmt)
    recent_reports_list = recent_reports_res.scalars().all()

    recent_negotiations = [
        {
            "id": r.id,
            "session_id": r.session_id,
            "scenario_id": r.scenario_id,
            "scenario_title": r.scenario_title,
            "mode": r.mode,
            "outcome": r.outcome,
            "rounds_completed": r.rounds_completed,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in recent_reports_list
    ]

    return DashboardSummaryResponse(
        total_negotiations=total_negotiations,
        agreements_reached=agreements_reached,
        deadlocks_detected=deadlocks_detected,
        reports_generated=reports_generated,
        current_negotiations=current_negotiations,
        recent_negotiations=recent_negotiations,
    )
