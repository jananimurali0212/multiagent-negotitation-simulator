from typing import AsyncGenerator
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_supabase_jwt
from app.core.exceptions import UnauthorizedError
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token", auto_error=False)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> User:
    if not token:
        raise UnauthorizedError("Authentication token missing")

    payload = decode_supabase_jwt(token)
    if not payload or "sub" not in payload:
        raise UnauthorizedError("Invalid or expired Supabase authentication token")

    user_id = payload["sub"]
    user_email = payload.get("email", f"{user_id}@supabase.user")
    user_metadata = payload.get("user_metadata", {})
    full_name = user_metadata.get("full_name") or user_metadata.get("name")

    result = await db.execute(select(User).where(or_(User.id == user_id, User.email == user_email)))
    user = result.scalar_one_or_none()

    if not user:
        # Auto-create application profile for newly authenticated Supabase Auth user
        try:
            user = User(
                id=user_id,
                email=user_email,
                full_name=full_name,
                is_active=True,
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
        except Exception:
            await db.rollback()
            result = await db.execute(select(User).where(or_(User.id == user_id, User.email == user_email)))
            user = result.scalar_one_or_none()
            if not user:
                raise UnauthorizedError("Failed to initialize user profile")

    if not user.is_active:
        raise UnauthorizedError("Inactive user account")

    return user
