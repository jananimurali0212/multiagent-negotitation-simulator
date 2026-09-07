# Backend Implementation Plan
## AI-Driven Multi-Agent Negotiation Training and Simulation Platform

---

### 1. Documented Architecture Summary

Based on the primary source of truth documentation (*Technical Specifications Document 1*, *Software Design Document / Milestone 1*, and *Architectures and Diagrams*):

The backend architecture is built as a modular, event-driven, multi-agent AI system supporting two negotiation execution modes (**AI vs AI Simulation Mode** and **Human vs AI Practice Mode**) across three fixed enterprise scenarios (**Vendor Pricing Negotiation**, **Job Offer Negotiation**, and **Project Budget Allocation**).

#### Core Component Responsibilities:
- **Authentication & User Management**: JWT-based stateless authentication with secure password hashing (`bcrypt`/`passlib`) protecting user-scoped data.
- **Scenario Management**: Seeded/reference templates for the 3 pre-built scenarios with fixed roles, negotiation dimensions, default goal/constraint definitions, and participant counts.
- **Workflow Engine & Validation**: Strict 8-step state validation enforcing sequential progression (**Scenario → Mode → Agent Configuration → Goals & Constraints → Review & Confirm → Start Negotiation → Negotiation Execution → Outcome / Report**). Prevents manual API bypass.
- **Orchestrator Agent**: Dynamic turn-taking, speaker selection, conversation history broadcast, and execution flow management. Governed by **Dynamic Round Control** with a **System Safety Ceiling** of 20 rounds (40 turns).
- **Decision Engine Pipeline**: Structured 4-stage pipeline for turn processing:
  1. *Offer Evaluation*
  2. *Concession Strategy* (Aggressive, Collaborative, Risk-Averse)
  3. *Counteroffer Logic*
  4. *Acceptance & Agreement Detection*
- **Deadlock Engine**: Detects stalled negotiations (no progress, repeated offers, constraint violations) and executes deadlock resolution algorithms.
- **Agent Reasoning & LLM Layer**: Gemini LLM integration utilizing Pydantic structured outputs (`AgentDecision`, `OfferPayload`, `EvaluationResult`) to guarantee schema compliance and zero free-text parsing failures.
- **Report & Outcome Engine**: Persistent session analytics, concession trend tracking, argument quality scoring, and downloadable/reopenable report generation.

---

### 2. Technology Stack & Dependencies

- **Language**: Python 3.12+
- **Framework**: FastAPI (Async API development, automatic OpenAPI docs)
- **Data Validation & Schemas**: Pydantic v2
- **Database & ORM**: PostgreSQL with SQLAlchemy 2.0 (Async engine)
- **Migrations**: Alembic
- **Security & Auth**: PyJWT, passlib[bcrypt], python-multipart
- **LLM / AI Layer**: Google Gemini API (`google-genai` / `google-generativeai`) with structured JSON mode
- **State Management & Orchestration**: LangGraph / custom state graph orchestration pattern
- **Real-Time Streaming**: WebSockets & Server-Sent Events (FastAPI `WebSocket` / `EventSourceResponse`)
- **Testing**: `pytest`, `pytest-asyncio`, `httpx` (FastAPI TestClient)
- **Configuration**: `pydantic-settings` (.env parsing)

---

### 3. Database Entities & Schema Design

The PostgreSQL database (managed via SQLAlchemy 2.0 and Alembic migrations) contains the following core tables:

