import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_workflow_guards_prevent_premature_start(client: AsyncClient, auth_headers: dict):
    # Step 01 & 02: Create session draft
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    session_id = create_res.json()["id"]

    # Attempting to START before confirming review step MUST fail with HTTP 400 (Workflow Validation Guard)
    start_res = await client.post(
        f"/api/v1/negotiations/{session_id}/start",
        headers=auth_headers,
    )
    assert start_res.status_code == 400
    err_data = start_res.json()
    assert "Workflow guard failed" in err_data["detail"]
    assert "REVIEW" in err_data["detail"]

    # Confirm Review
    review_res = await client.post(
        f"/api/v1/negotiations/{session_id}/confirm-review",
        json={"confirm": True},
        headers=auth_headers,
    )
    assert review_res.status_code == 200

    # Now start MUST succeed
    start_success = await client.post(
        f"/api/v1/negotiations/{session_id}/start",
        headers=auth_headers,
    )
    assert start_success.status_code == 200
    assert start_success.json()["status"] == "running"
