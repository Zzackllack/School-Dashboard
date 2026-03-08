# 05 Implementation Plan

## Workstream A: Backend Data Model and Contracts

1. Add `theme_id` to `DisplayEntity` with default `default`.
2. Update constructor and mapping paths in `DisplayEnrollmentService`.
3. Extend DTOs:
   - `DisplaySummaryResponse`
   - `UpdateDisplayRequest`
   - `DisplaySessionValidationResponse` (recommended)
4. Add validation for allowed theme ids in service layer.
5. Add/extend Flyway migration(s) for H2 and PostgreSQL support.
6. Extend audit metadata to include `themeId` when updated.

Deliverable:

- Theme id persisted and returned by admin/session APIs.

## Workstream B: Frontend Admin Theme Assignment

1. Update API types in `Frontend/src/lib/api/displays.ts`.
2. Add `themeId` into admin display detail form state.
3. Add `Theme` select input in `admin.displays.$displayId.tsx`.
4. Submit `themeId` through existing update API call.
5. Show persisted value after successful update.

Deliverable:

- Admin can assign theme per display.

## Workstream C: Frontend Theme Runtime

1. Introduce `DisplayThemeProps` and normalized display data adapters.
2. Extract current UI into `default` theme renderer.
3. Implement first new theme from examples (recommended id:
   `brutalist-high-density`).
4. Create theme registry and runtime selection in `DisplayPage`.
5. Add fallback-to-default behavior for unknown ids.

Deliverable:

- Display route renders by persisted theme id with safe fallback.

## Workstream D: Theme-Example Translation

1. Use `examples/1.html.example` as primary baseline for first theme.
2. Bring in visual ideas from examples 2 and 3 where compatible:
   - column page-state signaling
   - sidebar module rhythm
   - contrast-heavy status labels
3. Keep module content complete and data-driven.

Deliverable:

- New visually distinct theme with complete module parity.

## Workstream E: Automated Verification

1. Backend unit tests:
   - request validation for theme id
   - mapping includes theme id
2. Backend integration tests:
   - PATCH display theme persists
   - GET returns theme id
3. Frontend unit tests:
   - admin form includes theme selector
   - runtime theme resolver fallback behavior
4. Frontend integration tests:
   - display page renders chosen theme marker/structure
5. Playwright e2e:
   - set theme via admin flow, open display, verify modules visible
   - repeat for default and new theme

Deliverable:

- Confidence that theme changes are visual-only and non-regressive.

## Suggested Implementation Order

1. Backend model + DTO + API tests.
2. Frontend admin form + tests.
3. Theme registry + default extraction + tests.
4. New theme implementation + visual tests.
5. End-to-end regression suite.

## Definition of Done

1. Theme is configurable per display in admin UI.
2. Display runtime uses selected theme.
3. Both themes render all required modules.
4. Test suite updated and passing in backend + frontend + e2e.
5. Spec checklist in `04-theme-authoring-guide.md` satisfied.
