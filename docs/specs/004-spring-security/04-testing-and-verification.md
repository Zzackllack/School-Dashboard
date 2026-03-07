# 04 Testing and Verification Plan

## Objective

Define a complete security verification strategy for migrating to Spring Security
without regressions in admin workflows or display runtime behavior.

## Testing Principles

1. Security behavior must be explicit, deterministic, and automated.
2. Negative-path tests are as important as happy-path tests.
3. Route-level and method-level authorization must both be verified.
4. Migration tests must prove compatibility where transitional paths exist.
5. Test artifacts should support incident forensics and audit evidence.

## Test Pyramid Coverage

## Unit Tests

### Scope

- Security helper logic.
- Principal mapping and role resolution.
- Password hashing and account status handling.
- Authentication/authorization error mapping.

### Candidate unit test classes

- `SecurityConfigurationTest`
- `AppUserDetailsServiceTest`
- `RestAuthenticationEntryPointTest`
- `RestAccessDeniedHandlerTest`
- `AdminAuditLogServiceSecurityContextTest`

### Core assertions

- Disabled/locked users cannot authenticate.
- Incorrect password always fails.
- Role mapping preserves `ROLE_*` semantics.
- Error payload codes match contract.

## Integration Tests (Spring Context + DB)

### Scope

- Full auth provider behavior with H2/Flyway migrations.
- Session lifecycle and CSRF behavior.
- Role-based access decisions on real endpoint mappings.

### Test infrastructure

- `@SpringBootTest` with test profile.
- Flyway migrations applied in test DB.
- Test data setup for users/roles/displays.

### Critical scenarios

1. Login creates authenticated session.
2. Logout invalidates session and prevents reuse.
3. Session timeout forces re-authentication.
4. Non-admin role receives `403` on admin routes.
5. Missing auth receives `401` on admin routes.
6. Public display endpoints remain reachable without admin login.

## Web Layer Tests (MockMvc / WebTestClient)

### Scope

- HTTP contracts for all security-sensitive endpoints.
- Header/cookie/CSRF behavior validation.
- Structured error response verification.

### Endpoint matrix tests

- `/api/admin/auth/login`:
  - valid credentials => success + session
  - invalid credentials => `401`
  - malformed payload => validation error
- `/api/admin/auth/me`:
  - authenticated => current principal
  - unauthenticated => `401`
- `/api/admin/displays/**`:
  - admin => allowed
  - unauthenticated => `401`
  - authenticated without role => `403`
- `/api/displays/enrollments` and `/api/displays/session`:
  - remain public per policy
  - still enforce domain-specific token checks where required

## End-to-End and UI-Integrated Tests

### Scope

- Frontend + backend login flow.
- Admin dashboard access lifecycle.
- Display enrollment and runtime behavior under status changes.

### Required E2E scenarios

1. Admin logs in, opens admin displays page, performs management actions.
2. Admin logs out, refreshes admin page, is redirected to login.
3. Display enrolled and active can access assigned display route.
4. Display set to inactive/revoked is denied and redirected to setup.
5. Re-activating display restores allowed session behavior as expected.
6. New incognito session without display token cannot bypass setup.

## Security Regression and Abuse Tests

### Authentication abuse

- Brute-force attempts against login endpoint (rate limiting/lock strategy).
- Session fixation check at login boundary.
- Reuse of expired/revoked session identifiers fails.

### Authorization abuse

- Horizontal/vertical privilege checks across display IDs.
- Attempt admin action with authenticated non-admin user.
- Ensure direct object references require role and ownership policy where
  applicable.

### CSRF and browser security

- State-changing admin routes reject missing/invalid CSRF token.
- Verify CORS denies unexpected origins on credentialed requests.

### Header and token handling

- Ensure sensitive headers are not echoed in logs.
- Ensure no fallback to legacy header auth when flag is off.

## Data and Migration Tests

### Flyway validation

- New security migrations apply cleanly from empty DB.
- Existing DB with prior migrations upgrades without data loss.
- Roll-forward migrations are idempotent in CI setup.

### Seed/bootstrap tests

- Dev bootstrap account created only when configured.
- Production profile does not auto-create weak/default accounts.

## Performance and Capacity Checks

### Objectives

- Security middleware should not materially degrade baseline latency.
- Login/auth endpoints should remain stable under realistic concurrency.

### Suggested checks

- Baseline p95 for admin API before and after migration.
- Load test login and `/api/admin/auth/me` under peak expected operator use.
- Confirm no unacceptable DB contention on user lookup/auth paths.

## Observability Verification

### Logging expectations

- Authentication success/failure events are logged with request correlation ID.
- Authorization denies include endpoint and principal metadata.
- No plaintext secrets/passwords in logs.

### Metrics expectations

- Counters: login success, login failure, 401 count, 403 count.
- Alerting thresholds defined for abnormal auth failure spikes.

## CI Pipeline Requirements

1. Unit tests run on every PR.
2. Integration and web-layer security tests run on every PR.
3. E2E auth workflows run at least on protected branches/nightly.
4. Build fails if any security contract tests fail.

## Test Data Strategy

- Maintain deterministic fixture users:
  - `admin.user` with `ROLE_ADMIN`
  - `operator.user` with non-admin role
  - `disabled.user`
- Use dedicated display fixtures for status transitions:
  - active, inactive, revoked.

## Manual Verification Checklist (Release Candidate)

1. Admin login/logout/me tested manually in target environment.
2. Admin actions work only when authenticated and authorized.
3. Public display enrollment/session endpoints behave as documented.
4. Unauthorized/forbidden responses are correct and stable.
5. Actuator exposure/security validated against policy.
6. Recovery procedure for locked/misconfigured admin account tested.

## Evidence and Sign-Off

### Required evidence

- Test reports from unit/integration/web/E2E layers.
- Screenshots or request traces for key manual checks.
- Log excerpts proving audit/security events.
- Rollout checklist with approver names and timestamps.

### Sign-off roles

- Backend engineering owner.
- Security reviewer (or designated maintainer).
- Operations/deployment owner.
