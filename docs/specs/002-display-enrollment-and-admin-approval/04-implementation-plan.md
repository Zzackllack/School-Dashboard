# 04 Implementation Plan

## Sequencing

Implement after Spec 001 is in production and stable.

## Phase 1: Backend Foundations

- Add persistence entities, repositories, and Flyway migrations for:
  - displays
  - enrollment codes
  - enrollment requests
  - display sessions
  - audit logs
- Add admin endpoints for code creation and approval workflows.
- Add public endpoints for enrollment and session validation.

Exit Criteria:
- All endpoints available in local/staging.
- Schema migration successful on clean and existing DB.

## Phase 2: Frontend Kiosk Bootstrap

- Implement `/` resolver behavior.
- Implement `/setup` and `/setup/pending`.
- Add local storage persistence for display session token.
- Add polling for enrollment approval completion.

Exit Criteria:
- Unregistered device flows to setup.
- Approved device auto-routes to display view on restart.

## Phase 3: Admin Display Management UI

- Build pending approvals list.
- Build approve/reject actions with assignment controls.
- Build display detail page with revoke/reassign actions.

Exit Criteria:
- Admin can complete full lifecycle: invite -> approve -> revoke.

## Phase 4: Security and Hardening

- Rate limits on enrollment and session validation endpoints.
- Enrollment code TTL and max-uses enforcement.
- Audit log coverage for all admin actions.
- Sensitive logging review.

Exit Criteria:
- Security checklist complete and reviewed.

## Phase 5: Rollout

- Pilot one new kiosk device through full enrollment flow.
- Migrate existing devices in planned maintenance window.
- Monitor and tune retry/poll behavior.

Exit Criteria:
- All production kiosk devices enrolled and stable.
