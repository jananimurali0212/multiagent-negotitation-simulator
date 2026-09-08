import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from app.orchestration.turn_resolver import TurnResolver
from app.orchestration.orchestrator import OrchestratorService
from app.schemas.agent import AgentConfigSchema
from app.models.negotiation import NegotiationSession, NegotiationMessage
from app.services.seed_data import PRESET_SCENARIOS_DATA


from app.models.agent import AgentConfiguration


@pytest.fixture
def vendor_pricing_agents():
    return [
        AgentConfiguration(id="a1", agent_template_id="vendor-sales", name="Vendor", role="Enterprise Sales VP", avatar="VN", personality="Collaborative"),
        AgentConfiguration(id="a2", agent_template_id="buyer-proc", name="Buyer", role="Procurement Director", avatar="BY", personality="Collaborative"),
    ]


@pytest.fixture
def job_offer_agents():
    return [
        AgentConfiguration(id="j1", agent_template_id="recruiter-hr", name="Employer / Recruiter", role="Lead HR Partner", avatar="HR", personality="Collaborative"),
        AgentConfiguration(id="j2", agent_template_id="candidate-hr", name="Candidate", role="Senior Developer Candidate", avatar="CD", personality="Collaborative"),
    ]


@pytest.fixture
def budget_allocation_agents():
    return [
        AgentConfiguration(id="b1", agent_template_id="finance-mgr", name="Finance Manager", role="VP of Finance", avatar="FM", personality="Risk-Averse"),
        AgentConfiguration(id="b2", agent_template_id="pm-lead", name="Project Manager", role="Engineering Director", avatar="PM", personality="Aggressive"),
        AgentConfiguration(id="b3", agent_template_id="dept-head", name="Department Head", role="CMO / Marketing Lead", avatar="DH", personality="Collaborative"),
    ]


# ---------------------------------------------------------------------------
# 1. Human Role Resolution Across All 3 Scenarios
# ---------------------------------------------------------------------------

def test_resolve_human_role_vendor_pricing(vendor_pricing_agents):
    # Vendor variants
    for role in ["vendor", "seller", "sales", "Enterprise Sales VP", "sarah"]:
        ag = TurnResolver.resolve_human_agent("vendor-pricing", role, vendor_pricing_agents)
        assert ag.id == "a1", f"Failed to match vendor for {role}"

    # Buyer variants
    for role in ["buyer", "procurement", "purchaser", "Procurement Director", "alex"]:
        ag = TurnResolver.resolve_human_agent("vendor-pricing", role, vendor_pricing_agents)
        assert ag.id == "a2", f"Failed to match buyer for {role}"


def test_resolve_human_role_job_offer(job_offer_agents):
    # Recruiter variants
    for role in ["recruiter", "hr", "hiring-manager", "Lead HR Partner", "marcus"]:
        ag = TurnResolver.resolve_human_agent("job-offer", role, job_offer_agents)
        assert ag.id == "j1", f"Failed to match recruiter for {role}"

    # Candidate variants
    for role in ["candidate", "developer", "engineer", "Senior Developer Candidate", "elena"]:
        ag = TurnResolver.resolve_human_agent("job-offer", role, job_offer_agents)
        assert ag.id == "j2", f"Failed to match candidate for {role}"


def test_resolve_human_role_budget_allocation(budget_allocation_agents):
    # Finance variants (including finance-director and finance-manager!)
    for role in ["finance-director", "finance-manager", "vp-finance", "cfo", "VP of Finance", "finance", "david"]:
        ag = TurnResolver.resolve_human_agent("budget-allocation", role, budget_allocation_agents)
        assert ag.id == "b1", f"Failed to match finance for {role}"

    # Engineering / PM variants
    for role in ["project-manager", "pm-lead", "engineering", "Engineering Director", "priya"]:
        ag = TurnResolver.resolve_human_agent("budget-allocation", role, budget_allocation_agents)
        assert ag.id == "b2", f"Failed to match PM for {role}"

    # Marketing / Dept Head variants
    for role in ["department-head", "dept-head", "marketing", "cmo", "CMO / Marketing Lead", "liam"]:
        ag = TurnResolver.resolve_human_agent("budget-allocation", role, budget_allocation_agents)
        assert ag.id == "b3", f"Failed to match Dept Head for {role}"


# ---------------------------------------------------------------------------
# 2. Authoritative Turn Sequence Across All 3 Scenarios
# ---------------------------------------------------------------------------

def test_turn_sequence_vendor_pricing(vendor_pricing_agents):
    ordered = TurnResolver.get_ordered_agents("vendor-pricing", vendor_pricing_agents)
    assert len(ordered) == 2
    assert ordered[0].name == "Vendor"  # Vendor speaks first
    assert ordered[1].name == "Buyer"  # Buyer speaks second