```
+-------------------+        +---------------------------+        +--------------------------+
|       users       |        |    negotiation_sessions   |        |   agent_configurations   |
+-------------------+        +---------------------------+        +--------------------------+
| id (UUID, PK)     |<-------| id (UUID, PK)             |<-------| id (UUID, PK)            |
| email (UQ)        |        | user_id (FK -> users.id)  |        | session_id (FK)          |
| password_hash     |        | scenario_id (VARCHAR)     |        | agent_template_id        |
| full_name         |        | mode ('ai-ai'|'human-ai') |        | role, name, personality  |
| created_at        |        | current_step (VARCHAR)    |        | experience, avatar       |
+-------------------+        | review_confirmed (BOOL)   |        +--------------------------+
                             | status (VARCHAR)          |                    |
                             | current_round (INT)       |                    v
                             | agreement_reached (BOOL)  |        +--------------------------+
                             | created_at, updated_at    |        |  agent_goals_constraints |
                             +---------------------------+        +--------------------------+
                                       |      |                   | id (UUID, PK)            |
                                       |      |                   | agent_config_id (FK)     |
                                       |      |                   | type ('goal'|'constraint')|
                                       |      v                   | text_or_label, value     |
                                       |  +---------------------+ | priority / constraint_key|
                                       |  | negotiation_messages| +--------------------------+
                                       |  +---------------------+
                                       |  | id (UUID, PK)       |
                                       |  | session_id (FK)     |
                                       |  | sender, role, round |
                                       |  | content, rationale  |
                                       |  | offer_json (JSONB)  |
                                       |  | is_user (BOOL)      |
                                       |  | timestamp           |
                                       |  +---------------------+
                                       v
                             +--------------------+
                             | outcome_reports    |
                             +--------------------+
                             | id (UUID, PK)      |
                             | session_id (FK,UQ) |
                             | user_id (FK)       |
                             | outcome (VARCHAR)  |
                             | final_terms (JSONB)|
                             | metrics (JSONB)    |
                             | summary (TEXT)     |
                             | recommendations    |
                             | created_at         |
                             +--------------------+
```

---

### 4. API Specification & Route Groups

#### **Auth Routes (`/api/v1/auth`)**
- `POST /signup` — Register new user
- `POST /login` — Authenticate user & issue JWT token
- `GET /me` — Get authenticated user profile

#### **Scenario Routes (`/api/v1/scenarios`)**
- `GET /` — List pre-built scenario templates (`vendor-pricing`, `job-offer`, `budget-allocation`)
- `GET /{scenario_id}` — Get specific scenario template details and default agents

#### **Negotiation Setup & Workflow Routes (`/api/v1/negotiations`)**
- `POST /` — Create a new negotiation setup draft (Step 01 & 02: scenario & mode)
- `GET /{session_id}` — Get full negotiation setup/session state
- `PUT /{session_id}/agents` — Save configured agents & personalities (Step 03)
- `PUT /{session_id}/goals-constraints` — Save goals & constraints (Step 04)
- `POST /{session_id}/confirm-review` — Confirm review step (Step 05)
- `POST /{session_id}/start` — Validate workflow completion and start negotiation (Step 06)
- `POST /{session_id}/stop` — Manually stop negotiation

#### **Negotiation Execution Routes (`/api/v1/negotiations/{session_id}`)**
- `POST /step` — Execute next AI vs AI turn (for step-by-step or auto-run loop)
- `POST /user-message` — Submit user offer/counteroffer in Human vs AI practice mode
- `WS /ws` — Real-time WebSocket connection for streaming turn-by-turn messages & live metrics

#### **Reports & History Routes (`/api/v1/reports`)**
- `GET /` — List all completed negotiation reports for authenticated user
- `GET /{report_id}` — Get full detailed outcome report by ID
- `GET /session/{session_id}` — Get report by session ID

---

### 5. Multi-Agent & Orchestrator Architecture

```
                                  +-----------------------+
                                  |  Orchestrator Agent   |
                                  +-----------------------+
                                              |
                     +------------------------+------------------------+
                     |                        |                        |
                     v                        v                        v
        +-------------------------+ +-------------------+ +-------------------------+
        |   LangGraph / Shared    | |  Decision Engine  | |   Gemini LLM Provider   |
        |      State Graph        | |     Pipeline      | |   (Structured Output)   |
        +-------------------------+ +-------------------+ +-------------------------+
        | - Negotiation State     | | 1. Offer Eval     | | - Pydantic JSON schema  |
        | - Conversation History  | | 2. Concession     | | - Role + Personality    |
        | - Private Boundaries    | | 3. Counteroffer   | | - Goals + Constraints   |
        | - Current Turn Index    | | 4. Acceptance Check| | - Public History Only   |
        +-------------------------+ +-------------------+ +-------------------------+
```

