# 03 API- und Datenvertraege

## Datenbankaenderungen

## Neue Tabelle `survey_submissions`

Vorgesehene Spalten:

- `id UUID PRIMARY KEY`
- `display_id UUID NOT NULL`
- `category VARCHAR(40) NOT NULL`
- `message TEXT NOT NULL`
- `submitter_name VARCHAR(160) NULL`
- `created_at TIMESTAMP NOT NULL`
- `source_ip_hash VARCHAR(255) NOT NULL`

Constraints:

1. `display_id` verweist auf `displays.id`.
2. `category` ist ein kontrollierter Enum-Wert.
3. `message` ist nicht leer.
4. `submitter_name` ist optional.

Indizes:

1. Index auf `created_at`
2. Index auf `display_id`
3. optional kombinierter Index auf `category, created_at`

## Flyway

Neue Migrationen in:

- `Backend/src/main/resources/db/migration`
- `Backend/src/main/resources/db/migration/h2`
- `Backend/src/main/resources/db/migration/postgresql`

Migrationen muessen:

1. die Tabelle anlegen.
2. Indizes erzeugen.
3. Fremdschluessel sauber definieren.
4. fuer H2 und PostgreSQL kompatibel bleiben.

## Enum-Definition

## `SurveyCategory`

Erlaubte Werte:

- `PROBLEM`
- `WUNSCH`
- `ALLGEMEINES_FEEDBACK`

## Oeffentliche DTOs

## `SurveyDisplayContextResponse`

```json
{
  "displayId": "9d0a7549-5fc8-40be-9aad-1d1f6ab6d8bb",
  "displayName": "Haupteingang",
  "locationLabel": "Lobby",
  "themeId": "default",
  "acceptingFeedback": true
}
```

Regeln:

1. `acceptingFeedback = false`, wenn das Display unbekannt, inaktiv oder fuer
   den Flow nicht zulaessig ist.
2. Die Route darf daraus den Anzeigezustand ableiten.

## `CreateSurveySubmissionRequest`

```json
{
  "displayId": "9d0a7549-5fc8-40be-9aad-1d1f6ab6d8bb",
  "category": "PROBLEM",
  "message": "Der QR-Code sollte groesser sein.",
  "name": "Mila"
}
```

Validierungsregeln:

1. `displayId` Pflichtfeld
2. `category` Pflichtfeld
3. `message` Pflichtfeld
4. `message` mit Mindest- und Maximallaenge
5. `name` optional, aber mit Maximallaenge

## `CreateSurveySubmissionResponse`

```json
{
  "submissionId": "8ec4f103-a0d1-4f26-9d73-41edbbd4d52a",
  "createdAt": "2026-03-09T15:04:00Z",
  "status": "RECORDED"
}
```

`status` ist in V1 fest auf `RECORDED`.

## Oeffentliche API

## `GET /api/surveys/displays/{displayId}`

Zweck:

- Display-Kontext fuer die oeffentliche Rueckmeldungsseite liefern.

Antwort:

- `200 OK` mit `SurveyDisplayContextResponse`
- `404` oder fachlich gleichwertiger Fehler fuer unbekannte Displays

## `POST /api/surveys/submissions`

Zweck:

- Rueckmeldung validieren und persistieren.

Antwort:

- `201 Created` mit `CreateSurveySubmissionResponse`
- `400` bei Validierungsfehlern
- `404` oder fachlicher Fehler bei ungueltigem Display
- `429` bei Rate-Limit

## Admin-DTOs

## `AdminSurveyListItemResponse`

```json
{
  "id": "8ec4f103-a0d1-4f26-9d73-41edbbd4d52a",
  "displayId": "9d0a7549-5fc8-40be-9aad-1d1f6ab6d8bb",
  "displayName": "Haupteingang",
  "locationLabel": "Lobby",
  "category": "PROBLEM",
  "message": "Der QR-Code sollte groesser sein.",
  "submitterName": "Mila",
  "createdAt": "2026-03-09T15:04:00Z"
}
```

## Admin-API

## `GET /api/admin/surveys`

Query-Parameter:

- `category?`
- `displayId?`
- `query?`
- `limit?`

Verhalten:

1. standardmaessig absteigend nach `createdAt` sortieren.
2. `query` durchsucht mindestens `message` und `submitterName`.
3. `limit` ist serverseitig begrenzt.

Beispiel:

`GET /api/admin/surveys?category=PROBLEM&displayId=9d0a7549-5fc8-40be-9aad-1d1f6ab6d8bb&query=qr&limit=50`

Antwort:

```json
[
  {
    "id": "8ec4f103-a0d1-4f26-9d73-41edbbd4d52a",
    "displayId": "9d0a7549-5fc8-40be-9aad-1d1f6ab6d8bb",
    "displayName": "Haupteingang",
    "locationLabel": "Lobby",
    "category": "PROBLEM",
    "message": "Der QR-Code sollte groesser sein.",
    "submitterName": "Mila",
    "createdAt": "2026-03-09T15:04:00Z"
  }
]
```

## Frontend-Typen

`Frontend/src/lib/api/displays.ts` bleibt fuer Display-Verwaltung zustaendig.
Fuer Surveys soll ein eigener API-Client-Bereich eingefuehrt werden, zum
Beispiel:

- `Frontend/src/lib/api/surveys.ts`

Zu pflegende Typen:

- `SurveyCategory`
- `SurveyDisplayContextResponse`
- `CreateSurveySubmissionRequest`
- `CreateSurveySubmissionResponse`
- `AdminSurveyListItemResponse`

## Proxy-Routen im Frontend

Empfohlene neue Proxy-Dateien:

- `Frontend/src/routes/api/surveys/displays/$displayId.ts`
- `Frontend/src/routes/api/surveys/submissions.ts`
- `Frontend/src/routes/api/admin/surveys.ts`

Diese Routen sollen das bestehende Proxy-Muster des Projekts wiederverwenden.
