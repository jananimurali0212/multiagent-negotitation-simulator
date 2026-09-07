import pytest
from httpx import AsyncClient


async def _get_auth_headers(client: AsyncClient, email: str = "fix8user@example.com") -> dict:
    res = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "Password123!", "name": "Fix8 User"},
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
async def test_ai_waits_for_human_turn(client: AsyncClient):
    """Verify that in human-ai mode when human is opening speaker, status is waiting_for_human and /step does not generate AI response."""
    headers = await _get_auth_headers(client, "test_waits@example.com")
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "job-offer", "mode": "human-ai", "human_role": "recruiter"},
        headers=headers,
    )
    assert create_res.status_code == 201
    sess_id = create_res.json()["id"]

    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=headers)
    start_res = await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "waiting_for_human"

    # Calling /step while waiting for human must return waiting_for_human with message=None
    step_res = await client.post(f"/api/v1/negotiations/{sess_id}/step", headers=headers)
    assert step_res.status_code == 200
    assert step_res.json()["status"] == "waiting_for_human"
    assert step_res.json()["message"] is None


@pytest.mark.asyncio
async def test_ai_never_generates_human_message(client: AsyncClient):
    """Verify that calling /step on human turn does not persist any AI messages."""
    headers = await _get_auth_headers(client, "test_never_gen@example.com")
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "human-ai", "human_role": "buyer"},
        headers=headers,
    )
    assert create_res.status_code == 201
    sess_id = create_res.json()["id"]

    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=headers)

    step_res = await client.post(f"/api/v1/negotiations/{sess_id}/step", headers=headers)
    assert step_res.json()["status"] == "waiting_for_human"
    assert step_res.json()["message"] is None

    get_res = await client.get(f"/api/v1/negotiations/{sess_id}", headers=headers)
    assert len(get_res.json()["messages"]) == 0


@pytest.mark.asyncio
async def test_human_message_persisted_exactly(client: AsyncClient):
    """Verify that when human submits a message via /human-turn, it is saved exactly as is_user=True and AI returns 1 response."""
    headers = await _get_auth_headers(client, "test_exact_persist@example.com")
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "job-offer", "mode": "human-ai", "human_role": "recruiter"},
        headers=headers,
    )
    assert create_res.status_code == 201
    sess_id = create_res.json()["id"]

    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=headers)

    exact_user_input = "We are pleased to offer $115,000 with 3 remote days."
    turn_res = await client.post(
        f"/api/v1/negotiations/{sess_id}/human-turn",
        json={"message": exact_user_input, "offer": {"salary": "$115,000", "remoteDays": "3"}},
        headers=headers,
    )
    assert turn_res.status_code == 200
    turn_data = turn_res.json()
    assert turn_data["message"] is not None
    assert turn_data["message"]["is_user"] is False

    get_res = await client.get(f"/api/v1/negotiations/{sess_id}", headers=headers)
    msgs = get_res.json()["messages"]
    assert len(msgs) == 2
    assert msgs[0]["content"] == exact_user_input
    assert msgs[0]["is_user"] is True


@pytest.mark.asyncio
async def test_refresh_restores_waiting_for_human(client: AsyncClient):
    """Verify that GET /negotiations/{session_id} restores waiting_for_human status."""
    headers = await _get_auth_headers(client, "test_refresh_restore@example.com")
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "job-offer", "mode": "human-ai", "human_role": "recruiter"},
        headers=headers,
    )
    assert create_res.status_code == 201
    sess_id = create_res.json()["id"]

    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=headers)
    start_res = await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=headers)
    assert start_res.status_code == 200
    assert start_res.json()["status"] == "waiting_for_human"

    get_res = await client.get(f"/api/v1/negotiations/{sess_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["status"] == "waiting_for_human"
    assert get_res.json()["current_speaker"] == "Recruiter Agent"
