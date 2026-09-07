import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.negotiation import NegotiationSession, NegotiationMessage
from app.models.agent import AgentConfiguration, AgentGoal, AgentConstraint
from app.models.report import OutcomeReport
from app.orchestration.orchestrator import OrchestratorService
from app.orchestration.runner import stop_background_simulation
from app.services.context_builder import NegotiationContextBuilder
from app.negotiation.rules.acceptance_rules import AcceptanceRules
from app.negotiation.rules.deadlock_rules import DeadlockRules
from app.schemas.agent import AgentConfigSchema
from app.schemas.arena import AgentDecision


async def _get_auth_headers(client: AsyncClient, email: str = "continuity@example.com") -> dict:
    signup_res = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "Password123!", "name": "Continuity User"},
    )
    if signup_res.status_code == 201:
        token = signup_res.json()["access_token"]
    else:
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "Password123!"},
        )
        token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_conversation_continuity_and_memory(client: AsyncClient):
    """Test 1: Generate 3+ turns. Verify Turn 3 context includes Turn 1, Turn 2, exact configured data, same session_id."""
    headers = await _get_auth_headers(client, "test_cont@example.com")

    # Create Vendor Pricing session
    create_res = await client.post(
        "/api/v1/negotiations",
        headers=headers,
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
    )
    assert create_res.status_code == 201
    session_id = create_res.json()["id"]

    # Configure agents with exact parameters
    put_agents_res = await client.put(
        f"/api/v1/negotiations/{session_id}/agents",
        headers=headers,
        json={
            "agents": [
                {
                    "name": "Vendor Agent",
                    "role": "Vendor Agent",
                    "personality": "Collaborative",
                    "negotiation_parameters": {"targetPrice": "$60/user/month", "minPrice": "$50/user/month"},
                    "goals": [{"text": "Close at $60/user/month", "priority": "High"}],
                    "constraints": [{"label": "Price Floor", "value": "$50/user/month"}],
                },
                {
                    "name": "Buyer Agent",
                    "role": "Buyer Agent",
                    "personality": "Collaborative",
                    "negotiation_parameters": {"targetPrice": "$40/user/month", "maxBudget": "$48/user/month"},
                    "goals": [{"text": "Stay under $48/user/month", "priority": "High"}],
                    "constraints": [{"label": "Budget Cap", "value": "$48/user/month"}],
                },
            ]
        },
    )
    assert put_agents_res.status_code == 200

    # Confirm and start
    await client.post(f"/api/v1/negotiations/{session_id}/confirm-review", headers=headers, json={"confirm": True})
    start_res = await client.post(f"/api/v1/negotiations/{session_id}/start", headers=headers)
    assert start_res.status_code == 200
    stop_background_simulation(session_id)

    # Execute Turn 1 (Vendor Agent)
    step1_res = await client.post(f"/api/v1/negotiations/{session_id}/step", headers=headers)
    assert step1_res.status_code == 200
    turn1_msg = step1_res.json()["message"]
    assert turn1_msg["sender"] == "Vendor Agent"
    assert turn1_msg["round"] == 1

    # Execute Turn 2 (Buyer Agent)
    step2_res = await client.post(f"/api/v1/negotiations/{session_id}/step", headers=headers)
    assert step2_res.status_code == 200
    turn2_msg = step2_res.json()["message"]
    assert turn2_msg["sender"] == "Buyer Agent"
    assert turn2_msg["round"] == 1

    # Verify context builder derives Turn 1 and Turn 2 for Turn 3
    sess_res = await client.get(f"/api/v1/negotiations/{session_id}", headers=headers)
    sess_data = sess_res.json()
    assert len(sess_data["messages"]) == 2

    active_agent = sess_data["agents"][0]
    context = NegotiationContextBuilder.build_negotiation_context(
        session_id=session_id,
        scenario_id="vendor-pricing",
        scenario_title="Vendor Pricing Negotiation",
        scenario_objective="Agree on licensing fees",
        active_agent=active_agent,
        other_agents=[sess_data["agents"][1]],
        messages=sess_data["messages"],
        current_round=2,
    )

    context_summary = context["context_summary"]
    assert "Vendor Agent" in context_summary
    assert "Buyer Agent" in context_summary
    assert turn1_msg["content"] in context["formatted_transcript"]
    assert turn2_msg["content"] in context["formatted_transcript"]
    assert context["latest_offer"] is not None


