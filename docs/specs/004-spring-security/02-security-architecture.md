# 02 Security Architecture

## Architectural Principles

1. Security is configured centrally, not embedded per controller.
2. Deny by default; explicitly permit only required unauthenticated paths.
3. Separate browser-session security from machine/API security concerns.
4. Treat authorization as policy, not application glue code.
5. Design migration for compatibility-first cutover, then simplification.

## Proposed Topology

### Layer 1: HTTP Security Filter Chains

Use one or more `SecurityFilterChain` beans with clear request matching.

Suggested split:

- Chain A: `/api/admin/**`
  - Requires authenticated admin principal.
  - Session-based auth for browser clients.
  - CSRF enabled for state-changing browser endpoints.

- Chain B: `/api/displays/**`, `/api/substitution/**`, `/api/calendar/**`
  - Public/display rules as needed.
  - Explicitly no admin role assumptions.

- Chain C: actuator endpoints
  - Minimal exposure and strict role/network controls.

### Layer 2: Authentication Providers

### Phase target

- `DaoAuthenticationProvider` backed by app user store.
- Password hashing via `PasswordEncoder` (BCrypt or Argon2).
- Optional documented recovery account procedure for operational safety.

### Transitional compatibility

If needed during migration:

- A temporary custom `AuthenticationProvider` for existing admin token+PIN header flow.
- Restricted to specific routes and disabled by default in production after cutover.

### Layer 3: Authorization

Primary mechanism:

- `authorizeHttpRequests` route-level role checks.

Optional reinforcement:

- `@EnableMethodSecurity` and `@PreAuthorize` for high-risk service methods:
  - Delete display.
  - Revoke sessions.
  - Enrollment approval/rejection.

### Layer 4: Session and CSRF Strategy

For browser-admin:

- Stateful server session using secure cookie.
- CSRF enabled for non-idempotent endpoints.
- Login/logout endpoints integrated with Spring Security mechanisms.

For non-browser API clients:

- Keep current behavior and evaluate dedicated API auth only when needed.

### Layer 5: User and Role Domain Model

Introduce persistent identity model with Flyway migrations.

Minimal schema:

- `app_user`:
  - `id`, `username`, `password_hash`, `enabled`, `locked`, timestamps.
- `app_role`:
  - `id`, `name` (e.g., `ROLE_ADMIN`).
- `app_user_role`:
  - `user_id`, `role_id` join table.

Optional hardening:

- `failed_login_count`, `last_failed_login_at`, `locked_until`.
- Password rotation metadata.

### Layer 6: Error Handling

Unify auth/authorization failures with explicit handlers:

- `AuthenticationEntryPoint` for unauthenticated requests.
- `AccessDeniedHandler` for authenticated but unauthorized requests.

Response contract guidance:

- `401` with code `UNAUTHENTICATED`.
- `403` with code `FORBIDDEN`.
- Include `requestId`, timestamp, and stable machine-readable codes.

### Layer 7: Audit and Logging

- Log auth success/failure with principal and request metadata.
- Log authorization denials with target endpoint and role context.
- Preserve existing admin audit log semantics, now keyed by authenticated principal.

### Layer 8: Configuration Conventions

Externalized configuration only:

- `application-security.yaml` (base security defaults).
- `application-dev.yaml` (developer-friendly overrides).
- `application-prod.yaml` (strict defaults, no weak credentials).

Required conventions:

- No secrets in repo.
- Env var binding for credentials and keys.
- Startup fail-fast when required security config is missing in non-dev profiles.

## Endpoint Policy Matrix (Target)

- `/api/admin/**` -> authenticated + `ROLE_ADMIN`.
- `/api/displays/enrollments` -> permitted with rate limiting.
- `/api/displays/session` -> permitted, domain token validation remains required.
- `/api/substitution/**`, `/api/calendar/**` -> explicit policy per product decision.
- `/actuator/health` -> optional permit.
- Other actuator endpoints -> restricted.

