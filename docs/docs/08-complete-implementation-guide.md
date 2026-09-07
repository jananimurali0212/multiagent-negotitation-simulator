# Complete Implementation Guide

This document explains how the project is implemented from the first page load to the final negotiation report. It is intended for a developer who needs to understand the codebase, debug it, or add a feature.

## 1. What the Application Does

The application is a negotiation laboratory. A user selects a business scenario, configures the participants, provides their goals and constraints, and starts a negotiation. The participants can be autonomous AI agents or a human and an AI agent.

The application has two separate responsibilities:

1. **Conversation generation**: an LLM or deterministic fallback proposes what the current agent should say and offer.
2. **Business truth and safety**: deterministic Python code validates the proposal, applies state transitions, detects agreement/deadlock, and persists the result.

This separation is the most important design decision in the project. A model-generated response never gets to change the negotiation database directly.

## 2. Repository Map

```text
project-root/
|-- backend/
|   |-- app/
|   |   |-- main.py                 FastAPI app, startup, health, CORS
|   |   |-- api/
|   |   |   |-- router.py           API route registration
|   |   |   |-- dependencies.py     Authentication and shared dependencies
|   |   |   `-- routes/              Auth, scenarios, negotiations, arena, reports, dashboard
|   |   |-- core/
|   |   |   |-- config.py           Environment-backed settings
|   |   |   |-- database.py          Async SQLAlchemy engine and session
|   |   |   |-- security.py          Token and security helpers
|   |   |   `-- exceptions.py        Application/workflow exceptions
|   |   |-- models/                  SQLAlchemy database models
|   |   |-- schemas/                 Pydantic API and decision contracts
|   |   |-- services/                Setup, workflow, seeding, reports, usage
|   |   |-- orchestration/           Turn orchestration, graph nodes, runner
|   |   |-- negotiation/             Rules, validation, state, ZOPA, telemetry
|   |   |-- providers/               LLM provider abstraction and fallback
|   |   |-- agents/                  Provider-specific integrations
|   |   |-- prompts/                 Prompt construction
|   |   `-- reports/                 Report analysis and persistence
|   |-- migrations/                  Alembic configuration and migrations
|   |-- tests/                       Backend test suite
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |   |-- App.tsx                 Routes and route guards
|   |   |-- main.tsx                React bootstrap
|   |   |-- lib/api.ts              REST client and response types
|   |   |-- lib/supabase.ts         Supabase browser client
|   |   |-- store/useStore.ts       Zustand application state
|   |   |-- screens/                 Setup, arena, report, dashboard screens
|   |   `-- components/              Shared UI components
|   |-- package.json
|   `-- vite.config.ts
|-- docs/                           Project documentation
`-- README.md
```

## 3. Application Startup

The backend entry point is `backend/app/main.py`.

When the process starts:

1. `Settings` is loaded from environment variables and `backend/.env`.
2. A FastAPI application is created.
3. CORS is configured for the allowed frontend origins.
4. The router from `app.api.router` is mounted under `/api/v1`.
5. The lifespan function opens an async database connection.
6. SQLAlchemy creates missing tables.
7. Compatibility columns are added when required by the running database.
8. `seed_scenarios` inserts or updates the preset scenarios.
9. The server begins accepting requests.

The health endpoints are available at `/health` and `/api/v1/health`. Swagger documentation is available at `/api/v1/docs`.

The frontend entry point is `frontend/src/main.tsx`. It mounts the React tree, while `frontend/src/App.tsx` initializes authentication and selects the screen based on the current route and workflow state.

## 4. Configuration and External Services

`backend/app/core/config.py` defines the settings object. The important configuration groups are:

### Database

`DATABASE_URL` defaults to:

```text
sqlite+aiosqlite:///./negotiation.db
```

PostgreSQL URLs are converted to an async SQLAlchemy driver when necessary. The database abstraction is asynchronous, so route handlers and services use `AsyncSession` and `await` for queries and commits.

