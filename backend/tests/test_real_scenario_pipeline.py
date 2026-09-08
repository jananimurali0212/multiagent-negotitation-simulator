import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_real_scenario_data_flow_vendor_pricing(client: AsyncClient, auth_headers: dict):
    # 1. Create session with real vendor pricing data
    real_data = {
        "product": "Enterprise Cloud ERP",
        "quantity": "250 user licenses",
        "current_vendor_price": "$80/user/month",
        "target_price": "$50/user/month",
        "maximum_budget": "$65/user/month",
        "delivery_requirement": "Immediate / 7 days",
        "quality_requirement": "99.99% SLA Gold Support",
        "other_conditions": "Net-45 payment terms",
    }
    create_res = await client.post(
        "/api/v1/negotiations",
        json={
            "scenario_id": "vendor-pricing",
            "mode": "human-ai",
            "human_role": "vendor",
            "scenario_data": real_data,
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    session = create_res.json()
    session_id = session["id"]
    assert session["scenario_data"]["product"] == "Enterprise Cloud ERP"
    assert session["current_step"] == "NEGOTIATION"
    assert session["review_confirmed"] is True

    # 2. Start negotiation
    start_res = await client.post(
        f"/api/v1/negotiations/{session_id}/start",
        headers=auth_headers,
    )
    assert start_res.status_code == 200

    # 3. Submit human turn (human is vendor, authoritative speaker 0)
    turn_res = await client.post(
        f"/api/v1/negotiations/{session_id}/user-turn",
        json={
            "message": "Thank you for reaching out. We propose $75/user/month for 250 licenses with Gold Support.",
            "turn_index": 0,
        },
        headers=auth_headers,
    )
    assert turn_res.status_code == 200
    turn_data = turn_res.json()
    assert turn_data["message"] is not None

    # 4. Complete negotiation and verify automatic comprehensive report
    end_res = await client.post(
        f"/api/v1/negotiations/{session_id}/complete",
        headers=auth_headers,
    )
    assert end_res.status_code == 200

    report_res = await client.get(
        f"/api/v1/negotiations/{session_id}/report",
        headers=auth_headers,
    )
    assert report_res.status_code == 200
    report = report_res.json()
    assert report["scenario_id"] == "vendor-pricing"
    assert report["initial_data"]["product"] == "Enterprise Cloud ERP"
    assert "participants" in report
    assert len(report["participants"]) >= 2
    assert "overall_score" in report
    assert report["overall_score"] > 0
    assert "key_events" in report
    assert len(report["key_events"]) >= 1
    assert "agent_analysis" in report
    assert "recommendations" in report


@pytest.mark.asyncio
async def test_real_scenario_data_job_offer(client: AsyncClient, auth_headers: dict):
    real_data = {
        "job_role": "Staff Platform Engineer",
        "current_initial_salary": "$160,000",
        "expected_salary": "$190,000",
        "experience": "8 years distributed systems",
        "location": "New York City",
        "work_mode": "Hybrid (2 days remote)",
        "benefits": "Comprehensive medical, 401k match, 4 weeks PTO",
        "joining_date": "1 month notice",
        "other_requirements": "Relocation assistance",
    }
    create_res = await client.post(
        "/api/v1/negotiations",
        json={
            "scenario_id": "job-offer",
            "mode": "human-ai",
            "human_role": "candidate",
            "scenario_data": real_data,
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    session = create_res.json()
    session_id = session["id"]
    assert session["scenario_data"]["job_role"] == "Staff Platform Engineer"

    # Start and complete
    await client.post(f"/api/v1/negotiations/{session_id}/start", headers=auth_headers)
    await client.post(
        f"/api/v1/negotiations/{session_id}/user-turn",
        json={"message": "I am seeking $180,000 base salary with hybrid work mode.", "turn_index": 0},
        headers=auth_headers,
    )
    await client.post(f"/api/v1/negotiations/{session_id}/complete", headers=auth_headers)

    report_res = await client.get(f"/api/v1/negotiations/{session_id}/report", headers=auth_headers)
    assert report_res.status_code == 200
    report = report_res.json()
    assert report["scenario_id"] == "job-offer"
    assert "scenario_analysis" in report
    assert report["scenario_analysis"]["initial_salary"] == "$160,000"
    assert report["scenario_analysis"]["expected_salary"] == "$190,000"
    assert "final_assessment" in report


@pytest.mark.asyncio
async def test_real_scenario_data_project_budget_inr(client: AsyncClient, auth_headers: dict):
    real_data = {
        "project_name": "NextGen AI Platform",
        "total_project_budget": "₹5,00,00,000",
        "department_allocations": "Engineering ₹3,00,00,000, Marketing ₹1,00,00,000, Ops ₹1,00,00,000",
        "priorities": "Core AI model rollout",
        "deadline": "Q4 2026",
    }
    create_res = await client.post(
        "/api/v1/negotiations",
        json={
            "scenario_id": "budget-allocation",
            "mode": "ai-ai",
            "scenario_data": real_data,
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    session = create_res.json()
    session_id = session["id"]
    assert session["scenario_data"]["total_project_budget"] == "₹5,00,00,000"

    # Step through simulation
    await client.post(f"/api/v1/negotiations/{session_id}/start", headers=auth_headers)
    step_res = await client.post(f"/api/v1/negotiations/{session_id}/step", headers=auth_headers)
    assert step_res.status_code == 200

    # Complete simulation
    await client.post(f"/api/v1/negotiations/{session_id}/complete", headers=auth_headers)

    report_res = await client.get(f"/api/v1/negotiations/{session_id}/report", headers=auth_headers)
    assert report_res.status_code == 200
    report = report_res.json()
    assert report["scenario_id"] == "budget-allocation"
    assert report["scenario_analysis"]["total_budget"] == "₹5,00,00,000"
    assert report["scenario_analysis"]["currency"] == "₹"


@pytest.mark.asyncio
async def test_real_scenario_data_job_offer_inr(client: AsyncClient, auth_headers: dict):
    real_data = {
        "job_role": "Full Stack AI Developer",
        "company": "Indian Tech Innovations",
        "initial_salary_offer": "₹30,000 / month",
        "expected_salary": "₹45,000 / month",
        "minimum_acceptable_salary": "₹35,000 / month",
        "experience": "4 years Python & React",
        "location": "Bengaluru",
        "work_mode": "Hybrid (3 days remote)",
        "joining_date": "Immediate",
        "notice_period": "15 days",
    }
    create_res = await client.post(
        "/api/v1/negotiations",
        json={
            "scenario_id": "job-offer",
            "mode": "human-ai",
            "human_role": "recruiter",
            "scenario_data": real_data,
        },
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    session = create_res.json()
    session_id = session["id"]

    # Start session
    await client.post(f"/api/v1/negotiations/{session_id}/start", headers=auth_headers)

    # Human (recruiter, speaker 0) proposes real salary in ₹
    turn_res = await client.post(
        f"/api/v1/negotiations/{session_id}/user-turn",
        json={"message": "We would like to offer ₹35,000 per month with 3 days remote.", "turn_index": 0},
        headers=auth_headers,
    )
    assert turn_res.status_code == 200
    turn_data = turn_res.json()
    assert turn_data.get("validation_error") is None

    # Complete session and check report
    await client.post(f"/api/v1/negotiations/{session_id}/complete", headers=auth_headers)

    report_res = await client.get(f"/api/v1/negotiations/{session_id}/report", headers=auth_headers)
    assert report_res.status_code == 200
    report = report_res.json()
    assert report["scenario_id"] == "job-offer"
    analysis = report["scenario_analysis"]
    assert analysis is not None
    assert analysis["currency"] == "₹"
    assert "₹" in analysis["final_salary"]
    assert "$" not in analysis["final_salary"]
    assert "₹" in analysis["initial_salary"]
    assert "₹" in analysis["expected_salary"]
    assert "₹" in analysis["minimum_acceptable_salary"]
    if report.get("final_terms") and "salary" in report["final_terms"]:
        assert "$" not in report["final_terms"]["salary"]
        assert "₹" in report["final_terms"]["salary"]

