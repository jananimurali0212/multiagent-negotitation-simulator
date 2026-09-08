import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from datetime import datetime, timezone

from app.orchestration.turn_resolver import TurnResolver
from app.orchestration.orchestrator import OrchestratorService
from app.models.agent import AgentConfiguration
from app.models.negotiation import NegotiationSession, NegotiationMessage
from app.negotiation.rules.deadlock_rules import DeadlockRules
from app.negotiation.rules.acceptance_rules import AcceptanceRules
from app.schemas.agent import AgentConfigSchema, ConstraintSchema


# ===========================================================================
# FIXTURES ACROSS ALL THREE SCENARIOS
# ===========================================================================

@pytest.fixture
def vendor_pricing_agents():
    return [
        AgentConfiguration(id="a1", agent_template_id="vendor-sales", name="Sarah Chen", role="Enterprise Sales VP", avatar="SC", personality="Collaborative"),
        AgentConfiguration(id="a2", agent_template_id="buyer-proc", name="Alex Rivera", role="Procurement Director", avatar="AR", personality="Collaborative"),
    ]


@pytest.fixture
def job_offer_agents():
    return [
        AgentConfiguration(id="j1", agent_template_id="recruiter-hr", name="Marcus Brody", role="Lead HR Partner", avatar="MB", personality="Collaborative"),
        AgentConfiguration(id="j2", agent_template_id="candidate-hr", name="Elena Rostova", role="Senior Developer Candidate", avatar="ER", personality="Collaborative"),
    ]


@pytest.fixture
def budget_allocation_agents():
    return [
        AgentConfiguration(id="b1", agent_template_id="finance-mgr", name="David Vance", role="VP of Finance", avatar="DV", personality="Risk-Averse"),
        AgentConfiguration(id="b2", agent_template_id="pm-lead", name="Priya Sharma", role="Engineering Director", avatar="PS", personality="Aggressive"),
        AgentConfiguration(id="b3", agent_template_id="dept-head", name="Liam Connor", role="CMO / Marketing Lead", avatar="LC", personality="Collaborative"),
    ]


# ===========================================================================
# 1. SCENARIO VALIDATION: VENDOR PRICING
# ===========================================================================

def test_vendor_pricing_role_resolution(vendor_pricing_agents):
    # Test all Buyer variations
    for r in ["buyer", "buyer-proc", "procurement", "procurement-director", "alex"]:
        ag = TurnResolver.resolve_human_agent("vendor-pricing", r, vendor_pricing_agents)
        assert ag.id == "a2", f"Failed for buyer role variant: {r}"

    # Test all Vendor variations
    for r in ["vendor", "vendor-sales", "sales", "enterprise-sales", "sarah"]:
        ag = TurnResolver.resolve_human_agent("vendor-pricing", r, vendor_pricing_agents)
        assert ag.id == "a1", f"Failed for vendor role variant: {r}"


def test_vendor_pricing_turn_order(vendor_pricing_agents):
    # Vendor speaks first (turn 0), Buyer speaks second (turn 1)
    ordered = TurnResolver.get_ordered_agents("vendor-pricing", vendor_pricing_agents)
    assert ordered[0].name == "Sarah Chen"
    assert ordered[1].name == "Alex Rivera"

    # Human Buyer: Turn 0 (AI Vendor), Turn 1 (Human Buyer)
    assert TurnResolver.is_human_turn("vendor-pricing", "human-ai", "buyer", vendor_pricing_agents, 0) is False
    assert TurnResolver.is_human_turn("vendor-pricing", "human-ai", "buyer", vendor_pricing_agents, 1) is True

    # Human Vendor: Turn 0 (Human Vendor), Turn 1 (AI Buyer)
    assert TurnResolver.is_human_turn("vendor-pricing", "human-ai", "vendor", vendor_pricing_agents, 0) is True
    assert TurnResolver.is_human_turn("vendor-pricing", "human-ai", "vendor", vendor_pricing_agents, 1) is False


# ===========================================================================
# 2. SCENARIO VALIDATION: JOB OFFER
# ===========================================================================

