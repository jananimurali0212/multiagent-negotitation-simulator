from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, ForbiddenError, WorkflowValidationError
from app.models.user import User
from app.models.scenario import Scenario
from app.models.negotiation import NegotiationSession
from app.models.agent import AgentConfiguration, AgentGoal, AgentConstraint
from app.schemas.negotiation import SessionCreatePayload, SessionResponse, UpdateAgentsPayload, ConfirmReviewPayload
from app.api.dependencies import get_current_user
from app.services.workflow_service import WorkflowService
from app.services.seed_data import seed_scenarios

router = APIRouter(prefix="/negotiations", tags=["Negotiations"])


async def _load_full_session(session_id: str, db: AsyncSession) -> NegotiationSession:
    stmt = (
        select(NegotiationSession)
        .where(NegotiationSession.id == session_id)
        .options(
            selectinload(NegotiationSession.agents).selectinload(AgentConfiguration.goals),
            selectinload(NegotiationSession.agents).selectinload(AgentConfiguration.constraints),
            selectinload(NegotiationSession.messages),
        )
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    if not session:
        raise ResourceNotFoundError("NegotiationSession", session_id)
    return session


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    payload: SessionCreatePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Step 01 & 02 Validation: scenario & mode
    WorkflowService.validate_scenario_and_mode(payload.scenario_id, payload.mode)

    # Verify scenario exists in database
    res = await db.execute(select(Scenario).where(Scenario.id == payload.scenario_id))
    scenario = res.scalar_one_or_none()
    if not scenario:
        await seed_scenarios(db)
        res = await db.execute(select(Scenario).where(Scenario.id == payload.scenario_id))
        scenario = res.scalar_one_or_none()
    if not scenario:
        raise ResourceNotFoundError("Scenario", payload.scenario_id)

    # Create new negotiation session
    session = NegotiationSession(
        user_id=current_user.id,
        scenario_id=payload.scenario_id,
        mode=payload.mode,
        human_role=payload.human_role,
        current_step="AGENTS",
        status="setup",
    )
    db.add(session)
    await db.flush()

    # Pre-populate default agent configurations from scenario template
    for default_agent in scenario.default_agents_data:
        agent_config = AgentConfiguration(
            session_id=session.id,
            agent_template_id=default_agent["agent_template_id"],
            name=default_agent["name"],
            role=default_agent["role"],
            avatar=default_agent["avatar"],
            personality=default_agent["personality"],
            experience=default_agent.get("experience", "Medium"),
            negotiation_parameters=default_agent.get("negotiation_parameters", {}),
        )
        db.add(agent_config)
        await db.flush()

        for g in default_agent.get("goals", []):
            goal = AgentGoal(
                agent_config_id=agent_config.id,
                text=g["text"],
                priority=g.get("priority", "Medium"),
            )
            db.add(goal)

        for c in default_agent.get("constraints", []):
            constraint = AgentConstraint(
                agent_config_id=agent_config.id,
                label=c["label"],
                value=c["value"],
            )
            db.add(constraint)

    await db.commit()
    return await _load_full_session(session.id, db)


@router.get("/{session_id}", response_model=SessionResponse)
async def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError("You do not have access to this negotiation session.")
    return session


@router.put("/{session_id}/agents", response_model=SessionResponse)
async def update_agents(
    session_id: str,
    payload: UpdateAgentsPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    # Update agents
    for agent_data in payload.agents:
        agent_id = agent_data.get("id")
        template_id = agent_data.get("agent_template_id")
        
        target_agent = None
        for a in session.agents:
            if (agent_id and a.id == agent_id) or (template_id and a.agent_template_id == template_id):
                target_agent = a
                break

        if target_agent:
            if "name" in agent_data:
                target_agent.name = agent_data["name"]
            if "personality" in agent_data:
                target_agent.personality = agent_data["personality"]
            if "experience" in agent_data:
                target_agent.experience = agent_data["experience"]
            if "negotiation_parameters" in agent_data:
                target_agent.negotiation_parameters = agent_data["negotiation_parameters"]

    session.current_step = "GOALS"
    await db.commit()
    return await _load_full_session(session.id, db)


@router.put("/{session_id}/goals-constraints", response_model=SessionResponse)
async def update_goals_constraints(
    session_id: str,
    payload: List[Dict[str, Any]],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    # Process each agent's goals and constraints
    for agent_item in payload:
        agent_id = agent_item.get("id")
        template_id = agent_item.get("agent_template_id")
        
        target_agent = None
        for a in session.agents:
            if (agent_id and a.id == agent_id) or (template_id and a.agent_template_id == template_id):
                target_agent = a
                break

        if target_agent:
            if "goals" in agent_item and isinstance(agent_item["goals"], list):
                # Clear existing goals and replace
                target_agent.goals.clear()
                for g in agent_item["goals"]:
                    target_agent.goals.append(
                        AgentGoal(text=g["text"], priority=g.get("priority", "Medium"))
                    )

            if "constraints" in agent_item and isinstance(agent_item["constraints"], list):
                # Clear existing constraints and replace
                target_agent.constraints.clear()
                for c in agent_item["constraints"]:
                    target_agent.constraints.append(
                        AgentConstraint(label=c["label"], value=c["value"])
                    )

    session.current_step = "REVIEW"
    await db.commit()
    return await _load_full_session(session.id, db)


@router.post("/{session_id}/confirm-review", response_model=SessionResponse)
async def confirm_review(
    session_id: str,
    payload: ConfirmReviewPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    session.review_confirmed = payload.confirm
    if payload.confirm:
        session.current_step = "NEGOTIATION"
        session.status = "ready"
    await db.commit()
    return await _load_full_session(session.id, db)


@router.post("/{session_id}/start", response_model=SessionResponse)
async def start_negotiation(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    # STRICT WORKFLOW BACKEND VALIDATION GUARD (STEP 01 -> STEP 05 check)
    await WorkflowService.validate_readiness_to_start(session)

    session.status = "running"
    session.current_step = "NEGOTIATION"
    await db.commit()
    return await _load_full_session(session.id, db)
