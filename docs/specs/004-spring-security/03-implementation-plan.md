# 03 Implementation Plan

## Objective

Deliver a controlled migration from custom header-based admin authorization to
Spring Security (Spring Security 7 via Spring Boot 4), with minimal user-facing
regression and explicit rollback points.

## Current State Inventory (From Existing Code)

### Existing auth design

- Admin APIs are under `/api/admin/displays/**`.
- Every admin endpoint manually reads `X-Admin-Token`, `X-Admin-Password`, and
  optional `X-Admin-Id`.
- `AdminAuthService` validates static credentials from
  `display.admin-auth.api-token` and `display.admin-auth.api-password`.
- Security checks are controller-level and repeated per endpoint.

### Existing display/public design

- Public display APIs are under `/api/displays/**`.
- Session validation uses bearer token and domain logic in
  `DisplayEnrollmentService.validateSession(...)`.
- Display status (`ACTIVE`, `INACTIVE`, `REVOKED`) is enforced in domain
  validation logic.

### Identified gaps to close

- No centralized deny-by-default policy.
- Plaintext credential defaults currently exist in properties.
- No first-class login/session lifecycle for admins.
- Hard to extend to multiple admin accounts and role-based access.

## Target Architecture Summary

1. Add Spring Security starter and central security config.
2. Introduce persistent app users + roles + password hashing.
3. Move admin auth to session-backed login endpoints.
4. Protect admin routes with `ROLE_ADMIN` via `SecurityFilterChain`.
5. Keep display session/domain checks in service layer.
6. Remove custom auth headers and `AdminAuthService` after compatibility phase.

## Workstreams and Phases

## Phase 0: Safety Baseline and Preparation

### Tasks

- Create migration branch and baseline tags for rollback.
- Capture endpoint inventory and expected auth behavior for all backend routes.
- Record current auth failure response shapes as compatibility reference.

### Deliverables

- Endpoint-to-policy spreadsheet or markdown table.
- Baseline test report for current backend tests.
- Rollback tag and release note draft.

### Exit criteria

- Full endpoint inventory complete.
- Baseline tests green and recorded.

## Phase 1: Dependency and Infrastructure Setup

### Tasks

- Add dependency: `spring-boot-starter-security`.
- Keep existing CORS config but align through Spring Security CORS integration.
- Introduce a dedicated security config package, for example:
  - `com.schooldashboard.security.config`
  - `com.schooldashboard.security.auth`
  - `com.schooldashboard.security.web`

### Deliverables

- `SecurityDependencies` added in Maven (`pom.xml`).
- Initial `SecurityFilterChain` bean with explicit policy skeleton.

### Exit criteria

- Application boots with Spring Security enabled.
- Explicit allowlist exists for required public endpoints.

## Phase 2: Identity and Role Data Model

### Tasks

- Add Flyway migration(s) for:
  - `app_user`
  - `app_role`
  - `app_user_role`
- Add entities/repositories or JDBC model used by `UserDetailsService`.
- Add password encoder (`BCryptPasswordEncoder` default).

### Data conventions

- Username unique and immutable per account.
- Password hashes only, never plaintext.
- Roles stored as `ROLE_*` names.
- `enabled` and `locked` flags for account lifecycle.

### Bootstrap strategy

- Implement startup bootstrap only for dev/local profile:
  - If no admin users exist, create one from env vars.
- For production profile:
  - Fail fast if no admin exists and bootstrap is disabled.

### Exit criteria

- Admin account can authenticate via database-backed user store.
- No plaintext static admin secret required for normal admin login.

## Phase 3: Authentication Flows (Admin)

### Tasks

- Add admin auth endpoints (API contract stable and explicit):
  - `POST /api/admin/auth/login`
  - `POST /api/admin/auth/logout`
  - `GET /api/admin/auth/me`
- Configure session-based auth for admin browser flows.
- Define session timeout policy and invalid-session behavior.

### CSRF strategy

- Keep CSRF enabled for session-auth state-changing endpoints.
- For SPA integration, expose CSRF token endpoint or cookie strategy and
  document frontend fetch behavior.

### Compatibility bridge (time-limited)

- Optional: keep legacy header auth behind feature flag:
  - `security.legacy-admin-header-auth.enabled=false` by default.
- Restrict to dev/test first; production use only as emergency fallback.

### Exit criteria

- Admin UI can authenticate with login/logout/me flow.
- `/api/admin/**` access is denied without authenticated session.

## Phase 4: Authorization Refactor and Controller Cleanup

