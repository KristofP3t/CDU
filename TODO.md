# Offene Punkte bis zum Start auf cdu-schwerin.com

Stand: 25. September 2026. Einzelheiten zu vielen Punkten stehen in
`RELAUNCH.md`.

Bei jedem Punkt steht, wer ihn erledigen kann:
**[KV]** braucht Angaben oder Entscheidungen vom Kreisverband,
**[Tech]** lässt sich im Code erledigen, sobald die Angaben da sind.

---

## 1. Muss vor dem Start erledigt sein

### Formulare
- [ ] **[KV]** Ein EmailJS-Konto anlegen und ein Postfach als Service verbinden.
- [ ] **[KV]** Im EmailJS-Dashboard drei Vorlagen anlegen: Antrag an die
      Geschäftsstelle, Kopie an das neue Mitglied, Kontaktnachricht. Die
      Platzhalter stehen in `RELAUNCH.md`.
- [ ] **[Tech]** Public Key, Service-ID und die drei Vorlagen-IDs eintragen, im
      `MAIL`-Objekt von `mitglied-werden/index.html` und `kontakt/index.html`.
- [ ] **[KV]** In EmailJS nur `cdu-schwerin.com` als erlaubte Domain eintragen,
      damit niemand den Key von anderen Seiten aus benutzt.
- [ ] **[KV]** Rechtlich klären, ob die IBAN aus dem Mitgliedsantrag über einen
      US-Dienst laufen darf. Wenn nicht: die Bankdaten aus der Mail nehmen
      oder einen Anbieter in der EU verwenden.
- [ ] **[Tech]** Nach dem Eintragen einen echten Testantrag und eine echte
      Testnachricht schicken und prüfen, dass beides ankommt.

### Rechtstexte
- [ ] **[KV]** Datenschutzerklärung ergänzen: EmailJS, das Hosting und die
      nachgeladenen Bibliotheken von jsDelivr und cdnjs (dabei geht die IP des
      Besuchers an Dritte).
- [ ] **[Tech]** Alternative dazu: EmailJS und jsPDF selbst hosten. Dann fällt
      das Nachladen von fremden Servern weg, wie schon bei der Schrift.
- [ ] **[KV]** Impressum: Es beruft sich noch auf das TMG. Seit Mai 2024 gilt
      das Digitale-Dienste-Gesetz (DDG).
- [ ] **[KV]** Prüfen, ob Google Analytics bleiben soll. Eine cookielose
      Messung wie Plausible oder Matomo würde das Cookie-Banner überflüssig
      machen.

### Meldungen
- [ ] **[KV]** Den Fließtext der vier Meldungen liefern. Danach
      `status="veroeffentlicht"` setzen und den Build laufen lassen.
- [ ] **[KV]** Die Veröffentlichungsdaten bestätigen. Bei zweien ist nur der
      Monat geschätzt.
- [ ] **[KV]** Die Beitragsbilder in rund 840px Breite aus der
      WordPress-Mediathek liefern; lokal liegen sie nur in 272px vor.
- [ ] **[Tech]** Alternativtexte für die Meldungsbilder ergänzen.

### Fakten, die jemand prüfen muss
- [ ] **[KV]** Spenden: Stimmt der BIC `COBADEFFXXX` mit dem Kontoauszug überein?
- [ ] **[KV]** Spenden: Die Angaben zum Parteiengesetz, besonders die Grenzen
      für Großspenden, gegen die aktuelle Fassung prüfen.
- [ ] **[KV]** Instagram: Heißt das Konto `schwerin_cdu` oder `cduschwerin`?
- [ ] **[KV]** Fax: Stimmt die 59 00 420 (MIT, Frauen Union) oder die
      59 00 421 (Kreisverband)?

---

## 2. Umzug auf cdu-schwerin.com

- [ ] **[Tech]** In `tools/build-site-data.py` `SITE_URL` auf
      `https://cdu-schwerin.com/` setzen und den Build laufen lassen. Damit
      werden Sitemap, `robots.txt`, 404-Seite, Kalenderdateien und die
      `canonical`-Links neu erzeugt. **Erst beim Umzug**, sonst funktioniert
      die 404-Seite in der Vorschau auf GitHub Pages nicht mehr.
- [ ] **[KV]** Das Hosting festlegen: das bisherige Webpaket, GitHub Pages mit
      eigener Domain oder ein anderer statischer Hoster. Der Server muss
      `404.html` für unbekannte Adressen ausliefern.
- [ ] **[KV]** HTTPS-Zertifikat für `cdu-schwerin.com` und `www.` einrichten,
      dazu eine Weiterleitung von `www` auf die Hauptadresse oder umgekehrt.