### Authentication

Supabase settings identify the Supabase project and JWT configuration. The frontend obtains a Supabase access token. The backend reads the bearer token through its authentication dependency and uses the authenticated identity when accessing user-owned sessions and reports.

### LLM providers

The provider settings define:

- Primary provider, normally Gemini.
- Gemini, Groq, and OpenRouter model/API-key settings.
- Rule-based fallback provider.
- Request timeout.
- Maximum retry count.

A missing or failing external provider should not be allowed to bypass validation. The provider manager returns a structured decision or falls back to a deterministic rule provider.

## 5. Database Design

The main persistence model is `NegotiationSession`.

```text
User
  |
  +-- NegotiationSession
        |
        +-- AgentConfiguration
        |     +-- AgentGoal
        |     `-- AgentConstraint
        |
        +-- NegotiationMessage
        +-- LLMUsageRecord
        `-- OutcomeReport

Scenario -------- NegotiationSession
```

### NegotiationSession

A session stores:

- Owner (`user_id`).
- Scenario and mode.
- Human role when using human-AI mode.
- Current workflow step.
- Review confirmation flag.
- Runtime status.
- Current round and turn index.
- Current speaker.
- Latest offer and its sender.
- Maximum round limit.
- Agreement flag and final terms.
- Creation and update timestamps.

The status represents the session lifecycle. Common values are `setup`, `running`, `waiting_for_human`, `paused`, `finished`, `deadlock`, and `terminated`.

### AgentConfiguration

An agent has a name, role, avatar, personality, experience level, negotiation parameters, goals, and constraints. The configuration is copied into the negotiation state used for prompts and validation.

### NegotiationMessage

Every accepted user or AI turn is stored as a message. It contains:

- Sender and role.
- Human-readable content.
- Optional rationale summary.
- Structured `offer_data` JSON.
- Round and turn index.
- User/AI flag.
- Timestamp.

The orchestrator sorts messages by round, turn index, and timestamp before calculating the next speaker. This avoids relying on database query order.

### LLMUsageRecord

AI turns record provider, model, token counts, agent, round, turn index, operation type, and status. This allows the report and dashboard to distinguish AI usage from human turns.

### OutcomeReport

A terminal session produces one report containing the outcome, final terms, summary, metrics, timeline, concession analysis, and recommendations. The report is linked to the session and can be reopened later.

## 6. Frontend Implementation

### Routing

`App.tsx` maps routes to screens. The important route groups are:

```text
/setup/scenario
/setup/mode
/setup/agents
/setup/goals-constraints
/setup/review
/arena/simulation
/arena/practice
/reports
/dashboard
```

The frontend route guard checks the first incomplete setup step. A user who opens a later URL directly is redirected or shown a guard instead of bypassing setup.

### Zustand state

`frontend/src/store/useStore.ts` holds the current browser workflow:

- Selected scenario.
- Selected mode and human role.
- Agent configuration.
- Scenario-specific context fields.
- Goals and constraints.
- Active session ID and status.
- Displayed messages and arena state.
- Reports and selected report.

This state makes the multi-screen setup feel continuous. It is not the final source of truth for execution. Once a session exists, the backend session and database determine whether a turn is valid.

### API client

`frontend/src/lib/api.ts` contains `apiRequest` and typed API groups. Before each request it:

1. Reads the current Supabase session.
2. Adds `Content-Type: application/json`.
3. Adds `Authorization: Bearer <access token>` when available.
4. Sends the request to `VITE_API_BASE_URL` or `/api/v1`.
5. Parses the JSON response.
6. Converts HTTP errors and network failures into readable JavaScript errors.

The API groups include scenario, negotiation, dashboard, report, and usage operations.

## 7. Complete Setup Workflow

### Step 1: Select a scenario

