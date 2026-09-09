# 01 Incident analysis and evidence

## Executive finding

The dashboard was receiving current substitution plans, but the backend was
misinterpreting the new Untis 2027 HTML structure. It returned non-empty plan
arrays containing only records without a class. The frontend sanitizer then
discarded every record. This explains why the official app showed changes while
the dashboard showed none.

This is a deterministic parser compatibility defect. It was reproduced locally
from the same upstream documents and is not explained by stale deployment
artifacts, Cloudflare caching, kiosk DNS, or failed DSB authentication.

## User-visible symptom

Observed on the physical school kiosk systems:

- the dashboard itself loaded;
- current substitution rows were absent;
- the official application showed current changes;
- the school's delivered HTML plan had visibly changed its layout.

The important distinction is that the page did not fail as a whole. A loaded
dashboard with empty substitution tables can be caused anywhere between the
upstream source, parser, API, client-side normalization, or display rendering.
The investigation therefore traced the complete data path instead of treating
the kiosk screen as proof of a frontend-only failure.

## Relevant production data path

```text
DSBmobile authentication/menu endpoint
  -> timetable detail URLs
  -> current Untis HTML files on dsbmobile.de
  -> DsbMobileClient / DSBService
  -> SubstitutionPlanParserService
  -> SubstitutionPlanService.latestPlans
  -> ApiResponseCacheService / PostgreSQL fallback
  -> Spring GET /api/substitution/plans
  -> Cloudflare Worker GET /api/substitution/plans
  -> TanStack Query substitutionPlansQueryOptions
  -> sanitizeSubstitutionPlans
  -> SubstitutionPlanDisplay
  -> enrolled kiosk browser
```

## Investigation constraints

The incident investigation was intentionally read-only in production:

- no deployment was queued;
- no container was restarted;
- no environment variable was changed;
- no database was modified;
- no kiosk or NetBird policy was changed;
- no repository source file was edited during diagnosis.

The local application was run with an in-memory H2 URL so its parser and API
could be exercised without updating the repository's persisted H2 data.

## Investigation trail

### 1. Establish repository and deployment identity

The checkout was clean on `main`. The local HEAD and the commit reported for
the latest successful backend deployment were both:

```text
4036f826a5dc10cc6ff0ab5393624d26cd3031ee
```

The parser file at that deployed commit had the same SHA-256 as the checked-out
parser. This ruled out a simple "production is running an older parser than the
one being inspected" explanation.

The Coolify application was reported as:

- resource: `BACKEND - 3`;
- application UUID: `d4c4kw8kcs0o4gsgc0o04044`;
- branch: `main`;
- build pack: Docker Compose;
- status: `running:healthy`;
- restart count: zero;
- backend domain:
  `https://goethe-dashboard-springbackend.zacklack.de`.

The most recent recorded deployment was successful. Coolify also displayed a
"configuration changes pending" badge. That pending state was not used as a
causal explanation because the running application was healthy, fetched fresh
plans, and exposed the same malformed payload through both API paths.

### 2. Read the production runtime logs

The authenticated Coolify log view showed the scheduled update completing
normally. At approximately 21:04 UTC on 8 September 2026, the backend:

- received four timetable documents;
- grouped them into today and tomorrow;
- fetched both pages for each day;
- reported 25 plus 18 entries for today;
- reported 25 plus 2 entries for tomorrow;
- published two combined plans;
- completed the refresh in roughly 3.5 seconds.

There was no authentication, network, HTTP, or parser exception in the observed
refresh. The same log sequence was reproduced locally.

This was a misleading success signal: "entries" meant selected odd/even table
rows, not validated substitution records.

### 3. Inspect both public API paths

The following endpoints were requested independently:

```text
https://goethe-dashboard.zacklack.de/api/substitution/plans
https://goethe-dashboard-springbackend.zacklack.de/api/substitution/plans
```

Both returned HTTP 200 and equivalent JSON. The snapshot contained:

| Plan             | Backend-reported entries | Entries with a usable class |
| ---------------- | -----------------------: | --------------------------: |
| 8 September 2026 |                       43 |                           0 |
| 9 September 2026 |                       27 |                           0 |

