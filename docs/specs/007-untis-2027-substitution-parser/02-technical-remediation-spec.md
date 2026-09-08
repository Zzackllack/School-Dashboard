# 02 Technical remediation specification

## Objective

Make substitution-plan parsing compatible with both observed Untis layouts
while preserving the existing API and frontend behavior. A structurally invalid
or incomplete refresh must not silently replace the last known-good plan.

## Existing contracts that must remain stable

### Public API

`GET /api/substitution/plans` continues to return an array of plans. No field
is removed or renamed.

```text
SubstitutionPlan
  date: string
  title: string
  entries: SubstitutionEntry[]
  news:
    date: string
    newsItems: string[]

SubstitutionEntry
  classes: string
  period: string
  absent: string
  substitute: string
  originalSubject: string
  subject: string
  newRoom: string
  type: string
  comment: string
  date: string
```

Fields absent from a specific source layout remain empty or null according to
the existing serialization behavior. They must not be populated with unrelated
values merely to fill the old schema.

### Refresh cadence

The five-minute DSB refresh and frontend refetch cadence remain unchanged.

### Persistence

No Flyway migration is required. Existing raw-plan persistence and the
`api_response_cache` key remain compatible.

### Frontend validation

`isMeaningfulSubstitutionEntry` must continue to require:

1. a visible class value; and
2. at least one visible substitution field.

This defense prevents placeholder and structural rows from appearing on kiosk
screens.

## Supported source formats

### Format A: explicit-class rows

Observed in archived Untis 2026 documents.

Characteristics:

- the table includes `Klasse(n)`;
- every substitution row contains its class;
- expected aliases include `neuer Raum` and `Bemerkungen`;
- odd/even row classes identify presentation striping only.

### Format B: grouped-class rows

Observed in current Untis 2027 documents.

Characteristics:

- the table has no class column;
- a one-cell row containing `td.inline_header[colspan]` starts a group;
- following data rows inherit class context until the next group row;
- the table currently uses
  `Stunde | Vertreter | Fach | Raum | Art | Text`;
- one group can contain multiple data rows.

The parser must detect capabilities from the DOM and headers. It must not switch
solely on `<meta name="generator">`, because an export profile can change
independently of the installed Untis version.

## Recommended parser structure

The current `parseDocument` method mixes document metadata, header discovery,
row classification, field mapping, and output creation. The repair should split
these responsibilities into focused private helpers. Suggested names are
illustrative:

```text
parseDocument(Document)
  -> parsePlanMetadata(Document)
  -> locatePlanTable(Document)
  -> buildColumnMap(Element)
  -> parseSubstitutionRows(Element, ColumnMap, planDate)
       -> classifyRow(Element)
       -> parseGroupContext(Element)
       -> directCells(Element)
       -> mapEntry(...)
       -> validateEntry(...)
  -> extractDailyNews(Document, DailyNews)
```

A small private enum is preferable to stringly typed field names:

```java
private enum PlanField {
    CLASSES,
    PERIOD,
    ABSENT,
    SUBSTITUTE,
    ORIGINAL_SUBJECT,
    SUBJECT,
    ROOM,
    TYPE,
    COMMENT
}
```

This is easier to audit than values such as `"classes"` and avoids silent
typos in switch cases.

## Header normalization and aliases

Header text must be normalized before matching:

1. trim leading and trailing whitespace;
2. collapse internal whitespace;
3. lowercase with `Locale.ROOT`;
4. preserve parentheses long enough to distinguish `(Fach)` from `Fach`.

Required mappings:

| Source header                      | API field         |
| ---------------------------------- | ----------------- |
| `Klasse`, `Klasse(n)`              | `classes`         |
| `Stunde`                           | `period`          |
| `abwesend`                         | `absent`          |
| `Vertreter`                        | `substitute`      |
| `(Fach)`                           | `originalSubject` |
| `Fach`                             | `subject`         |
| `Raum`, `neuer Raum`               | `newRoom`         |
| `Art`                              | `type`            |
| `Text`, `Bemerkung`, `Bemerkungen` | `comment`         |

