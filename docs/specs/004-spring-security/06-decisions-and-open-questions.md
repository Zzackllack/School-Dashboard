# 06 Decisions and Open Questions

## Purpose

Track concrete technical decisions and remaining open questions for a pragmatic,
maintainable Spring Security migration.

## Decisions

## ADR-004-01: Centralize admin authorization in Spring Security

- Status: accepted.
- Decision:
  - All `/api/admin/**` authorization is enforced by Spring Security, not custom
    controller header checks.
- Consequences:
  - Consistent policy enforcement.
  - Simpler controllers and easier maintenance.

## ADR-004-02: Use session-based login for admin dashboard

- Status: accepted.
- Decision:
  - Admin users authenticate with username/password and server-side session.
- Consequences:
  - Clean browser flow.
  - Requires CSRF handling for state-changing requests.

## ADR-004-03: Keep display token checks in domain logic

- Status: accepted.
- Decision:
  - Display session token validation stays in `DisplayEnrollmentService` and is
    separate from admin auth.
- Consequences:
  - Clear boundary between admin and display concerns.

## ADR-004-04: Replace static admin secrets with user table + hashed passwords

- Status: accepted.
- Decision:
  - Use DB-backed admin users and `PasswordEncoder` (BCrypt).
- Consequences:
  - No plaintext default admin credentials in config.
  - Supports proper account lifecycle management.

## ADR-004-05: Keep legacy header auth only as temporary migration fallback

- Status: accepted.
- Decision:
  - Legacy `X-Admin-*` auth remains optional behind a feature flag, then removed.
- Consequences:
  - Lower migration risk.
  - Clear deprecation/removal step required.

## Open Questions

## Q1: Session timeout values

- Open:
  - Idle timeout and absolute session lifetime.
- Proposed default:
  - Start with practical values for admin workflows, then tune from usage data.

## Q2: Login attempt protections

- Open:
  - Lockout/cooldown thresholds for repeated failed login attempts.
- Proposed default:
  - Add moderate cooldown and audit events; avoid aggressive lockouts.

## Q3: CSRF integration approach for frontend

- Open:
  - Best approach for current frontend stack (cookie token vs explicit token
    endpoint).
- Proposed default:
  - Implement the simpler option that fits current frontend architecture.

## Q4: Legacy auth sunset date

- Open:
  - Date to fully remove compatibility header auth.
- Proposed default:
  - Define and enforce a short fixed sunset window.

## Q5: Audit retention period

- Open:
  - How long to retain auth and admin audit logs.
- Proposed default:
  - Keep a practical retention period aligned with operational needs.

## Ownership

- Engineering owner: backend maintainer.
- Security owner: designated maintainer/reviewer.
- Operations owner: deployment maintainer.