The frontend proxy response contained:

```text
Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
Pragma: no-cache
Expires: 0
CF-Cache-Status: DYNAMIC
```

The direct backend response also disabled caching. This ruled out Cloudflare
serving an old plan and showed that the frontend proxy was faithfully forwarding
the backend's current malformed response.

### 4. Run the current application locally

The backend and frontend were started from the deployed commit. The backend used
an isolated in-memory database:

```bash
cd Backend
SPRING_DATASOURCE_URL='jdbc:h2:mem:incident;DB_CLOSE_DELAY=-1' \
  mvn -q spring-boot:run
```

The local DSB credentials loaded from the ignored environment file. The refresh
again received four timetables and produced 43 and 27 entries.

The local frontend proxy returned the same JSON. Applying the checked-in
`isMeaningfulSubstitutionEntry` predicate produced zero renderable entries for
both days. Both servers were stopped after the reproduction.

### 5. Inspect the current upstream HTML structure

The current source identifies itself as:

```html
<meta name="generator" content="Untis 2027" />
```

Its substitution table has six headers:

```text
Stunde | Vertreter | Fach | Raum | Art | Text
```

It does not include `Klasse(n)` in each data row. Instead, class context is
introduced with a grouping row:

```html
<tr class="list odd">
  <td class="list inline_header" colspan="6">[class and group label]</td>
</tr>
<tr class="list even">
  <td>[period]</td>
  <td>[substitute]</td>
  <td>[subject]</td>
  <td>[room]</td>
  <td>[type]</td>
  <td>[text]</td>
</tr>
```

One grouping row may be followed by multiple substitutions. Upper-grade group
labels also include descriptive semester text after the grade identifier.

The current source row breakdown was:

| Plan page        | Selected odd/even rows | Group headers | Actual data rows |
| ---------------- | ---------------------: | ------------: | ---------------: |
| Today, page 1    |                     25 |             9 |               16 |
| Today, page 2    |                     18 |             3 |               15 |
| Tomorrow, page 1 |                     25 |             9 |               16 |
| Tomorrow, page 2 |                      2 |             1 |                1 |
| **Combined**     |                 **70** |        **22** |           **48** |

Therefore the correct incident-snapshot totals were 31 actual records for
today and 17 for tomorrow, not 43 and 27.

### 6. Compare archived HTML

The ignored local H2 database contains raw documents collected between 6 March
and 14 April 2026. It was opened with H2's read-only data mode.

Those archived documents identify themselves as Untis 2026 and use the historic
nine-column format:

```text
Klasse(n) | Stunde | abwesend | Vertreter | (Fach) | Fach
neuer Raum | Art | Bemerkungen
```

Each historic substitution row contains its own class cell. This is the contract
implemented by the current parser.

The evidence confirms a real source-contract change between the archived Untis
2026 documents and the current Untis 2027 documents. It does not prove whether
the change was caused solely by the Untis software upgrade, a changed school
export profile, or both. The implementation must depend on observed structure,
not on the generator version string.

### 7. Trace the malformed values through the code

The backend's header mapping only sets `classes` when a header contains
`klasse`. The new table has no such header.

The row selector accepts all `tr.list.odd` and `tr.list.even` elements. It
does not distinguish `td.inline_header[colspan]` rows from real substitutions.

Consequences:

- grouping rows are added as records;
- the grouping label is mapped to `period`, because `Stunde` is column zero;
- real data rows populate period, substitute, subject, room, and type;
- every record keeps `classes = null`;
- the `Text` column is ignored because only `Bemerkung` is recognized.

The frontend then requires a visible class before it considers an entry
meaningful. That validation was added to remove historic placeholder rows and
is behaving as designed. It is the point where the malformed backend response
becomes an empty displayed table, but it is not the source of the defect.

### 8. Review automated coverage

Existing backend parser tests only create old-format HTML with explicit
`Klasse`, `Stunde`, and `Bemerkung` headers. They do not contain:

- an `inline_header` row;
- a class inherited by following rows;
- multiple substitutions within one group;
- a six-column layout;
- a `Text` header;
- a malformed grouped table.

The targeted backend parser tests passed. The eight targeted frontend dashboard
API tests also passed. This demonstrates a fixture coverage gap rather than a
failing quality gate.

## Confirmed root cause

The direct cause is the mismatch between two table contracts:

1. the parser assumes class information is a normal column in every row;
2. the current source carries class information in separate grouping rows.

The complete failure chain is:

1. the new grouped source is fetched successfully;
2. the parser selects both group and data rows;
3. no row receives a class;
4. non-empty but invalid plans replace the current in-memory and persisted API
   cache;
5. the frontend discards all classless entries;
6. the kiosk renders a valid plan shell with no substitution rows.

## Contributing weaknesses

### Row count is treated as semantic success

The log count comes from the size of the parsed list. There is no validation
that rows have required fields. Structural metadata can therefore inflate the
count and create a false healthy signal.

### Parsing and publication have no contract boundary

`SubstitutionPlanService` publishes any non-empty list of combined plans. It
does not distinguish:

- a genuinely empty plan;
- a partially parsed multi-page plan;
- a structurally invalid plan;
- a fully valid plan.

### Per-page failures can produce partial days

Exceptions are caught inside the page loop. If one page fails and another page
succeeds, the incomplete combined day can still be published.

### Test fixtures model one producer version

The parser is nominally header-driven, but its tests do not cover alternative
ways the source represents row context. Passing tests therefore did not protect
the real input contract.

### No production semantic health signal

HTTP health and scheduled-job completion do not report:

- parsed versus source row counts;
- records missing classes;
- unknown headers;
- skipped grouping rows;
- incomplete page groups;
- fallback activation.

## Ruled-out causes

### DSB credentials or authentication

Production and the local run both received all four current timetable detail
URLs. The upstream HTML documents were fetched successfully.

### Cloudflare or browser cache

The backend and frontend proxy returned the same current payload, with explicit
no-store/no-cache headers and `CF-Cache-Status: DYNAMIC`.

### Stale backend deployment

The deployed backend commit matched the local HEAD exactly, and the parser file
was byte-identical.

### Prior kiosk DNS incident

The dashboard, frontend API, and backend API were reachable during this
incident. The earlier NetBird/AdGuard port-policy outage had a different
failure mode and is not the cause of classless API records.

### Frontend refresh timing

TanStack Query refetches the substitution query every five minutes, and the
display runtime reloads the page every five minutes. Faster refreshing cannot
repair data that is already invalid when it reaches the client.

## Evidence-handling and privacy

Live substitution documents can contain teacher abbreviations and operational
document identifiers. Do not commit raw production HTML or exact current DSB
detail URLs.

For implementation fixtures:

1. preserve tags, classes, column order, `colspan`, and grouping semantics;
2. replace all class, teacher, subject, room, comment, UUID, and tenant values
   with synthetic values;
3. verify that the sanitized fixture still reproduces the parser behavior;
4. document the source date and sanitization method without retaining the raw
   source in Git.

## Reproduction commands

The following commands describe the investigation without embedding secrets.

Check headers and structural counts:

```bash
curl -sS -D - -o /dev/null \
  https://goethe-dashboard.zacklack.de/api/substitution/plans

curl -sS https://goethe-dashboard.zacklack.de/api/substitution/plans \
  | jq '[.[] | {
      date,
      entries: (.entries | length),
      entries_with_class: ([.entries[] | select(.classes != null and .classes != "")] | length)
    }]'
```

Inspect a currently authenticated timetable document structurally:

```bash
curl -sS '<current-detail-url>' \
  | rg -o '<(table|tr|th|td)[^>]*>'
```

Run locally without touching the file-backed development database:

```bash
cd Backend
SPRING_DATASOURCE_URL='jdbc:h2:mem:incident;DB_CLOSE_DELAY=-1' \
  mvn -q spring-boot:run
```

Do not print environment-file values, raw plan contents, or authentication
tokens into CI or issue logs.
