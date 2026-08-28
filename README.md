# Multi-Agent Negotiation Simulation Platform

An enterprise-grade platform for simulating, practicing, and analyzing complex multi-party business negotiations powered by **Google Gemini LLM** and a **deterministic multi-agent decision engine**.

---

## 🌟 Overview

The **Multi-Agent Negotiation Simulation Platform** enables organizations, executives, and individuals to simulate high-stakes negotiation scenarios. Users can run autonomous **AI vs AI Simulations** to explore strategic outcomes or participate in **Human vs AI Practice Arenas** to hone real-world negotiation skills.

The system features server-enforced workflow progression, dynamic ZOPA (Zone of Possible Agreement) calculation, concession strategies, automated deadlock detection, live telemetry streams, and post-negotiation analytics reports.

---

## ✨ Key Features

- 🤖 **Dual Simulation Modes**:
  - **AI vs AI (Simulation Mode)**: Full autonomous negotiation between multiple AI agents with distinct personalities, goals, and secret reservation prices.
  - **Human vs AI (Practice Arena)**: Interactive negotiation where a human user negotiates live against an AI agent.
- 📋 **Preset & Custom Scenarios**:
  - **Vendor Pricing**: B2B software procurement negotiation (Buyer vs Vendor).
  - **Job Offer**: Executive compensation & perks negotiation (Recruiter vs Candidate).
  - **Project Budget Allocation**: Multi-party departmental resource allocation (Dept Head vs Project Manager vs Finance Manager).
  - **Custom Scenarios**: Full flexibility to define custom parameters, agent personas, and financial bounds.
- 🧠 **Deterministic & LLM Decision Engine**:
  - Structured output enforcement via Pydantic schemas (`AgentDecision`).
  - Zone of Possible Agreement (ZOPA) analysis & concession curve modeling.
  - Rule-based constraint validation and anti-hallucination guards.
  - Automatic deadlock detection and dynamic round safety limits (up to 20 rounds / 40 turns).
- 🛡️ **Server-Enforced 8-Step Workflow**:
  - Enforces strict sequential progression: **Scenario Selection → Mode Selection → Agent Configuration → Goals & Constraints → Review & Confirm → Start Negotiation → Live Execution → Outcome Report**.
- 📊 **Real-Time Telemetry & Reports**:
  - Live turn-by-turn negotiation stream, concession step tracking, and sentiment trends.
  - Comprehensive post-negotiation analytics: Win-Win scoring, joint surplus distribution, concession timelines, and downloadable executive summaries.

---

## 🏛️ System Architecture

```
                                  +---------------------------------+
                                  |     React + TypeScript Frontend |
                                  |     (Vite + Tailwind + Zustand) |
                                  +----------------+----------------+
                                                   |
                                                   | REST APIs / WebSockets
                                                   v
+--------------------------------------------------+--------------------------------------------------+
|                                    FastAPI Backend Engine                                           |
|                                                                                                     |
|  +--------------------------+  +--------------------------+  +-----------------------------------+  |
|  |   8-Step Workflow Guard  |  |  State Machine & ZOPA    |  |  Orchestrator & Decision Engine   |  |
|  +-------------+------------+  +------------+-------------+  +-----------------+-----------------+  |
|                |                            |                                    |                  |
+----------------|----------------------------|------------------------------------|------------------+
                 |                            |                                    |
                 v                            v                                    v
   +---------------------------+  +-----------------------+           +--------------------------+
   |   PostgreSQL / Supabase   |  |   Concession Rules    |           |   Google Gemini LLM API  |
   |   (Async SQLAlchemy 2.0)  |  |  & Deadlock Engine    |           |   (Structured Outputs)   |
   +---------------------------+  +-----------------------+           +--------------------------+
```

