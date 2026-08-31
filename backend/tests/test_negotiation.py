import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_negotiation_simulation_lifecycle(client: AsyncClient, auth_headers: dict):
    # 1. Create Session
    create_res = await client.post(
        "/api/v1/negotiations",
        json={"scenario_id": "vendor-pricing", "mode": "ai-ai"},
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    session_id = create_res.json()["id"]

    # 2. Confirm Review & Start
    await client.post(
        f"/api/v1/negotiations/{session_id}/confirm-review",
        json={"confirm": True},
        headers=auth_headers,
    )
    start_res = await client.post(
        f"/api/v1/negotiations/{session_id}/start",
        headers=auth_headers,
    )
    assert start_res.status_code == 200

    from app.orchestration.runner import stop_background_simulation
    stop_background_simulation(session_id)

    # 3. Step turn execution loop until finished or deadlock
    max_steps = 15
    completed = False
    for step in range(max_steps):
        step_res = await client.post(
            f"/api/v1/negotiations/{session_id}/step",
            headers=auth_headers,
        )
        assert step_res.status_code == 200
        step_data = step_res.json()
        if step_data["status"] in ["finished", "deadlock"]:
            completed = True
            break

    assert completed is True

    # 4. Verify outcome report generated and persistent
    report_res = await client.get(
        f"/api/v1/reports/session/{session_id}",
        headers=auth_headers,
    )
    assert report_res.status_code == 200
    report_data = report_res.json()
    assert report_data["session_id"] == session_id
    assert "metrics" in report_data
    assert "concessionControl" in report_data["metrics"]