def test_job_offer_role_resolution(job_offer_agents):
    for r in ["recruiter", "hr", "recruiter-hr", "lead-hr-partner", "marcus", "hiring-manager"]:
        ag = TurnResolver.resolve_human_agent("job-offer", r, job_offer_agents)
        assert ag.id == "j1", f"Failed for recruiter role variant: {r}"

    for r in ["candidate", "developer", "engineer", "candidate-hr", "elena"]:
        ag = TurnResolver.resolve_human_agent("job-offer", r, job_offer_agents)
        assert ag.id == "j2", f"Failed for candidate role variant: {r}"


def test_job_offer_turn_order(job_offer_agents):
    ordered = TurnResolver.get_ordered_agents("job-offer", job_offer_agents)
    assert ordered[0].name == "Marcus Brody"
    assert ordered[1].name == "Elena Rostova"

    # Human Recruiter: Turn 0 is Human, Turn 1 is AI
    assert TurnResolver.is_human_turn("job-offer", "human-ai", "recruiter", job_offer_agents, 0) is True
    assert TurnResolver.is_human_turn("job-offer", "human-ai", "recruiter", job_offer_agents, 1) is False

    # Human Candidate: Turn 0 is AI, Turn 1 is Human
    assert TurnResolver.is_human_turn("job-offer", "human-ai", "candidate", job_offer_agents, 0) is False
    assert TurnResolver.is_human_turn("job-offer", "human-ai", "candidate", job_offer_agents, 1) is True


# ===========================================================================
# 3. SCENARIO VALIDATION: BUDGET ALLOCATION (3 AGENTS)
# ===========================================================================

def test_budget_allocation_role_resolution_all_roles(budget_allocation_agents):
    # Department Head variants -> Liam Connor (b3)
    for r in ["department-head", "dept-head", "marketing", "cmo", "liam"]:
        ag = TurnResolver.resolve_human_agent("budget-allocation", r, budget_allocation_agents)
        assert ag.id == "b3", f"Failed for Department Head variant: {r}"

    # Project Manager variants -> Priya Sharma (b2)
    for r in ["project-manager", "pm-lead", "engineering", "engineering-director", "priya", "pm"]:
        ag = TurnResolver.resolve_human_agent("budget-allocation", r, budget_allocation_agents)
        assert ag.id == "b2", f"Failed for Project Manager variant: {r}"

    # Finance Director / Manager variants -> David Vance (b1)
    for r in ["finance-director", "finance-manager", "finance-mgr", "vp-finance", "vp of finance", "david", "cfo", "finance"]:
        ag = TurnResolver.resolve_human_agent("budget-allocation", r, budget_allocation_agents)
        assert ag.id == "b1", f"Failed for Finance Director variant: {r}"


def test_budget_allocation_three_agent_sequence(budget_allocation_agents):
    ordered = TurnResolver.get_ordered_agents("budget-allocation", budget_allocation_agents)
    assert len(ordered) == 3
    # Authoritative Sequence: Department Head -> Project Manager -> Finance Manager
    assert ordered[0].name == "Liam Connor"       # Department Head
    assert ordered[1].name == "Priya Sharma"      # Project Manager
    assert ordered[2].name == "David Vance"       # Finance Manager

    # Case A: Human = Department Head
    # Turn 0 (DH - Human) -> Turn 1 (PM - AI) -> Turn 2 (FM - AI) -> Turn 3 (DH - Human)
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "department-head", budget_allocation_agents, 0) is True
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "department-head", budget_allocation_agents, 1) is False
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "department-head", budget_allocation_agents, 2) is False
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "department-head", budget_allocation_agents, 3) is True

    # Case B: Human = Project Manager
    # Turn 0 (DH - AI) -> Turn 1 (PM - Human) -> Turn 2 (FM - AI) -> Turn 3 (DH - AI)
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "project-manager", budget_allocation_agents, 0) is False
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "project-manager", budget_allocation_agents, 1) is True
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "project-manager", budget_allocation_agents, 2) is False

    # Case C: Human = Finance Director
    # Turn 0 (DH - AI) -> Turn 1 (PM - AI) -> Turn 2 (FM - Human) -> Turn 3 (DH - AI)
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "finance-director", budget_allocation_agents, 0) is False
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "finance-director", budget_allocation_agents, 1) is False
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "finance-director", budget_allocation_agents, 2) is True
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "finance-director", budget_allocation_agents, 3) is False


# ===========================================================================
# 4. STRICT TURN GUARD: OUT-OF-TURN REJECTION & PERSISTENCE
# ===========================================================================

