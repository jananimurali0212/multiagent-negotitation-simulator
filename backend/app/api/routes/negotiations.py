import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, ForbiddenError, WorkflowValidationError
from app.models.user import User
from app.models.scenario import Scenario
from app.models.negotiation import NegotiationSession
from app.models.agent import AgentConfiguration, AgentGoal, AgentConstraint
from app.models.report import OutcomeReport
from app.schemas.negotiation import SessionCreatePayload, SessionResponse
from app.schemas.arena import UserTurnPayload, TurnResultResponse
from app.schemas.report import ReportResponse
from app.api.dependencies import get_current_user
from app.services.workflow_service import WorkflowService
from app.services.seed_data import seed_scenarios
from app.orchestration.orchestrator import OrchestratorService
from app.reports.report_generator import ReportGenerator

logger = logging.getLogger("backend.negotiations")
router = APIRouter(prefix="/negotiations", tags=["Negotiations"])
orchestrator = OrchestratorService()


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
async def create_session(
    payload: SessionCreatePayload,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Creates a new negotiation session initialized strictly with user-provided scenario data."""
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

    has_scenario_data = bool(payload.scenario_data)
    initial_step = "NEGOTIATION" if has_scenario_data else "SCENARIO_DATA"
    initial_status = "ready" if has_scenario_data else "setup"
    review_confirmed = True if has_scenario_data else False
    sc_data = dict(payload.scenario_data or {})

    session = NegotiationSession(
        user_id=current_user.id,
        scenario_id=payload.scenario_id,
        mode=payload.mode,
        human_role=payload.human_role,
        current_step=initial_step,
        status=initial_status,
        review_confirmed=review_confirmed,
        scenario_data=sc_data,
        structured_events=[],
    )
    db.add(session)
    await db.flush()

    # Pre-populate agent configurations grounded strictly on authoritative scenario data
    chosen_personality = sc_data.get("personality") or sc_data.get("ai_personality")
    clean_human_role = (payload.human_role or "").lower()

    for default_agent in scenario.default_agents_data:
        agent_role_lower = (default_agent.get("role") or "").lower()
        agent_template_id = default_agent.get("agent_template_id", "")
        agent_name = default_agent.get("name", "")

        # Determine personality
        agent_personality = default_agent.get("personality", "Collaborative")
        agent_specific_pers = None
        if sc_data.get("agent_personalities") and isinstance(sc_data["agent_personalities"], dict):
            for k, v in sc_data["agent_personalities"].items():
                if k.lower() in agent_template_id.lower() or k.lower() in agent_role_lower or k.lower() in agent_name.lower():
                    agent_specific_pers = v
                    break
        elif sc_data.get(f"{agent_template_id}_personality"):
            agent_specific_pers = sc_data.get(f"{agent_template_id}_personality")

        if agent_specific_pers:
            agent_personality = agent_specific_pers
        elif chosen_personality:
            if payload.mode == "human-ai" and clean_human_role:
                # In Practice mode, apply chosen personality to opposing AI counterparty
                is_this_human = any(
                    token in agent_role_lower or token in agent_template_id.lower() or token in agent_name.lower()
                    for token in clean_human_role.replace("_", "-").split("-") if token
                )
                if not is_this_human:
                    agent_personality = chosen_personality
            elif payload.mode == "ai-ai":
                agent_personality = chosen_personality


        agent_config = AgentConfiguration(
            session_id=session.id,
            agent_template_id=default_agent["agent_template_id"],
            name=default_agent["name"],
            role=default_agent["role"],
            avatar=default_agent["avatar"],
            personality=agent_personality,
            experience=default_agent.get("experience", "Medium"),
            negotiation_parameters=default_agent.get("negotiation_parameters", {}),
        )
        db.add(agent_config)
        await db.flush()

        goals_to_add = []
        constraints_to_add = []

        agent_params = dict(default_agent.get("negotiation_parameters", {}))
        if sc_data:
            role_lower = (default_agent["role"] or "").lower()

            if payload.scenario_id == "vendor-pricing":
                prod = sc_data.get("product") or "Commercial Product/Service"
                prod_desc = sc_data.get("product_description") or ""
                qty = sc_data.get("quantity") or "Standard Volume"
                target_p = sc_data.get("target_price") or "Target Price"
                max_b = sc_data.get("maximum_budget") or "Maximum Budget"
                cur_p = sc_data.get("initial_vendor_price") or sc_data.get("current_vendor_price") or "List Price"
                deliv = sc_data.get("delivery_requirements") or sc_data.get("delivery_requirement") or "Standard Delivery"
                qual = sc_data.get("quality_requirements") or sc_data.get("quality_requirement") or "Standard Quality SLA"
                terms = sc_data.get("payment_terms") or "Standard Terms"
                other = sc_data.get("other_requirements") or sc_data.get("other_conditions") or ""

                if "buyer" in role_lower or "procurement" in role_lower:
                    agent_params["targetPrice"] = str(target_p)
                    agent_params["maxBudget"] = str(max_b)
                    goals_to_add.append({"text": f"Procure {qty} of {prod} at or near target price {target_p} with {qual}.", "priority": "High"})
                    if terms:
                        goals_to_add.append({"text": f"Secure favorable payment terms ({terms}) and required delivery ({deliv}).", "priority": "Medium"})
                    constraints_to_add.append({"label": "Budget Ceiling", "value": f"Cannot exceed maximum budget of {max_b}"})
                    constraints_to_add.append({"label": "Delivery Timeline", "value": f"Requires delivery within {deliv}"})
                    if qual:
                        constraints_to_add.append({"label": "Quality SLA", "value": f"Must adhere to {qual}"})
                else:
                    vendor_floor = sc_data.get("minimum_acceptable_price") or sc_data.get("vendor_floor") or sc_data.get("vendor_minimum_price")
                    if not vendor_floor:
                        try:
                            c_val = float(str(cur_p).replace(",", "").replace("$", "").replace("₹", "").strip())
                            vendor_floor = round(c_val * 0.85, 2)
                        except Exception:
                            vendor_floor = target_p

                    agent_params["targetPrice"] = str(cur_p)
                    agent_params["minPrice"] = str(vendor_floor)
                    goals_to_add.append({"text": f"Defend price near initial price {cur_p} for {qty} of {prod} with floor {vendor_floor}.", "priority": "High"})
                    if prod_desc:
                        goals_to_add.append({"text": f"Highlight value proposition: {prod_desc}.", "priority": "Medium"})
                    constraints_to_add.append({"label": "Minimum Price Floor", "value": f"Cannot accept price below {vendor_floor}; opening quote is {cur_p}"})
                    constraints_to_add.append({"label": "Delivery Schedule", "value": f"Committed delivery timeframe is {deliv}"})
                    if terms:
                        goals_to_add.append({"text": f"Target payment schedule: {terms}", "priority": "Low"})
                        constraints_to_add.append({"label": "Payment Terms", "value": f"Target payment schedule: {terms}"})

            elif payload.scenario_id == "job-offer":
                role_name = sc_data.get("job_role") or "Target Role"
                company = sc_data.get("company") or "Hiring Company"
                curr_sal = sc_data.get("initial_salary_offer") or sc_data.get("current_initial_salary") or "Initial Offer"
                exp_sal = sc_data.get("expected_salary") or "Expected Salary"
                min_sal = sc_data.get("minimum_acceptable_salary") or curr_sal
                w_mode = sc_data.get("work_mode") or "Hybrid"
                loc = sc_data.get("location") or "Designated Location"
                join_d = sc_data.get("joining_date") or "Agreed Date"
                notice = sc_data.get("notice_period") or "Standard Notice"
                benefits = sc_data.get("benefits") or "Standard Benefits Package"
                exp_lvl = sc_data.get("experience") or "Relevant Experience"
                other = sc_data.get("other_requirements") or ""

                if "candidate" in role_lower:
                    agent_params["targetSalary"] = str(exp_sal)
                    agent_params["minSalary"] = str(min_sal)
                    goals_to_add.append({"text": f"Secure position as {role_name} at {company} at target compensation of {exp_sal}.", "priority": "High"})
                    if benefits:
                        goals_to_add.append({"text": f"Ensure package includes expected benefits: {benefits}.", "priority": "Medium"})
                    constraints_to_add.append({"label": "Salary Floor", "value": f"Absolute minimum acceptable compensation is {min_sal}"})
                    constraints_to_add.append({"label": "Work Mode & Location", "value": f"Position in {loc} with {w_mode} work mode"})
                    if notice:
                        constraints_to_add.append({"label": "Availability / Notice", "value": f"Notice period: {notice}; joining date: {join_d}"})
                else:
                    recruiter_max = sc_data.get("maximum_budget") or sc_data.get("max_salary") or sc_data.get("recruiter_maximum_salary")
                    if not recruiter_max:
                        try:
                            c_val = float(str(curr_sal).replace(",", "").replace("$", "").replace("₹", "").strip())
                            e_val = float(str(exp_sal).replace(",", "").replace("$", "").replace("₹", "").strip())
                            recruiter_max = max(c_val, e_val)
                        except Exception:
                            recruiter_max = exp_sal

                    agent_params["targetSalary"] = str(curr_sal)
                    agent_params["maxSalary"] = str(recruiter_max)
                    goals_to_add.append({"text": f"Recruit qualified {role_name} with {exp_lvl} for {company} within target {curr_sal} and cap {recruiter_max}.", "priority": "High"})
                    if other:
                        goals_to_add.append({"text": f"Address candidate requirements: {other}.", "priority": "Medium"})
                    constraints_to_add.append({"label": "Budget Boundary", "value": f"Initial target salary is {curr_sal}; hard ceiling is {recruiter_max}"})
                    constraints_to_add.append({"label": "Work Arrangement", "value": f"Designated role location is {loc} ({w_mode})"})
                    constraints_to_add.append({"label": "Onboarding Timeline", "value": f"Expected start timeline: {join_d} (Notice: {notice})"})

            elif payload.scenario_id == "budget-allocation":
                proj = sc_data.get("project_name") or sc_data.get("project") or "Strategic Project"
                tot_b = sc_data.get("total_budget") or "Total Budget Pool"
                depts = sc_data.get("teams_departments") or "Participating Teams"
                init_alloc = sc_data.get("initial_allocations") or sc_data.get("initial_allocation") or "Initial Allocations"
                req_b = sc_data.get("requested_budget") or "Department Requests"
                priorities = sc_data.get("priorities") or sc_data.get("priority_areas") or "Core Objectives"
                deadline = sc_data.get("deadline") or "Target Deadline"
                resources = sc_data.get("resource_requirements") or ""
                constraints_txt = sc_data.get("constraints") or ""
                other = sc_data.get("other_requirements") or ""

                agent_params["totalPool"] = str(tot_b)
                agent_params["maxAllocation"] = str(tot_b)
                if req_b:
                    agent_params["requestedBudget"] = str(req_b)

                goals_to_add.append({"text": f"Fairly allocate total pool {tot_b} across {depts} for {proj} according to {priorities}.", "priority": "High"})
                if req_b:
                    goals_to_add.append({"text": f"Reconcile requested allocations ({req_b}) with baseline proposal ({init_alloc}).", "priority": "High"})
                constraints_to_add.append({"label": "Total Pool Ceiling", "value": f"Total funding pool cap is {tot_b} with zero unauthorized overrun"})
                constraints_to_add.append({"label": "Project Deadline", "value": f"Project delivery required by {deadline}"})
                if resources:
                    constraints_to_add.append({"label": "Resource Dependencies", "value": resources})

        agent_config.negotiation_parameters = agent_params

        if not goals_to_add:
            goals_to_add = default_agent.get("goals", [])
        if not constraints_to_add:
            constraints_to_add = default_agent.get("constraints", [])

        for g in goals_to_add:
            goal = AgentGoal(
                agent_config_id=agent_config.id,
                text=g["text"],
                priority=g.get("priority", "Medium"),
            )
            db.add(goal)

        for c in constraints_to_add:
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
    """Retrieves state, messages, and parameters for a negotiation session."""
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError("You do not have access to this negotiation session.")
    return session


@router.post("/{session_id}/start", response_model=SessionResponse)
async def start_negotiation(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Starts the negotiation session and initializes first speaker turn."""
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    await WorkflowService.validate_readiness_to_start(session)

    if session.mode == "human-ai":
        from app.orchestration.turn_resolver import TurnResolver
        ordered = TurnResolver.get_ordered_agents(session.scenario_id, session.agents)
        is_human_first = TurnResolver.is_human_turn(session.scenario_id, session.mode, session.human_role, ordered, 0)
        session.status = "waiting_for_human" if is_human_first else "running"
    else:
        session.status = "running"

    session.current_step = "NEGOTIATION"
    await db.commit()
    return await _load_full_session(session.id, db)


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
        turn_index=payload.turn_index,
        request_id=payload.request_id,
    )
    return TurnResultResponse(**result)


