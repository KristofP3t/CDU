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

1. **Formulare scharf schalten.** EmailJS-IDs eintragen, dann den
   Mitgliedsantrag und das Kontaktformular mit echten Nachrichten testen.
   Vorher klären, ob die IBAN über einen US-Dienst laufen darf.
2. **Rechtstexte.** In der Datenschutzerklärung EmailJS, das Hosting und
   die Skripte von jsDelivr und cdnjs ergänzen, oder diese Skripte selbst
   hosten. Im Impressum „TMG“ durch „DDG“ ersetzen.
3. **Meldungen fertigstellen.** Texte, Daten, Bilder in rund 840px Breite,
   Alternativtexte.
4. **Angaben prüfen.** BIC, Grenzen für Großspenden, Instagram-Konto,
   Faxnummer.
5. **Umzug auf cdu-schwerin.com.** `SITE_URL` umstellen, Hosting, HTTPS,
   301-Weiterleitungen von den alten WordPress-Adressen. Die MX-Einträge
   bleiben unverändert, sonst kommen keine Mails mehr an.

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
5. **Cookie-Banner** als kleine Karte unten statt als Balken. Oder ganz
   weglassen, siehe Phase 5.

### Phase 5: Technik

1. **Das eingebettete CSS und JS** (rund 63 KB in `mitglied-werden`,
   `termine`, `kontakt` und `bestaetigung`) in `css/styles.css` und
   `js/main.js` überführen.
2. **Cookielose Messung** (Plausible oder Matomo) statt GA4. Damit entfällt
   das Cookie-Banner vermutlich.
3. **Strukturierte Daten** (`Event`, `Organization`, `NewsArticle`), damit
   Termine direkt in der Google-Suche erscheinen.
4. **Dunkelmodus**: Die Farben sind schon als Variablen angelegt.
5. **Web-App-Manifest** und dezente Seitenübergänge (View Transitions),
   jeweils mit Rücksicht auf die Einstellung für reduzierte Bewegung.
6. **Serifenschrift** für Zitate statt Georgia.

---

## Nächster Schritt

Am schnellsten geht es voran mit diesen Angaben vom Kreisverband:

1. die EmailJS-Zugangsdaten (Public Key, Service-ID, drei Vorlagen-IDs)
2. die Texte der vier Meldungen
3. eine Liste der alten WordPress-Adressen, zum Beispiel deren Sitemap,
   für die Weiterleitungen
