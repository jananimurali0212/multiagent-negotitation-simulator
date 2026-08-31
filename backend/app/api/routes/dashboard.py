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


from sqlalchemy.orm import selectinload
from app.models.agent import AgentConfiguration


class DashboardSummaryResponse(BaseModel):
    total_negotiations: int
    agreements_reached: int
    deadlocks_detected: int
    reports_generated: int
    recent_negotiations: List[Dict[str, Any]]


@router.get("/summary", response_model=DashboardSummaryResponse)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves real-time dashboard summary metrics and a unified recent negotiations feed."""
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

    # 5. Unified Recent Negotiations (Running, Paused, Stopped, Completed)
    sessions_stmt = (
        select(NegotiationSession)
        .where(NegotiationSession.user_id == current_user.id)
        .options(
            selectinload(NegotiationSession.agents),
            selectinload(NegotiationSession.report),
        )
        .order_by(NegotiationSession.updated_at.desc())
        .limit(10)
    )
    sessions_res = await db.execute(sessions_stmt)
    recent_sessions = sessions_res.scalars().all()

    scenario_titles = {
        "vendor-pricing": "Vendor Pricing Negotiation",
        "job-offer": "Job Offer Negotiation",
        "budget-allocation": "Project Budget Allocation",
    }

    recent_negotiations = []
    for s in recent_sessions:
        outcome = None
        if s.report:
            outcome = s.report.outcome
        elif s.status == "finished" and s.agreement_reached:
            outcome = "Agreement Reached"
        elif s.status == "deadlock":
            outcome = "Deadlock"
        elif s.status in ["terminated", "stopped"]:
            outcome = "Stopped"
        elif s.status == "paused":
            outcome = "Paused"
        elif s.status == "running":
            outcome = "Running"
        else:
            outcome = s.status.capitalize()

        recent_negotiations.append({
            "id": s.id,
            "session_id": s.id,
            "scenario_id": s.scenario_id,
            "scenario_title": scenario_titles.get(s.scenario_id, s.scenario_id.replace("-", " ").title()),
            "mode": s.mode,
            "status": s.status,
            "outcome": outcome,
            "current_round": s.current_round,
            "max_rounds": s.max_rounds,
            "rounds_completed": s.current_round,
            "agents": [{"name": a.name, "role": a.role, "avatar": a.avatar} for a in s.agents],
            "agent_names": [a.name for a in s.agents],
            "report_id": s.report.id if s.report else None,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "updated_at": s.updated_at.isoformat() if s.updated_at else None,
        })

    return DashboardSummaryResponse(
        total_negotiations=total_negotiations,
        agreements_reached=agreements_reached,
        deadlocks_detected=deadlocks_detected,
        reports_generated=reports_generated,
        recent_negotiations=recent_negotiations,
    )
