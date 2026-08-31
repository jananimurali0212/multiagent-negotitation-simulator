import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine, Base, AsyncSessionLocal
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
    # Initialize database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Ensure newly added columns exist in existing database tables
        migration_statements = [
            ("human_role", "VARCHAR(50)"),
            ("current_turn_index", "INTEGER DEFAULT 0"),
            ("current_speaker", "VARCHAR(100)"),
            ("latest_offer", "JSON" if conn.dialect.name == "sqlite" else "JSONB" if conn.dialect.name == "postgresql" else "JSON"),
            ("latest_offer_sender", "VARCHAR(100)"),
        ]
        for col_name, col_type in migration_statements:
            try:
                if conn.dialect.name == "sqlite":
                    await conn.execute(text(f"ALTER TABLE negotiation_sessions ADD COLUMN {col_name} {col_type}"))
                else:
                    await conn.execute(text(f"ALTER TABLE negotiation_sessions ADD COLUMN IF NOT EXISTS {col_name} {col_type}"))
            except Exception as e:
                logger.debug(f"Migration note for {col_name}: {e}")
    
    # Seed preset scenarios
    async with AsyncSessionLocal() as session:
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
