# Supabase Environment Setup Guide — Free Tier

This guide walks through setting up a hosted **Supabase Free Project**, configuring environment variables, running database migrations with Alembic, and launching the backend.

---

## 1. Create Supabase Free Tier Project

1. Go to [https://supabase.com](https://supabase.com) and log in or create a free account.
2. Click **New Project** and select the **Free Plan** organization.
3. Enter Project Name: `multi-agent-negotiation`
4. Set a strong Database Password. (Save this password securely).
5. Select a region close to your primary users.
6. Click **Create new project**. Wait ~2 minutes for provision completion.

---

## 2. Obtain Supabase Project Keys & Database URL

In the Supabase Dashboard:

### A. API Keys & URL
Go to **Project Settings → API**:
- **Project URL**: `https://<project-ref>.supabase.co`
- **anon / public key**: `eyJhbGci...`
- **service_role key**: `eyJhbGci...` (Server-side ONLY - NEVER expose to browser)
- **JWT Secret**: `Project Settings → API → JWT Settings → JWT Secret`

### B. PostgreSQL Connection String
Go to **Project Settings → Database → Connection string**:
- Select **Transaction Pooler** (Port `6543`) or **Direct Connection** (Port `5432`).
- Format: `postgresql+asyncpg://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:6543/postgres`

---

## 3. Configure Local Backend `.env`

Copy `.env.example` to `.env` in the `backend/` directory:

```env
PROJECT_NAME="AI Multi-Agent Negotiation Simulation Platform"
API_V1_STR="/api/v1"
SECRET_KEY="super-secret-key-change-in-production-123456789"

# Supabase Configuration
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_ANON_KEY="<your-supabase-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<your-supabase-service-role-key>"
SUPABASE_JWT_SECRET="<your-supabase-jwt-secret>"

# Supabase PostgreSQL Connection URL
DATABASE_URL="postgresql+asyncpg://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:6543/postgres"

# LLM & CORS Configuration
GEMINI_API_KEY="<your-gemini-api-key>"
GEMINI_MODEL="gemini-1.5-pro"
ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"
```

---

## 4. Run Alembic Database Migrations

Apply Alembic migrations against Supabase PostgreSQL:

```bash
cd backend
alembic upgrade head
```

---

## 5. Launch FastAPI Backend

Start the FastAPI application server:

```bash
python -m app.main
```

The application automatically seeds the 3 preset scenarios (`vendor-pricing`, `job-offer`, `budget-allocation`) into Supabase PostgreSQL on startup.

Access Swagger API docs at: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
