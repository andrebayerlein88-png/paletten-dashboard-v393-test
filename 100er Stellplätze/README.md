# Paletten Dashboard V3.9.3 – zentraler TEST (NICHT PRODUKTIV)

## Was enthalten ist
- Originale Bedienoberfläche und Geschäftslogik als technische Testkopie, aber **synthetische Mitarbeiter** statt echter Personendaten und **separates Test-Admin-Passwort**.
- Node.js Webserver mit geschütztem Dashboard und serverseitigem Testzugang.
- PostgreSQL Snapshot-Speicherung mit Revisionsprüfung gegen stilles Überschreiben.
- GET `/health` prüft die Datenbank.

## Grenzen – wichtig
- **Nicht produktionsreif**: Das bisherige Dashboard prüft Mitarbeiter-IDs und Adminrechte weiterhin im Browser. Der Server prüft nur das gemeinsame Testzugangspasswort, nicht jede einzelne Buchung oder Rolle. Nicht für echte Lagerdaten oder öffentliche Produktivnutzung freigeben.
- Konflikte führen zum Stopp weiterer Speicherung und einer Aufforderung zum Neuladen. Es gibt **keine automatische Zusammenführung** paralleler Änderungen. Offene Änderungen können verloren gehen; Vorgänge müssen geprüft werden.
- Beim kostenlosen Render-Tarif werden Anmeldesitzungen nach einem Neustart ungültig.
- Der bisherige API_TEST_TOKEN wird in diesem Testpaket nicht benutzt und darf niemals im Browser stehen.
- Die HTML-Datei enthält weiterhin Test-Demodaten und ein **bekanntes** Test-Admin-Passwort. Die Zugangssperre des Servers schützt die Testseite; keine echten Konten importieren.
- Nur eine Testdatenbank verwenden: der Start erstellt Tabellen und der erste Browseraufruf kann den bisherigen Zustand der Datenbank überschreiben, falls schon Testdaten vorhanden sind.

## Testkonten
- Test-Admin: `EMP-001`, Admin-Passwort: `DemoOnly-ChangeMe-2026!`
- Test Verpackung: `EMP-002`
- Test Verladung: `EMP-003`

## Render – sichere Bereitstellung
1. **Nicht** die bisherige produktive Netlify-Seite verändern.
2. Erstelle ein separates privates GitHub-Repository oder einen separaten Branch. ZIP entpacken und Inhalt (package.json, src, public, sql, test) hochladen.
3. Neuen Render Web Service in Frankfurt anlegen, Node, Build `npm install`, Start `npm start`, Root Directory dort setzen, wo `package.json` liegt.
4. Environment: `DATABASE_URL` = Render Internal Database URL (nur in Render eintragen), `TEST_ACCESS_PASSWORD` = zufälliger geheimer Wert mit mindestens 32 Zeichen. **Niemals in GitHub, Screenshots oder Chat veröffentlichen.**
5. Für isolierte Tests am besten eine **separate PostgreSQL-Testdatenbank** anlegen. Bestehende Datenbank nicht ohne Backup verwenden.
6. `/health` im Browser prüfen. Danach Render-URL öffnen, mit Testzugangspasswort anmelden.
7. In einem Browser Testpalette anlegen, in zweitem Browser neu laden und Zustand kontrollieren. Gleichzeitige Änderungen provozieren und prüfen, dass der Konflikt gemeldet wird.
8. Vor Produktivbetrieb fehlen serverseitige Mitarbeiterautorisierung, einzelne transaktionale Buchungsendpunkte, robuste Konfliktbehandlung, Sicherheitsprüfung und vollständige Ende-zu-Ende-Tests.

## Lokal testen
`npm install` und `npm test`; für Start `DATABASE_URL` und `TEST_ACCESS_PASSWORD` setzen. Lokaler Test über HTTP benötigt Anpassung des Secure-Cookies – die bereitgestellte Version ist ausdrücklich für Render HTTPS ausgelegt.
