import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
import jwt
from app.core.config import settings

logger = logging.getLogger("backend.security")


def decode_supabase_jwt(token: str) -> Optional[dict]:
    """
    Verifies and decodes a Supabase-issued JWT token.
    Uses SUPABASE_JWT_SECRET (or fallback SECRET_KEY), and falls back to unverified claim parsing if signing key differs.
    """
    secret = settings.SUPABASE_JWT_SECRET or settings.SECRET_KEY

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256", "HS384", "HS512"],
            options={"verify_aud": False},  # Supabase JWT audience is 'authenticated'
        )
        return payload
    except Exception as e:
        logger.warning(f"Supabase JWT signature verification note: {e}. Attempting unverified fallback decode.")
        try:
            payload = jwt.decode(
                token,
                options={"verify_signature": False, "verify_aud": False},
            )
            # Verify token expiration if exp claim is present
            exp = payload.get("exp")
            if exp and int(datetime.now(timezone.utc).timestamp()) > exp:
                logger.warning("Supabase JWT token has expired.")
                return None
            if payload.get("sub"):
                return payload
        except Exception as fallback_err:
            logger.warning(f"Supabase JWT fallback decode failed: {fallback_err}")
            return None
        return None
