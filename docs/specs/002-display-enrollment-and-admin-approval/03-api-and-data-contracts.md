# 03 API and Data Contracts

## API Endpoints

## Kiosk / Public Endpoints

- `POST /api/displays/enrollments`
  - Creates pending enrollment request.
  - Input:
    - `enrollmentCode`
    - `proposedDisplayName`
    - `deviceInfo` (optional metadata)
  - Output:
    - `requestId`
    - `status` (`PENDING`)
    - `pollAfterSeconds`

- `GET /api/displays/enrollments/{requestId}`
  - Returns current enrollment status.
  - Output:
    - `status` (`PENDING|APPROVED|REJECTED|EXPIRED`)
    - `displayId` (if approved)
    - `displaySessionToken` (if approved)

- `GET /api/displays/session`
  - Validates current display token.
  - Auth: `Authorization: Bearer <display_session_token>`
  - Output:
    - `valid`
    - `displayId`
    - `displaySlug`
    - `assignedProfileId`
    - `redirectPath`

## Admin Endpoints

- `POST /api/admin/displays/enrollment-codes`
  - Create enrollment code (short TTL).
- `GET /api/admin/displays/enrollments?status=PENDING`
  - List pending enrollments.
- `POST /api/admin/displays/enrollments/{requestId}/approve`
  - Approve pending request and assign profile/layout.
- `POST /api/admin/displays/enrollments/{requestId}/reject`
  - Reject pending request.
- `POST /api/admin/displays/{displayId}/revoke-session`
  - Revoke active display session.
- `PATCH /api/admin/displays/{displayId}`
  - Update display metadata/assignment.

## Suggested Persistence Model

## Table: `display`

- `id` (UUID, PK)
- `name`
- `slug` (unique)
- `location_label`
- `status` (`ACTIVE|INACTIVE|REVOKED`)
- `assigned_profile_id` (nullable)
- `created_at`
- `updated_at`

## Table: `display_enrollment_code`

- `id` (UUID, PK)
- `code_hash`
- `created_by_admin_id`
- `expires_at`
- `max_uses`
- `uses_count`
- `status` (`ACTIVE|EXPIRED|DISABLED`)
- `created_at`

## Table: `display_enrollment_request`

- `id` (UUID, PK)
- `enrollment_code_id` (FK)
- `proposed_display_name`
- `device_info_json`
- `status` (`PENDING|APPROVED|REJECTED|EXPIRED`)
- `approved_by_admin_id` (nullable)
- `approved_at` (nullable)
- `rejected_at` (nullable)
- `created_at`

## Table: `display_session`

- `id` (UUID, PK)
- `display_id` (FK)
- `token_hash`
- `issued_at`
- `expires_at`
- `last_seen_at`
- `revoked_at` (nullable)
- `revoked_by_admin_id` (nullable)

## Table: `admin_audit_log`

- `id` (UUID, PK)
- `admin_id`
- `action`
- `target_type`
- `target_id`
- `metadata_json`
- `created_at`

## Error Contract (Minimum)

- `code`
- `message`
- `requestId`
- `timestamp`

Examples:
- `ENROLLMENT_CODE_INVALID`
- `ENROLLMENT_REQUEST_NOT_FOUND`
- `DISPLAY_SESSION_REVOKED`
- `DISPLAY_SESSION_EXPIRED`
