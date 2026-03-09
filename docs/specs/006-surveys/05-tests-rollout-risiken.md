# 05 Tests, Rollout und Risiken

## Teststrategie

## Backend Unit-Tests

1. DTO-Validierung fuer `CreateSurveySubmissionRequest`
2. Ablehnung bei ungueltiger oder fehlender Kategorie
3. Ablehnung bei leerer oder zu langer Nachricht
4. Service-Verhalten bei unbekanntem oder inaktivem Display
5. Sortierung und Filterung der Admin-Abfrage

## Backend Web- und Integrationstests

1. `GET /api/surveys/displays/{displayId}` liefert Kontext fuer gueltiges
   Display.
2. `POST /api/surveys/submissions` speichert gueltige Eintraege.
3. Nicht authentisierte Zugriffe auf `/api/admin/surveys` werden mit
   `401/403` blockiert.
4. Authentisierte Admins erhalten korrekt sortierte Inbox-Daten.
5. Persistenz funktioniert mit H2.
6. Rate-Limit-Fall liefert `429`.

## Frontend Unit- und Integrationstests

1. Survey-QR-Modul rendert die deutschen Texte und eine QR-Ziel-URL.
2. Default-Theme rendert das Survey-Modul.
3. Brutalist-Theme rendert das Survey-Modul.
4. Der bestehende Theme-Parity-Test wird um das Survey-Modul erweitert.
5. Die Route `/rueckmeldung/$displayId` laedt Kontext, validiert Eingaben und
   sendet erfolgreich.
6. Die Admin-Inbox zeigt deutsche UI-Texte und reagiert auf Filter.

## Web-/E2E-Tests

1. Oeffentliche Route `/rueckmeldung/$displayId`:
   - gueltiges Display oeffnen
   - Formular ausfuellen
   - erfolgreichen Submit bestaetigen
2. Admin-Flow:
   - Admin-Login
   - Survey-Inbox oeffnen
   - neue Rueckmeldung sehen
3. Theme-Flow:
   - Display mit Default-Theme zeigt Survey-Modul
   - Display mit Brutalist-Theme zeigt Survey-Modul

## Wichtige Testfaelle

1. Leere Nachricht wird client- und serverseitig abgelehnt.
2. Optionaler Name darf fehlen.
3. `displayId` ist unbekannt.
4. `displayId` ist inaktiv oder nicht feedbackfaehig.
5. Freitextsuche findet Treffer in `message` und `submitterName`.
6. Kategorie-Filter reduziert die Inbox korrekt.

## Rollout-Plan

1. Backend-Migrationen und Endpunkte deployen.
2. Frontend mit oeffentlicher Route und Theme-Modulen deployen.
3. Admin-Inbox freischalten.
4. Pilotbetrieb auf wenigen Displays beobachten.
5. Sichtbarkeit, Scanbarkeit und Rueckmeldungsqualitaet evaluieren.

## Rollback-Plan

1. Display-Modul aus den Themes entfernen und Frontend neu deployen.
2. Oeffentliche Route und Admin-Zugriff im Frontend stilllegen.
3. Backend-Endpunkte koennen notfalls ungenutzt bleiben.
4. Gespeicherte Daten bleiben unkritisch erhalten, bis eine separate
   Bereinigungsstrategie definiert wird.

## Risiken und Gegenmassnahmen

1. Risiko: Spam oder Unsinnseintraege.
   Gegenmassnahme: Rate-Limit, Eingabegrenzen, spaeter erweiterbare Anti-Spam-
   Strategie.
2. Risiko: QR-Code ist in einem Theme schlecht scanbar.
   Gegenmassnahme: feste Mindestgroesse, hoher Kontrast, Test auf echten
   Geraeten.
3. Risiko: sehr lange Texte verschlechtern die Admin-UI.
   Gegenmassnahme: robustes Layout, Zeilenumbruch, definierte Maximalgrenzen.
4. Risiko: fehlende Theme-Parity fuehrt zu inkonsistentem Verhalten.
   Gegenmassnahme: gemeinsames Modul und erweiterter Parity-Test.
