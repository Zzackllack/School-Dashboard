# Spec 006: Surveys / Schueler-Feedback

## Zweck

Diese Spezifikation beschreibt ein neues Feedback-Feature fuer den
School-Dashboard-Stack. Auf jedem Display wird ein eigener QR-Code angezeigt,
den Schueler mit dem Smartphone scannen koennen. Der QR-Code fuehrt auf eine
oeffentliche, deutschsprachige Rueckmeldungsseite derselben Anwendung. Dort
koennen Schueler Probleme, Wuensche oder allgemeines Feedback zum Dashboard
einreichen.

Das Feature deckt den gesamten Ablauf ab:

- Anzeige eines QR-Codes im Display-Theme.
- Oeffentliche Eingabeseite fuer Rueckmeldungen.
- Persistenz der Eintraege in der Datenbank.
- Geschuetzte Einsicht im Admin-Bereich als einfache Inbox.

## Warum diese Spec existiert

Der aktuelle Dashboard-Stack bietet keinen direkten, niedrigschwelligen Kanal
fuer Rueckmeldungen aus der Schuelerschaft. Hinweise zu Problemen, Wuenschen
oder Verbesserungsbedarf gehen dadurch verloren oder muessen ausserhalb des
Systems gesammelt werden.

Mit diesem Feature soll:

- Feedback direkt am Display ausgelost werden.
- jede Rueckmeldung einem Display bzw. Standort zugeordnet bleiben.
- die Nutzererfahrung fuer Schueler vollständig auf Deutsch sein.
- das Admin-Team neue Rueckmeldungen ohne Zusatzsystem im Dashboard sehen
  koennen.

## Scope

Im Scope:

- neues Survey-/Feedback-Modul im Default-Theme.
- neues Survey-/Feedback-Modul im Brutalist-Theme.
- oeffentliche Route `/rueckmeldung/$displayId`.
- neue oeffentliche und geschuetzte Backend-Endpunkte.
- Datenbankpersistenz fuer Feedback-Eintraege.
- Admin-Inbox fuer Rueckmeldungen.
- Tests, Rollout, Risiken und Implementierungsvorgaben.

Nicht im Scope fuer V1:

- Antworten an Schueler.
- Bearbeitungsstatus, Archiv oder Ticket-Workflow.
- Uploads oder Anhaenge.
- Moderation, Freigabe oder Loesch-UI.
- globale Survey-Links ohne Display-Bezug.

## Spec-Set

1. [01-produkt-spec.md](./01-produkt-spec.md)
2. [02-technik-spec.md](./02-technik-spec.md)
3. [03-api-und-datenvertraege.md](./03-api-und-datenvertraege.md)
4. [04-umsetzungsplan.md](./04-umsetzungsplan.md)
5. [05-tests-rollout-risiken.md](./05-tests-rollout-risiken.md)
6. [06-agent-implementierungsprompt.md](./06-agent-implementierungsprompt.md)

## Genutzte Inputs

- bestehende Display-Theme-Architektur in `docs/specs/005-themes/`.
- bestehende Display- und Admin-Flows im Frontend und Backend.
- vorhandene Sicherheits- und Routing-Struktur fuer oeffentliche sowie
  admin-geschuetzte Endpunkte.
- Produktvorgabe: deutsche UI, QR pro Display, kategorisierte Rueckmeldung,
  einfache Inbox ohne Statusworkflow.
