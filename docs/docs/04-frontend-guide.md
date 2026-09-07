# Frontend Guide

## Entry Points

- `frontend/src/main.tsx` mounts the React application.
- `frontend/src/App.tsx` defines routes, authentication initialization, and workflow protection.
- `frontend/src/lib/api.ts` provides the centralized backend request helpers.
- `frontend/src/lib/supabase.ts` creates the browser Supabase client.
- `frontend/src/store/useStore.ts` holds the main Zustand state.

## Screen Flow

The main application routes represent these areas:

```text
Welcome / Login
  -> Scenario selection
  -> Mode selection
  -> Agent configuration
  -> Goals and constraints
  -> Review
  -> Simulation arena or practice arena
  -> Outcome report / history
```

Additional screens support the dashboard, settings, help, password reset, access-denied, offline, and not-found states.

## State Management

The Zustand store keeps browser-level workflow state such as:

- Current authenticated user and session status.
- Selected scenario and negotiation mode.
- Human role.
- Configured agents, goals, and constraints.
- Active backend session identifier.
- Arena messages and progress.
- Reports and selected report.
- Workflow completion and guard information.

The store is useful for rendering and navigation, but the backend session remains the authority for persisted negotiation state.

## Backend Integration

The API client attaches the Supabase access token as a bearer token when making protected requests. Frontend screens use the API for scenarios, negotiation setup, arena turns, reports, dashboard data, and token usage.

The arena execution pattern is request-driven:

- AI vs AI calls the next-step endpoint.
- Human vs AI submits a human turn endpoint.
- Session start, resume, pause/stop, and report retrieval use lifecycle endpoints.

## Authentication

Login, signup, password reset, and OAuth provider flows are handled through Supabase Auth. Auth state changes are observed by the Supabase client and reflected in the application store.

## Frontend Tests and Build

The frontend package scripts are:

```powershell
cd frontend
npm run dev
npm run build
npm run lint
npm run test
```

`npm run build` runs the TypeScript project build before Vite creates production assets. `npm run test` runs Vitest tests.

## Working on a Screen

When changing a workflow screen, check all three layers:

1. The screen's form and validation state.
2. The Zustand action and persisted browser state.
3. The API payload and backend schema/guard that receives it.

This prevents a UI-only change from allowing a setup state that the backend rejects, or a backend change from leaving the user stuck in an outdated route guard.
