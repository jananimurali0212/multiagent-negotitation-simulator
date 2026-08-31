import pytest
from httpx import AsyncClient
from app.prompts.scenario_prompts import build_system_prompt
from app.providers.fallback_provider import FallbackRuleProvider
from app.schemas.agent import AgentConfigSchema
from app.schemas.arena import AgentDecision
from app.negotiation.models.negotiation_state import NormalizedNegotiationState
from app.negotiation.validation.decision_validator import DecisionValidator


@pytest.mark.asyncio
async def test_llm_prompt_contains_exact_persisted_configuration():
    """Requirement 4: Verify the constructed LLM prompt contains exact persisted agent data, goals, constraints, parameters, session context, and history."""
    session_id = "test-session-uuid-12345"
    scenario_title = "Job Offer Negotiation"
    scenario_objective = "Agree on base salary and work arrangement."
    agent_name = "Recruiter Agent"
    agent_role = "Recruiter Agent"
    personality = "Risk-Averse"
    experience = "High"
    goals = [{"text": "Hire top candidate within approved budget", "priority": "High"}]
    constraints = [{"label": "Maximum Salary Budget", "value": "$120,000"}]
    negotiation_parameters = {
        "targetSalary": "$110,000",
        "maxSalary": "$120,000",
    }
    other_agents = [
        {
            "name": "Candidate Agent",
            "role": "Candidate Agent",
            "goals": [{"text": "Maximize compensation package", "priority": "High"}],
            "constraints": [{"label": "Minimum Floor", "value": "$135,000"}],
        }
    ]
    public_transcript = [
        {"sender": "Candidate Agent", "role": "Candidate Agent", "content": "I am seeking a salary of $135,000.", "round": 1}
    ]

    prompt = build_system_prompt(
        scenario_title=scenario_title,
        scenario_objective=scenario_objective,
        agent_name=agent_name,
        agent_role=agent_role,
        personality=personality,
        experience=experience,
        goals=goals,
        constraints=constraints,
        negotiation_parameters=negotiation_parameters,
        public_transcript=public_transcript,
        other_agents=other_agents,
        scenario_id="job-offer",
        current_round=2,
        session_id=session_id,
    )

    # 1. Agent identity & Role
    assert "Agent Name: Recruiter Agent" in prompt
    assert "Configured Role: Recruiter Agent" in prompt
    assert f"Session ID: {session_id}" in prompt
    assert "Candidate Agent" in prompt

    # 2. Personality
    assert "Configured Personality: Risk-Averse" in prompt

    # 3. Goals & Constraints
    assert "Hire top candidate within approved budget" in prompt
    assert "Maximum Salary Budget: $120,000" in prompt

    # 4. Parameters
    assert "110,000" in prompt
    assert "120,000" in prompt

    # 5. Conversation history & Greeting Rule
    assert "I am seeking a salary of $135,000." in prompt
    assert "CONTINUATION ROUND (Round 2+): Negotiation is ALREADY ACTIVE. STRICT RULE: DO NOT GREET" in prompt

    # 6. Verify unconfigured terms are NOT in prompt
    assert "$155,000" not in prompt
    assert "$160,000" not in prompt
    assert "$165,000" not in prompt
    assert "10,000 equity options" not in prompt


