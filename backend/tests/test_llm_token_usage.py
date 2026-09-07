import pytest
from httpx import AsyncClient
from types import SimpleNamespace
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.services.llm_usage_service import LLMUsageService
from app.models.llm_usage import LLMUsageRecord
from app.models.negotiation import NegotiationSession
from app.orchestration.runner import stop_background_simulation


async def _get_auth_headers(client: AsyncClient, email: str = "token_user@example.com") -> dict:
    res = await client.post(
        "/api/v1/auth/signup",
        json={"email": email, "password": "Password123!", "name": "Token User"},
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


def test_gemini_usage_normalization():
    """Verify Gemini response metadata extraction for prompt, candidate, and total tokens."""
    # Test valid usage metadata object
    mock_resp = SimpleNamespace(
        usage_metadata=SimpleNamespace(
            prompt_token_count=120,
            candidates_token_count=45,
            total_token_count=165,
        )
    )
    result = LLMUsageService.normalize_gemini_usage(mock_resp)
    assert result["usage_available"] is True
    assert result["input_tokens"] == 120
    assert result["output_tokens"] == 45
    assert result["total_tokens"] == 165

    # Test dictionary variant
    mock_dict_resp = SimpleNamespace(
        usage_metadata={
            "prompt_token_count": 80,
            "candidates_token_count": 20,
            "total_token_count": 100,
        }
    )
    res_dict = LLMUsageService.normalize_gemini_usage(mock_dict_resp)
    assert res_dict["usage_available"] is True
    assert res_dict["input_tokens"] == 80
    assert res_dict["output_tokens"] == 20
    assert res_dict["total_tokens"] == 100

    # Test missing usage metadata returns nulls and usage_available=False
    mock_none_resp = SimpleNamespace(usage_metadata=None)
    res_none = LLMUsageService.normalize_gemini_usage(mock_none_resp)
    assert res_none["usage_available"] is False
    assert res_none["input_tokens"] is None
    assert res_none["output_tokens"] is None
    assert res_none["total_tokens"] is None


def test_openai_usage_normalization():
    """Verify OpenAI-compatible (Groq / OpenRouter) usage dict normalization."""
    usage_dict = {
        "prompt_tokens": 250,
        "completion_tokens": 75,
        "total_tokens": 325,
    }
    result = LLMUsageService.normalize_openai_usage(usage_dict)
    assert result["usage_available"] is True
    assert result["input_tokens"] == 250
    assert result["output_tokens"] == 75
    assert result["total_tokens"] == 325

    # Test None / empty usage
    res_empty = LLMUsageService.normalize_openai_usage(None)
    assert res_empty["usage_available"] is False
    assert res_empty["input_tokens"] is None
    assert res_empty["output_tokens"] is None


@pytest.mark.asyncio
async def test_record_usage_and_session_summary():
    """Verify recording token usage and aggregating session summary."""
    async with AsyncSessionLocal() as db:
        session = NegotiationSession(
            user_id="test-user-telemetry",
            scenario_id="vendor-pricing",
            mode="ai-ai",
            status="running",
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

        # Record Turn 0 - Agent A
        r1 = await LLMUsageService.record_usage(
            db=db,
            session_id=session.id,
            provider="gemini",
            model="gemini-2.5-flash",
            usage_data={"input_tokens": 100, "output_tokens": 50, "total_tokens": 150, "usage_available": True},
            agent_name="Vendor Agent",
            agent_role="Vendor Agent",
            round_number=1,
            turn_index=0,
        )
        # Record Turn 1 - Agent B
        r2 = await LLMUsageService.record_usage(
            db=db,
            session_id=session.id,
            provider="groq",
            model="llama-3.3-70b-versatile",
            usage_data={"input_tokens": 200, "output_tokens": 100, "total_tokens": 300, "usage_available": True},
            agent_name="Buyer Agent",
            agent_role="Buyer Agent",
            round_number=1,
            turn_index=1,
        )
        await db.commit()

        summary = await LLMUsageService.get_session_token_summary(session.id, db)
        assert summary["available"] is True
        assert summary["input_tokens"] == 300
        assert summary["output_tokens"] == 150
        assert summary["total_tokens"] == 450
        assert summary["llm_calls"] == 2
        assert len(summary["by_agent"]) == 2
        assert len(summary["by_round"]) == 1
        assert len(summary["by_model"]) == 2
        assert len(summary["turn_usage"]) == 2


@pytest.mark.asyncio
async def test_token_usage_endpoint_and_stop_actions(client: AsyncClient):
    """Verify GET /negotiations/{id}/token-usage and stop actions (discard, partial_report, pause)."""
    headers = await _get_auth_headers(client, "test_token_api@example.com")

    # Create session
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=headers,
    )
    assert create_res.status_code == 201
    sess_id = create_res.json()["id"]

    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=headers)
    stop_background_simulation(sess_id)

    # Execute one step
    step_res = await client.post(f"/api/v1/negotiations/{sess_id}/step", headers=headers)
    assert step_res.status_code == 200

    # Query token usage endpoint
    usage_res = await client.get(f"/api/v1/negotiations/{sess_id}/token-usage", headers=headers)
    assert usage_res.status_code == 200
    usage_data = usage_res.json()
    assert "llm_calls" in usage_data
    assert "turn_usage" in usage_data

    # Test Stop with pause
    pause_res = await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=pause", headers=headers)
    assert pause_res.status_code == 200
    assert pause_res.json()["status"] == "paused"

    # Test Stop with partial_report
    report_res = await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=partial_report", headers=headers)
    assert report_res.status_code == 200
    rep_data = report_res.json()
    assert rep_data["status"] == "terminated"
    assert rep_data["report_status"] == "generated"
    assert rep_data["report_id"] is not None

    # Fetch partial report
    fetched_rep = await client.get(f"/api/v1/reports/session/{sess_id}", headers=headers)
    assert fetched_rep.status_code == 200
    assert fetched_rep.json()["outcome"] == "Stopped by User"
    assert "token_usage" in fetched_rep.json()["analysis"]

    # Test Unauthorized user cannot access token usage
    headers2 = await _get_auth_headers(client, "other_token_user@example.com")
    unauth_res = await client.get(f"/api/v1/negotiations/{sess_id}/token-usage", headers=headers2)
    assert unauth_res.status_code == 403