- **Information Boundaries**: Agents only see public message history and their OWN private goals/constraints. Private boundaries of opposing agents are NEVER leaked into LLM context prompts.
- **Dynamic Round Control**: Evaluated after every turn. Negotiation stops when:
  - Acceptance condition met (`Agreement Reached`)
  - Unresolvable conflict / repeated offers (`Deadlock Detected → Resolution Failed`)
  - User stops session (`Stopped by User`)
  - Ceiling reached (20 rounds / 40 turns) (`Safety Limit Reached`)

---

### 6. Strict Workflow Backend Validation Engine

The backend enforces the strict 8-step workflow regardless of client implementation:

| Step | Requirements for Transition |
|---|---|
| **01 Scenario** | Valid `scenario_id` selected (`vendor-pricing`, `job-offer`, `budget-allocation`) |
| **02 Mode** | Valid `mode` selected (`ai-ai` or `human-ai`) |
| **03 Agents** | All scenario-required agent roles configured with name, personality (`Aggressive`, `Collaborative`, `Risk-Averse`), experience level |
| **04 Goals & Constraints** | Each agent must have non-empty goals and required quantitative constraints |
| **05 Review & Confirm** | User explicitly calls confirm review endpoint (`review_confirmed = True`) |
| **06 Start Negotiation** | Backend validates steps 1–5 complete. If any check fails, returns `400 Bad Request` with exact missing requirements |
| **07 Negotiation** | Running loop (AI vs AI turns or Human turns) |
| **08 Outcome Report** | Terminal state reached; outcome report generated and stored |

---

### 7. Implementation Order (Phase by Phase)

1. **Phase 1**: Plan & Document Architecture (*This plan & `BACKEND_IMPLEMENTATION_PLAN.md`*)
2. **Phase 2**: FastAPI Project Structure & Configuration (`app/core`, `config.py`, database setup, CORS, health check)
3. **Phase 3**: Database Entities, Models & Alembic Migrations (`app/models`, seed scenarios)
4. **Phase 4**: JWT Authentication & User Routes (`app/api/routes/auth.py`, `security.py`)
5. **Phase 5**: Scenario & Setup Workflow APIs (`app/api/routes/scenarios.py`, `negotiations.py` setup routes, strict validation guards)
6. **Phase 6**: Negotiation Session Management & Database Persistence
7. **Phase 7**: Orchestrator, State Machine & Decision Engine Pipeline (`app/orchestration/`, `app/negotiation/`)
8. **Phase 8**: Gemini LLM Integration & Reusable Prompt Templates (`app/agents/`, `app/prompts/`)
9. **Phase 9**: Agreement Detection, Deadlock Detection & Resolution Flow
10. **Phase 10**: Report Generation Engine & Persistent Reports API (`app/reports/`, `app/api/routes/reports.py`)
11. **Phase 11**: Frontend Integration & Verification (Connecting frontend Zustand store to backend REST/WS APIs)

---

### 8. Verification & Testing Plan

- **Automated Unit & Integration Tests (`pytest`)**:
  - `test_auth.py`: Signup, login, JWT verification, invalid credentials, protected routes.
  - `test_scenarios.py`: Retrieval of 3 preset scenarios.
  - `test_workflow_guards.py`: Attempting to start negotiation out-of-order fails with proper HTTP 400 error codes.
  - `test_orchestrator.py`: State transitions, turn ordering, safety ceiling enforcement.
  - `test_deadlock.py`: Verification of deadlock detection and resolution rules.
  - `test_reports.py`: End-to-end negotiation outcome generation and persistence retrieval.
- **Manual End-to-End Verification**:
  - Run full AI vs AI negotiation simulation for Vendor Pricing scenario.
  - Run Human vs AI practice mode.
  - Reopen stored outcome reports.
