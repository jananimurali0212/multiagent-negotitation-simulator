import pytest
from httpx import AsyncClient
from app.models.negotiation import NegotiationSession, NegotiationMessage
from app.models.agent import AgentConfiguration, AgentGoal, AgentConstraint
from app.services.report_analysis_service import ReportAnalysisService
from app.orchestration.runner import stop_background_simulation


async def _get_auth_headers(client: AsyncClient, email: str = "report_user@example.com") -> dict:
    res = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "Password123!", "name": "Report User"},
    )
    if res.status_code == 201:
        token = res.json()["access_token"]
    else:
        login_res = await client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": "Password123!"},
        )
        token = login_res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_deadlock_report_intelligence_generation(client: AsyncClient):
    """Verify that a deadlock session automatically generates a complete intelligence report with deadlock analysis."""
    headers = await _get_auth_headers(client, "test_rep_deadlock@example.com")

    create_res = await client.post(
        "/api/v1/negotiations",
        headers=headers,
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
    )
    assert create_res.status_code == 201
    session_id = create_res.json()["id"]

    # Configure strictly incompatible hard constraints (Vendor min $90 > Buyer max $40)
    await client.put(
        f"/api/v1/negotiations/{session_id}/agents",
        headers=headers,
        json={
            "agents": [
                {
                    "name": "Vendor Agent",
                    "role": "Vendor Agent",
                    "personality": "Aggressive",
                    "negotiation_parameters": {"minPrice": "$90/user/month", "targetPrice": "$95/user/month"},
                    "goals": [{"text": "Maximize subscription margin", "priority": "High"}],
                    "constraints": [{"label": "Price Floor", "value": "$90/user/month"}],
                },
                {
                    "name": "Buyer Agent",
                    "role": "Buyer Agent",
                    "personality": "Aggressive",
                    "negotiation_parameters": {"maxBudget": "$40/user/month", "targetPrice": "$35/user/month"},
                    "goals": [{"text": "Strict cost control", "priority": "High"}],
                    "constraints": [{"label": "Budget Cap", "value": "$40/user/month"}],
                },
            ]
        },
    )
    await client.post(f"/api/v1/negotiations/{session_id}/confirm-review", headers=headers, json={"confirm": True})
    await client.post(f"/api/v1/negotiations/{session_id}/start", headers=headers)
    stop_background_simulation(session_id)

    # Step through rounds until deadlock is triggered
    final_status = "running"
    for _ in range(8):
        step_res = await client.post(f"/api/v1/negotiations/{session_id}/step", headers=headers)
        step_data = step_res.json()
        final_status = step_data["status"]
        if final_status in ["deadlock", "finished"]:
            break

    assert final_status == "deadlock"

    # Fetch report and verify intelligence analysis payload
    rep_res = await client.get(f"/api/v1/reports/session/{session_id}", headers=headers)
    assert rep_res.status_code == 200
    report = rep_res.json()

    assert report["outcome"] == "Deadlock"
    assert "analysis" in report
    analysis = report["analysis"]
    assert analysis is not None

    # Verify deadlock-specific analysis
    assert analysis["deadlock_analysis"] is not None
    assert analysis["agreement_analysis"] is None
    assert "Incompatible" in analysis["deadlock_analysis"]["deadlock_cause"]
    assert len(analysis["deadlock_analysis"]["conflicting_constraints"]) >= 1

    # Verify overview & timeline
    assert analysis["overview"]["scenario_title"] == "Vendor Pricing Negotiation"
    assert len(analysis["negotiation_timeline"]) >= 1

    # Verify metrics (no fabricated fallbacks)
    assert analysis["metrics"]["rounds_completed"] >= 1
    assert analysis["metrics"]["total_turns"] >= 1