def test_turn_sequence_job_offer(job_offer_agents):
    ordered = TurnResolver.get_ordered_agents("job-offer", job_offer_agents)
    assert len(ordered) == 2
    assert ordered[0].name == "Employer / Recruiter"  # Recruiter speaks first
    assert ordered[1].name == "Candidate"  # Candidate speaks second


def test_turn_sequence_budget_allocation(budget_allocation_agents):
    ordered = TurnResolver.get_ordered_agents("budget-allocation", budget_allocation_agents)
    assert len(ordered) == 3
    # 1. Department Head -> 2. Project Manager -> 3. Finance Manager
    assert ordered[0].name == "Department Head"
    assert ordered[1].name == "Project Manager"
    assert ordered[2].name == "Finance Manager"


# ---------------------------------------------------------------------------
# 3. is_human_turn Calculations
# ---------------------------------------------------------------------------

def test_is_human_turn_vendor_pricing(vendor_pricing_agents):
    # If human is Vendor: turn 0 is Human, turn 1 is AI
    assert TurnResolver.is_human_turn("vendor-pricing", "human-ai", "vendor", vendor_pricing_agents, 0) is True
    assert TurnResolver.is_human_turn("vendor-pricing", "human-ai", "vendor", vendor_pricing_agents, 1) is False
    assert TurnResolver.is_human_turn("vendor-pricing", "human-ai", "vendor", vendor_pricing_agents, 2) is True

    # If human is Buyer: turn 0 is AI, turn 1 is Human
    assert TurnResolver.is_human_turn("vendor-pricing", "human-ai", "buyer", vendor_pricing_agents, 0) is False
    assert TurnResolver.is_human_turn("vendor-pricing", "human-ai", "buyer", vendor_pricing_agents, 1) is True


def test_is_human_turn_budget_allocation_three_agents(budget_allocation_agents):
    # Sequence: Dept Head (0) -> PM (1) -> Finance Director (2)
    # If human is Finance Director:
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "finance-director", budget_allocation_agents, 0) is False
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "finance-director", budget_allocation_agents, 1) is False
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "finance-director", budget_allocation_agents, 2) is True
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "finance-director", budget_allocation_agents, 3) is False

    # If human is Dept Head:
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "department-head", budget_allocation_agents, 0) is True
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "department-head", budget_allocation_agents, 1) is False
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "department-head", budget_allocation_agents, 2) is False
    assert TurnResolver.is_human_turn("budget-allocation", "human-ai", "department-head", budget_allocation_agents, 3) is True


# ---------------------------------------------------------------------------
# 4. Strict Turn Guard & Out-of-Turn Submission Rejection
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_orchestrator_rejects_out_of_turn_submission():
    service = OrchestratorService()

    # Create mock session where human is Buyer (speaks second), but turn count is 0
    buyer_ag = AgentConfiguration(id="a2", agent_template_id="buyer-proc", name="Alex Rivera", role="Procurement Director", avatar="AR", personality="Collaborative")
    vendor_ag = AgentConfiguration(id="a1", agent_template_id="vendor-sales", name="Sarah Chen", role="Enterprise Sales VP", avatar="SC", personality="Collaborative")
    session = NegotiationSession(
        id="test-out-of-turn",
        scenario_id="vendor-pricing",
        mode="human-ai",
        human_role="buyer",
        status="running",
        current_round=1,
        max_rounds=10,
        agreement_reached=False,
    )
    session.agents = [vendor_ag, buyer_ag]
    session.messages = []

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = session
    mock_db.execute.return_value = mock_res

    # Human tries to submit a message at turn 0 when it's Vendor's turn
    result = await service.execute_turn(
        session_id=session.id,
        db=mock_db,
        user_message="I want $50/mo",
        user_offer={"price": "$50/user/month"},
    )

    assert result["validation_error"] == "It is not the human player's turn to speak."
    assert result["is_human_turn"] is False
    assert result["message"] is None
    # Ensure no DB commit or message addition happened
    mock_db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_orchestrator_waiting_for_human_on_step():
    service = OrchestratorService()

    # Human is Vendor (speaks first at turn 0). Calling step without user_message should NOT invoke AI
    buyer_ag = AgentConfiguration(id="a2", agent_template_id="buyer-proc", name="Alex Rivera", role="Procurement Director", avatar="AR", personality="Collaborative")
    vendor_ag = AgentConfiguration(id="a1", agent_template_id="vendor-sales", name="Sarah Chen", role="Enterprise Sales VP", avatar="SC", personality="Collaborative")
    session = NegotiationSession(
        id="test-waiting",
        scenario_id="vendor-pricing",
        mode="human-ai",
        human_role="vendor",
        status="running",
        current_round=1,
        max_rounds=10,
        agreement_reached=False,
    )
    session.agents = [vendor_ag, buyer_ag]
    session.messages = []

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = session
    mock_db.execute.return_value = mock_res

    result = await service.execute_turn(
        session_id=session.id,
        db=mock_db,
        user_message=None,
    )

    assert result["status"] == "waiting_for_human"
    assert result["is_human_turn"] is True
    assert result["message"] is None
    assert result["current_turn_speaker"] == "Sarah Chen"


