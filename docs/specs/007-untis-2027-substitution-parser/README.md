# Spec 007: Untis 2027 substitution-plan parser compatibility

## Status

- Investigation: complete
- Root cause: confirmed against production, a local end-to-end run, current
  upstream HTML, and archived HTML
- Implementation: not started
- Production changes: none
- Repository changes covered by this spec: documentation only
- Incident snapshot: 8 September 2026, Europe/Berlin

## Purpose

This specification is the implementation handoff for the production incident
in which the school displays show the current plan dates and daily notices but
no substitution rows, even though the official DSBmobile application contains
current changes.

The failure is caused by HTML contract drift. The school now publishes an
Untis 2027 substitution-plan layout that groups records below separate
`inline_header` rows. The backend parser was written for the previous Untis
2026 layout, where every data row contained its own `Klasse(n)` cell. The
parser therefore emits classless records, and the frontend correctly removes
them as malformed.

The required repair is a backward-compatible backend parser update, accompanied
by representative tests and a safer publish/fallback boundary. It is not a
frontend filtering workaround and does not require a database migration.

## Incident in one causal chain

```text
Untis export changes from a 9-column row layout to a 6-column grouped layout
  -> class moves from each data row into td.inline_header
  -> the backend still treats every odd/even row as a substitution
  -> group headers become fake entries and real entries have classes = null
  -> the backend logs non-zero row counts and publishes the malformed payload
  -> the frontend sanitizer rejects every entry without a class
  -> each plan renders as "Keine Vertretungen fuer dieses Datum verfuegbar"
```

## Scope

In scope:

- support both the historic Untis 2026 table shape and the observed Untis 2027
  grouped table shape;
- preserve class context from `inline_header` rows;
- stop counting grouping rows as substitution records;
- map the new `Text` column to the existing `comment` API field;
- reject structurally malformed refreshes before replacing known-good data;
- retain the existing public API contract and frontend sanitizer;
- add unit, integration, web, and production verification coverage;
- document rollout, rollback, observability, privacy, and future contract-drift
  mitigation.

Out of scope:

- redesigning the dashboard or its substitution table;
- replacing DSBmobile or the existing unofficial DSB client;
- changing display enrollment or kiosk networking;
- changing the database schema;
- committing live school-plan contents, teacher abbreviations, credentials, or
  unguessable DSB document identifiers;
- parsing arbitrary Untis layouts that have not been observed or specified.

## Specification set

1. [01-incident-analysis-and-evidence.md](./01-incident-analysis-and-evidence.md)
2. [02-technical-remediation-spec.md](./02-technical-remediation-spec.md)
3. [03-testing-validation-and-rollout.md](./03-testing-validation-and-rollout.md)
4. [04-resilience-and-operations.md](./04-resilience-and-operations.md)
5. [05-implementation-handoff.md](./05-implementation-handoff.md)

## Non-negotiable decisions

1. Fix the producer of malformed data, not the frontend symptom.
2. Do not remove the requirement that renderable substitutions have a class.
3. Keep support for the old nine-column layout.
4. Treat `inline_header` rows as context, never as substitutions.
5. Do not publish a structurally invalid partial refresh over known-good data.
6. Keep fixtures synthetic or irreversibly redacted.
7. Verify the final behavior through the real production request path and on at
   least one enrolled kiosk before declaring the incident resolved.

## Expected implementation footprint

The repair should primarily touch:

- `Backend/src/main/java/com/schooldashboard/service/SubstitutionPlanParserService.java`
- `Backend/src/main/java/com/schooldashboard/service/SubstitutionPlanService.java`
- parser and service tests under `Backend/src/test/`

The frontend should normally require tests only. Its sanitizer is a useful
last-line defense and should remain in place.

## Source index

Repository sources:

- `Backend/src/main/java/com/schooldashboard/service/SubstitutionPlanParserService.java`
- `Backend/src/main/java/com/schooldashboard/service/SubstitutionPlanService.java`
- `Backend/src/main/java/com/schooldashboard/service/SubstitutionPlanPersistenceService.java`
- `Backend/src/main/java/com/schooldashboard/controller/SubstitutionController.java`
- `Frontend/src/lib/api/dashboard.ts`
- `Frontend/src/lib/proxy/proxy-get-handler.ts`
- `Frontend/src/components/SubstitutionPlanDisplay.tsx`
- `Backend/src/test/java/com/schooldashboard/service/SubstitutionPlanParserServiceTest.java`
- `Backend/src/test/java/com/schooldashboard/service/SubstitutionPlanParserServiceIntegrationTest.java`
- `Frontend/src/lib/api/dashboard.unit.test.ts`

Runtime and external sources:

- [authenticated Coolify runtime logs supplied by the project owner](https://zlc.zacklack.de/project/t0w84kcsccwswkwgc8g8goo4/environment/bo4wwwo0ws0kksskso08808g/application/d4c4kw8kcs0o4gsgc0o04044/logs);
- public frontend API:
  `https://goethe-dashboard.zacklack.de/api/substitution/plans`;
- public backend API:
  `https://goethe-dashboard-springbackend.zacklack.de/api/substitution/plans`;
- current DSBmobile HTML documents discovered through the authenticated DSB
  timetable response;
- archived raw HTML in the local read-only H2 database;
- jsoup selector and element documentation:
  <https://jsoup.org/cookbook/extracting-data/selector-syntax> and
  <https://jsoup.org/apidocs/org/jsoup/nodes/Element.html>.

Exact live DSB document URLs and their contents are intentionally omitted from
this public-repository specification because they contain operational
identifiers and school-plan data. The investigation commands in the following
documents use placeholders for those values.
