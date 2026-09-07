# Development Setup and Testing

## Prerequisites

- Python 3.10 or newer.
- Node.js 18 or newer.
- A Gemini API key for live Gemini decisions, unless using the configured fallback path.
- Supabase configuration when using the application's hosted authentication/database setup.

## Backend Setup

From the repository root:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env` with the values appropriate for the environment. A minimal local configuration is commonly:

```env
GEMINI_API_KEY=your-key
SECRET_KEY=change-this-for-local-use
DATABASE_URL=sqlite+aiosqlite:///./negotiation.db
```

Start the API:

```powershell
python -m app.main
```

Useful URLs:

- `http://localhost:8000/health`
- `http://localhost:8000/api/v1/docs`
- `http://localhost:8000/api/v1/redoc`

## Frontend Setup

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Vite normally serves the app at `http://localhost:5173`.

The frontend also needs the Supabase browser configuration expected by `frontend/src/lib/supabase.ts` when authentication is enabled.

## Validation Commands

Backend tests:

```powershell
cd backend
pytest -v
```

Frontend typecheck/build:

```powershell
cd frontend
npm run build
```

Frontend tests:

```powershell
cd frontend
npm run test
```

Frontend lint:

```powershell
cd frontend
npm run lint
```

## Testing Strategy

Backend tests cover the highest-risk business boundaries:

- Authentication and protected access.
- Scenario and setup validation.
- Workflow ordering.
- Turn order and state transitions.
- Offer, constraint, concession, and ZOPA rules.
- Deadlock and safety behavior.
- Provider fallback and token usage.
- Human/AI execution.
- Report lifecycle and frontend/backend synchronization.

When changing negotiation behavior, run the narrowest related test first, then the full backend suite. When changing a frontend contract, run the frontend build and the relevant Vitest tests.

## Troubleshooting Checklist

1. Check `/health` before debugging the UI.
2. Open `/api/v1/docs` to verify the route and payload contract.
3. Confirm the frontend is using the same API base URL expected by `frontend/src/lib/api.ts`.
4. Check Supabase session configuration for authentication failures.
5. Check `backend/.env` and provider configuration for LLM failures.
6. Inspect backend logs for workflow guard or decision validation errors.
7. Use the persisted session and report endpoints to distinguish a UI-state issue from a backend-state issue.

## Deployment Caution

Do not copy production secrets into committed files. Review database migrations, CORS origins, authentication settings, and provider keys before exposing the API beyond local development.
