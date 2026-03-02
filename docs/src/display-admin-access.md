# Display Admin Access

This project uses a shared admin API token for display-admin endpoints.

## How admin authentication works

- Every admin API call requires `X-Admin-Token`.
- Backend validates this token in `AdminAuthService`.
- Admin UI pages (`/admin/displays`, `/admin/displays/pending`) send this header from the token field in the page.

## Configure the admin token

You can define the token in either of these ways:

1. Environment variable (recommended):
   - `DISPLAY_ADMIN_AUTH_API_TOKEN=your-strong-secret`
2. `application.properties`:
   - `display.admin-auth.api-token=your-strong-secret`

Spring Boot relaxed binding maps:
- `display.admin-auth.api-token` <-> `DISPLAY_ADMIN_AUTH_API_TOKEN`

## Important notes

- Current code defaults to `dev-admin-token` when nothing is configured.
- Do not use the default in staging/production.
- Treat the token like a secret and rotate it if leaked.