`(Fach)` must be checked before the general `Fach` alias.

Unknown headers should be logged once per document at warning level with safe,
normalized header names. They should not crash parsing when all required
semantics are still available.

## Direct-cell parsing

Only direct `td` children of the current row may participate in positional
mapping. Avoid a descendant selector whose behavior could change if a future
cell contains a nested table.

Conceptually:

```java
List<Element> cells = row.children().stream()
        .filter(child -> child.normalName().equals("td"))
        .toList();
```

The exact implementation may use an equivalent jsoup direct-child API.

## Row classification

Classify each selected row before mapping cells.

### Group-context row

A row is a group-context row when it contains a direct cell with the
`inline_header` class. The observed `colspan` is useful corroborating
evidence but should not be the only discriminator.

Behavior:

1. parse and retain its class context;
2. increment a group-header diagnostic counter;
3. do not construct or add a `SubstitutionEntry`;
4. continue to the next row.

### Data row

A row is a data row when it has direct cells and is not a group-context row.

Behavior:

1. map cells according to normalized headers;
2. set the explicit class cell when Format A provides one;
3. otherwise inherit the active group class from Format B;
4. set the plan date;
5. validate the resulting entry;
6. add only a valid semantic record.

### Decorative, empty, or malformed row

Do not add a record. Increment a skipped-row counter and retain enough
structural information for a safe warning.

## Group class extraction

The current observed labels contain a class or grade identifier followed by
additional group description. Examples include lower-grade labels with a
short descriptor and upper-grade labels with semester text.

The parser must not place the complete label in every table cell or infer that
the trailing description is the absent teacher. It only needs the class
identifier for the existing API.

Recommended extraction order:

1. If the document's `Betroffene Klassen` metadata can be parsed into a safe
   candidate set, match the longest candidate at the beginning of the group
   label.
2. Otherwise extract the first whitespace-delimited token.
3. Remove only a leading zero from an otherwise numeric grade prefix when this
   is required to retain the dashboard's established class convention
   (`07c` to `7c`).
4. Preserve unfamiliar but non-empty identifiers instead of applying a
   GGL-specific grade whitelist.
5. Reject blank or obviously decorative labels.

The helper requires focused tests for:

- a lower-grade class;
- a two-digit class;
- an upper-grade number with trailing semester text;
- extra whitespace;
- an unknown but plausible identifier;
- an empty inline header.

Do not hard-code a fixed list of GGL classes. The project documentation states
that the integration is intended to remain adaptable to other schools.

## Entry validity

A parser-level valid entry requires:

- a non-blank class; and
- at least one meaningful field among period, absent, substitute,
  originalSubject, subject, room, type, and comment.

The placeholder value `---` is not meaningful by itself.

This mirrors the frontend's defensive rule and creates a consistent producer
contract. Share the concept, not Java/TypeScript implementation code.

## Document validity

The parser must distinguish legitimate emptiness from structural failure.

### Valid document with substitutions

- a plan table exists;
- headers provide recognized substitution fields;
- source data rows exist;
- one or more valid entries are emitted.

### Valid document without substitutions

This case needs a representative upstream fixture before implementation is
declared complete. The parser must recognize the actual empty-plan structure
instead of assuming that every zero-entry document is either valid or broken.

### Invalid or unsupported document

Examples:

- a non-empty substitution table has no recognized headers;
- grouped rows exist but no class context can be extracted;
- data rows exist but all resulting entries are invalid;
- the number of cells is incompatible with the header map;
- expected plan pages are incomplete.

An invalid document should produce an explicit typed failure or structured
result. It must not look like a successful empty plan.

## Parse result and diagnostics

Two implementation approaches are acceptable:

### Option A: typed parse result

Extend `ParsedPlanDocument` or add an internal result carrying:

- parsed plan;
- raw HTML;
- source row count;
- group-header count;
- data-row count;
- valid-entry count;
- skipped-row count;
- unknown headers;
- format classification;
- validity status.

### Option B: typed exception plus counters

Keep the public result small, but throw a dedicated parser exception for
contract failures and log safe counters.

