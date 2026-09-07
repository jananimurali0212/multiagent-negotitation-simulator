# API and Workflow

All application routes are mounted below `/api/v1`.

## Health and Documentation

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` or `/api/v1/health` | Health check |
| GET | `/api/v1/docs` | Swagger UI |
| GET | `/api/v1/redoc` | ReDoc |

## Authentication

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/signup` | Create a user through the auth flow |
| POST | `/auth/login` | Sign in |
| POST | `/auth/token` | Token-oriented login endpoint |
| GET | `/auth/me` | Read the current user |

## Scenarios

| Method | Path | Purpose |
|---|---|---|
| GET | `/scenarios` | List seeded scenarios |
| GET | `/scenarios/{scenario_id}` | Read one scenario |

## Negotiation Setup and Lifecycle

| Method | Path | Purpose |
|---|---|---|
| POST | `/negotiations` | Create a negotiation setup/session |
| GET | `/negotiations` | List the current user's sessions |
| GET | `/negotiations/{session_id}` | Read one session |
| PUT | `/negotiations/{session_id}/agents` | Save agent configuration |
| PUT | `/negotiations/{session_id}/goals-constraints` | Save goals and constraints |
| POST | `/negotiations/{session_id}/confirm-review` | Confirm the review step |
| POST | `/negotiations/{session_id}/start` | Validate setup and start execution |
| POST | `/negotiations/{session_id}/resume` | Resume a paused session |
| DELETE | `/negotiations/{session_id}` | Delete a session |

## Arena Execution

| Method | Path | Purpose |
|---|---|---|
| POST | `/negotiations/{session_id}/step` | Execute the next AI turn |
| POST | `/negotiations/{session_id}/human-turn` | Submit a human turn through the arena flow |
| POST | `/negotiations/{session_id}/user-turn` | Submit a user's negotiation message |
| POST | `/negotiations/{session_id}/stop` | Stop or terminate a session, depending on action |
| GET | `/negotiations/{session_id}/token-usage` | Read recorded token usage |

## Reports and Dashboard

The reports route group supports listing, fetching by report ID or session ID, generating, deleting, and bulk deleting reports. The dashboard route group exposes `GET /dashboard/summary` for aggregate user-facing metrics.

## Enforced Workflow

The backend expects the following progression:

| Step | Required state |
|---|---|
| Scenario | A valid seeded scenario is selected. |
| Mode | Mode is `ai-ai` or `human-ai`. |
| Agents | Required roles and agent fields are configured. |
| Goals and constraints | Each agent has the required goals and constraints. |
| Review | The user explicitly confirms the review. |
| Start | The backend validates all previous steps before starting. |
| Negotiation | Turns run until a terminal state. |
| Outcome | A report is generated and stored. |

The workflow service is the controlling backend boundary. A client cannot safely skip directly to execution by changing its URL or sending a partial payload.

## Typical Client Sequence

```text
POST /negotiations
PUT /negotiations/{id}/agents
PUT /negotiations/{id}/goals-constraints
POST /negotiations/{id}/confirm-review
POST /negotiations/{id}/start
POST /negotiations/{id}/step        # AI vs AI
POST /negotiations/{id}/user-turn   # Human vs AI when user speaks
GET  /reports/session/{id}
```

The exact request and response bodies are defined by the Pydantic schemas and are visible in the generated OpenAPI documentation.
