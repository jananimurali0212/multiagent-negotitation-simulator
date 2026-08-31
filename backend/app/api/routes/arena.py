from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ForbiddenError
from app.models.user import User
from app.models.negotiation import NegotiationSession
from app.schemas.arena import UserTurnPayload, TurnResultResponse
from app.api.dependencies import get_current_user
from app.orchestration.orchestrator import OrchestratorService
from app.api.routes.negotiations import _load_full_session

router = APIRouter(prefix="/negotiations", tags=["Negotiation Arena"])
orchestrator = OrchestratorService()


@router.post("/{session_id}/step", response_model=TurnResultResponse)
async def execute_simulation_step(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Executes the next AI turn in AI vs AI simulation mode."""
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    if session.status == "paused":
        return TurnResultResponse(
            status="paused",
            round=session.current_round,
            current_turn_speaker=session.current_speaker or "",
            message=None,
            agreement_reached=False,
            final_terms=session.final_terms,
        )

    result = await orchestrator.execute_turn(session_id=session.id, db=db)
    return TurnResultResponse(**result)


@router.post("/{session_id}/user-turn", response_model=TurnResultResponse)
async def submit_user_turn(
    session_id: str,
    payload: UserTurnPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submits a human offer/message in Human vs AI practice mode and executes the AI counter-response."""
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    result = await orchestrator.execute_turn(
        session_id=session.id,
        db=db,
        user_message=payload.message,
        user_offer=payload.offer,
    )
    return TurnResultResponse(**result)


from app.orchestration.runner import stop_background_simulation


@router.post("/{session_id}/stop", response_model=TurnResultResponse)
async def stop_negotiation(
    session_id: str,
    action: str = "pause",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually pauses or stops an ongoing negotiation session."""
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    # Always halt background execution task
    stop_background_simulation(session.id)

    if action in ["finalize", "report", "stop", "terminate"]:
        session.status = "terminated"
        await db.commit()

        from app.reports.report_generator import ReportGenerator
        await ReportGenerator.generate_and_save_report(session, "Stopped by User", db)

        return TurnResultResponse(
            status="terminated",
            round=session.current_round,
            current_turn_speaker="System",
            message=None,
            agreement_reached=False,
            final_terms=session.final_terms,
        )

    # Default action: pause
    session.status = "paused"
    await db.commit()

    return TurnResultResponse(
        status="paused",
        round=session.current_round,
        current_turn_speaker=session.current_speaker or "",
        message=None,
        agreement_reached=False,
        final_terms=session.final_terms,
    )
