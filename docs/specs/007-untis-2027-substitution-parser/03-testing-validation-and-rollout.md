# 03 Testing, validation, and production rollout

## Test principle

The repair is complete only when it proves all of the following:

1. the old explicit-class format still parses;
2. the new grouped-class format parses;
3. grouping rows never become API records;
4. malformed source does not replace known-good data;
5. the frontend keeps and renders the repaired records;
6. production serves current valid records through the Cloudflare path;
7. at least one enrolled kiosk shows the same current changes.

Tests must be deterministic and use synthetic or irreversibly redacted input.
Live DSB endpoints are a deployment verification source, not a CI dependency.

## Fixture strategy

Create small fixtures under an appropriate backend test-resource directory,
for example:

```text
Backend/src/test/resources/substitution-plans/
  untis-2026-explicit-columns.html
  untis-2027-grouped-columns.html
  untis-2027-grouped-multiple-pages-page-1.html
  untis-2027-grouped-multiple-pages-page-2.html
  untis-empty-plan.html
  untis-unsupported-layout.html
```

Fixture requirements:

- retain the original DOM hierarchy;
- retain `mon_title`, `info`, `mon_list`, `list odd/even`, and
  `inline_header` classes;
- retain relevant `colspan` values;
- retain nested formatting such as `<b>` or `<s>` where parsing depends on
  text normalization;
- replace every real teacher, class, subject, room, comment, UUID, and tenant
  identifier with synthetic data;
- include no credentials or authenticated responses;
- explain the fixture's structural origin in a short comment or test name.

Do not commit a complete current production document and call it a fixture.

## Backend unit tests

### Existing explicit-class format

Retain and strengthen the existing test.

Assert:

- one old-format data row produces one entry;
- `Klasse(n)` maps to `classes`;
- `Stunde`, `abwesend`, `Vertreter`, `(Fach)`, `Fach`,
  `neuer Raum`, `Art`, and `Bemerkungen` map correctly;
- nested formatting yields normalized readable text;
- no recognized value shifts into an adjacent field.

### Grouped-class format

Use at least two groups and multiple data rows in one group.

Assert:

- group headers produce zero entries;
- each data row inherits the active class;
- class context changes at the next group header;
- the first group's records do not leak into the second group;
- `Text` maps to `comment`;
- absent and original-subject fields remain empty when not supplied;
- output order matches source data-row order;
- the entry count equals data rows, not odd/even rows.

### Upper-grade group

Assert that a label with trailing semester description yields the intended grade
identifier without putting the semester text in `classes`.

### Leading-zero class

Assert the decided normalization behavior for a source label such as a
zero-padded lower-grade class.

### Unknown but plausible class identifier

Ensure extraction does not hard-code only GGL grades if a safe fallback can
preserve the source identifier.

### Grouped data row before any group header

The parser must classify the document as invalid or skip the row and fail the
document validity gate. It must not invent a class.

### Blank group header

The parser must not reuse an older group's class after encountering an empty
new group marker.

### Unknown header

An extra unknown column must not shift recognized fields. The result should
retain known data and record the unknown normalized header in diagnostics.

### Unsupported non-empty table

A table with data rows but no recognizable contract must result in an explicit
invalid/unsupported outcome, not a valid empty plan.

### Legitimate empty plan

Use a real, sanitized example of the producer's empty-plan structure. Assert it
is distinguishable from parser failure.

### Direct-cell behavior

Include nested markup in one cell and, if useful, a nested table. Assert that
nested descendants do not become extra positional cells.

## Backend service tests

### Fully valid refresh

Given two valid page documents:

- both are parsed;
- entries are merged in page order;
- `latestPlans` is replaced once;
- the API response cache is updated once with the complete result.

### One page fails

Given a two-page group where page two is unsupported:

- the partial day is not published;
- the previously known-good response remains available;
- the API response cache is not overwritten;
- the refresh records fallback usage.

### All parsed rows are invalid

Assert that a non-empty list of classless entries cannot pass the publication
gate.

### Upstream fetch fails

Retain the existing fallback behavior and verify it remains distinct from a
parser-contract failure.

### Page ordering