@pytest.mark.asyncio
async def test_strict_turn_guard_rejects_out_of_turn():
    service = OrchestratorService()

    buyer = AgentConfiguration(id="a2", agent_template_id="buyer-proc", name="Alex Rivera", role="Procurement Director")
    vendor = AgentConfiguration(id="a1", agent_template_id="vendor-sales", name="Sarah Chen", role="Enterprise Sales VP")
    session = NegotiationSession(
        id="test-guard",
        scenario_id="vendor-pricing",
        mode="human-ai",
        human_role="buyer",  # Buyer speaks second (Turn 1)
        status="running",
        current_round=1,
        max_rounds=10,
        agreement_reached=False,
    )
    session.agents = [vendor, buyer]
    session.messages = []

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = session
    mock_db.execute.return_value = mock_res

    # Human Buyer tries to submit turn 0 when it is Vendor's turn
    result = await service.execute_turn(
        session_id=session.id,
        db=mock_db,
        user_message="I want $50/user/month",
        user_offer={"price": "$50/user/month"},
    )

    # Must reject with human turn validation error
    assert result["validation_error"] == "It is not the human player's turn to speak."
    assert result["is_human_turn"] is False
    assert result["message"] is None
    # Ensure no DB commit or message creation occurred
    mock_db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_human_turn_persists_exact_message_and_produces_one_ai_response():
    service = OrchestratorService()

    buyer = AgentConfiguration(id="a2", agent_template_id="buyer-proc", name="Alex Rivera", role="Procurement Director", avatar="AR")
    vendor = AgentConfiguration(id="a1", agent_template_id="vendor-sales", name="Sarah Chen", role="Enterprise Sales VP", avatar="SC")
    session = NegotiationSession(
        id="test-human-msg",
        scenario_id="vendor-pricing",
        mode="human-ai",
        human_role="vendor",  # Vendor speaks first (Turn 0)
        status="waiting_for_human",
        current_round=1,
        max_rounds=10,
        agreement_reached=False,
    )
    session.agents = [vendor, buyer]
    session.messages = []

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = session
    mock_db.execute.return_value = mock_res

    mock_workflow_res = {
        "messages": [
            {
                "sender": "Sarah Chen",
                "role": "Enterprise Sales VP",
                "content": "Our opening rate is $90/user/month with standard support.",
                "is_user": True,
                "turn_index": 0,
                "round": 1,
            },
            {
                "sender": "Alex Rivera",
                "role": "Procurement Director",
                "avatar": "AR",
                "content": "We can offer $70/user/month on Net-30 terms.",
                "rationale_summary": "Counter within budget zone",
                "offer_data": {"price": "$70/user/month"},
                "round": 1,
                "turn_index": 1,
                "is_user": False,
            }
        ],
        "status": "waiting_for_human",
        "current_round": 1,
    }

    with patch.object(service.workflow, "ainvoke", new=AsyncMock(return_value=mock_workflow_res)):
        result = await service.execute_turn(
            session_id=session.id,
            db=mock_db,
            user_message="Our opening rate is $90/user/month with standard support.",
            user_offer={"price": "$90/user/month"},
        )

    assert result.get("validation_error") is None
    assert result["status"] == "waiting_for_human"
    # Result message is the AI response (Buyer)
    assert result["message"]["sender"] == "Alex Rivera"
    assert result["message"]["is_user"] is False
    assert result["message"]["turn_index"] == 1
    assert result["is_human_turn"] is True


# ===========================================================================
# 5. IDEMPOTENT DUPLICATE REQUESTS
# ===========================================================================