Architecture and UML diagrams can be viewed in the [`Architectures and diagrams/`](file:///Architectures%20and%20diagrams/) directory:
- [High Level Architecture](file:///Architectures%20and%20diagrams/High%20level%20architecture.png)
- [Orchestration Flow](file:///Architectures%20and%20diagrams/Orcherstation%20Flow.png)
- [State Diagram](file:///Architectures%20and%20diagrams/State%20Diagram.png)
- [AI Agent Architecture](file:///Architectures%20and%20diagrams/Ai%20agent%20archtecture.png)

---

## 📁 Repository Structure

```
├── backend/                        # FastAPI Python Backend
│   ├── app/
│   │   ├── agents/                 # LLM Client Integrations (Gemini API)
│   │   ├── api/                    # REST API Routes & Dependencies
│   │   ├── core/                   # Config, Database, Security & Exceptions
│   │   ├── models/                 # SQLAlchemy DB Models
│   │   ├── negotiation/            # Decision Engine, ZOPA, Rules & State Machine
│   │   ├── orchestration/          # Multi-Agent Round & Turn Orchestrator
│   │   ├── prompts/                # Prompt Templates & Strategy Library
│   │   ├── providers/              # Provider Manager & Fallback Providers
│   │   ├── reports/                # Report Generator & Analytics
│   │   ├── schemas/                # Pydantic Request/Response Schemas
│   │   └── services/               # Workflow Guards & Business Services
│   ├── migrations/                 # Alembic Database Migrations
│   ├── tests/                      # Automated Pytest Test Suite
│   ├── alembic.ini                 # Alembic Configuration
│   └── requirements.txt            # Python Dependencies
├── frontend/                       # React + TypeScript Frontend
│   ├── public/                     # Static Assets & Icons
│   ├── src/
│   │   ├── components/             # Reusable UI Components & Navigation Layouts
│   │   ├── lib/                    # API Clients & Supabase Integration
│   │   ├── screens/                # Workflow & Arena Screens
│   │   ├── store/                  # Zustand Global State Management
│   │   ├── App.tsx                 # Main Application & Router
│   │   └── index.css               # Tailwind & Global Styles
│   ├── package.json                # Frontend Dependencies & Scripts
│   └── vite.config.ts              # Vite Bundler Configuration
├── Architectures and diagrams/     # PNG Architecture & Sequence Diagrams
└── README.md                       # Project Documentation
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, Zustand, Lucide Icons |
| **Backend** | Python 3.10+, FastAPI, Async SQLAlchemy 2.0, Pydantic v2, Alembic |
| **AI / LLM** | Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-pro`), Structured JSON Schemas |
| **Database** | PostgreSQL / Supabase (with SQLite Async fallback for local dev) |
| **Authentication** | JWT (JSON Web Tokens), Passlib / Bcrypt |
| **Testing** | Pytest, Asyncio Pytest, HTTPX |

---

## 🚀 Quick Start Guide

### Prerequisites

- **Python**: `v3.10` or higher
- **Node.js**: `v18.0` or higher
- **Google Gemini API Key**: [Get a Gemini API key](https://aistudio.google.com/)

---

### 1. Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file inside the `backend/` folder (or copy `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Set your `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   SECRET_KEY="your-secret-jwt-key"
   DATABASE_URL="sqlite+aiosqlite:///./sql_app.db"
   ```

5. **Run database migrations**:
   ```bash
   alembic upgrade head
   ```

6. **Start the backend server**:
   ```bash
   python -m app.main
   ```
   *The server will start at `http://localhost:8000`.*  
   - Interactive API Docs (Swagger): `http://localhost:8000/api/v1/docs`
   - ReDoc: `http://localhost:8000/api/v1/redoc`

---

### 2. Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   *The frontend application will be running at `http://localhost:5173`.*

---

## 🧪 Automated Testing

The backend includes a comprehensive automated test suite powered by `pytest`.

```bash
cd backend
pytest -v
```

### Key Test Coverage
- `tests/test_auth.py`: Authentication, user registration, JWT generation & password hashing.
- `tests/test_workflow_guards.py`: Server-side enforcement of the 8-step workflow.
- `tests/test_scenarios.py`: Validation of pre-configured negotiation scenarios.
- `tests/test_zopa_phase3d.py`: Zone of Possible Agreement calculation logic.
- `tests/test_concession_rules_phase3c.py`: Concession curve & step rules.
- `tests/test_decision_validator_phase3g.py`: Decision validator & LLM output sanitization.
- `tests/test_negotiation.py`: Full negotiation simulation end-to-end lifecycle.

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini API Key | *(Required for live LLM response)* |
| `DATABASE_URL` | Async Database connection string | `sqlite+aiosqlite:///./sql_app.db` |
| `SECRET_KEY` | Secret key for signing JWT tokens | `super-secret-jwt-key` |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token expiration time | `60` |
| `PROJECT_NAME` | API Application Name | `Multi-Agent Negotiation Simulator` |

---

## 📄 License

This project is licensed under the **MIT License**.
