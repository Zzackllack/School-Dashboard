# 02 Technical Specification

## Current State Summary

- Frontend: React 19 + Vite + TypeScript in `Frontend/`.
- Backend: Spring Boot REST API in `Backend/`.
- Production routing: Nginx serves frontend and proxies `/api` to backend.
- Current frontend architecture: largely single-page composition in `App.tsx`.

## Target State Summary

- Frontend framework: TanStack Start (React adapter).
- Router: TanStack Router with file-based routes.
- Backend integration: unchanged API contracts and unchanged Java backend code.
- Deployment: frontend served through production URL with `/api` proxy to backend.

## Architecture Decision

Use TanStack Start as the frontend runtime and routing foundation, while preserving backend ownership of all business/data APIs.

## Route Topology (Target)

```text
/
├── __root
└── index                     -> current public dashboard
```

Notes:
- `index` must reach parity with current dashboard display.
- New feature routes are intentionally deferred to Spec 002.

## Frontend Module Boundaries

- `src/routes/`:
  - Route files, loaders, and route-level concerns.
- `src/components/`:
  - Presentation and module widgets (weather, substitutions, transport, etc.).
- `src/lib/api/`:
  - Typed API clients for backend endpoints.
- `src/lib/query/`:
  - Query client configuration and shared query helpers.
- `src/lib/config/`:
  - Runtime environment configuration and base URL logic.

## API Contract Policy

- All existing backend endpoints remain unchanged.
- Frontend continues consuming:
  - `GET /api/substitution/plans`
  - `GET /api/calendar/events?limit=5`
  - Existing external APIs used client-side remain unchanged unless explicitly moved.
- No backend schema changes, no endpoint path changes, no auth protocol changes during this migration.

## Data Fetching Strategy

- Continue TanStack Query for cached asynchronous data.
- Introduce route-level loaders where route-scoped preloading improves UX.
- Keep backend calls centralized in API client utilities to reduce duplication.

## Error Handling Strategy

- Define route-level error boundaries for global route failures.
- Preserve module-level fallback UI states for partial data failures.
- Keep user-facing language and severity similar to current app behavior.

## Deployment Model

- Keep single public frontend URL used by kiosk devices.
- Keep reverse proxy behavior for `/api` to backend.
- Frontend runtime/container changes are allowed, but external behavior must stay stable:
  - URL remains unchanged.
  - `/api` remains proxied to backend.
  - Kiosk startup process remains "open URL in Firefox full-screen."

## Security Boundaries

- This migration does not introduce backend auth changes.
- Frontend must avoid embedding secrets.
- Existing environment-variable based configuration model remains.

## Compatibility Requirements

- Browser: Firefox kiosk mode on Linux mini PCs.
- Screen behavior: full-screen layout and long-running stability.
- Network behavior: tolerates temporary backend/API failures with graceful fallback states.

## Observability Hooks (Frontend)

- Introduce structured client-side logging points for route-level failures.
- Keep logs non-sensitive (no credentials, no PII).
- Ensure failures are diagnosable during migration verification.

## Technical Acceptance Criteria

- TAC-001: Route tree compiles and boots under TanStack Start.
- TAC-002: Dashboard parity route (`/`) renders all existing modules.
- TAC-003: Production build can be deployed behind existing reverse proxy model.
- TAC-004: No Java backend file changes are required or introduced.