### Tasks

- Remove header parameters from `AdminDisplayController` methods.
- Remove `requireAdmin(...)` controller helper.
- Replace `adminId` argument passing with authenticated principal extraction.
- Map principal identity to audit log actor consistently.

### Method security (recommended)

- Enable `@EnableMethodSecurity`.
- Add `@PreAuthorize` on destructive operations:
  - display deletion
  - revoke session
  - status transitions with high impact

### Exit criteria

- No controller-level manual credential checks remain.
- Role checks are central and test-covered.

## Phase 5: Error Handling, Response Contracts, and Observability

### Tasks

- Add custom `AuthenticationEntryPoint` and `AccessDeniedHandler`.
- Keep consistent JSON format with machine code and request correlation:
  - `401 UNAUTHENTICATED`
  - `403 FORBIDDEN`
- Add security event logging:
  - login success/failure
  - access denied
  - logout

### Observability additions

- Counters for auth failures and access denials.
- Optional rate metrics per endpoint group.
- Correlation ID propagation through logs.

### Exit criteria

- Security errors are deterministic and frontend-consumable.
- Ops can monitor auth incidents from logs/metrics.

## Phase 6: Legacy Cleanup and Hardening

### Tasks

- Remove `AdminAuthService` and `DisplayAdminAuthProperties` static credentials.
- Remove `display.admin-auth.*` properties from examples/defaults.
- Harden actuator exposure and security.
- Enforce secure cookie settings and strict CORS origins.

### Exit criteria

- Legacy auth path fully removed.
- No default secret credentials remain in repo configuration.

## Phase 7: Documentation and Runbooks

### Tasks

- Update backend README and operator docs:
  - how to create first admin account
  - how to rotate credentials
  - how to recover lockout safely
- Document emergency fallback (if feature-flagged compatibility exists).

### Exit criteria

- Ops and developers can execute setup/recovery without tribal knowledge.

## Detailed Task Breakdown (Concrete File-Level Plan)

### `Backend/pom.xml`

- Add `spring-boot-starter-security`.

### New package proposal

- `Backend/src/main/java/com/schooldashboard/security/config/SecurityConfiguration.java`
- `Backend/src/main/java/com/schooldashboard/security/config/SecurityProperties.java`
- `Backend/src/main/java/com/schooldashboard/security/auth/AppUserDetailsService.java`
- `Backend/src/main/java/com/schooldashboard/security/auth/AppUserPrincipal.java`
- `Backend/src/main/java/com/schooldashboard/security/web/RestAuthenticationEntryPoint.java`
- `Backend/src/main/java/com/schooldashboard/security/web/RestAccessDeniedHandler.java`

### Migrations

- `Backend/src/main/resources/db/migration/V6__create_security_users_roles.sql`
- Optional: `V7__seed_dev_admin_user.sql` only for dev-local profile strategy.

### Existing classes to refactor

- `AdminDisplayController`: remove header args and `requireAdmin` usage.
- `DisplayEnrollmentService`: take actor identity from authenticated principal.
- `AdminAuditLogService`: ensure actor comes from principal, not arbitrary header.
- Delete `AdminAuthService` after final cutover.
- Deprecate/remove `DisplayAdminAuthProperties`.

## Feature Flags and Config Gates

- `security.legacy-admin-header-auth.enabled`
- `security.admin.bootstrap.enabled`
- `security.admin.bootstrap.username`
- `security.admin.bootstrap.password`
- `security.session.idle-timeout`

Recommended defaults:

- local/dev: bootstrap enabled, legacy disabled unless debugging migration.
- staging/prod: bootstrap disabled after first admin creation, legacy disabled.

## Acceptance Gates by Environment

### Dev gate

- Admin login flow works end-to-end from frontend.
- Existing display enrollment/session behavior unchanged.

### Staging gate

- Security regression suite green.
- Unauthorized and forbidden behavior verified manually and automatically.
- Lockout/recovery runbook tested.

### Production gate

- Manual smoke checks are successful after deployment.
- Auth failure rate stays within normal range.

## Timeboxed Rollout Recommendation

1. Sprint 1: Phase 0-2.
2. Sprint 2: Phase 3-4.
3. Sprint 3: Phase 5-7 + cleanup.

## Definition of Done

- Spring Security is the single enforcement layer for admin endpoints.
- No static admin secrets are required for normal operation.
- Security tests across unit/integration/web layers are green.
- Migration runbook and rollback procedure are published and validated.
