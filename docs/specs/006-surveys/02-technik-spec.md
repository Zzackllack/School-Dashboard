# 02 Technik-Spezifikation

## Aktueller Ausgangspunkt

- Display-Rendering erfolgt ueber `DisplayPage` und die Theme-Registry.
- Das Default-Theme nutzt weiterhin `DashboardPage` als Kompositionsbasis.
- Das Brutalist-Theme ist bereits modularisiert.
- Admin-Endpunkte folgen dem Muster `/api/admin/**` mit Session-basierter
  Authentifizierung.
- Oeffentliche Display-Endpunkte liegen unter `/api/displays/**`.

## Zielarchitektur

Das Surveys-Feature wird in vier technische Teilbereiche aufgeteilt:

1. gemeinsames Survey-QR-Modul fuer Display-Themes.
2. oeffentliche Feedback-Route mit Formular und Submit-Flow.
3. neue Backend-Services und Persistenz fuer Survey-Submissions.
4. admin-geschuetzte Inbox fuer Auswertung.

## 1. Gemeinsames Survey-QR-Modul

Es wird eine wiederverwendbare Frontend-Komponente eingefuehrt, die in beiden
Themes gerendert werden kann.

Verantwortung des Moduls:

- Titel `Dein Feedback` anzeigen.
- kurzen deutschen Erklaertext anzeigen.
- QR-Code fuer `/rueckmeldung/{displayId}` rendern.
- optionalen Fallback-Hinweis anzeigen, falls der Code nicht scanbar ist.

Entscheidung:

- Der QR-Code wird clientseitig erzeugt.
- Die Ziel-URL wird aus `window.location.origin` und `displayId` gebildet.
- Beide Themes nutzen dieselbe Logik und denselben Textkern.

## 2. Einbindung in Display-Themes

### Default-Theme

- Das Survey-Modul wird in der rechten Sidebar vor `Credits` eingefuegt.
- Die bestehende Informationshierarchie bleibt erhalten.

### Brutalist-Theme

- Das Survey-Modul wird in der rechten Modulleiste vor `Credits` eingefuegt.
- Die Darstellung folgt dem Brutalist-Look, aber die Funktionalitaet bleibt
  identisch zum Default-Theme.

### Theme-Parity

Beide Themes muessen dieselben funktionalen Daten bereitstellen:

- identische Zielroute
- identische CTA-Absicht
- identischer Display-Kontext
- identisches Fehlverhalten bei fehlender `displayId`

## 3. Oeffentliche Feedback-Route

Neue Route:

- `Frontend/src/routes/rueckmeldung/$displayId.tsx`

Verhalten:

1. `displayId` aus der Route lesen.
2. oeffentlichen Display-Kontext ueber `GET /api/surveys/displays/{displayId}`
   laden.
3. bei gueltigem und aktivem Display das Formular rendern.
4. bei ungueltigem oder inaktivem Display einen deutschen Fehlerzustand zeigen.
5. Formular ueber `POST /api/surveys/submissions` absenden.
6. nach Erfolg eine deutsche Bestaetigung anzeigen und Doppelsubmit verhindern.

UI-Zustaende:

- Laden
- bereit zur Eingabe
- Submit laeuft
- Erfolg
- Validierungsfehler
- technischer Fehler

## 4. Backend-Service-Schichten

Empfohlene Aufteilung:

- `SurveyPublicService`
  - Display-Kontext fuer oeffentliche Route laden
  - Submission validieren und speichern
- `SurveyAdminService`
  - Inbox-Daten laden
  - Filter und Suchlogik anwenden

Alternativ ist eine gemeinsame Service-Schicht zulaessig, sofern die Trennung
zwischen oeffentlichem und admin-geschuetztem Zugriff im Controller und in den
Methoden klar bleibt.

## 5. Persistenzmodell

Neue Entitaet:

- `SurveySubmissionEntity`

Persistierte Felder:

- `id`
- `displayId`
- `category`
- `message`
- `submitterName`
- `createdAt`
- `sourceIpHash`

Technische Regeln:

1. `displayId` referenziert ein vorhandenes Display.
2. Ein Display muss fuer Feedback aktiv bzw. annehmbar sein.
3. IP-Adressen werden nicht im Klartext gespeichert.
4. V1 kennt keine Aenderung und keine Loeschfunktion.

## 6. Sicherheitsmodell

Oeffentliche Endpunkte:

- `/api/surveys/**` sind `permitAll`

Admin-Endpunkte:

- `/api/admin/surveys/**` sind `hasRole("ADMIN")`

Validierung:

- `category` Pflichtfeld
- `message` Mindest- und Maximallaenge
- `name` optionale Maximallaenge
- `displayId` muss vorhanden und nutzbar sein

Missbrauchsschutz:

- Rate-Limit fuer `POST /api/surveys/submissions`
- optional spaeter ausbaubar mit weiteren Anti-Spam-Massnahmen

## 7. Datenfluss

```text
Display Theme
  -> Survey-QR-Modul
  -> /rueckmeldung/$displayId
  -> GET /api/surveys/displays/{displayId}
  -> Formular absenden
  -> POST /api/surveys/submissions
  -> DB: survey_submissions
  -> GET /api/admin/surveys
  -> Admin-Inbox
```

## 8. Fehlerfaelle

1. Unbekanntes Display:
   - oeffentliche Seite zeigt deutschen Fehlerzustand
   - kein Absenden moeglich
2. Inaktives oder nicht annehmbares Display:
   - Formular gesperrt
   - deutlicher Hinweis fuer den Nutzer
3. Rate Limit erreicht:
   - Backend liefert `429`
   - Frontend zeigt eine deutsche Retry-Meldung
4. Leere oder zu lange Nachricht:
   - Client- und Servervalidierung greifen
5. Allgemeiner Backend-Fehler:
   - Frontend zeigt generische deutsche Fehlermeldung

## 9. Technische Entscheidungen

1. Route fuer Schueler bleibt deutsch: `/rueckmeldung/$displayId`.
2. Sichtbare UI-Texte sind deutsch, interne Symbole duerfen englisch bleiben.
3. QR-Erzeugung erfolgt im Frontend mit einer etablierten Bibliothek wie
   `qrcode`.
4. Die Admin-Seite ist eine reine Inbox ohne Statusworkflow.