@pytest.mark.asyncio
async def test_custom_salary_negotiation_pipeline(client: AsyncClient, auth_headers: dict):
    """Test 1: Custom configured salary values ($120k max recruiter, $135k min candidate) are persisted and returned via GET."""
    agents_payload = [
        {
            "agent_template_id": "recruiter-agent",
            "name": "Recruiter Agent",
            "role": "Recruiter Agent",
            "personality": "Risk-Averse",
            "experience": "High",
            "negotiation_parameters": {"targetSalary": "$110,000", "maxSalary": "$120,000"},
            "goals": [{"text": "Hire candidate within approved budget", "priority": "High"}],
            "constraints": [{"label": "Maximum Salary", "value": "$120,000"}],
        },
        {
            "agent_template_id": "candidate-agent",
            "name": "Candidate Agent",
            "role": "Candidate Agent",
            "personality": "Collaborative",
            "experience": "High",
            "negotiation_parameters": {"targetSalary": "$140,000", "minSalary": "$135,000"},
            "goals": [{"text": "Maximize compensation", "priority": "High"}],
            "constraints": [{"label": "Minimum Salary", "value": "$135,000"}],
        }
    ]

    # Create session
    create_res = await client.post(
        "/api/v1/negotiations",
        headers=auth_headers,
        json={"scenario_id": "job-offer", "mode": "ai-ai", "agents": agents_payload},
    )
    assert create_res.status_code == 201
    sess_id = create_res.json()["id"]

    # Confirm review
    confirm_res = await client.post(
        f"/api/v1/negotiations/{sess_id}/confirm-review",
        headers=auth_headers,
        json={"confirm": True},
    )
    assert confirm_res.status_code == 200
    assert confirm_res.json()["review_confirmed"] is True
    assert confirm_res.json()["status"] == "ready"

    # Start session (triggers snapshot & status=running)
    start_res = await client.post(
        f"/api/v1/negotiations/{sess_id}/start",
        headers=auth_headers,
    )
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "running"

    # GET session to verify exact database persistence
    get_res = await client.get(f"/api/v1/negotiations/{sess_id}", headers=auth_headers)
    assert get_res.status_code == 200
    sess_data = get_res.json()
    assert len(sess_data["agents"]) == 2

    recruiter = next(a for a in sess_data["agents"] if "Recruiter" in a["name"])
    candidate = next(a for a in sess_data["agents"] if "Candidate" in a["name"])

    assert recruiter["negotiation_parameters"]["maxSalary"] == "$120,000"
    assert recruiter["constraints"][0]["value"] == "$120,000"
    assert candidate["negotiation_parameters"]["minSalary"] == "$135,000"
    assert candidate["constraints"][0]["value"] == "$135,000"


@pytest.mark.asyncio
async def test_session_isolation(client: AsyncClient, auth_headers: dict):
    """Requirement 1: Verify complete isolation between multiple sessions with different configurations."""
    # Session A: $120k / $135k
    sess_a_res = await client.post(
        "/api/v1/negotiations",
        headers=auth_headers,
        json={
            "scenario_id": "job-offer",
            "mode": "ai-ai",
            "agents": [
                {
                    "agent_template_id": "recruiter-1",
                    "name": "Recruiter Agent",
                    "role": "Recruiter Agent",
                    "personality": "Risk-Averse",
                    "negotiation_parameters": {"maxSalary": "$120,000"},
                    "goals": [{"text": "Budget cap $120k", "priority": "High"}],
                    "constraints": [{"label": "Cap", "value": "$120,000"}],
                },
                {
                    "agent_template_id": "candidate-1",
                    "name": "Candidate Agent",
                    "role": "Candidate Agent",
                    "personality": "Collaborative",
                    "negotiation_parameters": {"minSalary": "$135,000"},
                    "goals": [{"text": "Floor $135k", "priority": "High"}],
                    "constraints": [{"label": "Floor", "value": "$135,000"}],
                }
            ],
        },
    )
    sess_a_id = sess_a_res.json()["id"]

    # Session B: $200k / $180k
    sess_b_res = await client.post(
        "/api/v1/negotiations",
        headers=auth_headers,
        json={
            "scenario_id": "job-offer",
            "mode": "ai-ai",
            "agents": [
                {
                    "agent_template_id": "recruiter-2",
                    "name": "Recruiter Agent",
                    "role": "Recruiter Agent",
                    "personality": "Collaborative",
                    "negotiation_parameters": {"maxSalary": "$200,000"},
                    "goals": [{"text": "Budget cap $200k", "priority": "High"}],
                    "constraints": [{"label": "Cap", "value": "$200,000"}],
                },
                {
                    "agent_template_id": "candidate-2",
                    "name": "Candidate Agent",
                    "role": "Candidate Agent",
                    "personality": "Aggressive",
                    "negotiation_parameters": {"minSalary": "$180,000"},
                    "goals": [{"text": "Floor $180k", "priority": "High"}],
                    "constraints": [{"label": "Floor", "value": "$180,000"}],
                }
            ],
        },
    )
    sess_b_id = sess_b_res.json()["id"]

    # Verify session A has $120k / $135k
    get_a = await client.get(f"/api/v1/negotiations/{sess_a_id}", headers=auth_headers)
    agents_a = get_a.json()["agents"]
    assert any(a["negotiation_parameters"].get("maxSalary") == "$120,000" for a in agents_a)
    assert not any("200,000" in str(a) for a in agents_a)

    # Verify session B has $200k / $180k
    get_b = await client.get(f"/api/v1/negotiations/{sess_b_id}", headers=auth_headers)
    agents_b = get_b.json()["agents"]
    assert any(a["negotiation_parameters"].get("maxSalary") == "$200,000" for a in agents_b)
    assert not any("120,000" in str(a) for a in agents_b)


