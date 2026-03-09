# 01 Produkt-Spezifikation

## Problemdefinition

Schueler haben aktuell keinen direkten In-App-Kanal, um Probleme, Wuensche
oder allgemeines Feedback zum School Dashboard abzugeben. Rueckmeldungen werden
dadurch nicht systematisch eingesammelt und koennen weder einem konkreten
Display noch einem Standort sicher zugeordnet werden.

## Produktziel

Fuehre ein leicht zugaengliches Feedback-Feature ein, das direkt auf den
Displays sichtbar ist, per Smartphone aufrufbar bleibt und Rueckmeldungen im
Admin-Bereich zentral verfuegbar macht.

## Ziele

1. Schueler koennen ohne Login schnell Feedback zum Dashboard absenden.
2. Jede Rueckmeldung bleibt einem konkreten Display zugeordnet.
3. Die komplette Schueler-UX ist auf Deutsch.
4. Admins koennen neue Rueckmeldungen in einer geschuetzten Inbox einsehen.
5. Beide Display-Themes stellen das Feature mit gleicher Funktionalitaet bereit.

## Nicht-Ziele

1. Kein Ticket-System mit Bearbeitungsstatus oder Zustandswechseln.
2. Keine Antwortfunktion an Schueler.
3. Keine Uploads, Bilder oder sonstigen Anhaenge.
4. Keine Push-Benachrichtigungen oder E-Mail-Workflows.
5. Keine allgemeine Schulkommunikationsplattform ausserhalb des
   Dashboard-Kontexts.

## Nutzerrollen

- Schueler:
  - sieht den QR-Code am Display.
  - scannt den Code mit dem Smartphone.
  - sendet kategorisiertes Feedback.
- Admin:
  - nutzt den geschuetzten Admin-Bereich.
  - sieht neue Rueckmeldungen als Inbox.
  - filtert nach Kategorie, Display und Freitext.

## Kern-User-Flows

## F1: Rueckmeldung vom Display aus starten

1. Ein Display zeigt im aktiven Theme ein Feedback-Modul mit QR-Code.
2. Ein Schueler scannt den QR-Code.
3. Das Smartphone oeffnet `/rueckmeldung/$displayId`.

## F2: Oeffentliche Feedback-Eingabe

1. Die Seite laedt den Display-Kontext.
2. Der Schueler waehlt eine Kategorie:
   - `PROBLEM`
   - `WUNSCH`
   - `ALLGEMEINES_FEEDBACK`
3. Der Schueler schreibt eine Nachricht.
4. Optional gibt der Schueler einen Namen an.
5. Die Rueckmeldung wird gespeichert.
6. Die Seite zeigt eine deutsche Erfolgsbestaetigung.

## F3: Einsicht im Admin-Bereich

1. Ein Admin meldet sich im Admin-Bereich an.
2. Der Admin oeffnet die Survey-Inbox.
3. Der Admin sieht die neuesten Rueckmeldungen zuerst.
4. Der Admin filtert bei Bedarf nach Kategorie, Display oder Suchtext.

## Funktionale Anforderungen

1. Jedes Display erzeugt einen eigenen QR-Code mit Display-Bezug.
2. Das Feedback-Modul erscheint in beiden Themes:
   - Default: rechte Sidebar vor `Credits`
   - Brutalist: rechte Modulleiste vor `Credits`
3. Das Formular ist oeffentlich und benoetigt keine Authentifizierung.
4. Die Kategorie ist Pflicht, die Nachricht ist Pflicht, der Name ist optional.
5. Rueckmeldungen werden dauerhaft in der Datenbank gespeichert.
6. Nur authentisierte Admins duerfen die Inbox abrufen.

## UX-Anforderungen

1. Sichtbare UI-Texte fuer Schueler sind auf Deutsch.
2. Das Modul auf dem Display nutzt die Ansprache `Dein Feedback`.
3. Das Formular erklaert knapp, wofuer die Rueckmeldung gedacht ist.
4. Erfolgs- und Fehlerzustaende werden in deutscher Sprache angezeigt.

## Erfolgsmetriken

1. Auf beiden Themes ist ein sichtbarer, scanbarer QR-Code vorhanden.
2. Oeffentliche Uebermittlung funktioniert ohne Login.
3. Eine abgeschickte Rueckmeldung erscheint im Admin-Bereich.
4. Die Display-Zuordnung geht entlang des gesamten Datenflusses nicht verloren.

## Akzeptanzkriterien

1. Ein aktives Display im Default-Theme zeigt das Feedback-Modul.
2. Ein aktives Display im Brutalist-Theme zeigt dasselbe Feature.
3. `/rueckmeldung/$displayId` laedt ein deutsches Formular.
4. Eine gueltige Rueckmeldung wird gespeichert und bestaetigt.
5. Nicht authentisierte Aufrufe an `/api/admin/surveys` werden blockiert.
6. Die Admin-Inbox zeigt neue Eintraege standardmaessig absteigend nach
   Erstellungszeitpunkt.