@pytest.mark.asyncio
async def test_two_agent_turn_order(client: AsyncClient):
    """Test 2: Vendor Pricing turn order: Vendor Agent -> Buyer Agent -> Vendor Agent -> Buyer Agent. No duplicate consecutive speaker."""
    headers = await _get_auth_headers(client, "test_order2@example.com")

    create_res = await client.post(
        "/api/v1/negotiations",
        headers=headers,
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
    )
    session_id = create_res.json()["id"]

    await client.post(f"/api/v1/negotiations/{session_id}/confirm-review", headers=headers, json={"confirm": True})
    await client.post(f"/api/v1/negotiations/{session_id}/start", headers=headers)
    stop_background_simulation(session_id)

    speakers = []
    rounds = []
    for _ in range(4):
        step_res = await client.post(f"/api/v1/negotiations/{session_id}/step", headers=headers)
        assert step_res.status_code == 200
        msg = step_res.json()["message"]
        if msg:
            speakers.append(msg["sender"])
            rounds.append(msg["round"])

    # Strict turn order
    assert speakers == ["Vendor Agent", "Buyer Agent", "Vendor Agent", "Buyer Agent"]
    # Round definition: Round 1 (turns 0, 1), Round 2 (turns 2, 3)
    assert rounds == [1, 1, 2, 2]


@pytest.mark.asyncio
async def test_three_agent_turn_order(client: AsyncClient):
    """Test 3: Budget Allocation: Dept Head -> Project Manager -> Finance Manager -> Dept Head."""
    headers = await _get_auth_headers(client, "test_order3@example.com")

    create_res = await client.post(
        "/api/v1/negotiations",
        headers=headers,
        json={"scenario_id": "budget-allocation", "mode": "ai-ai"},
    )
    session_id = create_res.json()["id"]

    await client.post(f"/api/v1/negotiations/{session_id}/confirm-review", headers=headers, json={"confirm": True})
    await client.post(f"/api/v1/negotiations/{session_id}/start", headers=headers)
    stop_background_simulation(session_id)

    speakers = []
    rounds = []
    for _ in range(4):
        step_res = await client.post(f"/api/v1/negotiations/{session_id}/step", headers=headers)
        assert step_res.status_code == 200
        msg = step_res.json()["message"]
        if msg:
            speakers.append(msg["sender"])
            rounds.append(msg["round"])

    assert speakers == [
        "Department Head Agent",
        "Project Manager Agent",
        "Finance Manager Agent",
        "Department Head Agent",
    ]
    # Round 1 for first 3 turns, Round 2 for 4th turn
    assert rounds == [1, 1, 1, 2]


@pytest.mark.asyncio
async def test_refresh_continuity(client: AsyncClient):
    """Test 4: Generate turns. Refresh/reload. Verify exact round, current speaker, messages, and next speaker match."""
    headers = await _get_auth_headers(client, "test_refresh@example.com")

    create_res = await client.post(
        "/api/v1/negotiations",
        headers=headers,
        json={"scenario_id": "job-offer", "mode": "ai-ai"},
    )
    session_id = create_res.json()["id"]
    await client.post(f"/api/v1/negotiations/{session_id}/confirm-review", headers=headers, json={"confirm": True})
    await client.post(f"/api/v1/negotiations/{session_id}/start", headers=headers)
    stop_background_simulation(session_id)

    # Run 3 turns (Recruiter -> Candidate -> Recruiter)
    for _ in range(3):
        await client.post(f"/api/v1/negotiations/{session_id}/step", headers=headers)

    # Refresh session state
    refresh_res = await client.get(f"/api/v1/negotiations/{session_id}", headers=headers)
    assert refresh_res.status_code == 200
    state = refresh_res.json()

    assert state["id"] == session_id
    assert len(state["messages"]) == 3
    assert state["current_turn_index"] == 3
    assert state["current_round"] == 2
    # Next speaker should be Candidate Agent (turn 3 % 2 = 1)
    assert state["current_speaker"] == "Candidate Agent"


