import pytest
import asyncio
import os
import sys

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.negotiation.state_tracker import NegotiationStateTracker
from app.negotiation.rules.acceptance_rules import AcceptanceRules
from app.negotiation.decision_engine import DecisionEngine
from app.schemas.agent import AgentConfigSchema
from app.schemas.arena import AgentDecision
from app.reports.report_generator import ReportGenerator
from app.prompts.scenario_prompts import build_system_prompt


def test_intent_detection_conditional_vs_pure():
    """Verify conditional counteroffers are NOT flagged as pure acceptances."""
    # Conditional counteroffers
    cond1 = NegotiationStateTracker.detect_intent("I accept if you can provide 3 days remote work.")
    assert cond1["is_acceptance"] is False
    assert cond1["is_counteroffer"] is True

    cond2 = NegotiationStateTracker.detect_intent("I can agree provided you increase the base offer to ₹40,000.")
    assert cond2["is_acceptance"] is False
    assert cond2["is_counteroffer"] is True

    cond3 = NegotiationStateTracker.detect_intent("I accept only if the joining date is October 15.")
    assert cond3["is_acceptance"] is False
    assert cond3["is_counteroffer"] is True

    # Pure acceptances
    pure1 = NegotiationStateTracker.detect_intent("I accept the offer of ₹37,000 and hybrid work mode.")
    assert pure1["is_acceptance"] is True
    assert pure1["is_counteroffer"] is False

    pure2 = NegotiationStateTracker.detect_intent("We have a deal. I agree to these terms.")
    assert pure2["is_acceptance"] is True
    assert pure2["is_counteroffer"] is False

    pure3 = NegotiationStateTracker.detect_intent("That works for me. Sounds good!")
    assert pure3["is_acceptance"] is True
    assert pure3["is_counteroffer"] is False


def test_cumulative_state_tracking():
    """Verify multi-issue memory accumulation across turns without losing prior terms."""
    initial_data = {
        "job_role": "Senior Software Engineer",
        "initial_salary": "₹32,000",
        "work_mode": "On-site",
    }
    messages = [
        {"sender": "Employer", "role": "Hiring Manager", "content": "We can offer ₹32,000 per month.", "round": 1},
        {"sender": "Candidate", "role": "Candidate", "content": "I am seeking ₹40,000 and Remote work.", "round": 1},
        {"sender": "Employer", "role": "Hiring Manager", "content": "We can meet you at ₹37,000.", "round": 2},
        {"sender": "Candidate", "role": "Candidate", "content": "I can join after October 15 if that works.", "round": 2},
    ]

    state = NegotiationStateTracker.track_cumulative_state(
        session_id="test-session",
        scenario_id="job-offer",
        mode="human-ai",
        initial_data=initial_data,
        messages=messages,
        participants=[],
        current_round=2,
        status="running",
    )

    terms = state["current_terms"]
    assert terms.get("salary") == "₹37,000"
    assert terms.get("work_mode") == "Remote"
    assert "October 15" in terms.get("joining_date", "")
    assert len(state["concessions"]) >= 1


def test_acceptance_rules_with_waiting_for_human():
    """Verify AcceptanceRules allows waiting_for_human status and recovers terms."""
    agent = AgentConfigSchema(
        id="cand-1",
        agent_template_id="candidate",
        name="Vaishnavi",
        role="Candidate",
        avatar="US",
        personality="Collaborative",
        experience="5 years",
        goals=[],
        constraints=[{"label": "Salary Floor", "value": "₹35,000"}],
        negotiation_parameters={},
    )
    previous_messages = [
        {"sender": "Employer", "role": "Hiring Manager", "content": "We can finalize at ₹37,000 with remote work.", "round": 2}
    ]

    res = AcceptanceRules.validate_acceptance(
        agent=agent,
        scenario_id="job-offer",
        offer=None,  # Not explicitly passed, should recover from message
        previous_messages=previous_messages,
        status="waiting_for_human",
    )
    assert res.is_valid is True, f"Validation failed: {res.human_safe_message}"