The user chooses one of the seeded scenarios. The frontend loads scenario metadata and default agent data from the scenarios API. The scenario determines the expected agent count and negotiable dimensions.

### Step 2: Select a mode

The user chooses `ai-ai` or `human-ai`. Human-AI mode also stores the human participant role.

### Step 3: Configure agents

The frontend edits agent name, role, personality, experience, goals, constraints, and scenario-specific parameters. It sends the configuration to:

```text
PUT /api/v1/negotiations/{session_id}/agents
```

### Step 4: Configure goals and constraints

The goals and constraints are sent separately through:

```text
PUT /api/v1/negotiations/{session_id}/goals-constraints
```

Goals describe desired outcomes. Constraints describe hard or limiting values such as maximum budget, minimum price, salary boundaries, payment terms, or allocation limits.

### Step 5: Review and confirm

The user explicitly confirms the configured negotiation. This sets `review_confirmed` on the session. It is a backend requirement, not only a UI checkbox.

### Step 6: Start

The start endpoint calls `WorkflowService.validate_readiness_to_start`. It checks:

- Scenario is supported.
- Mode is supported.
- Agent count is correct.
- Agent names are non-empty.
- Personalities are allowed.
- Every agent has at least one goal.
- Every agent has at least one constraint.
- Review was explicitly confirmed.

The current expected counts are:

| Scenario | Agents |
|---|---:|
| `vendor-pricing` | 2 |
| `job-offer` | 2 |
| `budget-allocation` | 3 |

If any check fails, the service raises a workflow error that identifies the incomplete step. If all checks pass, execution can begin.

## 8. AI vs AI Execution

For AI vs AI, the runner repeatedly invokes the next-step behavior. Each step eventually reaches `OrchestratorService.execute_turn`.

The orchestrator implementation is deliberately defensive:

1. It obtains a per-session async lock.
2. It loads the session with agents, goals, constraints, and messages.
3. On PostgreSQL it can use a row lock while loading the session.
4. It refuses to execute a new step for `finished`, `deadlock`, or `terminated` sessions.
5. It sorts the existing messages.
6. It calculates the current speaker.
7. It builds the negotiation state.
8. It runs the reasoning/evaluation pipeline.
9. It persists the new message and usage record.
10. It updates speaker, round, offer, and status.
11. It finalizes a report if the decision is terminal.

The basic speaker calculation is:

```text
turn_count = number of persisted messages
speaker_index = turn_count modulo number_of_agents
round = floor(turn_count / number_of_agents) + 1
```

This gives deterministic turn ordering. For three agents, turns rotate through index 0, 1, and 2.

## 9. Human vs AI Execution

In human-AI mode, the orchestrator identifies the configured human agent from `human_role` and the agent roles.

When the next speaker is the human and no user message is supplied:

1. The session is changed to `waiting_for_human`.
2. The current speaker is recorded.
3. No AI response is generated.
4. The response tells the frontend to wait for user input.

When the frontend submits a message:

1. The orchestrator verifies it is the human's turn.
2. A schema representation of the human agent is created.
3. A supplied offer is checked for structure.
4. The offer is checked against the human's constraints.
5. An `accept` message is checked against the current negotiation history.
6. Duplicate identical user messages are ignored for idempotency.
7. The valid user message is persisted.
8. The next AI turn is calculated and executed.

This means a human cannot submit an offer that is structurally invalid or outside the configured boundary merely by modifying the browser request.

## 10. Decision and Graph Pipeline

The implementation can use LangGraph when installed. The graph contains:

```text
agent_reasoning
  -> offer_evaluator
  -> end
```

If LangGraph is unavailable or cannot compile, the same two nodes are executed directly. This fallback keeps the core behavior usable without making graph compilation a single point of failure.

### 10.1 Build the reasoning state

The orchestrator creates a `NegotiationState` containing:

