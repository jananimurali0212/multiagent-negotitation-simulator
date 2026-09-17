import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal, fallback_to_sqlite
from app.core.exceptions import CustomHTTPException
from app.api.router import api_router
from app.services.seed_data import seed_scenarios

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up backend application...")
    # Initialize database tables with graceful offline / DNS failure fallback
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as db_err:
        logger.warning(f"Database connection error on startup ({db_err}). Switching to local SQLite database.")
        fallback_to_sqlite()
        from app.core.database import engine as current_engine
        async with current_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    # Apply database column migrations safely per-statement
    is_postgres = "postgresql" in str(engine.url) or "postgres" in str(engine.url)
    migration_statements = [
        ("ALTER TABLE negotiation_sessions ADD COLUMN IF NOT EXISTS human_role VARCHAR(50)" if is_postgres else "ALTER TABLE negotiation_sessions ADD COLUMN human_role VARCHAR(50)"),
        ("ALTER TABLE negotiation_sessions ADD COLUMN IF NOT EXISTS scenario_data JSON" if is_postgres else "ALTER TABLE negotiation_sessions ADD COLUMN scenario_data JSON"),
        ("ALTER TABLE negotiation_sessions ADD COLUMN IF NOT EXISTS structured_events JSON" if is_postgres else "ALTER TABLE negotiation_sessions ADD COLUMN structured_events JSON"),
        ("ALTER TABLE negotiation_sessions ADD COLUMN IF NOT EXISTS deadlock_reason TEXT" if is_postgres else "ALTER TABLE negotiation_sessions ADD COLUMN deadlock_reason TEXT"),
        ("ALTER TABLE outcome_reports ADD COLUMN IF NOT EXISTS initial_data JSON" if is_postgres else "ALTER TABLE outcome_reports ADD COLUMN initial_data JSON"),
        ("ALTER TABLE outcome_reports ADD COLUMN IF NOT EXISTS participants JSON" if is_postgres else "ALTER TABLE outcome_reports ADD COLUMN participants JSON"),
        ("ALTER TABLE outcome_reports ADD COLUMN IF NOT EXISTS key_events JSON" if is_postgres else "ALTER TABLE outcome_reports ADD COLUMN key_events JSON"),
        ("ALTER TABLE outcome_reports ADD COLUMN IF NOT EXISTS unresolved_terms JSON" if is_postgres else "ALTER TABLE outcome_reports ADD COLUMN unresolved_terms JSON"),
        ("ALTER TABLE outcome_reports ADD COLUMN IF NOT EXISTS agent_analysis JSON" if is_postgres else "ALTER TABLE outcome_reports ADD COLUMN agent_analysis JSON"),
        ("ALTER TABLE outcome_reports ADD COLUMN IF NOT EXISTS overall_score INTEGER DEFAULT 85" if is_postgres else "ALTER TABLE outcome_reports ADD COLUMN overall_score INTEGER DEFAULT 85"),
        ("ALTER TABLE outcome_reports ADD COLUMN IF NOT EXISTS duration_seconds INTEGER DEFAULT 0" if is_postgres else "ALTER TABLE outcome_reports ADD COLUMN duration_seconds INTEGER DEFAULT 0"),
        ("ALTER TABLE outcome_reports ADD COLUMN IF NOT EXISTS scenario_analysis JSON" if is_postgres else "ALTER TABLE outcome_reports ADD COLUMN scenario_analysis JSON"),
        ("ALTER TABLE outcome_reports ADD COLUMN IF NOT EXISTS final_assessment TEXT" if is_postgres else "ALTER TABLE outcome_reports ADD COLUMN final_assessment TEXT"),
        ("ALTER TABLE negotiation_sessions ALTER COLUMN current_turn_index DROP NOT NULL" if is_postgres else "SELECT 1"),
        ("ALTER TABLE outcome_reports ALTER COLUMN analysis DROP NOT NULL" if is_postgres else "SELECT 1"),
    ]
    from app.core.database import engine as current_engine, AsyncSessionLocal as current_sessionmaker
    for stmt in migration_statements:
        try:
            async with current_engine.begin() as conn:
                await conn.execute(text(stmt))
        except Exception:
            pass
    
    # Seed preset scenarios
    async with current_sessionmaker() as session:
        await seed_scenarios(session)

    yield
    logger.info("Shutting down backend application...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan,
)

# Configure CORS
if settings.ALLOWED_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS if isinstance(settings.ALLOWED_ORIGINS, list) else [settings.ALLOWED_ORIGINS],
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# Exception handler
@app.exception_handler(CustomHTTPException)
async def custom_http_exception_handler(request: Request, exc: CustomHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
    )


# Mount API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


from fastapi.responses import JSONResponse, RedirectResponse

# Health check endpoint
@app.get("/docs", include_in_schema=False)
async def docs_redirect():
    return RedirectResponse(url=f"{settings.API_V1_STR}/docs")


@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "project": settings.PROJECT_NAME,
        "version": "1.0.0",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