@pytest.mark.asyncio
async def test_session_cascade_delete_and_report_delete_telemetry(client: AsyncClient):
    """Verify deleting a report keeps session telemetry intact, and deleting session cascades."""
    headers = await _get_auth_headers(client, "telemetry_del_user@example.com")

    # Create session
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=headers,
    )
    sess_id = create_res.json()["id"]
    await client.post(f"/api/v1/negotiations/{sess_id}/confirm-review", json={"confirm": True}, headers=headers)
    await client.post(f"/api/v1/negotiations/{sess_id}/start", headers=headers)
    stop_background_simulation(sess_id)

    # Step turns and terminate
    await client.post(f"/api/v1/negotiations/{sess_id}/step", headers=headers)
    stop_res = await client.post(f"/api/v1/negotiations/{sess_id}/stop?action=partial_report", headers=headers)
    rep_id = stop_res.json()["report_id"]

    # Verify telemetry exists in DB
    async with AsyncSessionLocal() as db:
        stmt = select(LLMUsageRecord).where(LLMUsageRecord.session_id == sess_id)
        res = await db.execute(stmt)
        records = res.scalars().all()
        assert len(records) >= 1

    # Delete Report only
    del_rep_res = await client.delete(f"/api/v1/reports/{rep_id}", headers=headers)
    assert del_rep_res.status_code == 200

    # Verify session telemetry STILL EXISTS in DB
    async with AsyncSessionLocal() as db:
        stmt = select(LLMUsageRecord).where(LLMUsageRecord.session_id == sess_id)
        res = await db.execute(stmt)
        records = res.scalars().all()
        assert len(records) >= 1

    # Delete session
    del_sess_res = await client.delete(f"/api/v1/negotiations/{sess_id}", headers=headers)
    assert del_sess_res.status_code == 200

    # Verify session telemetry is CASCADED and cleanly removed
    async with AsyncSessionLocal() as db:
        stmt = select(LLMUsageRecord).where(LLMUsageRecord.session_id == sess_id)
        res = await db.execute(stmt)
        records = res.scalars().all()
        assert len(records) == 0