- Session and scenario identifiers.
- Mode and round information.
- Maximum rounds.
- Current speaker index/name.
- Agent configurations.
- Public message history.
- Latest offer.
- Agreement and deadlock flags.
- Current status.
- Latest decision.

### 10.2 Build the prompt

`agent_reasoning_node` selects the active agent and builds a scenario-specific system prompt. The prompt includes:

- Scenario objective.
- Agent name and role.
- Personality and experience.
- The active agent's goals and constraints.
- Negotiation parameters.
- Public transcript.
- Current round.

The prompt should not reveal another agent's private reservation values. The active agent receives its own private configuration plus information that is public in the transcript.

### 10.3 Generate a structured decision

`LLMProviderManager.generate_decision` calls the configured provider. The expected result is an `AgentDecision`, not arbitrary text. Typical fields include:

- Action.
- Message.
- Offer.
- Rationale.
- Concession percentage.
- Confidence.
- Provider and model.
- Token usage.

If a provider fails, retries are attempted according to configuration. The fallback provider can generate a deterministic decision.

### 10.4 Validate the decision

`DecisionValidator.validate_decision` receives the normalized negotiation state and raw decision. It checks schema correctness, action validity, offer structure, constraints, concession behavior, and other decision rules.

It returns a validation result, a validated decision, and concession information. The validated decision is the object used for state transition, not the raw provider output.

### 10.5 Apply the state transition

`StateTransitionEngine.apply_decision` updates the normalized state. Depending on the action, it can append a message, update the current offer, move the speaker/round state, or preserve the existing state when a decision is blocked.

If validation blocks the decision and no new message is produced, the orchestrator returns `validation_blocked` and does not persist a fake turn.

### 10.6 Evaluate agreement or deadlock

`offer_evaluator_node` calculates ZOPA information and calls `DecisionEngine.evaluate_agreement`. The evaluator considers:

- Latest validated decision.
- Previous messages.
- Current offer.
- ZOPA information.
- Current round.
- Maximum round ceiling.

It returns either:

- `running` when another turn is possible.
- `finished` when agreement is reached.
- `deadlock` when agreement is impossible or the safety condition is reached.

## 11. Persistence After an AI Turn

After the graph finishes, the orchestrator checks that a new message exists. It then creates a `NegotiationMessage` with:

- Sender.
- Role.
- Avatar.
- Content.
- Rationale summary.
- Offer data.
- Round and turn index.
- `is_user=False`.

It then records authoritative usage information through `LLMUsageService`. The session's latest offer is updated when the AI supplied one.

The next speaker and next round are calculated. In human-AI mode, the status becomes `waiting_for_human` when the next speaker is the human; otherwise it remains `running`.

The endpoint returns the new message, current status, next speaker, agreement flag, final terms, report information, and token usage for the frontend.

## 12. Terminal State and Report Lifecycle

The terminal handler is `finalize_negotiation_session`.

It:

1. Sets the final session status.
2. Sets `agreement_reached`.
3. Stores final terms only when appropriate.
4. Commits and refreshes the session.
5. Stops any background simulation runner.
6. Derives an outcome label such as `Agreement Reached`, `Deadlock`, or `Stopped by User`.
7. Calls `ReportGenerator.generate_and_save_report`.
8. Returns the persisted report.

The report generator can analyze the transcript to produce timeline events, offer evolution, concession data, metrics, and recommendations. The frontend can load the report by report ID or session ID after the arena ends.

## 13. API Request Sequence

A normal AI vs AI request sequence looks like this:

```text
POST   /api/v1/negotiations
PUT    /api/v1/negotiations/{id}/agents
PUT    /api/v1/negotiations/{id}/goals-constraints
POST   /api/v1/negotiations/{id}/confirm-review
POST   /api/v1/negotiations/{id}/start
POST   /api/v1/negotiations/{id}/step
POST   /api/v1/negotiations/{id}/step
POST   /api/v1/negotiations/{id}/step
...
GET    /api/v1/reports/session/{id}
```

