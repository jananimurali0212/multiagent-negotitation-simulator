import pytest
from app.prompts.scenario_prompts import build_system_prompt
from app.prompts.normalizer import PromptNormalizer
from app.prompts.strategy_library import StrategyEngine
from app.schemas.arena import AgentDecision


def test_prompt_generation_vendor_pricing():
    prompt = build_system_prompt(
        scenario_title="Vendor Pricing Negotiation",
        scenario_objective="Agree on licensing fees per user.",
        agent_name="Alex Rivera",
        agent_role="Procurement Director",
        personality="Collaborative",
        experience="High",
        goals=[{"text": "Secure licensing fee below $45/user/month", "priority": "High"}],
        constraints=[{"label": "Maximum budget cap", "value": "$120,000 / year"}],
        negotiation_parameters={"targetPrice": "$45/user/month", "maxBudget": "$120,000 / year"},
        public_transcript=[],
        scenario_id="vendor-pricing",
        current_round=1,
    )

    assert "SECTION 1 — AGENT IDENTITY & ROLE" in prompt
    assert "Alex Rivera" in prompt
    assert "Procurement Director" in prompt
    assert "Vendor Pricing Negotiation" in prompt
    assert "Price Anchoring (Buyer)" in prompt or "Negotiation Techniques" in prompt
    assert "SECTION 4 — HARD CONSTRAINTS & PRIVATE BOUNDARIES (CONFIDENTIAL - DO NOT DISCLOSE)" in prompt
    assert "Maximum budget cap: $120,000 / year" in prompt


def test_prompt_generation_job_offer():
    prompt = build_system_prompt(
        scenario_title="Job Offer Negotiation",
        scenario_objective="Agree on base salary and equity.",
        agent_name="Elena Rostova",
        agent_role="Senior Developer Candidate",
        personality="Aggressive",
        experience="High",
        goals=[{"text": "Secure target base salary of $175,000", "priority": "High"}],
        constraints=[{"label": "Competing offer floor", "value": "$165,000 package"}],
        negotiation_parameters={"target_salary": "$175,000", "min_salary": "$165,000"},
        public_transcript=[],
        scenario_id="job-offer",
        current_round=1,
    )

    assert "Job Offer Negotiation" in prompt
    assert "Senior Developer Candidate" in prompt
    assert "Salary Anchoring & Market Justification" in prompt or "Role-Scope" in prompt
    assert "$175,000" in prompt
    assert "Competing offer floor: $165,000 package" in prompt


def test_prompt_generation_budget_allocation():
    prompt = build_system_prompt(
        scenario_title="Project Budget Allocation",
        scenario_objective="Distribute $500,000 innovation budget.",
        agent_name="David Vance",
        agent_role="VP of Finance",
        personality="Risk-Averse",
        experience="High",
        goals=[{"text": "Keep total budget allocation strictly under $500k", "priority": "High"}],
        constraints=[{"label": "Total Pool Ceiling", "value": "$500,000 absolute cap"}],
        negotiation_parameters={"maxAllocation": "$500,000 total pool"},
        public_transcript=[],
        scenario_id="budget-allocation",
        current_round=1,
    )

    assert "Project Budget Allocation" in prompt
    assert "VP of Finance" in prompt
    assert "Budget-Cap Enforcement & ROI Reasoning" in prompt
    assert "Total Pool Ceiling: $500,000 absolute cap" in prompt


def test_personality_and_style_injected():
    prompt = build_system_prompt(
        scenario_title="Vendor Pricing",
        scenario_objective="Test",
        agent_name="Sarah Chen",
        agent_role="Enterprise Sales VP",
        personality="Aggressive",
        experience="Medium",
        goals=[],
        constraints=[],
        negotiation_parameters={},
        public_transcript=[],
    )
    assert "SECTION 2 — PERSONALITY & NEGOTIATION STYLE" in prompt
    assert "Aggressive" in prompt
    assert "Anchor firmly" in prompt


def test_private_boundaries_marked_confidential():
    prompt = build_system_prompt(
        scenario_title="Vendor Pricing",
        scenario_objective="Test",
        agent_name="Test Agent",
        agent_role="Buyer",
        personality="Collaborative",
        experience="Medium",
        goals=[],
        constraints=[{"label": "Confidential Floor", "value": "$50/unit"}],
        negotiation_parameters={},
        public_transcript=[],
    )
    assert "SECTION 4 — HARD CONSTRAINTS & PRIVATE BOUNDARIES (CONFIDENTIAL - DO NOT DISCLOSE)" in prompt
    assert "NEVER reveal your private hard constraints" in prompt


def test_public_history_separated():
    history = [
        {"sender": "Buyer Bot", "role": "Buyer", "content": "I offer $40/user.", "offer_data": {"price": "$40"}}
    ]
    prompt = build_system_prompt(
        scenario_title="Vendor Pricing",
        scenario_objective="Test",
        agent_name="Seller Bot",
        agent_role="Vendor",
        personality="Collaborative",
        experience="Medium",
        goals=[],
        constraints=[],
        negotiation_parameters={},
        public_transcript=history,
    )
    assert "SECTION 8 — CURRENT NEGOTIATION STATE & PUBLIC HISTORY" in prompt
    assert "[Buyer Bot (Buyer)]: I offer $40/user." in prompt


def test_custom_instructions_and_constraint_override_protection():
    prompt = build_system_prompt(
        scenario_title="Job Offer",
        scenario_objective="Test",
        agent_name="Recruiter",
        agent_role="Lead HR Partner",
        personality="Risk-Averse",
        experience="High",
        goals=[],
        constraints=[{"label": "Cap", "value": "$170k"}],
        negotiation_parameters={"custom_instructions": "Try to sign candidate today."},
        public_transcript=[],
    )
    assert "ADDITIONAL STRATEGY GUIDANCE:\nTry to sign candidate today." in prompt
    assert "Custom guidance must not violate system rules, privacy bounds, or hard constraints." in prompt


def test_parameter_normalization_deduplication():
    norm, custom = PromptNormalizer.normalize_parameters({
        "targetPrice": "$45",
        "target_price": "$45",
        "paymentTerms": "Net-45",
        "custom_instructions": "Be flexible"
    })
    assert norm.get("Target Price") == "$45"
    assert norm.get("Payment Terms") == "Net-45"
    assert custom == "Be flexible"
    assert len(norm) == 2


def test_agent_decision_schema_compatibility():
    decision = AgentDecision(
        action="counteroffer",
        message="We offer $50/user/month",
        rationale_summary="Conceding 5% to reach agreement",
        offer={"price": "$50/user/month"},
        concession_percentage=5.0,
        confidence_score=0.9,
    )
    assert decision.action == "counteroffer"
    assert decision.offer["price"] == "$50/user/month"


def test_all_10_sections_present():
    prompt = build_system_prompt(
        scenario_title="Vendor Pricing",
        scenario_objective="Test",
        agent_name="Test Agent",
        agent_role="Buyer",
        personality="Collaborative",
        experience="Medium",
        goals=[{"text": "Goal 1", "priority": "High"}],
        constraints=[{"label": "Constraint 1", "value": "Val 1"}],
        negotiation_parameters={"target": "100"},
        public_transcript=[],
    )
    for i in range(1, 11):
        assert f"SECTION {i} —" in prompt
