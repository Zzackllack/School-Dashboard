# 05 Testing, Risk, and Rollout

## Test Matrix

## Unit Tests

- Token persistence helpers.
- Bootstrap route decision logic.
- Enrollment status polling behavior.
- Admin action form validation.

## Integration Tests

- Enrollment API flow:
  - create request
  - approve
  - session validation
- Reject and expire paths.
- Revocation path forcing fallback to setup.

## Web / End-to-End Tests

- Fresh kiosk (no token) -> setup -> pending -> approved -> display route.
- Restart simulation with stored token -> direct display route.
- Revoked token -> setup fallback.
- Admin approval and rejection UX.

## Risk Register

| ID | Risk | Impact | Mitigation |
| --- | --- | --- | --- |
| R-201 | Unauthorized enrollment attempts | High | Code-gated enrollment + admin approval + rate limits |
| R-202 | Token theft from local storage | High | Opaque scoped tokens + short expiry + revocation + hardened kiosk profile |
| R-203 | Kiosk stuck on pending due to network | Medium | Retry backoff + clear status messages + operator fallback instructions |
| R-204 | Admin operational confusion | Medium | Clear pending/approved/rejected states and audit trail |
| R-205 | Data migration issues on existing environments | Medium | Staging dry-runs and migration backups |

## Rollout Plan

1. Deploy backend and frontend to staging.
2. Complete scripted E2E enrollment tests.
3. Canary rollout on one physical kiosk.
4. Roll out to remaining kiosks in batches.
5. Monitor session validation error rates and enrollment failures.

## Rollback Plan

1. Disable new enrollment entry points via feature flag.
2. Revert frontend to previous stable build.
3. Keep backend migrations but stop calling new endpoints.
4. Restore kiosk operation through previous static root behavior.

## Operational Playbook Notes

- Existing deployed kiosks should be pre-seeded with display tokens during maintenance, or re-enrolled one-by-one.
- If browser profile resets, re-enrollment is expected behavior.
