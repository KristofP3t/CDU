# Plan: Ausbau und Modernisierung

Stand: 25. September 2026. Hier steht, **was** getan werden soll und
**warum**. Die Checkliste zum Abhaken steht in `TODO.md`, der bisherige
Verlauf in `RELAUNCH.md`.

Ziel: Die Seite läuft später unter **cdu-schwerin.com**.

---

## Am PC weitermachen

```bash
git clone https://github.com/KristofP3t/CDU.git   # oder: git pull im bestehenden Ordner
cd CDU
python3 tools/build-site-data.py                 # Meldungen, Termine, Suche, Sitemap, 404
python3 -m http.server 8000                      # dann http://localhost:8000 öffnen
```

- Das Build-Skript braucht Python 3.9 oder neuer. Für die GiroCodes auf
  der Spendenseite zusätzlich `pip install segno`.
- Meldungen werden in `inhalte/meldungen/` gepflegt, Termine in
  `inhalte/termine/`. Die erzeugten Seiten nicht von Hand ändern, sondern
  danach das Build-Skript laufen lassen.
- Die 404-Seite verlinkt mit dem Pfad `/CDU/` und lädt deshalb lokal ohne
  Stylesheet. Auf dem Server ist sie richtig.

---

## Befund der Prüfung

**Was gut ist:** statisch und schnell, die Schrift selbst gehostet statt
von Google, per Tastatur bedienbar, Kontraste nach WCAG, Rücksicht auf die
Einstellung für reduzierte Bewegung. Meldungen und Termine kommen aus
Quelldateien und werden per Skript gebaut.

**Was fehlt:** Die Seite ist bisher vor allem ein Vereinsverzeichnis.
Positionen, Kandidaten und Wege zum Mitmachen jenseits der Mitgliedschaft
fehlen. Die Formulare senden noch nicht, und die vier Meldungen haben
keinen Text.

**Was altbacken wirkt:** Der erste Bildschirm zeigt Anschrift und
Sprechzeit statt einer Botschaft. Die Unterseiten (Service, Wahlarchiv,
Impressum) bestehen aus Überschrift, Text und hellen Kästen. Die
Terminkarten sind groß bei wenig Inhalt.

---

## Phasen

### Phase 1: Startklar machen

Ohne diese Punkte kann die Seite nicht live gehen.

**Ziel:** Die Seite läuft auf cdu-schwerin.com im bisherigen Webpaket, und
wer Mitglied werden will, kann den Antrag vollständig online stellen:
bestätigt, mit Bankdaten, ohne Papier. Kein fester Termin.

**Fertig ist die Phase, wenn** die Abschnitte 1 bis 3 in `TODO.md`
abgehakt sind, ein Testantrag mit IBAN nach Klick auf den
Bestätigungslink vollständig bei der Geschäftsstelle ankommt, eine
Testnachricht über das Kontaktformular ebenso, Lighthouse bei
Barrierefreiheit und SEO mindestens 95 zeigt und keine alte
WordPress-Adresse auf 404 läuft.

1. **Formulare über ein eigenes PHP-Skript.** EmailJS fällt weg. Die
   Formulardaten samt IBAN verlassen die EU nicht. Das Skript verschickt
   über SMTP aus dem Postfach des Kreisverbands.
   - Echter Double-Opt-in: Der Antrag geht erst an die Geschäftsstelle,
     wenn der Link in der Mail an das neue Mitglied geklickt wurde.
   - Bis dahin liegt er verschlüsselt (libsodium) auf dem Server, der
     Schlüssel außerhalb des Web-Verzeichnisses. Unbestätigte Anträge
     werden nach 7 Tagen gelöscht.
   - Gegen Spam: unsichtbares Feld (Honeypot) und Ratenlimit pro IP,
     kein Captcha.
   - Keine Bankdaten in Logs oder Fehlermeldungen.
2. **Rechtstexte.** Entwurf aus dem technischen Ist-Stand, Freigabe durch
   den Kreisverband: PHP-Versand, gespeicherte Anträge, Hosting, Google
   Analytics. Im Impressum „TMG“ durch „DDG“ ersetzen. jsPDF selbst
   hosten, dann bleibt kein fremdes Skript außer GA.
3. **Google Analytics bleibt**, misst aber auf allen Seiten erst nach
   Einwilligung. Das Banner kommt auf alle Seiten, der `preconnect` zu
   googletagmanager.com vor der Einwilligung fällt weg.
4. **Meldungen fertigstellen.** Texte, Daten, Bilder in rund 840px Breite,
   Alternativtexte.
5. **Angaben prüfen.** BIC, Grenzen für Großspenden, Instagram-Konto,
   Faxnummer.
6. **Umzug auf cdu-schwerin.com** im bisherigen Webpaket, beim selben
   Anbieter wie WordPress und das Postfach.
   - WordPress bleibt in seinem Verzeichnis liegen, die Domain wird auf
     das neue umgehängt. Zurück geht es mit einem Klick.
   - Deployment per GitHub Action: Build und Upload per SFTP nach jedem
     Push auf `main`.
   - Abnahme vorher auf einer Subdomain mit Passwortschutz, zum Beispiel
     `neu.cdu-schwerin.com`. Die PHP-Formulare laufen nicht auf der
     Vorschau bei GitHub Pages.
   - `SITE_URL` umstellen, HTTPS, 301-Weiterleitungen über `.htaccess`
     von den alten WordPress-Adressen. Die MX-Einträge bleiben
     unverändert, sonst kommen keine Mails mehr an.

