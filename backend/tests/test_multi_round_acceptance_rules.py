import pytest
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.negotiation.state_tracker import NegotiationStateTracker
from app.negotiation.decision_engine import DecisionEngine
from app.schemas.arena import AgentDecision
from app.negotiation.state.transition_engine import StateTransitionEngine


def test_exploratory_and_non_committal_phrases_not_accepted():
    """Verify phrases like 'could accept', 'can consider', 'sounds reasonable' are counteroffers, NOT terminal acceptances."""
    phrases = [
        "I could accept $140k if you include remote work.",
        "That sounds reasonable, but we also need to discuss equity.",
        "I can consider this if we also agree on notice period.",
        "I'm willing to discuss a base of $130k.",
        "I can offer $85/user/month.",
        "I'm willing to consider $90/user/month.",
    ]
    for phrase in phrases:
        detected = NegotiationStateTracker.detect_intent(phrase)
        assert detected["is_acceptance"] is False, f"Phrase '{phrase}' was incorrectly flagged as acceptance!"
        assert detected["is_counteroffer"] is True, f"Phrase '{phrase}' was not flagged as counteroffer!"


def test_proposing_new_terms_is_not_agreement():
    """Verify that proposing a counteroffer with new terms does not trigger agreement in DecisionEngine."""
    decision = AgentDecision(
        action="counter",
        message="I can offer $85/user/month with annual billing.",
        rationale_summary="Proposing counter",
        offer={"price_per_user": 85.0},
        concession_percentage=10.0,
        confidence_score=0.9,
    )
    previous_messages = [
        {"sender": "Buyer", "role": "Procurement Manager", "content": "Our budget is $75/user/month.", "round": 1}
    ]

    is_term, final_terms, outcome, reason = DecisionEngine.evaluate_agreement(
        scenario_id="vendor-pricing",
        latest_decision=decision,
        previous_messages=previous_messages,
    )
    assert is_term is False, "Counteroffer should not be terminal!"
    assert outcome == "running"


def test_unilateral_acceptance_without_opposing_offer_is_not_agreement():
    """Verify that an agent claiming action='accept' on turn 1 without an opposing offer is rejected."""
    decision = AgentDecision(
        action="accept",
        message="I accept!",
        rationale_summary="Accepting prematurely",
        offer={},
        concession_percentage=0.0,
        confidence_score=1.0,
    )
    # Empty previous messages
    is_term, final_terms, outcome, reason = DecisionEngine.evaluate_agreement(
        scenario_id="job-offer",
        latest_decision=decision,
        previous_messages=[],
    )
    assert is_term is False
    assert outcome == "running"


def test_transition_engine_prevents_premature_finished_state():
    """Verify StateTransitionEngine blocks transitioning to finished if mutual agreement is not validated."""
    from app.negotiation.models.negotiation_state import NormalizedNegotiationState
    from app.negotiation.validation.validation_result import ValidationResult
    
    state = NormalizedNegotiationState(
        session_id="test-session-trans",
        scenario_id="job-offer",
        mode="human-ai",
        max_rounds=10,
        status="running",
    )
    decision = AgentDecision(
        action="accept",
        message="I accept!",
        rationale_summary="Premature acceptance",
        offer={},
    )
    val_res = ValidationResult(is_valid=True)

    
    updated_state = StateTransitionEngine.apply_decision(
        state=state,
        decision=decision,
        validation_result=val_res,
    )
    assert updated_state.status == "running"
    assert updated_state.status != "finished"



def test_bilateral_mutual_agreement_validates_and_completes():
    """Verify true mutual agreement: Party A offers $140,000, Party B explicitly accepts in round 2."""
    previous_messages = [
        {"sender": "Employer", "role": "Hiring Manager", "content": "Opening offer is $120,000.", "round": 1},
        {"sender": "Candidate", "role": "Candidate", "content": "I am looking for $140,000.", "round": 1},
        {"sender": "Employer", "role": "Hiring Manager", "content": "We can offer a final salary of $140,000 with remote work.", "round": 2}
    ]
    decision = AgentDecision(
        action="accept",
        message="I accept the offer of $140,000 with remote work. We have a deal!",
        rationale_summary="Terms meet all criteria",
        offer={"salary": 140000.0, "work_mode": "Remote"},
        concession_percentage=0.0,
        confidence_score=1.0,
    )

    is_term, final_terms, outcome, reason = DecisionEngine.evaluate_agreement(
        scenario_id="job-offer",
        latest_decision=decision,
        previous_messages=previous_messages,
        current_round=2,
    )
    assert is_term is True
    assert outcome == "Agreement Reached"
    assert "140" in str(final_terms.get("salary", ""))

