# Display Admin Access

This project uses Spring Security session authentication for display-admin endpoints.

## How admin authentication works

- Admin users log in at `POST /api/admin/auth/login` with username/password.
- Authenticated session state is stored server-side and tracked by `JSESSIONID`.
- Admin API routes under `/api/admin/**` require `ROLE_ADMIN`.
- Admin UI should call `GET /api/admin/auth/csrf` and include CSRF token on state-changing requests.

## Configure secure admin bootstrap

Use bootstrap only for first setup in local/dev or controlled recovery:

1. Environment variables (recommended):
   - `SECURITY_ADMIN_BOOTSTRAP_ENABLED=true`
   - `SECURITY_ADMIN_BOOTSTRAP_USERNAME=admin`
   - `SECURITY_ADMIN_BOOTSTRAP_PASSWORD=<strong-password>`
2. Disable bootstrap after creating permanent admin users.

## Important notes

- No static `X-Admin-*` header authentication is used anymore.
- Never commit admin credentials to source control.
- Restrict `SECURITY_CORS_ALLOWED_ORIGINS` explicitly.