@pytest.mark.asyncio
async def test_duplicate_submission_is_idempotent():
    service = OrchestratorService()

    buyer = AgentConfiguration(id="a2", agent_template_id="buyer-proc", name="Alex Rivera", role="Procurement Director", avatar="AR")
    vendor = AgentConfiguration(id="a1", agent_template_id="vendor-sales", name="Sarah Chen", role="Enterprise Sales VP", avatar="SC")
    session = NegotiationSession(
        id="test-idem",
        scenario_id="vendor-pricing",
        mode="human-ai",
        human_role="buyer",
        status="waiting_for_human",
        current_round=1,
        max_rounds=10,
        agreement_reached=False,
    )
    session.agents = [vendor, buyer]

    # Pre-existing messages
    m0 = NegotiationMessage(id="m0", session_id=session.id, sender="Sarah Chen", role="Enterprise Sales VP", content="Price is $95.", turn_index=0, round=1, is_user=False)
    m1 = NegotiationMessage(id="m1", session_id=session.id, sender="Alex Rivera", role="Procurement Director", content="We offer $75.", turn_index=1, round=1, is_user=True)
    m2 = NegotiationMessage(id="m2", session_id=session.id, sender="Sarah Chen", role="Enterprise Sales VP", content="We can meet at $85.", turn_index=2, round=1, is_user=False)
    session.messages = [m0, m1, m2]

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = session
    mock_db.execute.return_value = mock_res

    # Resend identical message "We offer $75."
    result = await service.execute_turn(
        session_id=session.id,
        db=mock_db,
        user_message="We offer $75.",
    )

    # Must return cached m2 without error, without adding messages, and without advancing turns
    assert result.get("validation_error") is None
    assert result["message"]["id"] == "m2"
    assert result["message"]["content"] == "We can meet at $85."
    mock_db.commit.assert_not_called()


# ===========================================================================
# 6. DEADLOCK DETECTION RULES
# ===========================================================================

def test_deadlock_on_stagnant_identical_offers():
    # 4 consecutive identical offers after 6 messages
    msgs = [
        {"offer_data": {"price": "$80"}},
        {"offer_data": {"price": "$80"}},
        {"offer_data": {"price": "$80"}},
        {"offer_data": {"price": "$80"}},
        {"offer_data": {"price": "$80"}},
        {"offer_data": {"price": "$80"}},
    ]
    is_deadlock, reason = DeadlockRules.evaluate_deadlock("vendor-pricing", "counteroffer", 4, 20, msgs)
    assert is_deadlock is True
    assert "identical repeated offers" in reason


def test_deadlock_on_safety_round_limit():
    is_deadlock, reason = DeadlockRules.evaluate_deadlock("vendor-pricing", "counteroffer", 20, 20, [])
    assert is_deadlock is True
    assert "Safety round limit" in reason


def test_deadlock_on_no_zopa_after_round_3():
    zopa_info = {"status": "no_zopa"}
    is_deadlock, reason = DeadlockRules.evaluate_deadlock("vendor-pricing", "counteroffer", 3, 20, [], zopa_info=zopa_info)
    assert is_deadlock is True
    assert "No ZOPA" in reason


# ===========================================================================
# 7. TERMINAL STATE: AGREEMENT STOPS TURNS
# ===========================================================================

@pytest.mark.asyncio
async def test_agreement_stops_further_turns():
    service = OrchestratorService()

    buyer = AgentConfiguration(id="a2", agent_template_id="buyer-proc", name="Alex Rivera", role="Procurement Director", avatar="AR")
    vendor = AgentConfiguration(id="a1", agent_template_id="vendor-sales", name="Sarah Chen", role="Enterprise Sales VP", avatar="SC")
    session = NegotiationSession(
        id="test-finished",
        scenario_id="vendor-pricing",
        mode="human-ai",
        human_role="buyer",
        status="finished",
        current_round=3,
        max_rounds=10,
        agreement_reached=True,
        final_terms={"price": "$80/user/month"},
    )
    session.agents = [vendor, buyer]
    session.messages = []

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = session
    mock_db.execute.return_value = mock_res

    # Attempting to submit turn after agreement reached
    result = await service.execute_turn(
        session_id=session.id,
        db=mock_db,
        user_message="Another offer",
    )

    assert result["status"] == "finished"
    assert result["agreement_reached"] is True
    assert result["message"] is None
    mock_db.commit.assert_not_called()


# ===========================================================================
# 8. END-TO-END API ROUTE INTEGRATION TESTS ACROSS ALL 3 SCENARIOS
# ===========================================================================

