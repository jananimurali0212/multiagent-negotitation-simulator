import pytest
from app.schemas.agent import AgentConfigSchema, GoalSchema, ConstraintSchema
from app.schemas.arena import AgentDecision
from app.negotiation.validation.validation_result import ValidationResult, ValidationErrorCategory
from app.negotiation.models.negotiation_state import NormalizedNegotiationState


def test_validation_result_valid_factory():
    res = ValidationResult.valid_result(rule_name="schema_check")
    assert res.is_valid is True
    assert res.rule_name == "schema_check"
    assert res.severity == "INFO"
    assert res.error_code is None


def test_validation_result_invalid_factory():
    corrected = AgentDecision(action="counteroffer", message="Corrected proposal")
    res = ValidationResult.invalid_result(
        error_code="HARD_CONSTRAINT_EXCEEDED",
        error_category=ValidationErrorCategory.HARD_CONSTRAINT_VIOLATION,
        human_safe_message="Offer exceeds ceiling limit.",
        internal_reason="Proposed price $100 violates maximum budget constraint of $80.",
        rule_name="max_budget_rule",
        corrected_decision=corrected,
    )

    assert res.is_valid is False
    assert res.error_code == "HARD_CONSTRAINT_EXCEEDED"
    assert res.error_category == ValidationErrorCategory.HARD_CONSTRAINT_VIOLATION
    assert res.human_safe_message == "Offer exceeds ceiling limit."
    assert res.corrected_decision is not None
    assert res.corrected_decision.action == "counteroffer"


def test_normalized_negotiation_state_helpers():
    agent1 = AgentConfigSchema(
        id="a1",
        agent_template_id="t1",
        name="Alex Rivera",
        role="Procurement Director",
        avatar="AR",
        personality="Collaborative",
        goals=[GoalSchema(text="Keep price under $45", priority="High")],
        constraints=[ConstraintSchema(label="Max budget", value="$120k")],
    )
    agent2 = AgentConfigSchema(
        id="a2",
        agent_template_id="t2",
        name="Sarah Chen",
        role="Enterprise Sales VP",
        avatar="SC",
        personality="Aggressive",
        goals=[GoalSchema(text="Price above $65", priority="High")],
        constraints=[ConstraintSchema(label="Min seat count", value="150")],
    )

    state = NormalizedNegotiationState(
        session_id="sess-3a-test",
        scenario_id="vendor-pricing",
        agents=[agent1, agent2],
        current_speaker_index=0,
        current_turn_speaker="Alex Rivera",
    )

    active = state.get_active_agent()
    assert active is not None
    assert active.name == "Alex Rivera"

    buyer = state.get_agent_by_role("Procurement")
    assert buyer is not None
    assert buyer.name == "Alex Rivera"

    vendor = state.get_agent_by_role("Sales")
    assert vendor is not None
    assert vendor.name == "Sarah Chen"

    state.record_telemetry("turn_started", {"round": 1})
    assert len(state.telemetry_events) == 1
    assert state.telemetry_events[0]["event"] == "turn_started"
