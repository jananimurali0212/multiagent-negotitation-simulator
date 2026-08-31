from typing import List, Dict, Any, Optional
from pydantic import BaseModel
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


def normalize_fixed_agent_identity(scenario_id: str, role: str, name: str) -> tuple[str, str]:
    """Ensures fixed scenario-specific agent names and avatars are strictly enforced by the backend."""
    r = (role or "").lower()
    n = (name or "").lower()
    
    if scenario_id == "vendor-pricing":
        if any(k in r or k in n for k in ["buyer", "procurement", "purchasing", "client"]):
            return "Buyer Agent", "BA"
        return "Vendor Agent", "VA"
        
    elif scenario_id == "job-offer":
        if any(k in r or k in n for k in ["recruiter", "hr", "hiring", "talent"]):
            return "Recruiter Agent", "RA"
        return "Candidate Agent", "CA"
        
    elif scenario_id == "budget-allocation":
        if any(k in r or k in n for k in ["finance", "financial", "cfo"]):
            return "Finance Manager Agent", "FM"
        elif any(k in r or k in n for k in ["project", "engineering", "lead", "pm"]):
            return "Project Manager Agent", "PM"
        return "Department Head Agent", "DH"
        
    return name or "Agent", "AG"


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
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

    # Create new isolated negotiation session
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

    # Determine source of agents: User configured payload takes full priority over scenario defaults
    raw_agents_source = payload.agents if (payload.agents and len(payload.agents) >= 2) else scenario.default_agents_data

    for raw_agent in raw_agents_source:
        fixed_name, fixed_avatar = normalize_fixed_agent_identity(
            payload.scenario_id,
            raw_agent.get("role", ""),
            raw_agent.get("name", "")
        )
        
        # Merge negotiation_parameters
        params = dict(raw_agent.get("negotiation_parameters") or {})
        for param_k in ["targetPrice", "minPrice", "maxBudget", "targetSalary", "minSalary", "maxSalary", "targetAllocation", "minAllocation", "paymentTerms", "warrantySupport", "deliveryRequirement"]:
            if param_k in raw_agent and raw_agent[param_k] is not None:
                params[param_k] = raw_agent[param_k]

        agent_config = AgentConfiguration(
            session_id=session.id,
            agent_template_id=raw_agent.get("agent_template_id") or raw_agent.get("id") or "agent",
            name=fixed_name,
            role=raw_agent.get("role", fixed_name),
            avatar=fixed_avatar,
            personality=raw_agent.get("personality", "Collaborative"),
            experience=raw_agent.get("experience", "Medium"),
            negotiation_parameters=params,
        )
        db.add(agent_config)
        await db.flush()

        # Persist goals
        goals_list = raw_agent.get("goals", [])
        if not goals_list and "primary_goal" in raw_agent:
            goals_list = [{"text": raw_agent["primary_goal"], "priority": "High"}]
        for g in goals_list:
            goal_text = g.get("text") if isinstance(g, dict) else str(g)
            if goal_text:
                goal = AgentGoal(
                    agent_config_id=agent_config.id,
                    text=goal_text,
                    priority=g.get("priority", "Medium") if isinstance(g, dict) else "Medium",
                )
                db.add(goal)

        # Persist constraints
        constraints_list = raw_agent.get("constraints", [])
        for c in constraints_list:
            if isinstance(c, dict) and c.get("value"):
                constraint = AgentConstraint(
                    agent_config_id=agent_config.id,
                    label=c.get("label", "Constraint"),
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

    agents_list = payload.agents
    session_agents = list(session.agents)

    # Update agents with robust matching
    for idx, agent_data in enumerate(agents_list):
        agent_id = agent_data.get("id")
        template_id = agent_data.get("agent_template_id")
        role_hint = (agent_data.get("role") or "").lower()
        
        target_agent = None
        for a in session_agents:
            if (agent_id and a.id == agent_id) or (template_id and a.agent_template_id == template_id):
                target_agent = a
                break
        if not target_agent:
            for a in session_agents:
                if role_hint and (role_hint in a.role.lower() or a.role.lower() in role_hint):
                    target_agent = a
                    break
        if not target_agent and idx < len(session_agents):
            target_agent = session_agents[idx]

        if target_agent:
            fixed_name, fixed_avatar = normalize_fixed_agent_identity(
                session.scenario_id,
                agent_data.get("role", target_agent.role),
                agent_data.get("name", target_agent.name)
            )
            target_agent.name = fixed_name
            target_agent.avatar = fixed_avatar
            if "personality" in agent_data and agent_data["personality"]:
                target_agent.personality = agent_data["personality"]
            if "experience" in agent_data and agent_data["experience"]:
                target_agent.experience = agent_data["experience"]

            # Merge negotiation_parameters
            params = dict(target_agent.negotiation_parameters or {})
            if "negotiation_parameters" in agent_data and isinstance(agent_data["negotiation_parameters"], dict):
                params.update(agent_data["negotiation_parameters"])
            for param_k in ["targetPrice", "minPrice", "maxBudget", "targetSalary", "minSalary", "maxSalary", "targetAllocation", "minAllocation", "maxAllocation", "paymentTerms", "warrantySupport", "deliveryRequirement", "equity", "remoteDays", "workArrangement"]:
                if param_k in agent_data and agent_data[param_k] is not None:
                    params[param_k] = agent_data[param_k]
            target_agent.negotiation_parameters = params

            # Persist goals if present
            if "goals" in agent_data and isinstance(agent_data["goals"], list) and len(agent_data["goals"]) > 0:
                target_agent.goals.clear()
                for g in agent_data["goals"]:
                    text = g.get("text") if isinstance(g, dict) else str(g)
                    priority = g.get("priority", "Medium") if isinstance(g, dict) else "Medium"
                    if text:
                        target_agent.goals.append(AgentGoal(text=text, priority=priority))

            # Persist constraints if present
            if "constraints" in agent_data and isinstance(agent_data["constraints"], list) and len(agent_data["constraints"]) > 0:
                target_agent.constraints.clear()
                for c in agent_data["constraints"]:
                    if isinstance(c, dict) and c.get("value"):
                        target_agent.constraints.append(AgentConstraint(label=c.get("label", "Constraint"), value=str(c["value"])))

    session.current_step = "GOALS"
    await db.commit()
    return await _load_full_session(session.id, db)


@router.put("/{session_id}/goals-constraints", response_model=SessionResponse)
async def update_goals_constraints(
    session_id: str,
    payload: Any,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    # Normalize payload format (list or { agents: [...] } or { goals_constraints: [...] })
    raw_list: List[Dict[str, Any]] = []
    if isinstance(payload, list):
        raw_list = payload
    elif isinstance(payload, dict):
        raw_list = payload.get("agents") or payload.get("goals_constraints") or payload.get("goals") or [payload]

    session_agents = list(session.agents)

    # Process each agent's goals and constraints
    for idx, agent_item in enumerate(raw_list):
        agent_id = agent_item.get("id")
        template_id = agent_item.get("agent_template_id")
        role_hint = (agent_item.get("role") or "").lower()
        
        target_agent = None
        for a in session_agents:
            if (agent_id and a.id == agent_id) or (template_id and a.agent_template_id == template_id):
                target_agent = a
                break
        if not target_agent:
            for a in session_agents:
                if role_hint and (role_hint in a.role.lower() or a.role.lower() in role_hint):
                    target_agent = a
                    break
        if not target_agent and idx < len(session_agents):
            target_agent = session_agents[idx]

        if target_agent:
            # Update parameters if present
            params = dict(target_agent.negotiation_parameters or {})
            if "negotiation_parameters" in agent_item and isinstance(agent_item["negotiation_parameters"], dict):
                params.update(agent_item["negotiation_parameters"])
            for param_k in ["targetPrice", "minPrice", "maxBudget", "targetSalary", "minSalary", "maxSalary", "targetAllocation", "minAllocation", "maxAllocation", "paymentTerms", "warrantySupport", "deliveryRequirement", "equity", "remoteDays", "workArrangement"]:
                if param_k in agent_item and agent_item[param_k] is not None:
                    params[param_k] = agent_item[param_k]
            target_agent.negotiation_parameters = params

            if "goals" in agent_item and isinstance(agent_item["goals"], list):
                target_agent.goals.clear()
                for g in agent_item["goals"]:
                    text = g.get("text") if isinstance(g, dict) else str(g)
                    priority = g.get("priority", "Medium") if isinstance(g, dict) else "Medium"
                    if text:
                        target_agent.goals.append(
                            AgentGoal(text=text, priority=priority)
                        )

            if "constraints" in agent_item and isinstance(agent_item["constraints"], list):
                target_agent.constraints.clear()
                for c in agent_item["constraints"]:
                    if isinstance(c, dict) and c.get("value"):
                        target_agent.constraints.append(
                            AgentConstraint(label=c.get("label", "Constraint"), value=str(c["value"]))
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


from app.orchestration.runner import start_background_simulation, stop_background_simulation


@router.get("", response_model=List[SessionResponse])
async def list_user_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lists all negotiation sessions for the current user in descending creation order."""
    stmt = (
        select(NegotiationSession)
        .where(NegotiationSession.user_id == current_user.id)
        .options(
            selectinload(NegotiationSession.agents).selectinload(AgentConfiguration.goals),
            selectinload(NegotiationSession.agents).selectinload(AgentConfiguration.constraints),
            selectinload(NegotiationSession.messages),
        )
        .order_by(NegotiationSession.updated_at.desc())
    )
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    return sessions


@router.delete("/{session_id}", status_code=status.HTTP_200_OK)
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deletes a negotiation session and cascades deletion of its messages, agents, and reports."""
    stop_background_simulation(session_id)
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    await db.delete(session)
    await db.commit()
    return {"status": "deleted", "session_id": session_id}


class BulkDeleteSessionsPayload(BaseModel):
    session_ids: Optional[List[str]] = None
    delete_all: bool = False


@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
async def bulk_delete_sessions(
    payload: BulkDeleteSessionsPayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Deletes multiple or all negotiation sessions for the current user."""
    stmt = (
        select(NegotiationSession)
        .where(NegotiationSession.user_id == current_user.id)
        .options(
            selectinload(NegotiationSession.agents),
            selectinload(NegotiationSession.messages),
        )
    )
    if not payload.delete_all and payload.session_ids:
        stmt = stmt.where(NegotiationSession.id.in_(payload.session_ids))

    result = await db.execute(stmt)
    sessions = result.scalars().all()
    deleted_count = len(sessions)

    for sess in sessions:
        stop_background_simulation(sess.id)
        await db.delete(sess)

    await db.commit()
    return {"status": "success", "deleted_count": deleted_count}


@router.post("/{session_id}/resume", response_model=SessionResponse)
async def resume_negotiation(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resumes a paused negotiation session and resumes background runner if AI vs AI."""
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    if session.status in ["paused", "ready"]:
        session.status = "running"
        await db.commit()

    if session.mode == "ai-ai" and session.status == "running":
        start_background_simulation(session.id)

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

    # Capture configuration snapshot of all configured agents, goals, constraints, parameters
    config_snapshot = {
        "session_id": session.id,
        "scenario_id": session.scenario_id,
        "mode": session.mode,
        "human_role": session.human_role,
        "agents": [
            {
                "id": a.id,
                "template_id": a.agent_template_id,
                "name": a.name,
                "role": a.role,
                "personality": a.personality,
                "experience": a.experience,
                "negotiation_parameters": dict(a.negotiation_parameters or {}),
                "goals": [{"priority": g.priority, "text": g.text} for g in a.goals],
                "constraints": [{"label": c.label, "value": c.value} for c in a.constraints],
            }
            for a in session.agents
        ]
    }

    import logging
    logger = logging.getLogger("backend.negotiation.start")
    logger.info(
        f"\n==================== [SESSION_START_SNAPSHOT] ====================\n"
        f"  SESSION ID: {session.id}\n"
        f"  SCENARIO ID: {session.scenario_id}\n"
        f"  MODE: {session.mode}\n"
        f"  AGENTS CONFIGURED: {len(session.agents)}\n"
        f"  CONFIG SNAPSHOT: {config_snapshot}\n"
        f"=================================================================="
    )

    session.status = "running"
    session.current_step = "NEGOTIATION"
    await db.commit()

    # Launch background simulation runner if AI vs AI mode
    if session.mode == "ai-ai":
        start_background_simulation(session.id)

    return await _load_full_session(session.id, db)