Supply timetable descriptors out of order and assert deterministic page-number
ordering in the merged result.

### No previous payload

If the first-ever refresh is invalid:

- return an empty public result or an explicit existing API-safe fallback;
- log the unsupported state;
- never persist the malformed payload as the known-good cache.

## Backend integration and web tests

Use an embedded HTTP server to serve the synthetic fixtures.

Required coverage:

1. parser fetches and parses the old format over HTTP;
2. parser fetches and parses the grouped format over HTTP;
3. the service combines multiple grouped pages;
4. `GET /api/substitution/plans` returns non-blank classes;
5. the endpoint retains its existing status and JSON shape;
6. invalid refresh followed by an API request returns the previous valid cache;
7. CORS and security policy for the public endpoint remain unchanged.

The Spring integration test must disable or replace unrelated scheduled DSB
network activity reliably. The existing
`spring.task.scheduling.enabled=false` test property did not prevent every
observed scheduled method from running during the diagnostic test invocation,
so the implementation agent should verify the Boot 4 mechanism or mock
`DsbClient` in the test context. Tests must not contact the live DSB login
endpoint.

## Frontend tests

### Dashboard API unit test

Pass a repaired grouped-layout API payload through
`substitutionPlansQueryOptions`.

Assert:

- records with inherited classes survive sanitization;
- malformed classless structural records remain filtered;
- the five-minute refetch interval remains configured.

### Component integration test

Render `SubstitutionPlanDisplay` with a representative repaired response.

Assert:

- both class groups appear;
- multiple substitutions under one group appear;
- a `Text` comment appears in the comments column;
- the per-date empty message does not appear;
- cancellation and substitution types retain their established styling.

### Route/proxy integration test

Verify the frontend API route forwards the repaired payload without caching or
shape changes.

### Browser/E2E test

Using an enrolled or mocked display session:

1. open the display route;
2. fulfill the substitution API with a repaired response;
3. verify at least one substitution row is visible;
4. verify the empty-state sentence is absent;
5. advance/refetch or reload and verify updated data replaces the first result.

## Static quality gates

At minimum run:

```bash
cd Backend
mvn -q test
mvn -q package -DskipTests

cd ../Frontend
pnpm run typecheck
pnpm run lint
pnpm run test:unit
pnpm run test:integration
pnpm run test:web
pnpm run build

cd ..
pnpm run format:check
git diff --check
```

Follow the repository's normal CI matrix if it is stricter at implementation
time.

## Local runtime validation

Use the ignored local credentials, never print them. Use an in-memory database
unless persistence itself is under test:

```bash
cd Backend
SPRING_DATASOURCE_URL='jdbc:h2:mem:untis-compat;DB_CLOSE_DELAY=-1' \
  mvn -q spring-boot:run
```

After the scheduled refresh:

```bash
curl -sS http://127.0.0.1:8080/api/substitution/plans \
  | jq '[.[] | {
      date,
      entries: (.entries | length),
      missing_classes: ([.entries[] | select(.classes == null or .classes == "")] | length)
    }]'
```

Expected invariant:

```text
entries > 0 when the source has changes
missing_classes = 0
```

The incident snapshot produced 31 and 17 actual rows. Those exact counts are
historical evidence, not permanent assertions; live plan contents will change.

Run the frontend locally and verify its proxy:

```bash
pnpm --dir Frontend run dev

curl -sS http://127.0.0.1:3000/api/substitution/plans \
  | jq '[.[] | {
      date,
      entries: (.entries | length),
      classes: ([.entries[].classes] | unique)
    }]'
```

## Pre-production comparison procedure

Immediately before deployment, capture a privacy-safe structural baseline from
the current source:

- generator metadata;
- normalized headers;
- number of group rows;
- number of actual data rows;
- number of pages per day;
- no raw cell contents.

Run the candidate parser against those same documents and assert:

- output count equals actual data-row count;
- every output entry has a class;
- comments are populated when `Text` cells are non-empty;
- no group label appears as a period-only record.

If the source contract changes again before deployment, stop and update the
fixture/spec instead of deploying assumptions based on the September snapshot.

## Production rollout plan

