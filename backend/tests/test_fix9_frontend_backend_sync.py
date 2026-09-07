import pytest
from httpx import AsyncClient


async def _get_auth_headers(client: AsyncClient, email: str = "fix9user@example.com") -> dict:
    res = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "Password123!", "name": "Fix9 User"},
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
async def test_frontend_backend_state_consistency(client: AsyncClient):
    """Verify state consistency across create -> start -> step -> get."""
    headers = await _get_auth_headers(client, "test_sync1@example.com")
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=headers,
    )
    assert create_res.status_code == 201
    sess_id = create_res.json()["id"]

    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=headers)
    start_res = await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "running"

    step_res = await client.post(f"/api/v1/negotiations/{sess_id}/step", headers=headers)
    assert step_res.status_code == 200
    step_data = step_res.json()
    assert step_data["message"] is not None

    get_res = await client.get(f"/api/v1/negotiations/{sess_id}", headers=headers)
    assert get_res.status_code == 200
    session_data = get_res.json()
    assert len(session_data["messages"]) >= 1
    assert session_data["current_round"] == step_data["round"]


@pytest.mark.asyncio
async def test_no_step_when_paused(client: AsyncClient):
    """Verify that calling /step on a paused session returns paused without advancing."""
    headers = await _get_auth_headers(client, "test_sync_pause@example.com")
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=headers,
    )
    sess_id = create_res.json()["id"]
    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=headers)

    pause_res = await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=pause", headers=headers)
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "paused"

    step_res = await client.post(f"/api/v1/negotiations/{sess_id}/step", headers=headers)
    assert step_res.status_code == 200
    assert step_res.json()["status"] == "paused"
    assert step_res.json()["message"] is None


@pytest.mark.asyncio
async def test_no_step_when_waiting_for_human(client: AsyncClient):
    """Verify that calling /step on a waiting_for_human session returns waiting_for_human without generating an AI turn."""
    headers = await _get_auth_headers(client, "test_sync_waiting@example.com")
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "job-offer", "mode": "human-ai", "human_role": "recruiter"},
        headers=headers,
    )
    sess_id = create_res.json()["id"]
    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=headers)
    start_res = await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=headers)
    assert start_res.json()["status"] == "waiting_for_human"

    step_res = await client.post(f"/api/v1/negotiations/{sess_id}/step", headers=headers)
    assert step_res.status_code == 200
    assert step_res.json()["status"] == "waiting_for_human"
    assert step_res.json()["message"] is None


@pytest.mark.asyncio
async def test_no_step_after_finished(client: AsyncClient):
    """Verify that calling /step after session termination returns terminated without executing turns."""
    headers = await _get_auth_headers(client, "test_sync_term@example.com")
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=headers,
    )
    sess_id = create_res.json()["id"]
    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=headers)

    stop_res = await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=terminate", headers=headers)
    assert stop_res.status_code == 200
    assert stop_res.json()["status"] == "terminated"

    step_res = await client.post(f"/api/v1/negotiations/{sess_id}/step", headers=headers)
    assert step_res.status_code == 200
    assert step_res.json()["status"] == "terminated"
    assert step_res.json()["message"] is None


@pytest.mark.asyncio
async def test_status_transitions_complete_lifecycle(client: AsyncClient):
    """Verify status state machine lifecycle: setup -> ready -> running -> paused -> running -> terminated."""
    headers = await _get_auth_headers(client, "test_sync_lifecycle@example.com")
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=headers,
    )
    assert create_res.json()["status"] == "setup"
    sess_id = create_res.json()["id"]

    conf_res = await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=headers)
    assert conf_res.json()["status"] == "ready"

    start_res = await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=headers)
    assert start_res.json()["status"] == "running"

    pause_res = await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=pause", headers=headers)
    assert pause_res.json()["status"] == "paused"

    resume_res = await client.post(f"/api/v1/negotiations/{sess_id}/resume", headers=headers)
    assert resume_res.json()["status"] == "running"

    term_res = await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=terminate", headers=headers)
    assert term_res.json()["status"] == "terminated"
