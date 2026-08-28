import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_signup_and_login(client: AsyncClient):
    # Signup
    res = await client.post(
        "/api/v1/auth/signup",
        json={"email": "alice@example.com", "password": "password123", "full_name": "Alice Smith"},
    )
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "alice@example.com"

    # Login via JSON
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "alice@example.com", "password": "password123"},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data

    # Login via OAuth2 Form (/auth/token)
    form_res = await client.post(
        "/api/v1/auth/token",
        data={"username": "alice@example.com", "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert form_res.status_code == 200
    form_token_data = form_res.json()
    assert "access_token" in form_token_data
    assert form_token_data["token_type"] == "bearer"

    # Get Me
    headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "alice@example.com"


@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    res = await client.get("/api/v1/auth/me")
    assert res.status_code == 401