Option A is preferred because it supports explicit service-level publication
decisions and operational metrics without parsing log strings.

## Multi-page atomicity

Plans are grouped by timetable UUID, and a day may consist of multiple HTML
pages. Publishing a partially parsed group can omit real changes.

Required behavior:

1. determine the set of pages supplied for a timetable UUID;
2. parse each page independently;
3. consider the group complete only when every supplied page parses validly;
4. merge only a complete group;
5. if a page fails, do not replace the last known-good version of that group
   with the partial result;
6. log the affected group UUID in a non-sensitive, correlation-friendly form
   already used by current logs.

If the source itself advertises page count and page number, validate that the
observed set is contiguous. Do not assume map iteration order is page order;
sort by page number or detail filename before merging.

## Publication and fallback rules

The current service stores a response whenever `combinedPlans` is non-empty.
That check is insufficient.

The refresh should follow this state transition:

```text
fetch timetable descriptors
  -> parse all documents
  -> validate every day group
  -> if refresh is complete and structurally valid:
       replace latestPlans
       update API response cache
     else:
       keep latestPlans
       keep persisted API response cache
       expose/log fallback state
```

Do not overwrite the API cache with a response where all entries fail semantic
validation.

If some day groups are valid and another is invalid, the safest default for
this small two-day kiosk feed is to retain the entire previous response. An
implementation may support per-group fallback only if it can prove that dates,
ordering, expiry, and stale-group removal remain correct.

## Persisted raw documents

`SubstitutionPlanPersistenceService` stores raw HTML for change tracking. That
behavior is useful for forensic comparison but contains operational school
data.

Requirements:

- do not add raw HTML to ordinary application logs;
- do not expose it through a public endpoint;
- keep its existing database access boundary;
- do not add source content to error messages;
- define retention separately if database growth or privacy requirements make
  it necessary.

Whether raw HTML should be persisted before semantic validation is an
implementation decision. Persisting an invalid source can help diagnose future
drift, but it must never make the invalid source eligible for API publication.

## Frontend behavior

No production frontend logic change is required for the primary fix.

Keep:

- five-minute query refetch;
- `sanitizeSubstitutionPlans`;
- the visible per-date empty state;
- no-store proxy behavior.

Add or update tests so a valid grouped-layout backend response passes the
sanitizer and reaches `SubstitutionPlanDisplay`.

Do not relax `isMeaningfulSubstitutionEntry` merely to make malformed API rows
visible.

## Observability requirements

Each refresh should emit one concise summary per source document and one per
combined group. Avoid one info log per substitution row.

Suggested document summary fields:

```text
format=explicit|grouped|empty|unsupported
headers=9
sourceRows=25
groupRows=9
dataRows=16
validEntries=16
skippedRows=0
unknownHeaders=[]
```

Suggested refresh summary fields:

```text
timetableDocuments=4
dayGroups=2
validGroups=2
invalidGroups=0
published=true
fallbackUsed=false
durationMs=...
```

Warnings must fire when:

- unknown structural rows are skipped;
- data rows exist but no valid entries are produced;
- a group page is missing or fails;
- a previous payload is retained;
- a new, unrecognized header signature appears.

## Compatibility and migration

- API compatibility: preserved
- frontend compatibility: preserved
- database migration: none
- data backfill: none
- stored raw HTML rewrite: none
- kiosk re-enrollment: none
- NetBird or DNS change: none

The next successful refresh after deployment should replace the malformed API
cache naturally. A manual database edit or cache deletion is not part of the
fix.

## Explicitly rejected shortcuts

### Remove frontend sanitization

Rejected because it would display classless records and structural rows.

### Assign a constant or guessed class

Rejected because it would mislabel substitutions and could show incorrect
information to students.

### Parse by fixed numeric column positions only

Rejected because two known source formats have different column counts and
orders. Header-driven mapping remains necessary.

### Switch only on `Untis 2027`

Rejected because generator version is evidence, not a stable table contract.

### Change refresh intervals or disable caching

Rejected because freshness mechanisms already work. They repeatedly deliver
the same malformed records and do not address parsing.