@pytest.mark.asyncio
async def test_fallback_uses_real_configured_data_only():
    """Test fallback provider with custom data strictly generates contextual response using configured numbers without hardcoded terms."""
    fallback = FallbackRuleProvider()

    recruiter_data = {
        "name": "Recruiter Agent",
        "role": "Recruiter Agent",
        "personality": "Risk-Averse",
        "negotiation_parameters": {"maxSalary": "$120,000", "targetSalary": "$110,000"},
        "goals": [{"text": "Hire candidate within budget", "priority": "High"}],
        "constraints": [{"label": "Salary cap", "value": "$120,000"}],
    }

    # Round 1 Recruiter Opening
    dec_r1 = await fallback.generate_decision(
        prompt="",
        agent_personality="Risk-Averse",
        agent_role="Recruiter Agent",
        current_round=1,
        scenario_id="job-offer",
        agent_data=recruiter_data,
        session_id="test-session",
    )
    assert dec_r1.message.startswith("Hello.")
    assert "110,000" in dec_r1.message or "120,000" in dec_r1.message
    # Prohibit unconfigured defaults
    assert "$155,000" not in dec_r1.message
    assert "$160,000" not in dec_r1.message
    assert "$165,000" not in dec_r1.message

    # Round 2 Candidate Response (Strictly NO greeting in round > 1)
    candidate_data = {
        "name": "Candidate Agent",
        "role": "Candidate Agent",
        "personality": "Collaborative",
        "negotiation_parameters": {"minSalary": "$135,000", "targetSalary": "$140,000"},
        "goals": [{"text": "Maximize compensation", "priority": "High"}],
        "constraints": [{"label": "Minimum salary floor", "value": "$135,000"}],
    }

    dec_r2 = await fallback.generate_decision(
        prompt="",
        agent_personality="Collaborative",
        agent_role="Candidate Agent",
        current_round=2,
        scenario_id="job-offer",
        agent_data=candidate_data,
        session_id="test-session",
    )
    # Greeting rule: no Hello in round 2
    assert not dec_r2.message.startswith("Hello")
    assert "$138,750" in dec_r2.message or "$135,000" in dec_r2.message or "$140,000" in dec_r2.message
    assert "$155,000" not in dec_r2.message


@pytest.mark.asyncio
async def test_unsupported_term_rejection_and_repair():
    """Requirement 3: LLM generated message with unsupported factual numbers exceeding boundaries is repaired."""
    recruiter_agent = AgentConfigSchema(
        id="recruiter-uuid",
        agent_template_id="recruiter",
        name="Recruiter Agent",
        role="Recruiter Agent",
        avatar="RA",
        personality="Risk-Averse",
        goals=[{"text": "Stay under budget", "priority": "High"}],
        constraints=[{"label": "Maximum Salary", "value": "$120,000"}],
        negotiation_parameters={"maxSalary": "$120,000"},
    )

    norm_state = NormalizedNegotiationState(
        session_id="sess-test",
        scenario_id="job-offer",
        mode="ai-ai",
        current_round=2,
        max_rounds=20,
        current_speaker_index=0,
        current_turn_speaker="Recruiter Agent",
        agents=[recruiter_agent],
        messages=[],
        current_offer=None,
        status="running",
    )

    # LLM hallucinates $155,000 when recruiter cap is $120,000
    hallucinated_decision = AgentDecision(
        action="counteroffer",
        message="We can offer $155,000 base salary for this position.",
        rationale_summary="Testing boundary repair",
        offer={"salary": "$155,000"},
        concession_percentage=0.0,
    )

    val_res, validated_dec, _ = DecisionValidator.validate_decision(norm_state, hallucinated_decision)
    # The decision offer and message must be repaired to stay within the $120,000 cap
    assert "$155,000" not in validated_dec.message
    assert "$120,000" in validated_dec.message or "$120,000" in str(validated_dec.offer)
