# 05 Implementation handoff

## Handoff objective

Implement the smallest production-safe change that restores current
substitution rows, remains compatible with archived Untis 2026 documents, and
prevents another malformed source refresh from silently replacing valid data.

This document is ordered for an implementation agent. Read the complete spec
set before editing code.

## Ground truth

- Branch containing this specification:
  `zzackllack-aux/spec-untis-2027-parser-drift`
- Investigated application commit:
  `4036f826a5dc10cc6ff0ab5393624d26cd3031ee`
- Primary defect:
  `SubstitutionPlanParserService` does not support grouped class headers.
- Secondary defect:
  the current `Text` column is not mapped to `comment`.
- Safety defect:
  non-empty malformed and potentially partial plans can be published.
- Frontend status:
  its sanitizer behaves correctly and should stay enabled.
- Infrastructure status during investigation:
  backend healthy, public frontend and backend APIs reachable, no-cache path
  working.

Live counts and detail URLs are time-sensitive. Re-discover them; do not copy
incident-era identifiers into implementation code or tests.

## Required reading

Before implementation, inspect:

- this complete `docs/specs/007-untis-2027-substitution-parser/` directory;
- `AGENTS.md`;
- `docs/agents/backend.md`;
- `docs/agents/testing.md`;
- `docs/agents/security.md`;
- the parser, refresh service, persistence service, controller, frontend
  sanitizer, display component, and their tests.

Use current official jsoup documentation for selector/direct-child behavior.

## Recommended implementation sequence

### Task 1: Add sanitized source fixtures

Create one old-format and one grouped-format fixture before changing the parser.
Add malformed and empty fixtures as required by the test plan.

Run the current parser against the grouped fixture and capture the expected
failing assertion:

- wrong row count;
- missing classes;
- missing `Text` comment.

Do not commit a live production document.

### Task 2: Refactor header mapping

Replace string field identifiers with a small enum or similarly type-safe
mapping. Add normalized aliases for both formats.

Do not change the API model.

### Task 3: Introduce row classification

Separate group-context rows from data rows.

For a group-context row:

- update active class context;
- add no entry.

For a data row:

- map direct cells by header;
- use explicit class when present;
- otherwise use active group class;
- validate before adding.

### Task 4: Add parse diagnostics and validity

Return or expose structured information that distinguishes:

- explicit format;
- grouped format;
- confirmed empty plan;
- unsupported/malformed plan.

Count source rows, group rows, data rows, valid entries, and skipped rows.

### Task 5: Make multi-page publication safe

Update `SubstitutionPlanService` so all pages of a day group must parse before
that refresh becomes publishable. Sort pages deterministically.

Retain the previous response cache and `latestPlans` when the refresh is
invalid.

### Task 6: Add service and web coverage

Test valid refresh, invalid refresh fallback, incomplete multi-page data,
controller output, and startup/no-cache behavior as specified.

Ensure Spring tests do not contact live DSBmobile.

### Task 7: Add frontend regression coverage

Confirm repaired records survive sanitization and visibly render. Do not weaken
the sanitizer.

### Task 8: Run all quality gates

Run backend tests/package, frontend unit/integration/web tests, typecheck, lint,
build, formatting checks, and `git diff --check`.

### Task 9: Perform current-source local validation

Use an in-memory database and ignored credentials. Compare privacy-safe
structural counts against the live source at that time.

Do not assume the 8 September counts are still current.

### Task 10: Prepare a narrow PR

The PR should explain:

- old and new source contracts;
- why the backend is the repair boundary;
- fallback/publication safety;
- tests and current-source validation;
- production rollout and rollback.

Keep unrelated dependency updates and UI redesign out of the PR.

## Candidate file changes

Expected:

- `Backend/src/main/java/com/schooldashboard/service/SubstitutionPlanParserService.java`
- `Backend/src/main/java/com/schooldashboard/service/SubstitutionPlanService.java`
- `Backend/src/test/java/com/schooldashboard/service/SubstitutionPlanParserServiceTest.java`
- `Backend/src/test/java/com/schooldashboard/service/SubstitutionPlanParserServiceIntegrationTest.java`
- new sanitized HTML fixtures under `Backend/src/test/resources/`
- service/controller tests needed for publish/fallback behavior
- `Frontend/src/lib/api/dashboard.unit.test.ts`
- `Frontend/src/components/SubstitutionPlanDisplay.integration.test.tsx`
- possibly an existing Playwright display test

