# 03 API and Data Contracts

## Database Changes

## Display Table

Add column:

- `theme_id VARCHAR(80) NOT NULL DEFAULT 'default'`

Constraints:

1. Non-null.
2. Default `'default'`.
3. Optional check constraint with known values (if DB strategy accepts schema
   changes for each new theme) or leave unconstrained and validate at service
   layer.

## Flyway

Add migration in `Backend/src/main/resources/db/migration`:

1. Add column.
2. Backfill existing rows to default.
3. Ensure compatible SQL for H2 and PostgreSQL variants if split migration
   pattern is used in this repo.

## Backend DTO Updates

## `DisplaySummaryResponse`

Add field:

- `themeId: String`

## `UpdateDisplayRequest`

Add field:

- `themeId: String` (nullable in PATCH semantics)

Validation:

1. If provided, must be in allowed theme id set.
2. Empty/blank treated as validation error, not silent null.

## Optional Enrollment DTO

If initial theme assignment at approval time is desired:

- Add `themeId` to `ApproveEnrollmentRequest`.
- Otherwise default to `default` for newly approved displays.

## Service Layer Rules

In `DisplayEnrollmentService.updateDisplay(...)`:

1. If request includes `themeId`, validate and persist.
2. Include `themeId` in audit metadata for `DISPLAY_UPDATED` events.

## API Surface

Impacted endpoints:

1. `GET /api/admin/displays`
2. `GET /api/admin/displays/{displayId}`
3. `PATCH /api/admin/displays/{displayId}`
4. `GET /api/displays/session` (recommended to include `themeId` to avoid
   additional fetch)

## Frontend Type Updates

Update `Frontend/src/lib/api/displays.ts` interfaces:

1. `DisplaySummaryResponse` add `themeId`.
2. `UpdateDisplayRequest` add `themeId`.
3. `DisplaySessionValidationResponse` add `themeId` if endpoint extended.

## Example Payloads

## GET display detail response

```json
{
  "id": "display-123",
  "name": "Lobby 1",
  "slug": "lobby-1",
  "locationLabel": "Main Entrance",
  "status": "ACTIVE",
  "assignedProfileId": null,
  "themeId": "default",
  "updatedAt": "2026-03-07T12:34:56Z"
}
```

## PATCH request

```json
{
  "themeId": "brutalist-high-density"
}
```

## Display session response (recommended)

```json
{
  "valid": true,
  "displayId": "display-123",
  "displaySlug": "lobby-1",
  "assignedProfileId": null,
  "themeId": "brutalist-high-density",
  "redirectPath": "/display/display-123"
}
```

## Theme Catalog Contract

Recommendation: expose allowed themes via backend endpoint for admin UI:

- `GET /api/admin/display-themes`

Response:

```json
{
  "themes": [
    { "id": "default", "label": "Default", "status": "ACTIVE" },
    {
      "id": "brutalist-high-density",
      "label": "Brutalist High Density",
      "status": "ACTIVE"
    }
  ]
}
```

If not implemented now, maintain a shared constant between admin UI and display
runtime to avoid ID drift.