@router.post("/{session_id}/complete", response_model=TurnResultResponse)
async def complete_negotiation(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Completes or stops an ongoing negotiation session.
    Determines whether the session resulted in Agreement, Partial Agreement, or Deadlock,
    automatically generates and saves the outcome report, and returns the final state.
    """
    session = await _load_full_session(session_id, db)
    if session.user_id != current_user.id:
        raise ForbiddenError()

    messages = session.messages or []
    final_terms = session.final_terms or {}
    if not final_terms:
        for m in reversed(messages):
            if m.offer_data:
                final_terms = m.offer_data
                break

    # Determine final outcome status
    if session.status == "deadlock" or session.deadlock_reason:
        outcome = "Deadlock"
        status_val = "deadlock"
        session.agreement_reached = False
    elif session.agreement_reached:
        outcome = "Agreement Reached"
        status_val = "finished"
    elif final_terms and len(messages) >= 2 and not session.deadlock_reason:
        outcome = "Partial Agreement"
        status_val = "finished"
        session.agreement_reached = True
        session.final_terms = final_terms
    else:
        outcome = "Deadlock"
        status_val = "deadlock"

    report = await OrchestratorService.finalize_negotiation(
        session=session,
        outcome=outcome,
        db=db,
        status=status_val,
        final_terms=final_terms,
        deadlock_reason=session.deadlock_reason,
    )
    report_data = ReportResponse.model_validate(report).model_dump(mode="json")

    return TurnResultResponse(
        status=session.status,
        round=session.current_round,
        current_turn_speaker="System",
        message=None,
        agreement_reached=session.agreement_reached,
        final_terms=session.final_terms,
        report=report_data,
    )


@router.get("/{session_id}/report", response_model=ReportResponse)
async def get_session_report(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieves the generated outcome report directly for the specified negotiation session."""
    stmt = (
        select(OutcomeReport)
        .where(OutcomeReport.session_id == session_id)
        .order_by(OutcomeReport.created_at.desc())
    )
    result = await db.execute(stmt)
    report = result.scalars().first()

    if not report:
        # Check if session exists; if so, generate report automatically on demand
        session = await _load_full_session(session_id, db)
        if session.user_id != current_user.id:
            raise ForbiddenError()
        outcome = (
            "Agreement Reached"
            if session.agreement_reached
            else ("Deadlock" if session.status == "deadlock" else "No Agreement / Deadlock")
        )
        report = await OrchestratorService.finalize_negotiation(
            session=session, outcome=outcome, db=db
        )

    # Auto-heal any historical reports that suffered from zero salary bug
    if report.scenario_id == "job-offer":
        sal_val = (report.scenario_analysis or {}).get("final_salary", "")
        if (sal_val in ["₹0", "$0", "0", "0.0", "₹0 / year", "$0 / year"] or (sal_val.strip() in ["₹0", "$0"])) and report.outcome in ["Agreement Reached", "Agreement", "Partial Agreement"]:
            session = await _load_full_session(session_id, db)
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

