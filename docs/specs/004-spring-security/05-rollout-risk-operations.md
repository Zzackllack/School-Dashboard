# 05 Rollout, Risk, and Operations Plan

## Objective

Ship Spring Security migration safely with clear operational controls,
predefined rollback mechanics, and minimal disruption to admin/display users.

## Rollout Strategy

## Release model

Use phased rollout with environment gates:

1. Local development validation.
2. Staging soak + security regression test pass.
3. Production rollout with post-deploy smoke checks.

## Deployment slices

- Slice 1: Security infrastructure + login endpoints, legacy compatibility still
  available (feature-flagged).
- Slice 2: Admin endpoints switched to Spring Security enforcement.
- Slice 3: Legacy header auth removed.

## Feature Flags and Runtime Controls

### Required flags

- `security.legacy-admin-header-auth.enabled`
- `security.auth.login-endpoint.enabled` (optional for incremental bring-up)
- `security.admin.bootstrap.enabled`

### Flag policy

- Default all compatibility flags to `false` in production.
- Allow temporary emergency enablement only with explicit incident ticket.
- Log and alert when compatibility auth is enabled in non-dev environments.

## Environment Policy

## Development

- Bootstrap admin may be enabled for productivity.
- Lower friction session timeout acceptable.
- Security logs can be verbose.

## Staging

- Must mirror production auth settings as closely as possible.
- Legacy compatibility path disabled by default.
- Full regression suite required before promotion.

## Production

- No default credentials.
- Use documented recovery procedure if needed.
- Secure cookie, strict CORS allowlist, hardened actuator exposure.

## Risk Register

## R1: Admin lockout after migration

- Impact: high.
- Likelihood: medium.
- Mitigation:
  - documented account recovery procedure
  - verified bootstrap/seed strategy per environment
  - pre-release login validation in staging

## R2: Public display flow accidentally blocked

- Impact: high (school display outage).
- Likelihood: medium.
- Mitigation:
  - explicit allowlist for display endpoints
  - E2E tests for enrollment/session/active-display playback
  - monitor setup redirect spikes after deployment

## R3: Legacy auth path left enabled too long

- Impact: medium-high.
- Likelihood: medium.
- Mitigation:
  - flag telemetry and alerts
  - explicit decommission date
  - release checklist gate blocks production promotion if enabled

## R4: CSRF misconfiguration breaks admin UI writes

- Impact: medium.
- Likelihood: medium.
- Mitigation:
  - contract tests for mutating admin endpoints
  - frontend integration tests for token propagation
  - documented CSRF fetch strategy in frontend code

## R5: Audit trail gaps due to principal mapping changes

- Impact: medium.
- Likelihood: medium.
- Mitigation:
  - integration tests for actor identity in audit log entries
  - temporary dual logging during transition

## Operational Runbooks

## Runbook A: First-time secure admin setup

1. Set required environment variables for bootstrap admin (if applicable).
2. Start service in controlled environment.
3. Verify login with bootstrap account.
4. Create permanent named admin account.
5. Disable bootstrap flag and restart if required.
6. Confirm bootstrap credentials are no longer valid.

## Runbook B: Admin credential rotation

1. Authenticate as existing admin.
2. Create/activate replacement admin credential.
3. Validate replacement login in a new session.
4. Disable old credential.
5. Verify old credential no longer authenticates.
6. Record rotation event in ops/security log.

## Runbook C: Admin lockout recovery

1. Confirm outage scope and auth failure symptoms.
2. Follow the documented recovery procedure.
3. Create temporary recovery admin account with expiration marker.
4. Restore standard admin access.
5. Remove temporary account and rotate any exposed secrets.
6. Complete incident review and timeline.

## Runbook D: Fallback to compatibility auth (temporary)

1. Enable `security.legacy-admin-header-auth.enabled=true` in runtime config.
2. Confirm admin access restored.
3. Open remediation task to disable compatibility within defined SLA.
4. Disable flag after fix; verify session login path works.

## Monitoring and Alerting

## Key metrics

- Login failure rate.
- 401/403 rates on `/api/admin/**`.
- Display session validation failures and setup redirect rate.
- Rate-limit rejects on display enrollment/session endpoints.

## Alerts

- Sudden 401/403 surge over baseline.
- Display traffic success drop below threshold.
- Compatibility flag enabled in staging/production.

## Logging and forensic requirements

- Correlation IDs across auth requests.
- Principal identity in admin action logs.
- Sensitive fields redacted.

## Rollback Plan

## Rollback triggers

- Sustained admin lockout with failed recovery path.
- High-severity display availability regression.
- Critical security control failure discovered post-deploy.

## Rollback procedure

1. Roll back backend to previous known-good release artifact.
2. Restore prior runtime config (including disabled new auth paths).
3. Execute smoke tests:
   - admin access
   - display enrollment and session validation
4. Announce rollback completion and begin root-cause analysis.

## Roll-forward requirements after rollback

- Root cause identified and documented.
- Additional tests added for failure mode.
- Staging replay demonstrates fix before re-release.

## Change Management and Governance

- All security-affecting changes require PR review by at least one maintainer.
- Production rollout requires explicit checklist sign-off.
- Incident deviations from baseline policy must be documented in postmortem.

## Release Checklist

1. Security tests and integration tests green.
2. Staging manual verification completed.
3. Monitoring dashboards and alerts validated.
4. Rollback artifact and procedure confirmed.
5. Compatibility auth flag disabled in production.
6. Ops and engineering sign-off complete.
