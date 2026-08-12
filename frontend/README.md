# Multi-Agent Negotiation Simulator (Frontend)

An AI-powered multi-agent negotiation training and simulation platform where autonomous LLM-powered agents represent different stakeholders with unique goals, constraints, and personalities.

## Supported Modes & Scenarios

### Operational Modes
1. **Simulation Mode (AI vs AI)**: Autonomous agents negotiate multi-issue contracts with real-time telemetry, likelihood gauges, and deadlock resolution protocols.
2. **Practice Mode (Human vs AI)**: Interactive bargaining arena where the user negotiates against an AI counterpart with real-time tactical coaching tips and live scoring.

### Predefined Scenarios
1. **Vendor Pricing Negotiation**: Enterprise procurement between Vendor Agent (Seller) and Buyer Agent (Buyer).
2. **Job Offer Negotiation**: Salary, bonus, and hybrid role terms alignment between Recruiter Agent and Candidate Agent.
3. **Project Budget Allocation**: 3-party resource allocation among Project Manager, Finance Manager, and Department Head agents.

---

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Design System
- **State Management**: Zustand
- **Routing**: React Router DOM (v7)
- **Data Visualization**: Recharts
- **Icons**: Lucide React

---

## Getting Started

### Prerequisites
- Node.js 18+ (recommended 18.14 or later)
- npm (bundled with Node)

### Installation
```bash
git clone <repository-url>
cd <repository-folder>
npm install
```

### Run the Development Server
```bash
npm run dev
```
Open http://localhost:5173 in your browser.
```bash
npm run build
```

---

## Directory Structure
```
src/
├── components/
│   ├── common/       # Button, Card, Badge, Modal, PageHeader, LoadingSkeleton, ConfirmDialog
│   ├── layout/       # AppLayout, Sidebar, Topbar, PublicNavbar, MobileNav
│   ├── negotiation/  # ArenaHeader, AgentStatusCard, ConversationFeed, Metrics, Controls, Coaching
│   ├── reports/      # ConcessionChart, PerformanceTable, AgreementBreakdown, AccountAnalytics
│   ├── scenarios/    # ScenarioCard, ScenarioGrid
│   └── setup/        # SetupProgress, RoleCard, PersonalitySelector, GoalsList, ConstraintsList
├── data/             # Official scenario definitions, mock histories, and scripted dialogues
├── pages/            # 14 complete screens (Welcome, Auth, Dashboard, Setup, Arenas, Reports, Settings, Help)
├── routes/           # React Router route tree
├── services/         # API adapters & WebSocket simulation service (ready for FastAPI integration)
├── store/            # Zustand stores (auth, negotiationSetup, session, settings)
└── types/            # TypeScript interfaces (negotiation, scenario, report, auth)
```

---

## Connecting to Backend
The frontend is completely decoupled via the service layer in `src/services/`. When connecting to a FastAPI backend:
- Point `src/services/apiAdapter.ts` to your REST API endpoints.
- Update `src/services/negotiationSocket.ts` to connect to your real WebSocket server (`ws://localhost:8000/ws/negotiation/{sessionId}`).
