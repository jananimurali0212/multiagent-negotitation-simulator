import pytest
import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.providers.gemini_provider import GeminiProvider
from app.prompts.scenario_prompts import build_system_prompt
from app.negotiation.state_tracker import NegotiationStateTracker


@pytest.mark.asyncio
async def test_live_gemini_multi_turn_response():
    """Validates that Gemini generates live non-mock decisions using real cumulative user scenario context."""
    provider = GeminiProvider()
    if not provider.client:
        pytest.skip("Gemini API key not configured or client not available")

    scenario_data = {
        "job_role": "Lead AI Engineer",
        "company": "TechCorp India",
        "initial_salary_offer": "₹35,000",
        "expected_salary": "₹45,000",
        "minimum_acceptable_salary": "₹38,000",
        "experience": "6 years",
        "location": "Bengaluru",
        "work_mode": "Hybrid (3 days remote)",
        "joining_date": "November 1",
    }

    transcript = [
        {"sender": "You (User)", "role": "Candidate", "content": "Hello, thank you for the offer. While I appreciate the ₹35,000 baseline, given my 6 years of AI experience I am seeking ₹44,000 and full remote flexibility.", "round": 1},
    ]

    cum_state = NegotiationStateTracker.track_cumulative_state(
        session_id="live-test",
        scenario_id="job-offer",
        mode="collaborative",
        initial_data=scenario_data,
        messages=transcript,
        participants=[],
        current_round=1,
        status="running",
    )

    prompt = build_system_prompt(
        scenario_title="Job Offer Negotiation",
        scenario_objective="Reach mutual agreement on compensation and role parameters",
        agent_name="Priya Sharma",
        agent_role="Hiring Manager",
        personality="Collaborative",
        experience="Senior",
        goals=[{"priority": "High", "text": "Hire candidate within ₹40,000 budget cap"}],
        constraints=[{"label": "Salary Ceiling", "value": "₹40,000"}],
        negotiation_parameters={"target_salary": "₹37,000"},
        public_transcript=transcript,
        scenario_id="job-offer",
        current_round=1,
        scenario_data=scenario_data,
        mode="collaborative",
        cumulative_state=cum_state,
    )

    decision = await provider.generate_decision(
        prompt=prompt,
        agent_personality="Collaborative",
        agent_role="Hiring Manager",
        current_round=1,
        scenario_id="job-offer",
    )

    out_str = f"\n[LIVE GEMINI RESPONSE]:\nAction: {decision.action}\nMessage: {decision.message}\nOffer: {decision.offer}\nRationale: {decision.rationale_summary}"
    sys.stdout.buffer.write(out_str.encode("utf-8") + b"\n")

    assert decision.action in ["counteroffer", "accept", "reject"]
    assert len(decision.message) > 20
    # Verify AI recognized the user context and ₹ currency (or real monetary terms)
    assert any(sym in decision.message for sym in ["₹", "Rs", "35", "37", "38", "40", "salary", "offer"])