- [ ] **[KV]** Beim Umstellen der DNS-Einträge die **MX-Einträge nicht
      anfassen**, sonst kommen keine Mails mehr an `@cdu-schwerin.com` an.
- [ ] **[Tech]** Weiterleitungen (301) von den alten WordPress-Adressen auf die
      neuen einrichten, zum Beispiel für Meldungen, Kategorien, `/feed/` und
      `/wp-content/uploads/…`-PDFs. Dafür wird eine Liste der alten Adressen
      gebraucht (Export oder Sitemap der alten Seite).
- [ ] **[KV]** Vor dem Abschalten die alte WordPress-Seite komplett sichern:
      Datenbank, Mediathek und alle PDFs.
- [ ] **[KV]** Die neue Sitemap in der Google Search Console einreichen.
- [ ] **[Tech]** Die Stadtfraktion ist unter `www.cdu-schwerin.de` verlinkt.
      Klären, ob die Domain bleibt oder mit umzieht.
- [ ] **[Tech]** Das Wahlprogramm-PDF liegt auf `danielpeters-mv.de`. Eine
      Kopie auf die eigene Domain legen.

---

## 3. Abnahme vor dem Start

- [ ] **[Tech]** Alle 34 Seiten in Chrome, Firefox und Safari ansehen, dazu
      Telefon und Tablet. Bisher habe ich nur Startseite, Termine, Service,
      Kontakt, Vorstand, Aktuelles, Mitgliedsantrag und die 404-Seite im
      Browser gesehen.
- [ ] **[Tech]** Lighthouse laufen lassen: Performance, Barrierefreiheit, SEO.
- [ ] **[Tech]** Alle Links automatisch prüfen lassen.
- [ ] **[Tech]** Tastaturbedienung prüfen: Menü, Suche, Slider, Formulare.
- [ ] **[KV]** Den Kreisvorstand inhaltlich abnehmen lassen.

---

## 4. Material, das die Seite deutlich besser machen würde

- [ ] **[KV]** Einheitliche Porträts des Kreisvorstands, wie die Serie der
      Jungen Union.
- [ ] **[KV]** Einen Einleitungstext zum Kreisvorstand: was er tut, wann er
      gewählt wurde, wie oft er tagt.
- [ ] **[KV]** Gruppenfoto der Frauen Union; die Bildunterschrift existiert
      schon.
- [ ] **[KV]** Ein Foto der Senioren Union, eine eigene Telefonnummer und,
      falls es ihn gibt, den Landesverband.
- [ ] **[KV]** Das JU-Logo als Datei und das MIT-Logo freigestellt, als PNG
      oder SVG.
- [ ] **[KV]** Die Mobilnummer von Ingo Freund: soll sie auf die Seite?
- [ ] **[KV]** MIT: Leitantrag von 1998 streichen oder aktuelle Beschlusslage
      nennen.
- [ ] **[KV]** Frauen Union: den unklaren Satz zur EFU und den Titel
      „Kreisvorsitzende“ bestätigen.

---

## 5. Ausbau nach dem Start

Inhalte (brauchen Texte vom Kreisverband):
- [ ] Themenseite mit den Positionen der CDU Schwerin zu Verkehr, Sicherheit,
      Schule, Wohnen und Wirtschaft.
- [ ] Kandidatenseite für die Landtags- und OB-Wahl.
- [ ] Seite zur Stadtratsfraktion: Mitglieder, Anträge, Ausschüsse.
- [ ] Formular „Ich kann helfen“ für Plakate, Infostände und Flyer.
- [ ] Newsletter mit Double-Opt-in.
- [ ] Bürgersprechstunden als eigene Termin-Kategorie.
- [ ] Karte der Stadtbezirksverbände.

Gestaltung und Technik:
- [ ] Hero mit einer politischen Botschaft statt Anschrift. Auf dem Telefon
      sollte der Text über dem Bild liegen.
- [ ] Terminseite kompakter, ein abonnierbarer Gesamtkalender und eine
      Monatsansicht.
- [ ] Service, Wahlarchiv und Impressum mit Seitenkopf und Bildern gestalten.
- [ ] Das eingebettete CSS und JS (rund 63 KB in vier Seiten) in die
      gemeinsamen Dateien überführen.
- [ ] Dunkelmodus.
- [ ] Strukturierte Daten (`Event`, `Organization`, `NewsArticle`) für die
      Google-Suche.
- [ ] Web-App-Manifest, damit die Seite auf den Startbildschirm passt.
- [ ] Eine moderne Serifenschrift für Zitate statt Georgia.
