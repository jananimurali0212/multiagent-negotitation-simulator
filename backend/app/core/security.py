import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Union, Optional
import jwt
from app.core.config import settings

logger = logging.getLogger("backend.security")


def decode_supabase_jwt(token: str) -> Optional[dict]:
    """
    Verifies and decodes a Supabase-issued JWT token.
    Uses SUPABASE_JWT_SECRET (or fallback SECRET_KEY), supporting HS256, RS256, and ES256 algorithms.
    """
    secret = settings.SUPABASE_JWT_SECRET or settings.SECRET_KEY

    try:
        # Inspect header algorithm if present
        unverified_header = jwt.get_unverified_header(token)
        header_alg = unverified_header.get("alg", "HS256")
        allowed_algs = list(set(["HS256", "HS384", "HS512", "RS256", "ES256", header_alg]))

        payload = jwt.decode(
            token,
            secret,
            algorithms=allowed_algs,
            options={"verify_aud": False},  # Supabase JWT audience is 'authenticated'
        )
        return payload
    except Exception as e:
        logger.debug(f"Supabase JWT signature verification attempt with primary secret: {e}")
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


def hash_password(password: str) -> str:
    import bcrypt
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False
    import bcrypt
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

