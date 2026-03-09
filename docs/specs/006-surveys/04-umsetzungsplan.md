# 04 Umsetzungsplan

## Workstream A: Backend-Persistenz und Domaenenmodell

1. Flyway-Migrationen fuer `survey_submissions` anlegen.
2. Neue Entitaet `SurveySubmissionEntity` einfuehren.
3. Repository fuer Query- und Filterbedarf anlegen.
4. Enum `SurveyCategory` definieren.
5. Display-Referenz und Persistenzregeln absichern.

Lieferergebnis:

- Rueckmeldungen koennen strukturiert gespeichert und abgefragt werden.

## Workstream B: Backend-APIs und Services

1. Oeffentlichen Controller unter `/api/surveys` anlegen.
2. Admin-Controller unter `/api/admin/surveys` anlegen.
3. Service-Schichten fuer oeffentlichen Submit-Flow und Admin-Inbox
   implementieren.
4. DTOs fuer Kontext, Submit und Inbox definieren.
5. Rate-Limiting fuer Submission-Endpunkt einfuehren.
6. `SecurityConfiguration` fuer die neuen Endpunkte erweitern.

Lieferergebnis:

- Public- und Admin-Endpunkte sind fachlich komplett und sicher eingebunden.

## Workstream C: Oeffentliche Frontend-Route

1. API-Client fuer Surveys einfuehren.
2. Proxy-Routen fuer neue Survey-Endpunkte anlegen.
3. Route `Frontend/src/routes/rueckmeldung/$displayId.tsx` implementieren.
4. Formular mit deutscher UX, Validierung und Erfolgszustand bauen.
5. Fehlerzustaende fuer unbekannte oder inaktive Displays abdecken.

Lieferergebnis:

- Schueler koennen oeffentlich Feedback absenden.

## Workstream D: Theme-Integration

1. Wiederverwendbares Survey-QR-Modul bauen.
2. Default-Theme um das Modul vor `Credits` erweitern.
3. Brutalist-Theme um das Modul vor `Credits` erweitern.
4. Gemeinsame QR-URL-Bildung und deutschen CTA sicherstellen.
5. Theme-Parity-Test um das Survey-Modul erweitern.

Lieferergebnis:

- Beide Themes zeigen das Feature konsistent und scanbar an.

## Workstream E: Admin-Inbox

1. Geschuetzte Route `Frontend/src/routes/admin/surveys/index.tsx` anlegen.
2. Admin-Layout-Schutz analog zu bestehenden Admin-Routen verwenden.
3. Liste der neuesten Surveys laden und darstellen.
4. Filter nach Kategorie, Display und Freitext integrieren.
5. Link aus `admin/displays` zur Survey-Inbox ergaenzen.

Lieferergebnis:

- Admins koennen Rueckmeldungen im Dashboard auswerten.

## Empfohlene Reihenfolge

1. Persistenz, Migrationen und Backend-Domainmodell.
2. Oeffentliche und Admin-APIs mit Tests.
3. Oeffentliche Frontend-Route.
4. Wiederverwendbares QR-Modul und Theme-Einbindung.
5. Admin-Inbox und Navigation.
6. Abschluss mit Test- und E2E-Erweiterungen.

## Definition of Done

1. Beide Themes rendern das Survey-Modul.
2. `/rueckmeldung/$displayId` funktioniert fuer gueltige Displays.
3. Rueckmeldungen werden in der Datenbank gespeichert.
4. `/api/admin/surveys` liefert filterbare Inbox-Daten fuer Admins.
5. Tests auf Unit-, Integrations- und Web-Ebene sind aktualisiert und gruen.