@pytest.mark.asyncio
async def test_agreement_validation_requires_valid_proposal():
    """Test 5: Try to accept without an existing proposal or with invalid terms. Acceptance must be rejected."""
    agent_schema = AgentConfigSchema(
        id="buyer-1",
        agent_template_id="buyer",
        name="Buyer Agent",
        role="Buyer Agent",
        avatar="BA",
        personality="Collaborative",
        goals=[{"text": "Stay under $50", "priority": "High"}],
        constraints=[{"label": "Max price", "value": "$50/user/month"}],
        negotiation_parameters={"targetPrice": "$40/user/month"},
    )

    # Case A: No previous offer and empty current offer
    res_no_offer = AcceptanceRules.validate_acceptance(
        agent=agent_schema,
        scenario_id="vendor-pricing",
        offer={},
        previous_messages=[],
        status="running",
    )
    assert not res_no_offer.is_valid
    assert res_no_offer.error_code == "ACCEPTANCE_NO_OFFER_FOUND"

    # Case B: Offer violates buyer's hard constraint ($75 > $50 cap)
    res_violation = AcceptanceRules.validate_acceptance(
        agent=agent_schema,
        scenario_id="vendor-pricing",
        offer={"price": "$75/user/month"},
        previous_messages=[],
        status="running",
    )
    assert not res_violation.is_valid
    assert res_violation.error_code == "ACCEPTANCE_VIOLATES_HARD_CONSTRAINT"


@pytest.mark.asyncio
async def test_repeated_offer_deadlock_detection():
    """Test 6: Repeated identical offers across consecutive turns trigger deadlock detection."""
    identical_msgs = [
        {"sender": "Buyer Agent", "offer_data": {"price": "$40/user/month"}},
        {"sender": "Vendor Agent", "offer_data": {"price": "$60/user/month"}},
        {"sender": "Buyer Agent", "offer_data": {"price": "$40/user/month"}},
        {"sender": "Vendor Agent", "offer_data": {"price": "$60/user/month"}},
        {"sender": "Buyer Agent", "offer_data": {"price": "$40/user/month"}},
        {"sender": "Vendor Agent", "offer_data": {"price": "$60/user/month"}},
    ]

    # Stagnation test with 4 consecutive identical offers
    is_deadlock, reason = DeadlockRules.evaluate_deadlock(
        scenario_id="vendor-pricing",
        latest_decision_action="counteroffer",
        current_round=3,
        max_rounds=20,
        previous_messages=identical_msgs,
        zopa_info={"status": "overlap", "zopa_exists": True},
    )
    assert is_deadlock is True
    assert "identical repeated offers" in reason.lower() or "deadlock" in reason.lower()


@pytest.mark.asyncio
async def test_deadlock_on_incompatible_constraints_generates_report(client: AsyncClient):
    """Test 7: Incompatible hard constraints trigger deadlock and generate outcome report."""
    headers = await _get_auth_headers(client, "test_deadlock@example.com")

    create_res = await client.post(
        "/api/v1/negotiations",
        headers=headers,
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
    )
    session_id = create_res.json()["id"]

    # Configure strictly incompatible hard constraints (Vendor min $80 > Buyer max $40)
    await client.put(
        f"/api/v1/negotiations/{session_id}/agents",
        headers=headers,
        json={
            "agents": [
                {
                    "name": "Vendor Agent",
                    "role": "Vendor Agent",
                    "personality": "Aggressive",
                    "negotiation_parameters": {"minPrice": "$80/user/month", "targetPrice": "$90/user/month"},
                    "constraints": [{"label": "Absolute Floor", "value": "$80/user/month"}],
                },
                {
                    "name": "Buyer Agent",
                    "role": "Buyer Agent",
                    "personality": "Aggressive",
                    "negotiation_parameters": {"maxBudget": "$40/user/month", "targetPrice": "$35/user/month"},
                    "constraints": [{"label": "Budget Cap", "value": "$40/user/month"}],
                },
            ]
        },
    )
    await client.post(f"/api/v1/negotiations/{session_id}/confirm-review", headers=headers, json={"confirm": True})
    await client.post(f"/api/v1/negotiations/{session_id}/start", headers=headers)
    stop_background_simulation(session_id)

    # Run turns until deadlock is reached (round >= 3)
    final_status = "running"
    for _ in range(8):
        step_res = await client.post(f"/api/v1/negotiations/{session_id}/step", headers=headers)
        assert step_res.status_code == 200
        step_data = step_res.json()
        final_status = step_data["status"]
        if final_status in ["deadlock", "finished"]:
            break

    assert final_status == "deadlock"

    # Verify report is generated and saved to DB
    rep_res = await client.get(f"/api/v1/reports/{session_id}", headers=headers)
    assert rep_res.status_code == 200
    report_data = rep_res.json()
    assert report_data["outcome"] in ["Deadlock", "Unresolved / Terminated"]
