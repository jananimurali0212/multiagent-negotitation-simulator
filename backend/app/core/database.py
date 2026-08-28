import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

logger = logging.getLogger("backend.database")

database_url = settings.DATABASE_URL

# Fail fast if database URL is missing or unconfigured
if not database_url or not database_url.strip():
    raise RuntimeError(
        "DATABASE_URL environment variable is not configured. "
        "A valid Supabase PostgreSQL connection string is required."
    )

# Format PostgreSQL async driver prefix for SQLAlchemy + asyncpg
if database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

is_sqlite = "sqlite" in database_url

connect_args = {}
if not is_sqlite:
    # Disable prepared statement caching for PgBouncer / Supabase connection poolers
    connect_args = {
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    }

engine = create_async_engine(
    database_url,
    echo=False,
    future=True,
    pool_pre_ping=True if not is_sqlite else False,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
