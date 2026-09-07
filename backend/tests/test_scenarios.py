import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_scenarios(client: AsyncClient):
    res = await client.get("/api/v1/scenarios")
    assert res.status_code == 200
    scenarios = res.json()
    assert len(scenarios) == 3

    scenario_ids = [s["id"] for s in scenarios]
    assert "vendor-pricing" in scenario_ids
    assert "job-offer" in scenario_ids
    assert "budget-allocation" in scenario_ids


@pytest.mark.asyncio
async def test_get_scenario_by_id(client: AsyncClient):
    res = await client.get("/api/v1/scenarios/vendor-pricing")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == "vendor-pricing"
    assert data["agentCount"] == 2
