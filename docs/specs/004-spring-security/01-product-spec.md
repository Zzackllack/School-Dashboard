# 01 Product Spec

## Problem Statement

The backend currently uses custom admin authentication checks and ad-hoc endpoint protection. This creates security drift risk, duplicated logic, and operational fragility as the system grows.

Security goals now include:

- Centralized, policy-driven endpoint protection.
- Standardized authentication and authorization primitives.
- Durable support for browser-admin flows, display/device flows, and machine-to-machine interactions.
- Predictable long-term maintainability under evolving requirements.

## Goals

### Primary goals

- Adopt Spring Security as the single enforcement layer for HTTP security.
- Replace custom controller auth checks with centralized security configuration.
- Introduce robust admin authentication with Spring Security best practices.
- Formalize role-based authorization for admin operations.
- Preserve existing user-visible behavior unless explicitly changed.

### Secondary goals

- Improve observability and audit quality for auth decisions.
- Reduce accidental misconfiguration through explicit profiles and defaults.
- Keep the design simple and extensible for future needs.

## Non-Goals

- Implementing external identity provider integration in this migration.
- Rebuilding all frontend auth UX at once beyond what is needed for compatibility.
- Implementing advanced fine-grained policy engines in v1.

## Personas and Access Modes

### Persona A: Admin user (browser)

Needs secure interactive access to admin dashboard and admin APIs.

### Persona B: Display device (kiosk)

Needs non-admin, constrained access to display bootstrap/validation routes.

### Persona C: Service/operator automation

Needs tightly-scoped, non-interactive operational access where required.

## Target Authentication Model

### Admin browser access

- Preferred model: stateful login session (secure cookie).
- Login via username/password (PIN may be allowed only as transitional credential policy).
- Session timeout, idle timeout, logout, and invalidation supported.

### API and service access

- For transitional compatibility: optional header token support behind explicit feature flag and restricted routes.
- Long-term target: keep API auth extensible; this migration stays focused on admin session security.

### Display access

- Display session token validation remains domain-specific but is protected by centralized filter chain rules.
- No admin privilege leakage into display routes.

## Authorization Model

- Role-first model:
  - `ROLE_ADMIN`: full display admin lifecycle.
- Controller route guards at HTTP level.
- Optional method-level security for sensitive service operations.

## Functional Requirements

1. Admin routes under `/api/admin/**` require authenticated admin principal.
2. Display/public routes keep current behavior but must be explicitly allow-listed.
3. Delete display operation requires elevated permission and is auditable.
4. Access denials and auth failures return consistent structured error responses.
5. All security-relevant actions produce audit records with actor identity.

## Non-Functional Requirements

### Security

- Strong password hashing (BCrypt/Argon2).
- CSRF protection for session-auth browser endpoints.
- CORS explicitly configured, default deny.
- Secure cookie flags (`HttpOnly`, `Secure`, `SameSite`).

### Reliability

- Zero-downtime compatible rollout path.
- Feature-flagged legacy compatibility path for controlled cutover.

### Maintainability

- Security policy concentrated in a small number of classes.
- Minimal security logic in controllers.
- Clear extension points for future providers.

### Observability

- Metrics and logs for authentication success/failure, authorization denies.
- Correlation ID propagation through security events.

## Success Criteria

- 100% of admin endpoints are centrally protected by Spring Security config.
- No custom header auth checks remain in business controllers.
- Automated security tests cover positive and negative authorization cases.
- Existing display enrollment/session flows remain functional.
- Operational runbooks and rollback plans are documented and validated.
