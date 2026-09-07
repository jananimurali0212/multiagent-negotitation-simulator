import pytest
from app.schemas.agent import AgentConfigSchema, GoalSchema, ConstraintSchema
from app.schemas.arena import AgentDecision
from app.negotiation.models.negotiation_state import NormalizedNegotiationState
from app.negotiation.validation.decision_validator import DecisionValidator


def test_decision_validator_valid_decision():
    agent1 = AgentConfigSchema(
        id="a1", agent_template_id="t1", name="Alex", role="Procurement Director", avatar="AR", personality="Collaborative",
        goals=[], constraints=[ConstraintSchema(label="Budget Cap", value="$120,000 / year")],
        negotiation_parameters={"maxBudget": "$120,000 / year"}
    )
    state = NormalizedNegotiationState(
        session_id="sess-3g", scenario_id="vendor-pricing", agents=[agent1], current_speaker_index=0
    )

    decision = AgentDecision(action="counteroffer", message="I offer $45/user/month", offer={"price": "$45/user/month"})
    val_res, validated_dec, concession_info = DecisionValidator.validate_decision(state, decision)

    assert val_res.is_valid is True
    assert validated_dec.action == "counteroffer"
    assert validated_dec.offer["price"] == "$45/user/month"


def test_decision_validator_safe_correction_for_constraint_violation():
    vendor = AgentConfigSchema(
        id="v1", agent_template_id="t1", name="Sarah", role="Enterprise Sales VP", avatar="SC", personality="Aggressive",
        goals=[], constraints=[], negotiation_parameters={"minPrice": "$55/user/month"}
    )
    state = NormalizedNegotiationState(
        session_id="sess-3g", scenario_id="vendor-pricing", agents=[vendor], current_speaker_index=0
    )

    # Illegal price below vendor min floor ($40 < $55)
    decision = AgentDecision(action="counteroffer", message="I offer $40/user/month", offer={"price": "$40/user/month"})
    val_res, validated_dec, concession_info = DecisionValidator.validate_decision(state, decision)

    # Decision should be safely repaired to clamp price at $55 floor!
    assert val_res.is_valid is True
    assert validated_dec.offer["price"] == "$55/user/month"
    assert "Adjusted" in validated_dec.rationale_summary


def test_decision_validator_structural_key_alias_repair():
    recruiter = AgentConfigSchema(
        id="r1", agent_template_id="t1", name="Marcus", role="Lead HR Partner", avatar="MB", personality="Risk-Averse",
        goals=[], constraints=[], negotiation_parameters={"targetSalary": "$155,000"}
    )
    state = NormalizedNegotiationState(
        session_id="sess-3g-alias", scenario_id="job-offer", agents=[recruiter], current_speaker_index=0
    )

    # LLM returns 'baseSalary' instead of required key 'salary'
    decision = AgentDecision(
        action="offer", message="Opening offer", offer={"baseSalary": "$155,000", "stockOptions": "10,000 shares"}
    )
    val_res, validated_dec, concession_info = DecisionValidator.validate_decision(state, decision)

    # Key 'baseSalary' must be normalized/repaired to 'salary'
    assert val_res.is_valid is True
    assert "salary" in validated_dec.offer
    assert validated_dec.offer["salary"] == "$155,000"


def test_decision_validator_missing_dimension_repair():
    candidate = AgentConfigSchema(
        id="c1", agent_template_id="t2", name="Elena", role="Senior Developer Candidate", avatar="ER", personality="Collaborative",
        goals=[], constraints=[], negotiation_parameters={"targetSalary": "$175,000"}
    )
    state = NormalizedNegotiationState(
        session_id="sess-3g-missing", scenario_id="job-offer", agents=[candidate], current_speaker_index=0
    )

    # LLM returns offer with only stockOptions (missing salary)
    decision = AgentDecision(
        action="counteroffer", message="Counter offer", offer={"stockOptions": "20,000 shares"}
    )
    val_res, validated_dec, concession_info = DecisionValidator.validate_decision(state, decision)

    # Missing required key 'salary' must be safely repaired from default target!
    assert val_res.is_valid is True
    assert "salary" in validated_dec.offer
    assert validated_dec.offer["salary"] == "$175,000"

