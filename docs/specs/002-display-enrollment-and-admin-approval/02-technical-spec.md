# 02 Technical Specification

## Architecture Overview

- Frontend: TanStack Start app (from Spec 001).
- Backend: Spring Boot APIs and persistence extensions.
- Kiosk launch model: unchanged systemd startup (open root URL).

## Boot Resolution Logic at `/`

1. Read `display_session_token` from browser storage.
2. If absent, route to `/setup`.
3. If present, call `GET /api/displays/session`.
4. If valid, route to assigned `/display/$displayId`.
5. If invalid/revoked/expired, clear token and route to `/setup`.

## Enrollment Security Model

- Enrollment is gated by admin-generated one-time code.
- Creating a request does not activate display access.
- Only admin approval can mint active display session token.

## Session Token Strategy

- Use opaque random token (server-side stored hash), not frontend-signed authority token.
- Store token in browser storage under `display_session_token`.
- Scope token to display-only capabilities (no admin privileges).
- Support revocation and rotation by admin.

## Client Persistence

- Required:
  - `display_session_token`
  - `display_id` (optional cache hint)
- Storage medium:
  - Local storage for initial implementation.
- Behavior:
  - If storage cleared, display must re-enroll.

## Route Topology (Post-Spec-002)

```text
/
├── __root
├── index                  -> bootstrap resolver
├── setup                  -> enrollment form
├── setup/pending          -> waiting/approval polling
├── display/$displayId     -> assigned display experience
└── admin
    └── displays
        ├── index
        ├── pending
        └── $displayId
```

## Admin Approval State Machine

```text
ENROLLMENT REQUEST:
PENDING -> APPROVED -> ACTIVATED
PENDING -> REJECTED

DISPLAY SESSION:
ISSUED -> ACTIVE -> REVOKED
ISSUED -> EXPIRED
```

## Observability

- Log enrollment request creation (non-sensitive metadata).
- Log admin approval/rejection actions.
- Log display session validation outcomes.
- Add audit events for revoke/reassign actions.

## Hardening Requirements

- Rate limit enrollment request attempts per IP/device fingerprint.
- Expire enrollment codes and pending requests.
- Require admin authentication for all approval endpoints.
- Ensure no sensitive token material is logged.
