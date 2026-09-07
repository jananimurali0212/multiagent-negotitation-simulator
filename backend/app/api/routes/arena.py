from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ForbiddenError
from app.models.user import User
from app.models.negotiation import NegotiationSession
from app.models.report import OutcomeReport
from app.schemas.arena import UserTurnPayload, TurnResultResponse
from app.api.dependencies import get_current_user
from app.orchestration.orchestrator import OrchestratorService
from app.api.routes.negotiations import _load_full_session

from app.orchestration.runner import record_api_step, stop_background_simulation

router = APIRouter(prefix="/negotiations", tags=["Negotiation Arena"])
orchestrator = OrchestratorService()


@router.post("/{session_id}/step", response_model=TurnResultResponse)
async def execute_simulation_step(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Executes the next AI turn in AI vs AI simulation mode."""
    record_api_step(session_id)
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    if session.status in ["paused", "waiting_for_human", "finished", "deadlock", "terminated"]:
        rep_stmt = select(OutcomeReport).where(OutcomeReport.session_id == session.id)
        rep_res = await db.execute(rep_stmt)
        existing_rep = rep_res.scalar_one_or_none()

        return TurnResultResponse(
            status=session.status,
            round=session.current_round,
            current_turn_speaker=session.current_speaker or "",
            message=None,
            agreement_reached=session.agreement_reached,
            final_terms=session.final_terms,
            report_id=existing_rep.id if existing_rep else None,
            report_status="generated" if existing_rep else ("generating" if session.status in ["finished", "deadlock"] else "not_generated"),
        )

    result = await orchestrator.execute_turn(session_id=session.id, db=db)
    return TurnResultResponse(**result)


@router.post("/{session_id}/human-turn", response_model=TurnResultResponse)
@router.post("/{session_id}/user-turn", response_model=TurnResultResponse)
async def submit_human_turn(
    session_id: str,
    payload: UserTurnPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submits a human offer/message in Human vs AI practice mode and executes the AI counter-response."""
    record_api_step(session_id)
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    if session.status in ["finished", "deadlock", "terminated"]:
        rep_stmt = select(OutcomeReport).where(OutcomeReport.session_id == session.id)
        rep_res = await db.execute(rep_stmt)
        existing_rep = rep_res.scalar_one_or_none()

        return TurnResultResponse(
            status=session.status,
            round=session.current_round,
            current_turn_speaker=session.current_speaker or "",
            message=None,
            agreement_reached=session.agreement_reached,
            final_terms=session.final_terms,
            report_id=existing_rep.id if existing_rep else None,
            report_status="generated" if existing_rep else "not_generated",
        )

    result = await orchestrator.execute_turn(
        session_id=session.id,
        db=db,
        user_message=payload.message,
        user_offer=payload.offer,
    )
    return TurnResultResponse(**result)


@router.post("/{session_id}/stop", response_model=TurnResultResponse)
async def stop_negotiation(
    session_id: str,
    action: str = "pause",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually pauses or stops an ongoing negotiation session.
    Supported actions:
    - 'pause': Halts runner, sets status='paused'.
    - 'discard': Halts runner, terminates session without generating report.
    - 'partial_report' (or 'terminate', 'report', 'finalize'): Halts runner, generates stopped partial report.
    - 'select_new_scenario': Halts runner, keeps session paused for potential resumption.
    """
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    # Always halt background execution task
    stop_background_simulation(session.id)

    clean_action = (action or "pause").lower().strip()

    if clean_action in ["partial_report", "finalize", "report", "stop", "terminate"]:
        report = await OrchestratorService.finalize_negotiation_session(
            session=session,
            terminal_status="terminated",
            db=db,
            agreement_reached=False,
            final_terms=session.final_terms or {},
            outcome_str="Stopped by User",
        )

        return TurnResultResponse(
            status="terminated",
            round=session.current_round,
            current_turn_speaker="System",
            message=None,
            agreement_reached=False,
            final_terms=session.final_terms,
            report_id=report.id if report else session.id,
            report_status="generated" if report else "failed",
        )

    if clean_action == "discard":
        session.status = "terminated"
        await db.commit()
        return TurnResultResponse(
            status="terminated",
            round=session.current_round,
            current_turn_speaker="System",
            message=None,
            agreement_reached=False,
            final_terms=session.final_terms,
            report_id=None,
            report_status="not_generated",
        )

    # Default actions: 'pause' or 'select_new_scenario'
    session.status = "paused"
    await db.commit()

    return TurnResultResponse(
        status="paused",
        round=session.current_round,
        current_turn_speaker=session.current_speaker or "",
        message=None,
        agreement_reached=False,
        final_terms=session.final_terms,
        report_id=None,
        report_status="not_generated",
    )


@router.get("/{session_id}/token-usage")
async def get_session_token_usage(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves authoritative LLM token usage telemetry for the negotiation session."""
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    from app.services.llm_usage_service import LLMUsageService
    return await LLMUsageService.get_session_token_summary(session.id, db)

