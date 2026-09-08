# 04 Resilience and operations

## Goal

Prevent a future source-layout change from silently producing a healthy-looking
refresh with no useful kiosk data. The system should either publish a validated
current plan or retain a known-good fallback while producing an actionable,
privacy-safe signal.

## Failure model

The incident exposed three different meanings of "working":

1. transport health: requests reached DSBmobile and returned HTML;
2. syntactic health: jsoup found rows and constructed Java objects;
3. semantic health: the objects represented real substitutions with class
   context.

Only the first two were visible in logs. Future safeguards must measure the
third.

## Layered defenses

### 1. Parser contract validation

At the parser boundary:

- classify the source format from its structure;
- count group rows separately from data rows;
- reject data rows without class context;
- reject non-empty tables with no valid semantic rows;
- report unknown header signatures.

### 2. Atomic refresh publication

At the service boundary:

- assemble all pages for each day;
- validate completeness;
- publish only a complete valid refresh;
- retain last known-good data on structural failure;
- never store malformed output as the API fallback.

### 3. Frontend defensive filtering

At the client boundary:

- retain class and meaningful-field validation;
- render a clear error/fallback status if the API later exposes freshness
  metadata;
- never turn malformed structural rows into visible substitutions.

### 4. End-to-end semantic monitoring

At the operational boundary:

- periodically request the public Cloudflare API path;
- validate response shape and semantic invariants;
- distinguish a legitimately empty plan from parser failure;
- alert only on actionable or sustained changes.

## Contract fingerprint

Generate a privacy-safe fingerprint for each fetched document from:

- normalized ordered header names;
- whether `inline_header` rows exist;
- header count;
- number of group rows;
- number of data rows;
- generator metadata as informational context.

Example:

```text
signature=stunde|vertreter|fach|raum|art|text
format=grouped
headers=6
groupRows=9
dataRows=16
generator=Untis 2027
```

The fingerprint must not contain cell contents, class names, teacher
abbreviations, detail URLs, or credentials.

On a previously unseen signature:

1. warn once per refresh;
2. validate whether all required semantics are still available;
3. refuse publication if they are not;
4. retain known-good data;
5. provide the fingerprint and counters for diagnosis.

Do not reject a harmless extra column solely because the fingerprint is new.
Validation should be capability-based, with the signature used as an alerting
and investigation aid.

## Semantic invariants

Recommended invariants for a plan that contains source data rows:

- every published entry has a non-blank class;
- every published entry has at least one meaningful non-class field;
- published entry count equals validated data-row count;
- group rows never appear in the output count;
- every supplied page belongs to exactly one complete group;
- dates and sort priorities are present and deterministic;
- unknown headers do not shift known fields.

The service should also detect suspicious deltas, but a count change alone is
not necessarily an error because school plans naturally vary.

## Freshness and fallback metadata

The current public contract exposes plan content but not source freshness or
fallback state. A future, separately reviewed enhancement may add metadata such
as:

```text
lastFetchAttemptAt
lastSuccessfulParseAt
sourceFormat
fallbackUsed
fallbackReason
```

Do not add these fields casually to the existing array response. Options are:

- response headers;
- an internal/actuator health component;
- a new operations endpoint;
- a backward-compatible wrapper introduced in a versioned API.

For this incident repair, logs and metrics are sufficient if they make fallback
explicit.

## Health indicators

HTTP liveness must remain separate from substitution semantic health.

Suggested internal health states:

| State                          | Meaning                                         |
| ------------------------------ | ----------------------------------------------- |
| `UP`                           | service can answer requests                     |
| `SUBSTITUTION_CURRENT`         | latest fetch and parse succeeded                |
| `SUBSTITUTION_FALLBACK`        | service is available using older validated data |
| `SUBSTITUTION_UNSUPPORTED`     | source contract is not currently parseable      |
| `SUBSTITUTION_EMPTY_CONFIRMED` | producer explicitly represents no changes       |

If exposed through Actuator, avoid raw URLs, plan content, or personal data.

## Metrics

Useful counters and gauges:

- refresh attempts;
- successful publications;
- fetch failures;
- parse-contract failures;
- fallback activations;
- source data rows;
- valid published entries;
- invalid/skipped rows;
- unknown header signatures;
- incomplete page groups;
- seconds since last successful publication.

Cardinality must remain bounded. Never label a metric with a timetable UUID,
detail URL, class, teacher, or free text.

## Alerting recommendations

High-priority alert:

- source data rows are present, valid published entries are zero, and the
  condition persists through two refresh attempts.

Medium-priority alert:

- fallback remains active longer than an agreed duration;
- one or more day groups are incomplete;
- the source contract fingerprint is unknown and publication is withheld.

