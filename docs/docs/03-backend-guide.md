# Backend Guide

## Entry Point

The FastAPI application starts in `backend/app/main.py`. It:

- Creates the FastAPI application.
- Configures API documentation under `/api/v1/docs` and `/api/v1/redoc`.
- Adds CORS middleware.
- Registers the API router under `/api/v1`.
- Creates missing database tables during startup.
- Seeds the preset scenarios.
- Exposes health endpoints.

Run the backend from the `backend/` directory with:

```powershell
python -m app.main
```

## Package Responsibilities

| Package | Responsibility |
|---|---|
| `app/api` | Router registration, request dependencies, and route handlers |
| `app/core` | Settings, database engine, security, and exceptions |
| `app/models` | SQLAlchemy persistence models |
| `app/schemas` | Pydantic request and response contracts |
| `app/services` | Workflow guards, setup behavior, seeding, and application services |
| `app/orchestration` | Turn coordination, runner behavior, and negotiation execution |
| `app/negotiation` | Decision logic, state transitions, validation, rules, and telemetry |
| `app/providers` | LLM provider abstraction, provider selection, and fallback |
| `app/agents` | Provider-specific agent clients such as Gemini |
| `app/prompts` | Prompt construction and strategy instructions |
| `app/reports` | Outcome report generation and analytics |

## Configuration

Settings are loaded by `app/core/config.py`. Important values include:

- `API_V1_STR`: API prefix, normally `/api/v1`.
- `DATABASE_URL`: async SQLite or PostgreSQL connection string.
- `SECRET_KEY`: backend signing/configuration secret.
- `GEMINI_API_KEY`: key for Gemini-backed decisions.
- Provider settings for Gemini, Groq, OpenRouter, and fallback behavior.
- Allowed frontend origins for CORS.

Use a backend `.env` file for local values. Do not commit secrets.

## Data Models

The central model relationships are:

```text
User
  -> NegotiationSession
      -> AgentConfiguration
          -> AgentGoal
          -> AgentConstraint
      -> NegotiationMessage
      -> LLMUsageRecord
      -> OutcomeReport

Scenario
  -> referenced by NegotiationSession
```

Sessions, messages, agent configurations, reports, and usage records are linked so a completed negotiation can be reopened and analyzed.

## Authentication

The frontend uses Supabase Auth. Backend dependencies read the bearer token, verify the user identity, and load or provision the local user profile used for ownership checks.

Protected route handlers should use the shared authentication dependency rather than trusting a user identifier supplied by the client.

## Database Lifecycle

The application currently performs startup table creation and compatibility column additions in `main.py`, while Alembic configuration and migrations also exist in the repository. For production deployment, treat migration history and startup compatibility logic as separate operational concerns and verify them against the target database.

## Backend Tests

Tests are in `backend/tests/` and cover authentication, scenarios, workflow guards, negotiation rules, provider failover, reports, telemetry, and frontend/backend synchronization. Run them with:

```powershell
cd backend
pytest -v
```
