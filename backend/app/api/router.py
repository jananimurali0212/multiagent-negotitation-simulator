from fastapi import APIRouter
from app.api.routes import auth, scenarios, negotiations, arena, reports, dashboard

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(scenarios.router)
api_router.include_router(negotiations.router)
api_router.include_router(arena.router)
api_router.include_router(reports.router)
api_router.include_router(dashboard.router)
