import pytest
from app.schemas.agent import AgentConfigSchema
from app.schemas.arena import AgentDecision
from app.negotiation.models.negotiation_state import NormalizedNegotiationState
from app.negotiation.validation.message_quality import MessageQualityValidator
from app.services.context_builder import NegotiationContextBuilder
from app.prompts.scenario_prompts import build_system_prompt


def test_repeated_greeting_prevention():
    """Verify that greetings in Round > 1 are stripped or contextualized."""
    agent = AgentConfigSchema(
        id="a1",
        agent_template_id="recruiter",
        name="Recruiter Agent",
        role="Recruiter Agent",
        avatar="RA",
        personality="Collaborative",
        goals=[{"text": "Hire candidate within budget", "priority": "High"}],
        constraints=[{"label": "Max Salary", "value": "$120,000"}],
        negotiation_parameters={"maxSalary": "$120,000"},
    )
    state = NormalizedNegotiationState(
        session_id="test-sess",
        scenario_id="job-offer",
        mode="ai-ai",
        current_round=2,
        max_rounds=10,
        current_speaker_index=0,
        current_turn_speaker="Recruiter Agent",
        agents=[agent],
        messages=[
            {"sender": "Candidate Agent", "role": "Candidate Agent", "content": "I am looking for $135,000.", "round": 1, "turn_index": 0}
        ],
        current_offer={"salary": "$135,000"},
        status="running",
    )

    decision_with_greeting = AgentDecision(
        action="counteroffer",
        message="Hello! Thank you for joining the meeting. We are offering $120,000 for this position.",
        offer={"salary": "$120,000"},
    )

    is_valid, repaired_decision, repair_note = MessageQualityValidator.validate_message_quality(state, agent, decision_with_greeting)
    assert is_valid is True
    # Greeting prefix must be removed
    assert not repaired_decision.message.lower().startswith("hello")
    assert not repaired_decision.message.lower().startswith("thank you for joining")
    assert "$120,000" in repaired_decision.message


def test_generic_message_detection():
    """Verify that generic, isolated statements without negotiation context are rebuilt."""
    agent = AgentConfigSchema(
        id="a1",
        agent_template_id="recruiter",
        name="Recruiter Agent",
        role="Recruiter Agent",
        avatar="RA",
        personality="Collaborative",
        goals=[{"text": "Hire the best candidate within budget", "priority": "High"}],
        constraints=[{"label": "Max Salary", "value": "$120,000"}],
        negotiation_parameters={"maxSalary": "$120,000"},
    )
    state = NormalizedNegotiationState(
        session_id="test-sess",
        scenario_id="job-offer",
        mode="ai-ai",
        current_round=2,
        max_rounds=10,
        current_speaker_index=0,
        current_turn_speaker="Recruiter Agent",
        agents=[agent],
        messages=[
            {"sender": "Candidate Agent", "role": "Candidate Agent", "content": "My requirement is $135,000.", "round": 1, "turn_index": 0}
        ],
        current_offer={"salary": "$135,000"},
        status="running",
    )

    generic_decision = AgentDecision(
        action="counteroffer",
        message="We are looking for the best candidate and want to provide a competitive offer.",
        offer={"salary": "$120,000"},
    )

    is_valid, repaired_decision, repair_note = MessageQualityValidator.validate_message_quality(state, agent, generic_decision)
    assert is_valid is True
    assert repaired_decision.message != generic_decision.message
    assert "$120,000" in repaired_decision.message


def test_unconfigured_fact_rejection():
    """Verify that recruiter stating numbers violating configured budget cap is repaired."""
    agent = AgentConfigSchema(
        id="a1",
        agent_template_id="recruiter",
        name="Recruiter Agent",
        role="Recruiter Agent",
        avatar="RA",
        personality="Collaborative",
        goals=[{"text": "Hire candidate within budget", "priority": "High"}],
        constraints=[{"label": "Max Salary", "value": "$120,000"}],
        negotiation_parameters={"maxSalary": "$120,000"},
    )
    state = NormalizedNegotiationState(
        session_id="test-sess",
        scenario_id="job-offer",
        mode="ai-ai",
        current_round=2,
        max_rounds=10,
        current_speaker_index=0,
        current_turn_speaker="Recruiter Agent",
        agents=[agent],
        messages=[],
        current_offer=None,
        status="running",
    )

    hallucinated_decision = AgentDecision(
        action="counteroffer",
        message="We can offer you a salary of $150,000 per year.",
        offer={"salary": "$120,000"},
    )

    is_valid, repaired_decision, repair_note = MessageQualityValidator.validate_message_quality(state, agent, hallucinated_decision)
    assert is_valid is True
    # The $150,000 (exceeding $120,000 cap) must be repaired to approved $120,000
    assert "$150,000" not in repaired_decision.message
    assert "$120,000" in repaired_decision.message


def test_llm_message_uses_previous_offer():
    """Verify that context builder explicitly includes previous offer on table."""
    active_agent = {
        "name": "Recruiter Agent",
        "role": "Recruiter Agent",
        "goals": [{"text": "Hire within budget", "priority": "High"}],
        "constraints": [{"label": "Max Salary", "value": "$120,000"}],
    }
    other_agents = [
        {"name": "Candidate Agent", "role": "Candidate Agent", "goals": [{"text": "Target $135,000", "priority": "High"}]}
    ]
    messages = [
        {"sender": "Candidate Agent", "role": "Candidate Agent", "content": "I propose $135,000 with 3 remote days.", "offer_data": {"salary": "$135,000", "remoteDays": "3"}, "round": 1, "turn_index": 0}
    ]

    ctx = NegotiationContextBuilder.build_negotiation_context(
        session_id="sess-1",
        scenario_id="job-offer",
        scenario_title="Job Offer Negotiation",
        scenario_objective="Agree on salary, equity, and remote work.",
        active_agent=active_agent,
        other_agents=other_agents,
        messages=messages,
        current_round=2,
    )

    assert ctx["latest_offer"] == {"salary": "$135,000", "remoteDays": "3"}
    assert ctx["latest_offer_sender"] == "Candidate Agent"
    assert "$135,000" in ctx["context_summary"]


def test_llm_message_uses_configured_constraints():
    """Verify prompt builder embeds strict confidentiality and hard constraints."""
    prompt = build_system_prompt(
        scenario_title="Job Offer Negotiation",
        scenario_objective="Agree on salary, equity, and remote work.",
        agent_name="Recruiter Agent",
        agent_role="Recruiter Agent",
        personality="Collaborative",
        experience="High",
        goals=[{"text": "Stay under budget", "priority": "High"}],
        constraints=[{"label": "Maximum Salary", "value": "$120,000"}],
        negotiation_parameters={"maxSalary": "$120,000"},
        public_transcript=[{"sender": "Candidate Agent", "role": "Candidate Agent", "content": "I want $135,000.", "round": 1}],
        other_agents=[{"name": "Candidate Agent", "role": "Candidate Agent"}],
        scenario_id="job-offer",
        current_round=2,
    )

    assert "Maximum Salary: $120,000" in prompt
    assert "CONTINUATION ROUND (Round 2+): Negotiation is ALREADY ACTIVE. STRICT RULE: DO NOT GREET" in prompt
    assert "Hard constraints are BINDING" in prompt
