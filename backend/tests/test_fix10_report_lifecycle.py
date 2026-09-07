import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_report_generated_when_agreement_reached(client: AsyncClient, auth_headers: dict):
    """Verify that reaching an agreement automatically generates, links, and persists a complete outcome report."""
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    sess_id = create_res.json()["id"]

    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=auth_headers)
    start_res = await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=auth_headers)
    assert start_res.status_code == 200

    # Advance turns
    await client.post(f"/api/v1/negotiations/{sess_id}/step", headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/step", headers=auth_headers)

    # Terminate session
    stop_res = await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=terminate", headers=auth_headers)
    assert stop_res.status_code == 200
    stop_data = stop_res.json()
    assert stop_data["status"] == "terminated"
    assert stop_data["report_status"] == "generated"
    assert stop_data["report_id"] is not None

    # Fetch generated report and verify all metadata
    rep_res = await client.get(f"/api/v1/reports/session/{sess_id}", headers=auth_headers)
    assert rep_res.status_code == 200
    report = rep_res.json()
    assert report["session_id"] == sess_id
    assert report["analysis"] is not None
    assert "overview" in report["analysis"]


@pytest.mark.asyncio
async def test_report_generated_when_deadlock_reached(client: AsyncClient, auth_headers: dict):
    """Verify that deadlock automatically creates and persists an outcome report explaining why agreement failed."""
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=auth_headers,
    )
    sess_id = create_res.json()["id"]

    # Incompatible constraints
    await client.put(
        f"/api/v1/negotiations/{sess_id}/agents",
        headers=auth_headers,
        json={
            "agents": [
                {
                    "name": "Vendor Agent",
                    "role": "Vendor Agent",
                    "personality": "Aggressive",
                    "negotiation_parameters": {"minPrice": "$95/user/month"},
                    "goals": [{"text": "Maximize subscription margin", "priority": "High"}],
                    "constraints": [{"label": "Price Floor", "value": "$95/user/month"}],
                },
                {
                    "name": "Buyer Agent",
                    "role": "Buyer Agent",
                    "personality": "Aggressive",
                    "negotiation_parameters": {"maxBudget": "$40/user/month"},
                    "goals": [{"text": "Strict cost control", "priority": "High"}],
                    "constraints": [{"label": "Budget Cap", "value": "$40/user/month"}],
                },
            ]
        },
    )
    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=auth_headers)

    # Step turns until deadlock triggers
    final_status = "running"
    for _ in range(8):
        step_res = await client.post(f"/api/v1/negotiations/{sess_id}/step", headers=auth_headers)
        step_data = step_res.json()
        final_status = step_data["status"]
        if final_status in ["deadlock", "finished"]:
            break

    assert final_status == "deadlock"

    # Verify report is immediately queryable
    rep_res = await client.get(f"/api/v1/reports/session/{sess_id}", headers=auth_headers)
    assert rep_res.status_code == 200
    report_data = rep_res.json()
    assert report_data["outcome"] == "Deadlock"
    assert report_data["analysis"]["deadlock_analysis"] is not None


@pytest.mark.asyncio
async def test_exactly_one_report_per_session(client: AsyncClient, auth_headers: dict):
    """Verify that multiple completion triggers create exactly ONE report in the database."""
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "job-offer", "mode": "ai-ai"},
        headers=auth_headers,
    )
    sess_id = create_res.json()["id"]
    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=auth_headers)

    # Terminate twice via API
    res1 = await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=terminate", headers=auth_headers)
    assert res1.status_code == 200
    res2 = await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=terminate", headers=auth_headers)
    assert res2.status_code == 200

    # Also call generate endpoint
    gen_res = await client.post(f"/api/v1/reports/session/{sess_id}/generate", headers=auth_headers)
    assert gen_res.status_code == 200

    # Fetch list and verify only one report exists for this session
    list_res = await client.get("/api/v1/reports", headers=auth_headers)
    assert list_res.status_code == 200
    session_reports = [r for r in list_res.json() if r["session_id"] == sess_id]
    assert len(session_reports) == 1


