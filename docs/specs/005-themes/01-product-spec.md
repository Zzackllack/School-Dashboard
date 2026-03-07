# 01 Product Spec

## Problem Statement

Displays currently share one visual theme. School operations require assigning
specific visual themes per display (for example lobby display vs. hallway
screen) while keeping identical informational coverage.

## Goals

1. Admin can choose a theme per display from a controlled list.
2. Selected theme applies immediately after display refresh and consistently on
   session validation redirect.
3. Every theme shows all required information modules with no functional loss.
4. If a theme is invalid/unknown, display safely falls back to default theme.

## Non-Goals

1. No drag-and-drop layout editor.
2. No per-display module hiding.
3. No remote/user-uploaded theme code.

## User Stories

1. As an admin, I open a display detail and set `Theme` to a new value so that
   this physical display uses a different visual style.
2. As a viewer, I still see complete school information (substitutions,
   weather, transport, calendar, holidays) regardless of theme.
3. As an operator, I can safely roll back a theme assignment to `default` if
   a new theme misbehaves.

## Functional Requirements

1. Add theme field to display domain model and admin update flow.
2. Admin display detail page must expose a deterministic theme selector.
3. Display runtime selects renderer by theme id and passes shared normalized
   data into theme-specific components.
4. Theme registry must define allowed theme ids and metadata.
5. Unknown theme id from backend must not crash render pipeline.
6. Theme authoring process must enforce module parity checklist.

## Required Module Parity (Hard Requirement)

Each theme must include all of these data modules:

1. Substitution plan (including all entry types and comments).
2. Weather (current + short forecast).
3. Transportation departures (nearest/public transport data).
4. Calendar events.
5. Upcoming holidays.
6. Time/date context and display identification context currently shown in UI.

## Data Compatibility Requirements

Given substitution payloads like the provided sample, themes must support:

1. Multiple dates/pages (`Seite 1 / 2`, `Seite 2 / 2`).
2. Mixed entry types (`Entfall`, `Vertr.`, `S. Vertr.`, `Verlegung`,
   `Raumänd.`, `EVA`, `Veranst.`, `Unterricht geändert`, `findet statt`).
3. Empty/partial rows without crashing.
4. Long comments and room lists.
5. Class group strings with commas and ranges.

## Success Metrics

1. 100% of active displays can be assigned a theme without manual DB edits.
2. 0 regressions in module-level data fetch and rendering tests.
3. E2E scenarios pass for both `default` and newly introduced theme.
4. Rollback to default theme possible via admin UI only.

## Acceptance Criteria

1. Admin sees and can persist a theme selection on display detail page.
2. `GET /api/admin/displays` and `GET /api/admin/displays/:id` return theme id.
3. `PATCH /api/admin/displays/:id` accepts a theme id and validates allowed
   values.
4. `/display/:displayId` renders the selected theme and all modules.
5. Invalid/unknown persisted theme renders default with warning log.