@pytest.mark.asyncio
async def test_orchestrator_idempotency_duplicate_submission():
    service = OrchestratorService()

    buyer_ag = AgentConfiguration(id="a2", agent_template_id="buyer-proc", name="Alex Rivera", role="Procurement Director", avatar="AR", personality="Collaborative")
    vendor_ag = AgentConfiguration(id="a1", agent_template_id="vendor-sales", name="Sarah Chen", role="Enterprise Sales VP", avatar="SC", personality="Collaborative")
    session = NegotiationSession(
        id="test-idempotent",
        scenario_id="vendor-pricing",
        mode="human-ai",
        human_role="buyer",
        status="waiting_for_human",
        current_round=1,
        max_rounds=10,
        agreement_reached=False,
    )
    session.agents = [vendor_ag, buyer_ag]

    # Pre-populate session with:
    # 0: Vendor opening (AI)
    # 1: Buyer counteroffer (Human)
    # 2: Vendor counter-response (AI)
    m0 = NegotiationMessage(
        id="m0", session_id=session.id, sender="Sarah Chen", role="Enterprise Sales VP",
        content="Our standard pricing is $95.", turn_index=0, round=1, is_user=False
    )
    m1 = NegotiationMessage(
        id="m1", session_id=session.id, sender="Alex Rivera", role="Procurement Director",
        content="We can offer $70.", turn_index=1, round=1, is_user=True
    )
    m2 = NegotiationMessage(
        id="m2", session_id=session.id, sender="Sarah Chen", role="Enterprise Sales VP",
        content="We can meet at $82.", rationale_summary="Compromise to stay within target",
        turn_index=2, round=1, is_user=False, offer_data={"price": "$82/user/month"}
    )
    session.messages = [m0, m1, m2]

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = session
    mock_db.execute.return_value = mock_res

    # User resends the identical message "We can offer $70." (duplicate network request)
    result = await service.execute_turn(
        session_id=session.id,
        db=mock_db,
        user_message="We can offer $70.",
    )

    # Must return the existing AI message (m2) idempotently without advancing turns or erroring
    assert result.get("validation_error") is None
    assert result["message"]["id"] == "m2"
    assert result["message"]["content"] == "We can meet at $82."
    assert result["message"]["rationale_summary"] == "Compromise to stay within target"
    mock_db.commit.assert_not_called()


@pytest.mark.asyncio
async def test_orchestrator_ai_turn_in_human_ai_mode():
    service = OrchestratorService()

    # Human is Buyer (speaks second at turn 1). Vendor (AI) speaks first at turn 0.
    buyer_ag = AgentConfiguration(id="a2", agent_template_id="buyer-proc", name="Alex Rivera", role="Procurement Director", avatar="AR", personality="Collaborative")
    vendor_ag = AgentConfiguration(id="a1", agent_template_id="vendor-sales", name="Sarah Chen", role="Enterprise Sales VP", avatar="SC", personality="Collaborative")
    session = NegotiationSession(
        id="test-ai-turn",
        scenario_id="vendor-pricing",
        mode="human-ai",
        human_role="buyer",
        status="running",
        current_round=1,
        max_rounds=10,
        agreement_reached=False,
    )
    session.agents = [vendor_ag, buyer_ag]
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
                "avatar": "SC",
                "content": "Hello, our starting price is $95/user/month.",
                "rationale_summary": "Anchor high",
                "offer_data": {"price": "$95/user/month"},
                "round": 1,
                "turn_index": 0,
                "is_user": False,
            }
        ],
        "status": "running",
        "current_round": 1,
    }

    with patch.object(service.workflow, "ainvoke", new=AsyncMock(return_value=mock_workflow_res)):
        result = await service.execute_turn(
            session_id=session.id,
            db=mock_db,
            user_message=None,
        )

    # Should execute Vendor AI turn directly without creating a null user message
    assert result.get("validation_error") is None
    assert result["status"] == "waiting_for_human"
    assert result["is_human_turn"] is True
    assert result["message"]["sender"] == "Sarah Chen"
    assert result["message"]["is_user"] is False
    assert result["message"]["content"] == "Hello, our starting price is $95/user/month."
    assert mock_db.add.called
    added_msg = mock_db.add.call_args[0][0]
    assert added_msg.content is not None
    assert added_msg.is_user is False

