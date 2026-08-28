# Backend Service — AI-Driven Multi-Agent Negotiation Simulation Platform

FastAPI & Async SQLAlchemy backend implementation for multi-agent enterprise negotiation simulations powered by Google Gemini LLM and structured Pydantic outputs.

---

## Technical Features

1. **FastAPI & Async SQLAlchemy 2.0**: High-performance RESTful APIs with PostgreSQL support (and SQLite async fallback for local dev).
2. **JWT Authentication & Passlib/Bcrypt**: Secure user authentication with password hashing.
3. **Strict 8-Step Workflow Validation Engine**: Server-enforced workflow progression (**Scenario → Mode → Agent Configuration → Goals & Constraints → Review & Confirm → Start Negotiation → Negotiation Execution → Outcome / Report**). Prevents manual API bypasses.
4. **Three Preset Scenarios**: Pre-loaded templates for:
   - `vendor-pricing` (Vendor Pricing Negotiation - Buyer vs Vendor, 2 agents)
   - `job-offer` (Job Offer Negotiation - Recruiter vs Candidate, 2 agents)
   - `budget-allocation` (Project Budget Allocation - Dept Head vs Project Manager vs Finance Manager, 3 agents)
5. **Dynamic Round Control**: Dynamic turn-taking governed by Orchestrator Agent up to a **System Safety Ceiling of 20 rounds (40 turns)**.
6. **Gemini LLM Provider with Structured Outputs**: Integrates with Google Gemini API using Pydantic JSON response schemas (`AgentDecision`) with personality-driven rule fallbacks.
7. **Persistent Reports & History**: Outcome analytics, concession metrics, and persistent report storage.

---

## Local Setup & Quick Start

### 1. Environment Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional)
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your `GEMINI_API_KEY` in `.env` if testing live LLM responses:
```env
GEMINI_API_KEY="your_actual_gemini_api_key_here"
```

### 3. Run FastAPI Application

```bash
python -m app.main
# or using uvicorn:
uvicorn app.main:app --reload --port 8000
```

FastAPI OpenAPI Documentation will be available at:
- **Swagger UI**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **ReDoc**: [http://localhost:8000/api/v1/redoc](http://localhost:8000/api/v1/redoc)

---

## Database Migrations (Alembic)

```bash
# Generate migration
alembic revision --autogenerate -m "Initial schema"

# Apply migration
alembic upgrade head
```

---

## Running Test Suite

Run full automated tests using `pytest`:

```bash
pytest -v
```

Includes test suites for:
- Authentication & JWT security (`tests/test_auth.py`)
- Scenario templates (`tests/test_scenarios.py`)
- Strict 8-Step Workflow Guards (`tests/test_workflow_guards.py`)
- Negotiation simulation lifecycle (`tests/test_negotiation.py`)