Low-priority diagnostic:

- a harmless new column is observed but all semantic invariants pass.

Avoid alerting on a zero substitution count without an explicit indication that
the source contains rows. School days can legitimately have no changes.

## Known-good fallback policy

Fallback data must carry a freshness boundary. Showing yesterday's plan as
today's without warning can be worse than showing no plan.

Recommended policy:

1. retain last known-good data immediately after a failed refresh;
2. compare plan dates with the local school date;
3. do not present a stale date as current;
4. log and expose fallback age;
5. after the agreed maximum age, render a clearly unavailable state rather than
   silently showing obsolete substitutions.

The exact maximum age is a product/operations decision. A reasonable initial
default is to allow fallback within the same plan date and require an explicit
warning across a date boundary.

## Scheduled source-contract smoke test

A privacy-safe scheduled monitor can run during school days:

1. request the public substitution endpoint;
2. check HTTP status and no-cache headers;
3. verify the response is valid JSON;
4. if entries exist, require non-blank classes;
5. inspect operations health for last successful parse age;
6. notify only on sustained semantic failure or recovery.

The monitor must not store full payloads. It may retain counts, dates, hashes of
schema-only projections, and timestamps.

Do not scrape authenticated DSB content from a third-party monitoring service
unless data handling has been explicitly reviewed. Prefer checking the
application's privacy-safe health projection.

## Test-fixture maintenance

Keep one fixture per supported structural contract, not one fixture per school
day.

When a new source format appears:

1. capture the smallest HTML fragment that reproduces it;
2. sanitize all operational values;
3. add a parser regression test before changing behavior;
4. document the new fingerprint;
5. retain prior fixtures permanently unless support is intentionally dropped.

This turns upstream layout history into executable compatibility knowledge.

## Dependency update policy

jsoup itself parsed both documents correctly. The defect was in application
selectors and semantics, not a jsoup bug. Updating jsoup alone is not a fix.

Continue normal dependency maintenance, but require parser fixture tests to run
when jsoup is updated.

## Logging hygiene

Current logs include exact timetable detail URLs. These URLs contain operational
identifiers and point to school-plan data. Reduce routine exposure.

Recommended changes:

- log the page filename and a short non-reversible correlation hash instead of
  the full URL at info level;
- keep full URLs out of warnings and exceptions;
- log plan counts and source fingerprints;
- never log raw HTML or complete parsed entries;
- review production log retention and access.

This hardening is related and should be included if it can remain a narrow
change. It must not delay the parser compatibility fix if it materially expands
scope.

## Credential hygiene

- keep DSB credentials in environment variables;
- never print ignored `.env` values;
- use Coolify tokens with the minimum read scope and an expiration;
- treat any token displayed in an automated browser/session transcript as
  exposed;
- revoke exposed tokens and issue replacements outside repository history;
- never put tokens in specifications, fixtures, commands, or screenshots.

## Operational runbook for future empty-display reports

### Step 1: Establish the visible failure

- Does the dashboard load?
- Are plan dates and news visible?
- Is the empty state per date or global?
- Does the official app contain changes?

### Step 2: Check the public response

- request the Cloudflare frontend API;
- record status, cache headers, dates, counts, and missing-class counts;
- do not dump full content.

### Step 3: Compare the direct backend response

- verify frontend and backend projections agree;
- if they differ, investigate proxy/caching;
- if they agree and are malformed, move upstream.

### Step 4: Inspect refresh logs

- confirm authentication and fetch success;
- compare source rows, group rows, data rows, and valid entries;
- check fallback and page completeness.

### Step 5: Inspect source structure

- record generator and normalized headers;
- detect group rows and column changes;
- compare with committed sanitized fixtures.

### Step 6: Reproduce locally

- use an in-memory database;
- run the current deployed commit;
- avoid altering production or persisted local data.

### Step 7: Isolate kiosk/network only if warranted

If the public APIs and controlled browser work but the physical kiosk cannot
load them, then investigate its actual DNS, NetBird, browser, and enrollment
path. Do not use a past network incident as the default explanation for a
semantically malformed API response.

## Ownership and maintenance posture

This repository is in maintenance mode for its original author. Operational
design should minimize recurring manual work:

- prefer structural compatibility over school-specific hard-coding;
- keep the repair small enough for a focused review;
- make future drift fail loudly and safely;
- automate privacy-safe semantic checks;
- preserve a clear implementation and rollback handoff for another maintainer
  or AI agent.

## Follow-up opportunities

These are not required to close the current incident:

- versioned public API with freshness metadata;
- admin-visible substitution integration status;
- automated sanitized fixture generation;
- documented raw-plan retention;
- source-format compatibility matrix;
- a dedicated operations dashboard or alert receiver.
