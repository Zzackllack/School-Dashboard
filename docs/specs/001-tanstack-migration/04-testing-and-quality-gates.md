# 04 Testing and Quality Gates

## Quality Principle

No migration phase is considered complete without coverage across unit, integration, and web/end-to-end layers.

## Test Layers

## Unit Tests

Scope:

- Route utilities and parameter parsing.
- API client functions and response normalization.
- Component logic and rendering branches (loading/error/success).

Examples:

- Dashboard module renders fallback message when API response fails.
- Route param parsing for `/display/$screenId`.

## Integration Tests

Scope:

- Route + data loading integration.
- Query caching and refetch behavior.
- Cross-component behavior on shared data.

Examples:

- `/` route loads substitution and calendar modules with mocked backend API.
- Error boundary behavior on route-level failures.

## Web / End-to-End Tests

Scope:

- Browser-level route loading and user-visible rendering.
- Kiosk-critical flows for dashboard display.
- Regressions in startup and long-running stability smoke checks.

Examples:

- Open `/` and verify all core cards are visible.
- Open `/display/test-screen` and verify route parameter rendering scaffold.
- Verify admin placeholder route loads without affecting public route.

## Required Gates

- Gate-01: Frontend typecheck and production build pass.
- Gate-02: Unit test suite passes.
- Gate-03: Integration test suite passes.
- Gate-04: Web test suite passes in CI.
- Gate-05: Backend tests remain green to ensure frontend migration does not indirectly break contracts.

## Regression Checklist

- RC-001: Substitution plan data loads and refreshes as expected.
- RC-002: Calendar events render and fallback behavior remains intact.
- RC-003: Weather and transport modules still function.
- RC-004: Auto-refresh and auto-scroll behaviors remain operational.
- RC-005: Visual hierarchy and readability remain acceptable on kiosk displays.

## Performance and Stability Checks

- PSC-001: Initial route render performance does not regress materially versus baseline.
- PSC-002: Memory/CPU behavior acceptable during long-running kiosk sessions.
- PSC-003: Transient API failures do not crash route rendering.

## CI Expectations

- CI must run all test layers for migration PRs.
- PRs with failing quality gates are blocked from merge.
- Artifacts should include test reports and frontend build output for review.

## Release Sign-Off Criteria

- Product owner sign-off on visual parity and route behavior.
- Engineering sign-off on test gate completion.
- Operations sign-off on deployment runbook and rollback readiness.