def test_decision_engine_agreement_reconstruction():
    """Verify DecisionEngine reconstructs complete final_terms upon acceptance."""
    decision = AgentDecision(
        action="accept",
        message="I accept the proposed terms.",
        rationale_summary="Satisfied with terms",
        offer={},
        concession_percentage=0.0,
        confidence_score=1.0,
    )
    previous_messages = [
        {"sender": "Employer", "role": "Hiring Manager", "content": "We offer ₹38,000 and 3 days remote.", "round": 1}
    ]

    is_term, final_terms, outcome, _ = DecisionEngine.evaluate_agreement(
        scenario_id="job-offer",
        latest_decision=decision,
        previous_messages=previous_messages,
    )
    assert is_term is True
    assert outcome == "Agreement Reached"
    assert final_terms.get("salary") == "₹38,000"
    assert "remote" in final_terms.get("remote_days", "").lower() or "hybrid" in final_terms.get("work_mode", "").lower()


def test_system_prompt_includes_cumulative_terms():
    """Verify system prompt Section 8 contains the structured cumulative terms."""
    initial_data = {"job_role": "Backend Engineer", "initial_salary": "₹35,000"}
    transcript = [
        {"sender": "Employer", "role": "Hiring Manager", "content": "Opening offer is ₹35,000", "round": 1},
        {"sender": "Candidate", "role": "Candidate", "content": "I require ₹42,000 and Remote work mode", "round": 1},
    ]

    prompt = build_system_prompt(
        scenario_title="Job Offer Negotiation",
        scenario_objective="Reach agreement",
        agent_name="Priya",
        agent_role="Hiring Manager",
        personality="Collaborative",
        experience="Senior",
        goals=[],
        constraints=[],
        negotiation_parameters={},
        public_transcript=transcript,
        scenario_id="job-offer",
        current_round=2,
        scenario_data=initial_data,
    )

    assert "SECTION 8" in prompt
    assert "CURRENT ACCUMULATED TERMS ON THE TABLE ACROSS ALL ROUNDS:" in prompt
    assert "₹42,000" in prompt or "42,000" in prompt
    assert "Remote" in prompt
    assert "CRITICAL MULTI-TURN MEMORY INSTRUCTIONS:" in prompt


def test_report_generation_uses_real_cumulative_values():
    """Verify ReportGenerator uses the real negotiated values from messages instead of hardcoded 35000 or averages."""
    class DummyMsg:
        def __init__(self, sender, role, content, offer_data=None, round=1, turn_index=0):
            self.sender = sender
            self.role = role
            self.content = content
            self.offer_data = offer_data or {}
            self.round = round
            self.turn_index = turn_index

    class DummySession:
        def __init__(self):
            self.id = "test-session-rep"
            self.scenario_id = "job-offer"
            self.mode = "human-ai"
            self.current_round = 2
            self.status = "finished"
            self.agreement_reached = True
            self.final_terms = {}  # Empty, to test recovery from conversation state
            self.scenario_data = {
                "initial_salary_offer": "₹30,000",
                "expected_salary": "₹45,000",
                "minimum_acceptable_salary": "₹36,000",
                "work_mode": "On-site",
                "location": "Bengaluru",
            }
            self.messages = [
                DummyMsg("Hiring Manager", "Employer", "We offer ₹30,000", round=1, turn_index=0),
                DummyMsg("You (User)", "Candidate", "I require ₹38,500 and Remote work", round=1, turn_index=1),
                DummyMsg("Hiring Manager", "Employer", "We can agree to ₹38,500 with remote work.", round=2, turn_index=2),
                DummyMsg("You (User)", "Candidate", "I accept the offer of ₹38,500!", round=2, turn_index=3),
            ]

    session = DummySession()
    analysis = ReportGenerator._build_scenario_analysis(
        scenario_id=session.scenario_id,
        sc_data=session.scenario_data,
        final_terms=session.final_terms,
        outcome="Agreement Reached",
        messages=session.messages,
        session=session,
    )

    # Must be exactly the real agreed value ₹38,500, NOT the average (30000+45000)/2 = 37500, NOT 35000
    assert analysis["final_salary"] == "₹38,500"
    assert analysis["work_mode"] == "Remote"
    assert analysis["currency"] == "₹"
    assert "₹8,500" in analysis["salary_concessions"] or "8,500" in analysis["salary_concessions"]

