import pytest
from app.schemas.agent import AgentConfigSchema
from app.schemas.arena import AgentDecision
from app.negotiation.models.negotiation_state import NormalizedNegotiationState
from app.negotiation.validation.validation_result import ValidationResult, ValidationErrorCategory
from app.negotiation.state.state_machine import StateMachine
from app.negotiation.state.transition_engine import StateTransitionEngine


def test_state_machine_legal_transitions():
    assert StateMachine.can_transition("running", "running") is True
    assert StateMachine.can_transition("running", "finished") is True
    assert StateMachine.can_transition("running", "deadlock") is True
    assert StateMachine.can_transition("running", "terminated") is True
    
    # Illegal backward transitions
    assert StateMachine.can_transition("finished", "running") is False
    assert StateMachine.can_transition("deadlock", "running") is False
    assert StateMachine.can_transition("terminated", "running") is False


def test_state_transition_engine_valid_counteroffer():
    agent1 = AgentConfigSchema(id="a1", agent_template_id="t1", name="Alex", role="Procurement Director", avatar="AR", personality="Collaborative")
    agent2 = AgentConfigSchema(id="a2", agent_template_id="t2", name="Sarah", role="Enterprise Sales VP", avatar="SC", personality="Aggressive")

    state = NormalizedNegotiationState(
        session_id="sess-3f-test",
        scenario_id="vendor-pricing",
        agents=[agent1, agent2],
        current_speaker_index=0,
        current_turn_speaker="Alex",
        current_round=1,
    )

    decision = AgentDecision(action="counteroffer", message="We offer $45/mo", offer={"price": "$45/user/month"})
    val_res = ValidationResult.valid_result()

    updated = StateTransitionEngine.apply_decision(state, decision, val_res)

    assert updated.current_turn == 1
    assert len(updated.messages) == 1
    assert updated.messages[0]["sender"] == "Alex"
    assert updated.current_offer == {"price": "$45/user/month"}
    # Speaker index should advance from 0 (Alex) to 1 (Sarah)
    assert updated.current_speaker_index == 1
    assert updated.current_turn_speaker == "Sarah"
    # Round remains 1 until index cycles back to 0
    assert updated.current_round == 1


def test_state_transition_engine_round_increment():
    agent1 = AgentConfigSchema(id="a1", agent_template_id="t1", name="Alex", role="Procurement Director", avatar="AR", personality="Collaborative")
    agent2 = AgentConfigSchema(id="a2", agent_template_id="t2", name="Sarah", role="Enterprise Sales VP", avatar="SC", personality="Aggressive")

    state = NormalizedNegotiationState(
        session_id="sess-3f-test",
        scenario_id="vendor-pricing",
        agents=[agent1, agent2],
        current_speaker_index=1,
        current_turn_speaker="Sarah",
        current_round=1,
    )

    decision = AgentDecision(action="counteroffer", message="We counter at $60/mo", offer={"price": "$60/user/month"})
    val_res = ValidationResult.valid_result()

    updated = StateTransitionEngine.apply_decision(state, decision, val_res)

    # Speaker index cycles back from 1 (Sarah) to 0 (Alex) -> Round increments to 2!
    assert updated.current_speaker_index == 0
    assert updated.current_turn_speaker == "Alex"
    assert updated.current_round == 2


def test_state_transition_engine_invalid_decision_blocked():
    agent1 = AgentConfigSchema(id="a1", agent_template_id="t1", name="Alex", role="Procurement Director", avatar="AR", personality="Collaborative")
    state = NormalizedNegotiationState(
        session_id="sess-3f-test",
        scenario_id="vendor-pricing",
        agents=[agent1],
        current_speaker_index=0,
        current_turn_speaker="Alex",
    )

    decision = AgentDecision(action="counteroffer", message="Invalid offer", offer={"price": "-$50"})
    invalid_res = ValidationResult.invalid_result(
        error_code="NEGATIVE_OFFER",
        error_category=ValidationErrorCategory.INVALID_NUMERIC_VALUE,
        human_safe_message="Negative price rejected",
        internal_reason="Price -$50 is negative",
    )

    updated = StateTransitionEngine.apply_decision(state, decision, invalid_res)

    # State must NOT advance turn or offer on invalid decision!
    assert updated.current_turn == 0
    assert len(updated.messages) == 0
    assert updated.current_offer is None
    assert len(updated.telemetry_events) == 1
    assert updated.telemetry_events[0]["event"] == "decision_rejected"
