# 06 Testing, Rollout, and Risk

## Test Strategy

## Backend

1. Unit test: invalid `themeId` rejected with 400-domain error.
2. Unit test: missing `themeId` in PATCH keeps existing value.
3. Integration test: migration sets existing displays to `default`.
4. Integration test: display session response includes assigned theme.

## Frontend

1. Unit test: admin display detail loads/saves `themeId`.
2. Unit test: unknown theme id resolves to `default` renderer.
3. Integration test: selected theme component receives populated shared props.
4. Integration test: module placeholders/errors rendered consistently in all
   themes.

## E2E (Playwright)

1. Admin updates display to new theme.
2. Display route loads and shows theme-specific layout marker.
3. Substitution data from fixture is visible and readable.
4. Sidebar modules visible: weather, transport, calendar, holidays.
5. Repeat with theme switched back to default.

## Fixtures and Edge Cases

Use substitution fixtures including:

1. Multi-page date labels.
2. Empty row objects.
3. Long comments.
4. Mixed entry types.

Also cover API failures per module to validate resilient rendering.

## Rollout Plan

1. Deploy backend migration + API changes with default fallback behavior.
2. Deploy frontend with both themes but leave displays on `default`.
3. Pilot one low-risk display with new theme.
4. Monitor readability/performance and operator feedback.
5. Gradually assign additional displays.

## Rollback Plan

1. Immediate: set affected display `themeId` back to `default` in admin.
2. If systemic: disable new theme from registry and redeploy frontend.
3. Keep DB values; fallback logic ensures safe render behavior.

## Risks and Mitigations

1. Risk: new theme misses a module.
   Mitigation: parity checklist + e2e assertions per module.
2. Risk: broken theme id causes blank screen.
   Mitigation: runtime fallback to default + warning logging.
3. Risk: larger frontend bundle affects load.
   Mitigation: optional lazy-loading and bundle checks.
4. Risk: visual legibility on lobby screens.
   Mitigation: pilot rollout + contrast/font-size review.
