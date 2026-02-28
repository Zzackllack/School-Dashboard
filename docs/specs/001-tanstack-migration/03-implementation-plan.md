# 03 Implementation Plan

## Delivery Strategy

Use incremental phases with production-safe checkpoints. Each phase must be independently verifiable and reversible.

## Phase 0: Preparation

- Freeze non-migration frontend feature work during migration window.
- Capture baseline screenshots and behavior checklist from current production UI.
- Create migration branch and CI baseline.

Deliverables:

- Baseline behavior report.
- Branch strategy and release checklist draft.

## Phase 1: TanStack Start Bootstrap

- Initialize TanStack Start frontend structure in `Frontend/`.
- Configure core runtime, root route, and route tree.
- Ensure development server startup and basic production build.

Deliverables:

- Bootable TanStack Start app shell.
- Placeholder routes for `/`, `/display/$screenId`, `/admin`.

Exit Criteria:

- `pnpm run build` succeeds for frontend.
- Root route serves a minimal shell in local environment.

## Phase 2: Dashboard Parity Port

- Port current dashboard UI modules into the new route-based structure.
- Preserve current styles and rendering layout at `/`.
- Migrate existing query/data-fetching logic with minimal behavioral change.

Deliverables:

- Full module parity on root route.
- Shared API client utilities with typed responses.

Exit Criteria:

- Root route matches baseline behavior within agreed tolerance.
- Existing API integration flows operational end-to-end.

## Phase 3: Route Scaffolding for Future Features

- Add route scaffolds and typed params for:
  - `/display/$screenId`
  - `/admin`
- Add guard extension points (without backend auth changes yet).
- Add layout wrapper and route-level error boundaries.

Deliverables:

- Navigation-safe route structure for future admin/device features.
- Guard and loader extension hooks.

Exit Criteria:

- New routes resolve and render non-breaking placeholder screens.
- No regression on `/`.

## Phase 4: Deployment Adaptation

- Update frontend container/build runtime for TanStack Start output.
- Validate reverse proxy forwarding behavior for `/api`.
- Validate kiosk boot flow against production-like environment.

Deliverables:

- Updated deployment artifacts for frontend runtime.
- Deployment runbook updates for operations.

Exit Criteria:

- Production-like environment passes smoke tests on kiosk clients.
- Existing production URL behavior unchanged for end users.

## Phase 5: Hardening and Release

- Run full test matrix and fix migration regressions.
- Execute staged rollout (canary TV first, then full rollout).
- Capture post-release metrics and issues.

Deliverables:

- Release candidate build.
- Post-release validation report.

Exit Criteria:

- Quality gates pass.
- No critical or high severity regressions open at release time.

## Work Breakdown Structure

- WBS-01: Project scaffold and routing foundation.
- WBS-02: Data layer migration and API client consolidation.
- WBS-03: Component parity migration.
- WBS-04: Error/loading boundary migration.
- WBS-05: Deploy/runtime updates.
- WBS-06: Test suite updates.
- WBS-07: Rollout and rollback readiness.

## Definition of Done

- DoD-001: All acceptance criteria from product and technical specs are met.
- DoD-002: Required test layers pass (unit, integration, web).
- DoD-003: Deployment documentation is updated and validated.
- DoD-004: Backout procedure is documented and tested once in staging.
