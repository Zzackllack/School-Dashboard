# 05 Risk, Rollout, and Rollback

## Risk Register

| ID | Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- | --- |
| R-001 | Route migration causes dashboard regressions | High | Medium | Baseline parity checklist, phased porting, visual regression checks |
| R-002 | TanStack Start runtime/deploy mismatch with current infrastructure | High | Medium | Early deployment spike in staging, container runbook updates |
| R-003 | Kiosk browser compatibility issues in Firefox | High | Medium | Test on real kiosk hardware before rollout |
| R-004 | API handling regressions during refactor | Medium | Medium | Centralized API client, integration tests, staged rollout |
| R-005 | Team learning curve on new framework patterns | Medium | Medium | Internal migration guide and pair review in early phases |
| R-006 | Rollout outage during cutover | High | Low | Blue/green or canary deployment and validated rollback |

## Rollout Strategy

## Stage 1: Staging Validation

- Deploy TanStack Start frontend build to staging environment.
- Validate all core routes and module integrations.
- Execute kiosk simulation tests.

## Stage 2: Canary Production

- Route one physical display (or one controlled endpoint) to new frontend.
- Observe stability, rendering, and data freshness.
- Run for a minimum agreed soak period.

## Stage 3: Full Production

- Promote TanStack Start frontend to all production displays.
- Monitor for regressions and collect operator feedback.

## Rollback Strategy

Rollback trigger conditions:

- Any critical data display failure on production screens.
- Frontend unable to load reliably in kiosk mode.
- Severe rendering/performance regressions.

Rollback procedure:

1. Re-deploy last known good frontend artifact (pre-migration build).
2. Validate `/` route and API proxy behavior.
3. Confirm kiosk clients auto-recover on reload/restart.
4. Open incident ticket with root-cause and remediation actions.

## Operational Readiness Checklist

- OR-001: Last known good artifact is retained and documented.
- OR-002: Cutover and rollback commands are documented.
- OR-003: On-call owner is assigned for migration window.
- OR-004: Monitoring dashboard and log access verified pre-cutover.
- OR-005: Communication plan prepared for school stakeholders.

## Decision Log

- D-001: Backend remains untouched for this migration.
- D-002: Migration prioritizes parity and reliability over new features.
- D-003: Future admin/device functionality is enabled by route scaffolding, not delivered in this spec.

## Open Items for Follow-Up Specs

- O-001: Admin authentication model (PIN vs user accounts vs external IdP).
- O-002: Device-specific layout configuration model and persistence contract.
- O-003: Long-term frontend deployment model (SSR runtime vs static-first mode).
