# 02 Technical Architecture

## Current Baseline

- Display runtime route: `Frontend/src/components/display/DisplayPage.tsx`.
- Main dashboard composition: `Frontend/src/components/DashboardPage.tsx`.
- Admin display management route: `Frontend/src/routes/admin.displays.$displayId.tsx`.
- Backend display aggregate: `DisplayEntity`, `DisplayEnrollmentService`,
  `UpdateDisplayRequest`, `DisplaySummaryResponse`.

## Proposed Architecture

### 1. Theme Registry (Frontend)

Create a centralized theme registry, for example:

- `Frontend/src/components/display/themes/registry.ts`

Registry defines:

- Theme id (`default`, `brutalist-high-density`, ...).
- Human label and description.
- React renderer component.
- Capability metadata (optional, docs/testing only).

Only registry-listed themes are selectable/admin-updatable.

### 2. Shared Display Data Composition

Keep data-fetching logic and domain mapping independent of theme styling.

Introduce a theme-agnostic data layer:

- Shared hooks/query adapters for substitution/calendar/weather/transport/holidays.
- Normalized view model consumed by any theme.

Result: themes change presentation only, not business/data behavior.

### 3. Theme Runtime Selection

`DisplayPage` obtains display session data and reads `themeId`.

Flow:

1. Resolve `themeId` from validated display session payload.
2. Lookup renderer in registry.
3. Render selected theme.
4. Fallback to `default` if missing/invalid.

### 4. Module Composition Contract

Define a stable rendering contract for all theme components, e.g.

`DisplayThemeProps`:

- `substitution`
- `weather`
- `transportation`
- `calendarEvents`
- `holidays`
- `clock/date`
- `displayContext`

Every theme component must render each section.

### 5. Backend Domain Extension

Extend display domain with `theme_id` (string enum-like constrained values).

Update:

- `DisplayEntity`
- DTOs (`DisplaySummaryResponse`, `UpdateDisplayRequest`, optionally
  `ApproveEnrollmentRequest` for initial assignment)
- service mapping and validation
- Flyway migrations (H2 + PostgreSQL compatibility)

### 6. Admin UI Extension

`/admin/displays/$displayId` adds a `Theme` select control with registry-backed
choices fetched from backend or mirrored static allowlist.

Recommendation: backend remains source of truth for allowed values.

## Decision: Controlled Theme IDs

Do not persist arbitrary CSS/theme blobs in DB. Persist only compact IDs.

Reason:

1. Prevent broken/untrusted theme payloads.
2. Keep migrations and rollback simple.
3. Ensure deterministic behavior in kiosk devices.

## Compatibility and Fallback

1. Existing displays default to `default` on migration.
2. Missing theme id in older payloads treated as `default`.
3. Unknown id triggers warning and `default` renderer.

## Performance Considerations

1. Lazy-load non-default theme bundles if bundle growth becomes significant.
2. Keep animation costs bounded for kiosk devices (GPU-safe transforms,
   avoid excessive reflow).
3. Preserve existing auto-refresh and auto-scroll behavior unless explicitly
   redesigned per theme.