### Stage 0: Prepare rollback

Before changing production:

- record the currently deployed commit;
- confirm the last known-good backend artifact or commit is deployable;
- record current application and server health;
- confirm access to runtime and deployment logs;
- do not delete the persisted API cache or raw documents.

### Stage 1: Deploy backend only

The functional fix should require only a backend deployment. Do not redeploy the
frontend unless frontend tests or documentation changes produce a separate
necessary change.

Avoid unrelated dependency or infrastructure changes in the incident PR.

### Stage 2: Observe the first refresh

The backend initializes a refresh shortly after startup and then runs every five
minutes.

Verify the logs report:

- recognized grouped or explicit format;
- expected source and group-row counts;
- non-zero valid entries when the source contains changes;
- zero invalid groups;
- `published=true`;
- `fallbackUsed=false`.

### Stage 3: Verify the direct backend API

```bash
curl -sS \
  https://goethe-dashboard-springbackend.zacklack.de/api/substitution/plans \
  | jq '[.[] | {
      date,
      entries: (.entries | length),
      missing_classes: ([.entries[] | select(.classes == null or .classes == "")] | length)
    }]'
```

Do not paste the full response into public CI logs.

### Stage 4: Verify the Cloudflare frontend API

Repeat the structural check against:

```text
https://goethe-dashboard.zacklack.de/api/substitution/plans
```

Compare hashes or privacy-safe projections of both responses. They should agree
on plan dates, counts, class presence, and data fields.

Confirm no-store/no-cache headers remain present.

### Stage 5: Verify a controlled enrolled display

On one enrolled non-public test display or a controlled kiosk:

- wait for the normal reload or reload once manually;
- confirm current plan dates;
- compare several visible substitutions with the official application;
- verify class, period, subject, room, type, and available text;
- verify page auto-scroll still reaches later rows;
- observe one five-minute refresh.

### Stage 6: Verify physical kiosks

Confirm at least one real school kiosk through its actual network, session, and
browser path. A successful request from a developer machine is not proof of
kiosk recovery.

No kiosk re-enrollment, DNS edit, NetBird policy change, or browser cache purge
should be necessary.

### Stage 7: Soak

Observe at least two scheduled refresh cycles. If both remain valid and the
kiosk matches the official plan, complete the incident.

## Acceptance criteria

- AC-001: Historic explicit-class fixtures still parse.
- AC-002: Current grouped-class fixtures parse.
- AC-003: Group headers create no API entries.
- AC-004: Every valid grouped data row inherits the correct class.
- AC-005: `Text` maps to `comment`.
- AC-006: A non-empty unsupported table cannot be published as success.
- AC-007: A failed page cannot produce a published partial day.
- AC-008: The existing frontend sanitizer remains enabled.
- AC-009: Direct backend and frontend proxy APIs agree structurally.
- AC-010: Production responses have zero missing classes.
- AC-011: A controlled display renders current rows.
- AC-012: A physical kiosk matches current official-app changes.
- AC-013: Two scheduled refreshes complete without fallback or schema warnings.
- AC-014: No sensitive raw plan fixture or token is committed.

## Rollback triggers

Rollback immediately if:

- valid entries fall back to zero while the source contains changes;
- class context is attached to the wrong records;
- one day's records leak into another day;
- page merging duplicates or drops rows;
- the public endpoint becomes unavailable;
- unrelated backend features fail after deployment.

## Rollback procedure

1. Redeploy the previously recorded backend commit/artifact.
2. Do not delete PostgreSQL data.
3. Verify backend health and public API reachability.
4. Expect the previous parser defect to return; rollback protects broader
   availability, not substitution correctness.
5. Keep the incident open and use the captured sanitized structure to correct
   the candidate.

Because no schema migration is planned, rollback is code-only.

## Post-rollout evidence

Record in the PR or incident note:

- deployed commit;
- deployment timestamp;
- test commands and results;
- first two refresh summaries;
- privacy-safe direct/proxy response counts;
- controlled-display result;
- physical-kiosk result;
- any fallback or warning observed.

Do not include credentials, full plan JSON, raw HTML, teacher abbreviations, or
unguessable live detail URLs.