@pytest.mark.asyncio
async def test_agreement_report_intelligence_unit():
    """Unit test ReportAnalysisService directly with mock session data to verify all 13 sections."""
    agent1 = AgentConfiguration(
        id="a1",
        name="Recruiter Agent",
        role="Recruiter Agent",
        avatar="RA",
        personality="Collaborative",
        experience="High",
        negotiation_parameters={"targetSalary": "$120,000", "maxSalary": "$130,000"},
        goals=[AgentGoal(text="Hire top talent within budget", priority="High")],
        constraints=[AgentConstraint(label="Maximum Base Salary", value="$130,000")],
    )
    agent2 = AgentConfiguration(
        id="a2",
        name="Candidate Agent",
        role="Candidate Agent",
        avatar="CA",
        personality="Collaborative",
        experience="High",
        negotiation_parameters={"targetSalary": "$135,000", "minSalary": "$125,000"},
        goals=[AgentGoal(text="Secure competitive compensation", priority="High")],
        constraints=[AgentConstraint(label="Minimum Base Salary", value="$125,000")],
    )

    msg1 = NegotiationMessage(
        sender="Recruiter Agent",
        role="Recruiter Agent",
        content="We are pleased to offer $120,000 for this role.",
        offer_data={"salary": "$120,000"},
        round=1,
        turn_index=0,
    )
    msg2 = NegotiationMessage(
        sender="Candidate Agent",
        role="Candidate Agent",
        content="Thank you. Given my experience, I propose $130,000.",
        offer_data={"salary": "$130,000"},
        round=1,
        turn_index=1,
    )
    msg3 = NegotiationMessage(
        sender="Recruiter Agent",
        role="Recruiter Agent",
        content="We can meet at $128,000 with remote flexibility.",
        offer_data={"salary": "$128,000"},
        round=2,
        turn_index=2,
    )
    msg4 = NegotiationMessage(
        sender="Candidate Agent",
        role="Candidate Agent",
        content="I accept the offer of $128,000.",
        offer_data={"salary": "$128,000"},
        round=2,
        turn_index=3,
    )

    session = NegotiationSession(
        id="sess-unit-agree",
        user_id="user-123",
        scenario_id="job-offer",
        mode="ai-ai",
        status="finished",
        current_round=2,
        final_terms={"salary": "$128,000"},
        agents=[agent1, agent2],
        messages=[msg1, msg2, msg3, msg4],
    )

    analysis = ReportAnalysisService.build_report_analysis(
        session=session,
        outcome="Agreement Reached",
        scenario_title="Job Offer Negotiation",
    )

    # 1. Overview
    assert analysis["overview"]["scenario_title"] == "Job Offer Negotiation"
    assert analysis["overview"]["total_turns"] == 4

    # 2. Configuration Snapshot
    assert len(analysis["configuration_snapshot"]) == 2
    assert analysis["configuration_snapshot"][0]["primary_goal"] == "Hire top talent within budget"

    # 3. Timeline
    assert len(analysis["negotiation_timeline"]) == 4
    assert analysis["negotiation_timeline"][0]["action"] == "Opening Position"
    assert analysis["negotiation_timeline"][3]["action"] == "Acceptance"

    # 4. Offer Evolution
    assert analysis["offer_evolution"]["has_numeric_chart_data"] is True
    assert len(analysis["offer_evolution"]["chart_data"]) == 2

    # 5. Concessions
    assert analysis["concession_analysis"]["total_concessions_detected"] >= 1

    # 6. Turning Points
    assert len(analysis["turning_points"]) >= 2

    # 7. Strategy
    techniques = [t["technique"] for t in analysis["strategy_analysis"]["techniques"]]
    assert "Anchoring" in techniques
    assert "Counteroffering" in techniques

    # 8. Agreement Analysis & Constraint Compatibility
    agree = analysis["agreement_analysis"]
    assert agree is not None
    assert agree["all_constraints_satisfied"] is True
    assert agree["final_agreement_terms"] == {"salary": "$128,000"}

    # 9. Confidence Analysis
    conf = analysis["confidence_analysis"]
    assert conf["confidence_score"] == 100
    assert conf["confidence_level"] == "High Confidence"

    # 10. Agent Scorecards
    assert len(analysis["agent_analysis"]) == 2


@pytest.mark.asyncio
async def test_report_route_ordering_and_security(client: AsyncClient):
    """Verify that GET /reports/session/{session_id} is correctly resolved and user ownership is enforced."""
    headers1 = await _get_auth_headers(client, "user1_rep@example.com")
    headers2 = await _get_auth_headers(client, "user2_rep@example.com")

    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=headers1,
    )
    sess_id = create_res.json()["id"]
    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=headers1)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=headers1)
    stop_background_simulation(sess_id)

    # User 1 terminates session -> triggers report generation
    await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=terminate", headers=headers1)

    # User 1 fetches by session route
    sess_rep_res = await client.get(f"/api/v1/reports/session/{sess_id}", headers=headers1)
    assert sess_rep_res.status_code == 200
    assert sess_rep_res.json()["session_id"] == sess_id
    assert sess_rep_res.json()["analysis"] is not None

    # User 2 attempts to fetch User 1's report -> 403 Forbidden
    forbidden_res = await client.get(f"/api/v1/reports/session/{sess_id}", headers=headers2)
    assert forbidden_res.status_code == 403