@pytest.mark.asyncio
async def test_api_vendor_pricing_human_buyer(client, auth_headers):
    # Create session: Human is Buyer
    create_res = await client.post(
        "/api/v1/negotiations",
        json={
            "scenario_id": "vendor-pricing",
            "mode": "human-ai",
            "human_role": "buyer",
            "scenario_data": {"product": "CRM Platform", "target_price": "$65/user"},
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    session_id = create_res.json()["id"]

    # Start directly without obsolete builder confirm-review step
    start_res = await client.post(f"/api/v1/negotiations/{session_id}/start", headers=auth_headers)
    assert start_res.status_code == 200
    # Vendor speaks first, so status should be running
    assert start_res.json()["status"] == "running"

    # AI Vendor turn 0
    step_res = await client.post(f"/api/v1/negotiations/{session_id}/step", headers=auth_headers)
    assert step_res.status_code == 200
    step_data = step_res.json()
    assert step_data["is_human_turn"] is True
    assert step_data["status"] == "waiting_for_human"
    assert step_data["message"]["is_user"] is False

    # Human Buyer submits Turn 1
    turn_res = await client.post(
        f"/api/v1/negotiations/{session_id}/user-turn",
        json={"message": "We can offer $70/user/month.", "offer": {"price": "$70/user/month"}},
        headers=auth_headers,
    )
    assert turn_res.status_code == 200
    turn_data = turn_res.json()
    assert turn_data.get("validation_error") is None
    assert turn_data["message"]["is_user"] is False  # AI counter-response returned


@pytest.mark.asyncio
async def test_api_job_offer_human_recruiter(client, auth_headers):
    create_res = await client.post(
        "/api/v1/negotiations",
        json={
            "scenario_id": "job-offer",
            "mode": "human-ai",
            "human_role": "recruiter",
            "scenario_data": {"job_role": "Staff Engineer", "current_initial_salary": "$150,000"},
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    session_id = create_res.json()["id"]
    start_res = await client.post(f"/api/v1/negotiations/{session_id}/start", headers=auth_headers)
    assert start_res.status_code == 200
    # Recruiter speaks first, so human starts immediately!
    assert start_res.json()["status"] == "waiting_for_human"

    # Human Recruiter submits Turn 0
    turn_res = await client.post(
        f"/api/v1/negotiations/{session_id}/user-turn",
        json={"message": "We are offering $150,000 base salary.", "offer": {"salary": "$150,000"}},
        headers=auth_headers,
    )
    assert turn_res.status_code == 200
    turn_data = turn_res.json()
    assert turn_data["message"]["is_user"] is False  # AI Candidate counter-response


@pytest.mark.asyncio
async def test_api_budget_allocation_human_finance_director(client, auth_headers):
    create_res = await client.post(
        "/api/v1/negotiations",
        json={
            "scenario_id": "budget-allocation",
            "mode": "human-ai",
            "human_role": "finance-director",
            "scenario_data": {"project": "Infra Upgrade", "total_budget": "$1,000,000"},
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    session_id = create_res.json()["id"]

    start_res = await client.post(f"/api/v1/negotiations/{session_id}/start", headers=auth_headers)
    assert start_res.status_code == 200
    # In Budget Allocation, sequence is DH -> PM -> Finance Director. Human is 3rd!
    assert start_res.json()["status"] == "running"

    # AI Department Head speaks (Turn 0)
    step1 = await client.post(f"/api/v1/negotiations/{session_id}/step", headers=auth_headers)
    assert step1.status_code == 200
    assert step1.json()["is_human_turn"] is False  # Next is AI Project Manager

    # AI Project Manager speaks (Turn 1)
    step2 = await client.post(f"/api/v1/negotiations/{session_id}/step", headers=auth_headers)
    assert step2.status_code == 200
    assert step2.json()["is_human_turn"] is True  # Now it's Finance Director's turn!
    assert step2.json()["status"] == "waiting_for_human"


@pytest.mark.asyncio
async def test_api_rejects_out_of_turn_submission(client, auth_headers):
    create_res = await client.post(
        "/api/v1/negotiations",
        json={
            "scenario_id": "vendor-pricing",
            "mode": "human-ai",
            "human_role": "buyer",
            "scenario_data": {"product": "CRM Platform", "target_price": "$65/user"},
        },
        headers=auth_headers,
    )
    session_id = create_res.json()["id"]

    await client.post(f"/api/v1/negotiations/{session_id}/start", headers=auth_headers)

    # Human Buyer tries to speak at Turn 0 before Vendor speaks
    turn_res = await client.post(
        f"/api/v1/negotiations/{session_id}/user-turn",
        json={"message": "Premature offer", "offer": {"price": "$50"}},
        headers=auth_headers,
    )
    assert turn_res.status_code == 200
    data = turn_res.json()
    assert data["validation_error"] == "It is not the human player's turn to speak."
    assert data["is_human_turn"] is False
    assert data["message"] is None


@pytest.mark.asyncio
async def test_api_human_turn_alias_and_turn_index_idempotency(client, auth_headers):
    create_res = await client.post(
        "/api/v1/negotiations",
        json={
            "scenario_id": "vendor-pricing",
            "mode": "human-ai",
            "human_role": "vendor",
            "scenario_data": {"product": "CRM Platform", "current_vendor_price": "$85/user"},
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    session_id = create_res.json()["id"]

    start_res = await client.post(f"/api/v1/negotiations/{session_id}/start", headers=auth_headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "waiting_for_human"

    # Human Vendor submits Turn 0 via canonical /user-turn with turn_index=0
    turn_res = await client.post(
        f"/api/v1/negotiations/{session_id}/user-turn",
        json={"message": "Our platform license is $85/user/month.", "offer": {"price": "$85/user/month"}, "turn_index": 0},
        headers=auth_headers,
    )
    assert turn_res.status_code == 200
    first_response = turn_res.json()
    assert first_response["message"]["is_user"] is False
    assert first_response["status"] == "waiting_for_human"
    ai_msg_id = first_response["message"]["id"]

    # Re-send identical request with same turn_index=0 (simulating duplicate click or network retry)
    dup_res = await client.post(
        f"/api/v1/negotiations/{session_id}/user-turn",
        json={"message": "Our platform license is $85/user/month.", "offer": {"price": "$85/user/month"}, "turn_index": 0},
        headers=auth_headers,
    )
    assert dup_res.status_code == 200
    dup_data = dup_res.json()
    # Must return cached AI response without advancing or error
    assert dup_data["message"]["id"] == ai_msg_id


@pytest.mark.asyncio
async def test_api_budget_allocation_human_department_head(client, auth_headers):
    create_res = await client.post(
        "/api/v1/negotiations",
        json={
            "scenario_id": "budget-allocation",
            "mode": "human-ai",
            "human_role": "department-head",
            "scenario_data": {"project": "Infra Upgrade", "total_budget": "$1,000,000"},
        },
        headers=auth_headers,
    )
    session_id = create_res.json()["id"]
    start_res = await client.post(f"/api/v1/negotiations/{session_id}/start", headers=auth_headers)
    # Department Head is turn 0 speaker -> starts as waiting_for_human!
    assert start_res.json()["status"] == "waiting_for_human"
    assert start_res.json()["is_human_turn"] is True


@pytest.mark.asyncio
async def test_api_budget_allocation_human_project_manager(client, auth_headers):
    create_res = await client.post(
        "/api/v1/negotiations",
        json={
            "scenario_id": "budget-allocation",
            "mode": "human-ai",
            "human_role": "project-manager",
            "scenario_data": {"project": "Infra Upgrade", "total_budget": "$1,000,000"},
        },
        headers=auth_headers,
    )
    session_id = create_res.json()["id"]
    start_res = await client.post(f"/api/v1/negotiations/{session_id}/start", headers=auth_headers)
    # Project Manager is turn 1 speaker -> start status is running (waiting for DH AI)
    assert start_res.json()["status"] == "running"
    assert start_res.json()["is_human_turn"] is False

    # AI Department Head speaks (Turn 0)
    dh_step = await client.post(f"/api/v1/negotiations/{session_id}/step", headers=auth_headers)
    assert dh_step.status_code == 200
    assert dh_step.json()["status"] == "waiting_for_human"
    assert dh_step.json()["is_human_turn"] is True


@pytest.mark.asyncio
async def test_session_refresh_restores_complete_state(client, auth_headers):
    create_res = await client.post(
        "/api/v1/negotiations",
        json={
            "scenario_id": "vendor-pricing",
            "mode": "human-ai",
            "human_role": "buyer",
            "scenario_data": {"product": "CRM Platform", "target_price": "$65/user"},
        },
        headers=auth_headers,
    )
    session_id = create_res.json()["id"]
    await client.post(f"/api/v1/negotiations/{session_id}/start", headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{session_id}/step", headers=auth_headers)

    # Fetch session as would happen on page refresh
    get_res = await client.get(f"/api/v1/negotiations/{session_id}", headers=auth_headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["status"] == "waiting_for_human"
    assert data["is_human_turn"] is True
    assert len(data["messages"]) == 1
    assert data["messages"][0]["is_user"] is False

