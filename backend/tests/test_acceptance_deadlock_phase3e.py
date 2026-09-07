import pytest
from app.schemas.agent import AgentConfigSchema, GoalSchema, ConstraintSchema
from app.negotiation.rules.acceptance_rules import AcceptanceRules
from app.negotiation.rules.deadlock_rules import DeadlockRules
from app.negotiation.validation.validation_result import ValidationErrorCategory


def test_valid_acceptance():
    buyer = AgentConfigSchema(
        id="b1", agent_template_id="t1", name="Alex", role="Procurement Director", avatar="AR", personality="Collaborative",
        goals=[], constraints=[ConstraintSchema(label="Budget Cap", value="$120,000 / year")],
        negotiation_parameters={"maxBudget": "$120,000 / year"}
    )
    previous_msgs = [{"sender": "Sarah", "role": "Enterprise Sales VP", "content": "I offer $50/mo", "offer_data": {"price": "$50/user/month"}}]

    res = AcceptanceRules.validate_acceptance(buyer, "vendor-pricing", offer=None, previous_messages=previous_msgs, status="running")
    assert res.is_valid is True


def test_invalid_acceptance_no_offer():
    buyer = AgentConfigSchema(
        id="b1", agent_template_id="t1", name="Alex", role="Procurement Director", avatar="AR", personality="Collaborative",
        goals=[], constraints=[], negotiation_parameters={}
    )
    res = AcceptanceRules.validate_acceptance(buyer, "vendor-pricing", offer=None, previous_messages=[], status="running")
    assert res.is_valid is False
    assert res.error_code == "ACCEPTANCE_NO_OFFER_FOUND"
    assert res.error_category == ValidationErrorCategory.ACCEPTANCE_INVALID


def test_invalid_acceptance_violating_hard_constraint():
    buyer = AgentConfigSchema(
        id="b1", agent_template_id="t1", name="Alex", role="Procurement Director", avatar="AR", personality="Collaborative",
        goals=[], constraints=[ConstraintSchema(label="Budget Cap", value="$120,000 / year")],
        negotiation_parameters={"maxBudget": "$120,000 / year"}
    )
    # $90/user/mo exceeds buyer max budget cap ($66.66/mo)
    previous_msgs = [{"sender": "Sarah", "role": "Enterprise Sales VP", "content": "My final offer is $90/mo", "offer_data": {"price": "$90/user/month"}}]

    res = AcceptanceRules.validate_acceptance(buyer, "vendor-pricing", offer=None, previous_messages=previous_msgs, status="running")
    assert res.is_valid is False
    assert res.error_code == "ACCEPTANCE_VIOLATES_HARD_CONSTRAINT"
    assert res.error_category == ValidationErrorCategory.HARD_CONSTRAINT_VIOLATION


def test_explicit_deadlock():
    is_deadlock, reason = DeadlockRules.evaluate_deadlock("vendor-pricing", "deadlock", 2, 10, [])
    assert is_deadlock is True
    assert "Explicit deadlock" in reason


def test_max_rounds_deadlock():
    is_deadlock, reason = DeadlockRules.evaluate_deadlock("vendor-pricing", "counteroffer", 10, 10, [])
    assert is_deadlock is True
    assert "Safety round limit" in reason


def test_stagnation_deadlock():
    msgs = [{"offer_data": {"price": "$50"}}] * 6
    is_deadlock, reason = DeadlockRules.evaluate_deadlock("vendor-pricing", "counteroffer", 3, 10, msgs)
    assert is_deadlock is True
    assert "identical repeated offers" in reason