Possible, only if justified:

- `ParsedPlanDocument.java` or a new internal parse-result type;
- a dedicated parse exception;
- metrics/health support already consistent with the repository.

Not expected:

- database migrations;
- changes to `DsbMobileClient`;
- removal of frontend sanitization;
- Cloudflare configuration changes;
- kiosk enrollment changes;
- NetBird, DNS, or Coolify environment changes.

## Definition of done checklist

### Parser

- [ ] Old explicit-class format parses.
- [ ] New grouped-class format parses.
- [ ] Group rows create no entries.
- [ ] Group context is inherited by every following data row.
- [ ] Multiple rows per group work.
- [ ] Context changes cleanly at the next group.
- [ ] `Text` maps to `comment`.
- [ ] Unknown headers cannot shift known fields.
- [ ] Direct cells are used for positional mapping.
- [ ] Unsupported non-empty documents fail explicitly.
- [ ] Legitimately empty documents are recognized from a fixture.

### Service

- [ ] Page order is deterministic.
- [ ] All pages are required before publishing a day.
- [ ] Invalid data does not replace `latestPlans`.
- [ ] Invalid data does not replace the persisted API cache.
- [ ] Fallback is explicit in logs/diagnostics.
- [ ] Logs distinguish source, group, data, valid, and skipped row counts.

### Frontend

- [ ] Sanitizer remains enabled.
- [ ] Repaired rows survive sanitization.
- [ ] Current substitutions render.
- [ ] Empty state is absent when valid rows exist.
- [ ] No-cache proxy behavior remains.

### Quality and privacy

- [ ] Backend unit tests pass.
- [ ] Backend integration/web tests pass.
- [ ] Backend package succeeds.
- [ ] Frontend unit tests pass.
- [ ] Frontend integration tests pass.
- [ ] Frontend web tests pass.
- [ ] Frontend typecheck, lint, and build pass.
- [ ] Formatting and diff checks pass.
- [ ] No live plan data, credentials, tokens, or detail identifiers are added.
- [ ] Worktree contains no unrelated changes.

### Production

- [ ] Previous backend artifact/commit is recorded.
- [ ] Backend-only deployment succeeds.
- [ ] First refresh recognizes the current format.
- [ ] Direct backend response has zero missing classes.
- [ ] Cloudflare proxy response matches the backend structurally.
- [ ] Controlled display shows current changes.
- [ ] Physical kiosk shows current changes.
- [ ] Two refresh cycles remain healthy.
- [ ] Post-rollout evidence is recorded without sensitive data.

## Review traps

Reviewers should explicitly reject a change that:

- merely removes the frontend class check;
- turns `inline_header` rows into records;
- maps trailing group-description text into `absent`;
- hard-codes only today's class list;
- assumes six fixed columns without retaining old-format support;
- publishes a day after only one of its pages parsed;
- treats any zero-entry result as valid;
- logs full DSB URLs or source rows;
- uses live network calls in CI.

## Open implementation decisions

These decisions may be made during implementation, but must be documented in
the PR:

1. Whether parser diagnostics extend `ParsedPlanDocument` or use a new type.
2. The exact class-context extraction helper and fallback behavior.
3. The exact producer-specific signal for a legitimate empty plan.
4. Whether raw invalid documents are persisted for diagnostics.
5. Whether the first repair includes bounded metrics or only structured logs.
6. The maximum age and user-visible treatment of known-good fallback data.

Defaults if no stronger repository evidence exists:

- prefer a typed parse result;
- match a known affected-class prefix, then use a conservative first-token
  fallback;
- derive empty-plan recognition from a sanitized real sample;
- permit forensic raw persistence without API publication;
- add structured logs now and metrics only if the existing stack makes them
  small;
- retain same-date fallback and avoid silently presenting it across a date
  boundary.

## Final verification statement template

Use a statement like this after implementation and rollout:

```text
The parser now supports both explicit and grouped Untis table layouts.
Synthetic old/new fixtures, malformed-input fallback tests, service/controller
tests, and frontend rendering tests pass. At deployment time, the direct backend
and Cloudflare API paths returned the same current plans with zero classless
entries. A controlled display and one physical kiosk matched the official
application through two scheduled refreshes. No database, DNS, NetBird, or
kiosk-enrollment change was required.
```
