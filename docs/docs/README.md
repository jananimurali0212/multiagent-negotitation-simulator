# Project Documentation

This directory explains the Multi-Agent Negotiation Simulator in separate, focused guides. Read them in order for a progressive introduction, or open the guide that matches the area you are working on.

## Guides

1. [Project Overview](01-project-overview.md) - What the product does, who uses it, and the main concepts.
2. [Architecture and Runtime Flow](02-architecture-and-runtime-flow.md) - How the frontend, API, orchestration, providers, rules, and database interact.
3. [Backend Guide](03-backend-guide.md) - FastAPI structure, configuration, models, services, and authentication.
4. [Frontend Guide](04-frontend-guide.md) - React screens, Zustand state, Supabase auth, and API integration.
5. [Negotiation Engine](05-negotiation-engine.md) - Turns, decisions, validation, ZOPA, concessions, deadlocks, and terminal states.
6. [API and Workflow](06-api-and-workflow.md) - Endpoint groups and the enforced setup-to-report lifecycle.
7. [Development Setup and Testing](07-development-setup-and-testing.md) - Local setup, environment variables, commands, and test strategy.
8. [Complete Implementation Guide](08-complete-implementation-guide.md) - Detailed walkthrough of the codebase, data model, setup workflow, turn execution, validation, persistence, reports, testing, and extension points.

## Source of Truth

These guides are based on the current source under `backend/` and `frontend/`. Planning documents and older README text may describe intended features that are not active yet. Where that happens, this documentation calls out the current implementation explicitly.

The existing root files remain useful as project history and high-level context:

- [Root README](../README.md)
- [Learning README](../LEARNING_README.md)
- [Backend Implementation Plan](../BACKEND_IMPLEMENTATION_PLAN.md)
- [Integration Acceptance Audit](../INTEGRATION_ACCEPTANCE_AUDIT.md)
