import logging
import uuid
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.core.config import settings
from app.core.database import get_db
from app.core.exceptions import CustomHTTPException, UnauthorizedError
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse, Token
from app.api.dependencies import get_current_user
from app.core.security import hash_password, verify_password

logger = logging.getLogger("backend.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


def is_supabase_configured() -> bool:
    url = settings.SUPABASE_URL or ""
    anon_key = settings.SUPABASE_ANON_KEY or ""
    if not url or not anon_key:
        return False
    placeholders = ["your-project-ref", "your-supabase-project", "your-supabase-anon-key", "your-supabase-service-role-key"]
    if any(p in url for p in placeholders) or any(p in anon_key for p in placeholders):
        return False
    return True


def create_access_token(user_id: str, email: str, full_name: str | None = None) -> str:
    secret = settings.SUPABASE_JWT_SECRET or settings.SECRET_KEY
    token_payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=1),
        "aud": "authenticated",
        "role": "authenticated",
        "user_metadata": {"full_name": full_name or ""},
    }
    return jwt.encode(token_payload, secret, algorithm="HS256")


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    """Registers a new user with Supabase Auth or local authentication fallback."""
    if is_supabase_configured():
        supabase_auth_url = f"{settings.SUPABASE_URL}/auth/v1/signup"
        anon_key = settings.SUPABASE_ANON_KEY or settings.SUPABASE_SERVICE_ROLE_KEY
        headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "email": user_in.email,
            "password": user_in.password,
            "data": {"full_name": user_in.full_name},
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(supabase_auth_url, json=payload, headers=headers, timeout=10.0)
                if res.status_code in [200, 201]:
                    res_data = res.json()
                    access_token = res_data.get("access_token")
                    user_id = res_data.get("user", {}).get("id") if res_data.get("user") else None
                    if access_token and user_id:
                        result = await db.execute(select(User).where(User.id == user_id))
                        user = result.scalar_one_or_none()
                        if not user:
                            user = User(id=user_id, email=user_in.email, full_name=user_in.full_name)
                            db.add(user)
                            await db.commit()
                            await db.refresh(user)
                        return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))
                    elif user_id:
                        result = await db.execute(select(User).where(User.id == user_id))
                        user = result.scalar_one_or_none()
                        if not user:
                            user = User(id=user_id, email=user_in.email, full_name=user_in.full_name)
                            db.add(user)
                            await db.commit()
                            await db.refresh(user)
                        return Token(access_token="", token_type="bearer", user=UserResponse.model_validate(user))
                else:
                    try:
                        res_json = res.json()
                        err_msg = res_json.get("msg") or res_json.get("error_description") or "Signup failed"
                    except Exception:
                        err_msg = res.text or "Signup failed"
                    raise CustomHTTPException(status_code=400, detail=err_msg, code="SIGNUP_FAILED")
        except httpx.RequestError as e:
            logger.warning(f"Supabase Auth connection error: {e}")
            raise CustomHTTPException(status_code=503, detail="Unable to connect to Supabase authentication service.", code="NETWORK_ERROR")

    # Local fallback authentication
    result = await db.execute(select(User).where(func.lower(User.email) == func.lower(user_in.email)))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise CustomHTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
            code="EMAIL_ALREADY_REGISTERED",
        )

    user_id = str(uuid.uuid4())
    pwd_hash = hash_password(user_in.password)
    user = User(
        id=user_id,
        email=user_in.email,
        full_name=user_in.full_name,
        password_hash=pwd_hash,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(user.id, user.email, user.full_name)
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticates credentials against Supabase Auth or local authentication fallback."""
    if is_supabase_configured():
        supabase_auth_url = f"{settings.SUPABASE_URL}/auth/v1/token?grant_type=password"
        anon_key = settings.SUPABASE_ANON_KEY or settings.SUPABASE_SERVICE_ROLE_KEY
        headers = {
            "apikey": anon_key,
            "Authorization": f"Bearer {anon_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "email": credentials.email,
            "password": credentials.password,
        }
        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(supabase_auth_url, json=payload, headers=headers, timeout=10.0)
                if res.status_code == 200:
                    res_data = res.json()
                    access_token = res_data.get("access_token")
                    user_id = res_data.get("user", {}).get("id") if res_data.get("user") else None
                    if access_token and user_id:
                        result = await db.execute(select(User).where(User.id == user_id))
                        user = result.scalar_one_or_none()
                        if not user:
                            user = User(id=user_id, email=credentials.email)
                            db.add(user)
                            await db.commit()
                            await db.refresh(user)
                        return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))
                else:
                    try:
                        res_json = res.json()
                        err_desc = res_json.get("error_description") or res_json.get("error") or "Incorrect email or password."
                    except Exception:
                        err_desc = "Incorrect email or password."
                    raise CustomHTTPException(status_code=400, detail=err_desc, code="INVALID_CREDENTIALS")
        except httpx.RequestError as e:
            logger.warning(f"Supabase Auth login connection error: {e}")
            raise CustomHTTPException(status_code=503, detail="Unable to connect to authentication service.", code="NETWORK_ERROR")

    # Local fallback authentication
    result = await db.execute(select(User).where(func.lower(User.email) == func.lower(credentials.email)))
    user = result.scalar_one_or_none()
    if not user:
        raise CustomHTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password.",
            code="INVALID_CREDENTIALS",
        )

    if user.password_hash:
        if not verify_password(credentials.password, user.password_hash):
            raise CustomHTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Incorrect email or password.",
                code="INVALID_CREDENTIALS",
            )
    else:
        # If user has no password_hash stored yet, update it
        user.password_hash = hash_password(credentials.password)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(user.id, user.email, user.full_name)
    return Token(access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user))


@router.post("/token", response_model=Token)
async def login_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """OAuth2-compatible token endpoint for Swagger UI Authorization (application/x-www-form-urlencoded)."""
    credentials = UserLogin(email=form_data.username, password=form_data.password)
    return await login(credentials=credentials, db=db)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