A human-AI sequence pauses when the human must act:

```text
POST   /api/v1/negotiations/{id}/step
         -> status: waiting_for_human
POST   /api/v1/negotiations/{id}/human-turn
         -> user message is validated and the next AI turn is processed
```

## 14. Validation Layers

Validation is intentionally repeated at different boundaries:

### Frontend validation

Provides immediate field feedback and disables continuation buttons when required values are missing.

### Pydantic schema validation

Validates request and response shape, types, allowed enum values, and structured decision objects.

### Workflow validation

Checks that the entire setup is complete and steps occur in order.

### Negotiation rule validation

Checks offer semantics, agent constraints, acceptance conditions, concessions, and state transitions.

### Database ownership validation

Ensures authenticated users access only their own sessions, messages, and reports.

The frontend improves usability, but only backend validation protects the business rules.

## 15. Testing Strategy

The backend tests are organized around business boundaries rather than only individual functions. Important areas include:

- Authentication and authorization.
- Scenario retrieval.
- Workflow guard failures and successful readiness.
- Negotiation model behavior.
- Offer and constraint rules.
- Concession rules.
- ZOPA calculations.
- Decision validation.
- State transitions.
- Turn order and continuity.
- Human-AI interaction.
- Provider failover.
- Token usage.
- Deadlock behavior.
- Report generation and lifecycle.
- Telemetry.

The frontend has Vitest and Testing Library support for UI behavior. The production build also acts as a TypeScript integration check.

## 16. How to Add a New Scenario

A new scenario should be implemented across all layers rather than added only to the frontend.

1. Add the scenario definition and seed data.
2. Add its expected agent count to workflow validation.
3. Add scenario-specific dimensions and default agent configurations.
4. Add prompt objective/context handling.
5. Add offer structure rules.
6. Add constraint and acceptance rules.
7. Add ZOPA/evaluation behavior where the dimensions require it.
8. Add frontend scenario context and setup fields.
9. Add API/schema tests.
10. Add an end-to-end test that reaches a terminal report.

If a scenario is added only to frontend preset state, the UI may display it but the backend will reject it at start.

## 17. How to Add a New LLM Provider

The provider abstraction should hide provider-specific SDK details from the orchestrator.

1. Implement the provider's generation method.
2. Convert its response into the common `AgentDecision` schema.
3. Preserve provider, model, and token usage metadata.
4. Register the provider in `LLMProviderManager`.
5. Add settings and environment variables.
6. Define retry and failure behavior.
7. Add provider failover tests.

The orchestrator should continue to call one provider-manager interface regardless of which provider is active.

## 18. Important Current-State Notes

These points help prevent confusion between planning documents and active code:

- The active execution path is REST-based. The current route surface does not provide the planned WebSocket negotiation stream.
- AI vs AI execution uses an in-process asynchronous runner and step endpoint.
- The backend workflow currently accepts three preset scenario IDs.
- The default local database is SQLite through `aiosqlite`; PostgreSQL is supported by configuration.
- Startup creates tables and also contains compatibility column logic, while Alembic files remain available for migration management.
- The frontend package declares React 19, even though older documentation may mention React 18.
- Report and dashboard capabilities are backed by API clients, but some historical audit notes identify frontend fallback/static areas that should be checked before treating every screen as fully live.

## 19. Recommended Debugging Order

When a negotiation does not work, debug from the outside inward:

1. Call `/health`.
2. Open `/api/v1/docs` and confirm the endpoint contract.
3. Inspect the browser network request and authorization header.
4. Read the session status with `GET /negotiations/{id}`.
5. Check which workflow requirement failed.
6. Inspect the latest persisted message and offer.
7. Check provider logs and token usage.
8. Run the narrowest related backend test.
9. Only then inspect the frontend display state.

This order distinguishes connection problems, workflow problems, rule rejection, provider failures, persistence failures, and rendering problems.