**Annahmen:** Das Paket bietet PHP 8.1 oder neuer mit libsodium, SMTP,
SFTP und Subdomains. „Daten bleiben in der EU“ gilt für die
Formulardaten; GA ist die bewusste Ausnahme, abgesichert durch
Einwilligung.

**Risiken:** Ob die Geschäftsstelle ein SEPA-Mandat ohne Unterschrift
annimmt, ist offen. Wenn nicht, ist „ohne Papier“ nicht erreichbar und
das Ziel muss angepasst werden. Mails aus dem Paket können im Spam landen,
wenn SPF, DKIM und DMARC der Domain den Versand nicht abdecken.

**Bewusst später:** ob die Stadtfraktion unter cdu-schwerin.de bleibt,
die Rechte an der Kopie des Wahlprogramm-PDFs, ein Vergleich der
Antragszahlen vor und nach dem Umzug.

*Erledigt:* Kontaktformular an EmailJS angebunden (noch ohne IDs), Symbole
und Links auf der Terminseite repariert, 404-Seite, Sitemap und
`robots.txt`.

### Phase 2: Inhalte, die Wähler suchen

Hier liegt die größte inhaltliche Lücke.

1. **Themenseite**: Wofür steht die CDU Schwerin vor Ort? Verkehr,
   Sicherheit, Schule, Wohnen, Wirtschaft, je drei bis fünf
   Kernforderungen.
2. **Kandidatenseite** zur Landtags- und OB-Wahl: Porträt, Wahlkreis,
   Werdegang, Zitat. Das Wahlprogramm auf die eigene Domain holen.
3. **Hero mit Botschaft** statt Anschrift, zum Beispiel „Für ein sicheres,
   lebendiges Schwerin“. Im Wahlkampf den Kandidaten zeigen und einen
   Countdown zum Wahltag. Auf dem Telefon den Text über das Bild legen.
4. **Stadtratsfraktion**: Mitglieder, Anträge, Ausschüsse.

### Phase 3: Mitmachen leichter machen

1. **„Ich kann helfen“**: Kurzformular mit Auswahl (Plakate, Infostand,
   Flyer). Die Hürde ist niedriger als bei einer Mitgliedschaft.
2. **Newsletter** mit Double-Opt-in.
3. **Bürgersprechstunden** als eigene Termin-Kategorie.
4. **Karte der Stadtbezirksverbände**: Welcher Verband ist für meine
   Straße zuständig?
5. **Regelmäßige Meldungen**, etwa Rückblicke mit Fotos. Mit nur vier
   Meldungen wirkt die Seite schnell verwaist.

### Phase 4: Gestaltung

1. **Terminseite kompakter**: Datum und Punkt auf der Zeitleiste
   zusammenlegen, Zeilen statt großer Karten. Dazu ein abonnierbarer
   Gesamtkalender und eine Monatsansicht.
2. **Unterseiten gestalten**: Seitenkopf mit Motivbild, Icons, echte
   Gewichtung. Die Kontaktadresse als Karte mit Kartenausschnitt.
3. **Einheitliche Porträts** für den Kreisvorstand, wie die Serie der JU.
4. **Eine Zahlenleiste** auf der Startseite: Mitglieder, Sitze im
   Stadtrat, Ortsverbände.
5. **Cookie-Banner** als kleine Karte unten statt als Balken.

### Phase 5: Technik

1. **Das eingebettete CSS und JS** (rund 63 KB in `mitglied-werden`,
   `termine`, `kontakt` und `bestaetigung`) in `css/styles.css` und
   `js/main.js` überführen.
2. **Cookielose Messung** (Plausible oder Matomo) statt GA4. Vorerst
   zurückgestellt: GA bleibt, mit Einwilligung (siehe Phase 1).
3. **Strukturierte Daten** (`Event`, `Organization`, `NewsArticle`), damit
   Termine direkt in der Google-Suche erscheinen.
4. **Dunkelmodus**: Die Farben sind schon als Variablen angelegt.
5. **Web-App-Manifest** und dezente Seitenübergänge (View Transitions),
   jeweils mit Rücksicht auf die Einstellung für reduzierte Bewegung.
6. **Serifenschrift** für Zitate statt Georgia.

---

## Nächster Schritt

Am schnellsten geht es voran mit diesen Angaben vom Kreisverband:

1. Anbieter und PHP-Version des Webpakets, dazu SMTP- und SFTP-Zugang
2. ob ein online bestätigtes SEPA-Mandat ohne Unterschrift reicht
   (Schatzmeister oder Bank)
3. die Texte der vier Meldungen
4. eine Liste der alten WordPress-Adressen, zum Beispiel deren Sitemap,
   für die Weiterleitungen

Parallel im Code: das PHP-Skript für beide Formulare, jsPDF selbst hosten,
das Cookie-Banner auf alle Seiten, Alternativtexte, Entwürfe der
Rechtstexte.