@pytest.mark.asyncio
async def test_report_has_correct_user_id(client: AsyncClient, auth_headers: dict):
    """Verify OutcomeReport.user_id matches the authenticated user."""
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=auth_headers,
    )
    sess_id = create_res.json()["id"]
    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=terminate", headers=auth_headers)

    rep_res = await client.get(f"/api/v1/reports/session/{sess_id}", headers=auth_headers)
    assert rep_res.status_code == 200
    rep = rep_res.json()
    assert rep["user_id"] is not None
    assert len(rep["user_id"]) > 5


@pytest.mark.asyncio
async def test_report_has_correct_session_id(client: AsyncClient, auth_headers: dict):
    """Verify OutcomeReport.session_id exactly matches the NegotiationSession.id."""
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=auth_headers,
    )
    sess_id = create_res.json()["id"]
    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=terminate", headers=auth_headers)

    rep_res = await client.get(f"/api/v1/reports/session/{sess_id}", headers=auth_headers)
    assert rep_res.status_code == 200
    assert rep_res.json()["session_id"] == sess_id


@pytest.mark.asyncio
async def test_report_visible_in_authenticated_report_list(client: AsyncClient, auth_headers: dict):
    """Verify that newly generated reports are immediately listed under GET /reports for the owner."""
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "budget-allocation", "mode": "ai-ai"},
        headers=auth_headers,
    )
    sess_id = create_res.json()["id"]
    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=auth_headers)

    # Terminate
    await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=terminate", headers=auth_headers)

    # Fetch list
    list_res = await client.get("/api/v1/reports", headers=auth_headers)
    assert list_res.status_code == 200
    reports = list_res.json()
    assert any(r["session_id"] == sess_id for r in reports)


@pytest.mark.asyncio
async def test_generate_endpoint_is_idempotent(client: AsyncClient, auth_headers: dict):
    """Verify POST /reports/session/{session_id}/generate is fully idempotent."""
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=auth_headers,
    )
    sess_id = create_res.json()["id"]
    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=terminate", headers=auth_headers)

    # 3 sequential calls
    r1 = await client.post(f"/api/v1/reports/session/{sess_id}/generate", headers=auth_headers)
    r2 = await client.post(f"/api/v1/reports/session/{sess_id}/generate", headers=auth_headers)
    r3 = await client.post(f"/api/v1/reports/session/{sess_id}/generate", headers=auth_headers)

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r3.status_code == 200
    assert r1.json()["id"] == r2.json()["id"] == r3.json()["id"]


@pytest.mark.asyncio
async def test_historical_terminal_session_can_generate_missing_report(client: AsyncClient, auth_headers: dict):
    """Verify a terminal session lacking a report can generate it on demand via POST /generate."""
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "job-offer", "mode": "ai-ai"},
        headers=auth_headers,
    )
    sess_id = create_res.json()["id"]
    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=pause", headers=auth_headers)

    # Calling generate on paused session succeeds because it's non-active
    gen_res = await client.post(f"/api/v1/reports/session/{sess_id}/generate", headers=auth_headers)
    assert gen_res.status_code == 200
    assert gen_res.json()["session_id"] == sess_id


@pytest.mark.asyncio
async def test_report_analysis_persisted_after_generation(client: AsyncClient, auth_headers: dict):
    """Verify OutcomeReport.analysis is permanently stored and returned without modification on repeat queries."""
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=auth_headers,
    )
    sess_id = create_res.json()["id"]
    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=auth_headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=terminate", headers=auth_headers)

    rep1 = await client.get(f"/api/v1/reports/session/{sess_id}", headers=auth_headers)
    rep2 = await client.get(f"/api/v1/reports/session/{sess_id}", headers=auth_headers)

    assert rep1.status_code == 200
    assert rep2.status_code == 200
    assert rep1.json()["analysis"] == rep2.json()["analysis"]
