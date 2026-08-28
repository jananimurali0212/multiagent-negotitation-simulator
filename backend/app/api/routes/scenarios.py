from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError
from app.models.scenario import Scenario
from app.schemas.scenario import ScenarioResponse
from app.services.seed_data import seed_scenarios

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


@router.get("", response_model=List[ScenarioResponse])
@router.get("/", response_model=List[ScenarioResponse])
async def list_scenarios(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scenario))
    scenarios = result.scalars().all()
    if not scenarios:
        await seed_scenarios(db)
        result = await db.execute(select(Scenario))
        scenarios = result.scalars().all()
    return scenarios


@router.get("/{scenario_id}", response_model=ScenarioResponse)
async def get_scenario(scenario_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scenario).where(Scenario.id == scenario_id))
    scenario = result.scalar_one_or_none()
    if not scenario:
        # Check if seed needed
        await seed_scenarios(db)
        result = await db.execute(select(Scenario).where(Scenario.id == scenario_id))
        scenario = result.scalar_one_or_none()
    if not scenario:
        raise ResourceNotFoundError("Scenario", scenario_id)
    return scenario
