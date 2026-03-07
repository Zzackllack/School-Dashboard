# Display Device Enrollment Workflow

This is the end-to-end workflow for registering a new kiosk/display device.

## Admin side

1. Open `/admin/displays`.
2. Enter the configured admin API token.
3. Create an enrollment code (TTL + max uses).
4. Keep that code for the device setup step.

## Device side

1. Open `/` on the kiosk device.
2. If no valid display session exists, app redirects to `/setup`.
3. Enter:
   - Enrollment code
   - Display name
4. Submit to create an enrollment request.
5. Device moves to `/setup/pending` and polls for approval.

## Approval side

1. Open `/admin/displays/pending`.
2. Approve or reject the request.
3. On approval:
   - Display record is created.
   - Session token is issued to the request.
   - Device stores session token locally and navigates to `/display/:displayId`.

## Reboot behavior

- On restart, kiosk opens `/`.
- App validates stored session token via `/api/displays/session`.
- If valid: redirects to `/display/:displayId`.
- If invalid/revoked/expired: clears local token and redirects to `/setup`.

## Revoking a device

- In admin display detail, use revoke session.
- Backend revokes active sessions and marks display as `REVOKED`.
- Next kiosk startup falls back to `/setup`.

