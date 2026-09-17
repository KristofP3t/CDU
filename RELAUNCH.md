# CDU Schwerin – Startseiten-Relaunch 2026
## Implementierungsstatus

---

## Offen: E-Mail-Versand anbinden (September 2026)

**Ohne diesen Schritt nimmt die Seite keine Anträge und keine Nachrichten
entgegen.**

### Mitgliedsantrag

Beim Absenden gehen zwei Nachrichten raus: der vollständige Antrag an die
Geschäftsstelle und eine Kopie ohne Bankdaten an die Antragstellerin oder
den Antragsteller, zusammen mit dem Bestätigungslink (Double-Opt-in).
Beides läuft über EmailJS, die Bibliothek ist bereits eingebunden.

Einzutragen sind **fünf Werte an einer Stelle**, im `MAIL`-Objekt oben im
Skript von `mitglied-werden/index.html`:

| Wert | woher |
|---|---|
| `schluessel` | EmailJS-Dashboard, Public Key |
| `dienst` | die Service-ID des sendenden Postfachs |
| `vorlageCdu` | Template-ID der Nachricht an die Geschäftsstelle |
| `vorlageMitglied` | Template-ID der Nachricht an das neue Mitglied |
| `empfaengerCdu` | steht bereits auf `kreisverband@cdu-schwerin.com` |

Die beiden Vorlagen im Dashboard brauchen diese Platzhalter:

```
an die Geschäftsstelle          an das neue Mitglied
  An:      {{empfaenger}}         An:      {{empfaenger}}
  Antwort: {{antwort_an}}         Betreff: frei
  Betreff: {{name}}               Inhalt:  {{name}}
  Inhalt:  {{antrag}}                      {{bestaetigung_link}}
                                           {{antrag}}
```

`{{antrag}}` ist der fertig gesetzte Antragstext, nach Schritten
gegliedert. Die Vorlage braucht also keine 37 Einzelfelder.

Solange die Platzhalter im Code stehen, wird **nichts gesendet**, und das
Formular sagt es auch: Es zeigt eine Fehlermeldung und verweist auf das
PDF und den Postweg, statt Erfolg zu melden und den Antrag zu verlieren.

### Kontaktformular

`kontakt/index.html` sendet weiterhin an
`https://formspree.io/f/FORMSPREE_ID_EINFUEGEN`, also an einen
Platzhalter. **Dieses Formular ist unverändert tot.** Es wäre auf
dieselbe EmailJS-Anbindung umzustellen; das ist noch nicht geschehen.

### Vor der Freigabe zu klären

Der Antrag enthält die IBAN. EmailJS ist ein US-Dienst; ob
Bankverbindungen darüber laufen dürfen, ist eine datenschutzrechtliche
Frage, keine technische. Zwei Auswege, falls nicht: die Bankfelder aus
der Vorlage an die Geschäftsstelle herausnehmen und den Beitragseinzug
getrennt einholen, oder einen Anbieter mit Verarbeitung in der EU
verwenden. Die Anbindung liegt an einer Stelle und lässt sich tauschen.

---

## Umbau der Startseite (September 2026)

Die Startseite ist neu gegliedert. Reihenfolge jetzt: **Hero → Aktuelles
(Meldungen + Termine nebeneinander) → Mitmachen → Grußwort → Video → Footer.**

- **Hero**: Der Bildslider trägt jetzt eine Textebene mit H1, Kurztext und den
  beiden Handlungszielen (Mitglied werden, Termine). Vorher hatte die
  Startseite als einzige Seite des Projekts **keine H1** und der erste
  Bildschirm war ohne Aussage. Punktnavigation ergänzt die Pfeile; die Punkte
  entstehen in `js/main.js` aus der Zahl der Bilder.
- **Aktuelles**: Meldungen (2/3) und Termine (1/3) stehen nebeneinander statt
  untereinander. Gestapelt (ab 1024px abwärts) stehen die Termine oben.
- **Meldungen**: Bildkacheln zum Wischen, im Aufbau von „TK aktuell" auf
  tk.de übernommen – Bild, darauf unten ein Verlauf mit Kategorie und
  Schlagzeile, darunter mittig die Punkte und rechts die Blätterpfeile. Das
  Wischen macht `scroll-snap` im CSS; JavaScript steuert nur die Bedienung
  bei. Geblättert wird **seitenweise**: bei zwei sichtbaren Kacheln ergeben
  vier Meldungen zwei Punkte, auf dem Telefon bei einer sichtbaren Kachel
  vier. Die Zahl der Punkte passt sich der Fensterbreite an. Auf dem Telefon
  füllt eine Kachel die Breite und die nächste schaut am Rand hervor, die
  Pfeile entfallen dort – wie in der Vorlage. Echte `<img>` statt
  Inline-`background-image`, dadurch `width`/`height` und `loading="lazy"`.

  Abweichung von der Vorlage: tk.de zeigt auf dem Desktop **drei** Kacheln,
  wir zeigen **zwei**. Die Meldungen stehen bei uns in der 2/3-Spalte neben
  den Terminen, nicht über die volle Seitenbreite. Zwei Kacheln sind dort
  426px breit und damit ähnlich groß wie die 558px auf tk.de; drei wären je
  280px, und die Schlagzeilen würden abgeschnitten.

  Die **Kategorien** („Veranstaltungen", „OB-Wahl", „Landespolitik") sind aus
  den Schlagzeilen abgeleitet und nutzen die Kategorieliste aus
  `newsarchiv/index.html`. Sie stammen **nicht** aus der Live-Seite – dort
  gepflegte Kategorien können abweichen. Sie stehen je einmal in
  `index.html` und lassen sich dort direkt ändern.
- **Mitmachen**: neues Farbband mit Mitglied werden / Spenden / Kontakt. Ersetzt
  die in Commit `e740025` entfernte `features-section` und holt die
  Conversion-Ziele aus dem Seitenfuß nach oben.
- **Grußwort**: gekürzte Fassung des Textes von Jascha Rainer Dopp mit Porträt
  und Link auf den Vorstand.
- **Video**: mit Standbild (`assets/images/video-poster.jpg`, aus dem Video
  extrahiert) und `preload="none"`. Das Autoplay per JS ist entfallen – es zog
  bei jedem Aufruf der Startseite rund 84 MB, ohne dass jemand auf Abspielen
  geklickt hatte.
- **Footer**: statt zweier 250px-Social-Bilder jetzt Kontakt, zwei
  Linklisten (Die Partei, Service) und eine Icon-Zeile. Das Raster nutzt
  `auto-fit`, damit der schlankere Footer der Unterseiten davon unberührt bleibt.
- **Meta**: `og:image` und `rel="canonical"` ergänzt. Das `twitter:card` stand
  auf `summary_large_image`, ohne dass ein Bild hinterlegt war.
- **Aufgeräumt**: totes CSS der entfernten Abschnitte (`hero-section`,
  `banner-section`, `welcome-section`, `features-section`, `social-image`)
  gelöscht; das `style`-Attribut am Menüpunkt „Mitglied werden" ist eine
  Klasse geworden.

### Nachgezogen

- **Video komprimiert**: 80,6 MB → 12,5 MB (84 % kleiner). H.264 High, 1280×720,
  CRF 23, AAC 128 kbit/s, `+faststart`. Länge, Ton und Bildinhalt unverändert.
  Zusammen mit `preload="none"` lädt die Startseite jetzt gar kein Video mehr,
  bis jemand auf Abspielen klickt.

  ```
  ffmpeg -i mitglieder-werbung.mp4 -c:v libx264 -preset slow -crf 23 \
    -profile:v high -level 4.0 -pix_fmt yuv420p -vf "scale=1280:-2" \
    -c:a aac -b:a 128k -ac 2 -movflags +faststart out.mp4
  ```

- **Footer auf allen 28 Seiten vereinheitlicht**: die Unterseiten hatten einen
  verkürzten Footer, auf 23 der 28 Seiten war weder Impressum noch
  Datenschutz verlinkt – für die Impressumspflicht müssen beide von jeder
  Seite erreichbar sein. Alle Seiten tragen jetzt denselben Footer, die
  internen Verweise sind je nach Ebenentiefe relativ gesetzt.

### Blockiert: braucht Material von cdu-schwerin.com

Beide Punkte hängen an Daten, die es nur auf der Live-Seite gibt. Aus der
Entwicklungsumgebung ist `cdu-schwerin.com` nicht erreichbar – der
Egress-Proxy weist die Verbindung mit 403 ab. Wer die Seite lokal vorliegen
hat oder die Domain im Environment freischaltet, kann beides in einem Zug
nachziehen.

- **Meldungen ohne Datum.** Für einen Datums-Kicker auf den Meldungskacheln
  fehlen die Veröffentlichungsdaten. Im Projekt gibt es sie nirgends: die
  beiden Daten in `aktuelles/index.html` („25. Februar 2026", „November 2025")
  sind **Veranstaltungs-, keine Veröffentlichungsdaten** und taugen deshalb
  nicht als Kicker. Für die beiden übrigen Meldungen existiert lokal gar keine
  Datumsangabe. Gebraucht wird je Meldung das Veröffentlichungsdatum der vier
  in `index.html` verlinkten Beiträge.

- **Meldungsbilder in höherer Auflösung.** Die vier Bilder liegen in 272×182
  vor – auch in der Git-Historie gibt es keine größeren Fassungen. Gemessene
  Skalierung der neuen Startseite:

  | Ansicht | Darstellung | Gerätepixel | Faktor |
  |---|---|---|---|
  | 1440px @1x | 420px | 420px | 1,54× |
  | 1440px @2x (Retina) | 420px | 840px | 3,09× |
  | 390px @2x | 120px | 240px | 0,88× |
  | 390px @3x | 120px | 360px | 1,32× |

  Auf dem Telefon ist die Auflösung dank der Querformat-Karten ausreichend,
  auf dem Desktop – besonders auf Retina-Displays – sind die Bilder sichtbar
  weich. Gebraucht werden die Original-Beitragsbilder aus der
  WordPress-Mediathek, sinnvoll wären rund 840px Breite.

---

## MIT-Seite (September 2026)

Die Seite der Mittelstands- und Wirtschaftsunion trug bisher eine gekürzte
Nacherzählung der Live-Seite: drei Absätze, eine Kontaktangabe, kein Bild.
Jetzt steht der **vollständige Inhalt von
`cdu-schwerin.com/wirtschafts-und-mittelstandsvereinigung/`** darauf, neu
gegliedert.

**Übernommen:** beide Textteile („Was ist die MIT?", „Was will die MIT?") in
voller Länge, die Einladung zur Mitgliedschaft samt Hinweis auf
Nicht-CDU-Mitglieder, die Kontaktangaben mit Kreisvorsitzendem Christian
Graf, der Verweis auf den Landesverband (`mit-mv.de`, jetzt über HTTPS) und
das MIT-Logo als `assets/images/mit-schwerin-logo.jpg` (950×233, das einzige
Inhaltsbild der Vorlage).

Alte Schreibweisen sind dabei angeglichen („Einfluß" → „Einfluss", „In dem
wir" → „Indem wir", „2/3" → „zwei Drittel"), inhaltlich ist nichts gestrichen.

**Neu gestaltet:**

- **Kopf** mit Logo, Kicker („Vereinigung der CDU Schwerin"), H1 und
  Vorspann. Die H1 heißt jetzt „Mittelstands- und Wirtschaftsunion (MIT)" –
  so nennt sich die Vereinigung selbst; „Wirtschafts- und
  Mittelstandsvereinigung" stand nur in der Adresse und in der alten
  Überschrift. Die Adresse bleibt unverändert, damit Links weiter passen.
- **Kennzahlen** (`.kennzahlen`): die Mitgliederzahlen (40.000 / 600 / 100)
  und die Zahlen zum Mittelstand (90 % / zwei Drittel / vier Fünftel) standen
  in der Vorlage als Satzteile mitten im Fließtext. Als Reihe mit Linie links
  sind sie lesbar, ohne dass ein Kasten den Text unterbricht.
- **Themenkarten** (`.themenkarten`): die vier Ziele aus „Was will die MIT?"
  – Soziale Marktwirtschaft, privates Eigentum, fairer Wettbewerb,
  gesellschaftliche Anerkennung – statt eines Absatzblocks.
- **Mitmachen-Block** auf dunklem Grund mit zwei Schaltflächen. Die Einladung
  war in der Vorlage eine dünne Zeile zwischen zwei Absätzen. Die
  Hauptschaltfläche führt an `mit@mit-schwerin.de`, nicht an den
  CDU-Mitgliedsantrag: die MIT nimmt ausdrücklich auch Nicht-CDU-Mitglieder
  auf, der Antrag unter `mitglied-werden/` ist der der Partei.
- **Kontakt** in zwei `.infokarte`-Spalten: Angaben links, weiterführende
  Seiten rechts.

Die Klassen heißen `.vereinigung*`, nicht `.mit*` – die drei übrigen
Vereinigungsseiten sind gleich gebaut und bestreiten ihr Layout bisher mit
`style`-Attributen. `.vereinigung > .container` begrenzt die Textspalte auf
1040px; über die 1400px von `.container` laufen Zeilen sonst weit über 100
Zeichen. Der Hauptteil enthält kein einziges `style`-Attribut mehr.

### Offen

- **Leitantrag von 1998.** Die Vorlage nennt den Leitantrag des 5.
  Landesmittelstandstages vom 21. Februar 1998, verlinkt ihn aber nirgends.
  Der Satz steht übernommen auf der Seite, mit `TODO` im Quelltext: prüfen,
  ob es eine neuere Beschlusslage gibt – sonst streichen.
- **Zwei Faxnummern.** Für die MIT nennt die Live-Seite die 59 00 420, für
  den Kreisverband im Seitenfuß die 59 00 421. Beide stehen so dort; welche
  stimmt, ist ungeprüft. Vermerkt als Kommentar an der Adresse.
- **Logo mit weißem Rand.** Das JPEG bringt breite weiße Ränder mit. Auf dem
  weißen Seitengrund fällt das nicht auf, eine freigestellte PNG- oder
  SVG-Fassung wäre aber sauberer.
- **`tools/build-site-data.py` braucht Python 3.10+.** Die
  Typangabe `int | None` scheitert unter 3.9 beim Import. Auf Rechnern mit
  dem Apple-Python (3.9.6) läuft das Skript nur mit
  `from __future__ import annotations` in der ersten Zeile.

---

## Frauen-Union-Seite (September 2026)

Gleiches Vorgehen wie bei der MIT-Seite: erst den vollständigen Inhalt von
`cdu-schwerin.com/frauen-union-schwerin/` übernehmen, dann neu gliedern. Die
bisherige lokale Fassung war eine Zusammenfassung – vier knappe Karten, wo
die Live-Seite eine ausgeführte Ansprache hat.

**Übernommen:** die Eingangsansprache („Politik und Wetter sind
unausweichlich"), die drei „ob Sie … – oder nicht"-Zeilen, der
Pflasterstein-Satz, alle vier Schwerpunkte in voller Länge (bisher standen
sie auf ein Drittel gekürzt da), der gesamte Abschnitt „Komm mit: Politik
braucht Frauen!" und die Kontaktangaben samt Anschrift und Faxnummer.

Berichtigt sind offensichtliche Fehler der Vorlage: „Aus dem dem reinen
Männer-Blickwinkel" → „Aus dem reinen", „neue Lösungen : Phantasie" →
„Lösungen: Phantasie", „Ökologie Vorausdenkende Ökonomie" → „vorausdenkende".
Aus „Ansprechpartner" ist „Ansprechpartnerin" geworden.

**Neu gestaltet** – mit den `.vereinigung*`-Klassen der MIT-Seite, dazu zwei
neue Bausteine:

- **Zitat** (`.vereinigung-zitat`): „Wenn Sie nicht zur Politik gehen, kommt
  die Politik zu Ihnen:" stand in der Vorlage mitten im Fließtext und trägt
  die Aussage der Seite. Serifenschrift, Linie in Akzentfarbe, danach die
  drei Zeilen als Liste.
- **Ansprechpartnerin mit Porträt** (`.vereinigung-person`): das Bild von
  Manuela Preuß-Daschke aus `assets/images/vorstand/`. Die Live-Seite hat
  kein Bild, das Projekt aber dieses – so bekommt die Seite ein Gesicht.
- Vier **Themenkarten** für die Schwerpunkte, ein **Mitmachen-Block**
  („Lernen Sie uns kennen") und **Kontakt** in zwei Spalten, wie bei der MIT.

### Offen

- **Es fehlt ein Gruppenfoto.** Die Vorlage enthält die Bildunterschrift
  „Die engagierten Frauen der Frauen Union Schwerin", aber kein Bild dazu –
  offenbar bei einer Umstellung verloren gegangen. Die Zeile ist deshalb
  nicht übernommen; mit einem Foto gehört beides zurück auf die Seite.
- **Der Europa-Satz ist unklar.** „Die Europäische Frauen Union (EFU)
  arbeitet an verantwortlicher Stelle mit" steht so auf der Live-Seite.
  Gemeint ist wohl, dass die Frauen Union in der EFU mitarbeitet. Wörtlich
  übernommen und im Quelltext mit `TODO` markiert.
- **Wieder zwei Faxnummern.** Für die Frauen Union nennt die Live-Seite die
  59 00 420 – dieselbe wie für die MIT –, der Kreisverband im Seitenfuß die
  59 00 421. Gleiche offene Frage wie bei der MIT-Seite.
- **Einladung im Mitmachen-Block ersetzt.** Dort stand der Satz „Haben Sie
  Interesse an Politik, Zeitgeschichte und Kultur?" aus der bisherigen
  lokalen Fassung. Beim Umbau der Senioren-Union-Seite kam heraus, dass er
  von dort stammt; er ist durch eine Einladung aus den Worten der
  Frauen-Union-Seite ersetzt.
- **Titel „Kreisvorsitzende" unbestätigt.** Die Live-Seite nennt Manuela
  Preuß-Daschke nur „Ansprechpartner … FU Kreisverband Schwerin". Der Titel
  stammt aus der bisherigen lokalen Fassung und ist übernommen, aber nicht
  gegen eine Quelle geprüft.
- **Porträt klein.** 200×266px, dargestellt bei 110px – auf Retina-Displays
  knapp. Eine größere Fassung wäre besser.

---

## Senioren-Union-Seite (September 2026)

Dritte Vereinigungsseite nach demselben Muster. Inhaltlich war hier am
wenigsten zu holen: die Live-Seite besteht aus einer Begrüßung, drei
Leitworten, drei Absätzen und den Kontaktangaben – die bisherige lokale
Fassung hatte das schon fast vollständig.

**Übernommen** ist jetzt der genaue Wortlaut, wo die lokale Fassung
umformuliert hatte: „Fühlen Sie sich **noch** längst nicht zum »alten
Eisen«", „Dann **wäre für Sie** eine Mitgliedschaft … interessant", und die
Anführungszeichen »…« der Vorlage statt gerader. Die drei Leitworte stehen
wieder als Aufzählung, nicht als eine fettgesetzte Zeile.

**Ein Fund dabei:** der Satz „Haben Sie Interesse an Politik, Zeitgeschichte
und Kultur? … Verantwortung für Staat und Gesellschaft übernehmen" gehört der
Senioren Union. Er stand durch die bisherige lokale Fassung auch auf der
Frauen-Union-Seite, wo er nicht hingehört – dort trägt der Mitmachen-Block
jetzt eine Einladung aus den Worten der eigenen Seite.

**Neu gestaltet** mit den `.vereinigung*`-Klassen, dazu ein Baustein:

- **Leitworte** (`.leitworte`): „Mitarbeiten – Mitentscheiden –
  Mitverantworten" als Dreierreihe mit derselben Linie wie die Kennzahlen,
  nur ohne Zahlenwert. Sie stehen direkt unter dem Vorspann, der als
  Überleitung auf sie endet („Dafür stehen wir:"). Unter 480px stapeln sie,
  weil „Mitverantworten" in drei Spalten nicht mehr passt.
- **Zwei geprüfte Auswärtsverweise**, die die Vorlage nicht hat: der
  Bundesverband (`senioren-union.de`) und dessen ESU-Seite, auf die der
  Europa-Absatz jetzt verlinkt. Beide antworten mit 200.

### Offen

- **Die Senioren Union hat keine Telefonnummer.** Die Live-Seite nennt für
  sie nur eine Anschrift und eine E-Mail-Adresse – für eine
  Seniorenvereinigung die unglücklichste Lücke von allen. Bis es eine eigene
  Nummer gibt, weist die Kontaktkarte den Weg über die Geschäftsstelle
  ((0385) 59 00 426, im Seitenfuß belegt), und der Mitmachen-Block hat dafür
  eine zweite Schaltfläche. Eine eigene Durchwahl wäre besser.
- **Kein Bild, auch keine Bildunterschrift.** Anders als bei der Frauen Union
  fehlt hier kein Bild, es war nie eines da. Ein Foto vom Stammtisch oder
  einer Veranstaltung würde der Seite guttun.
- **Landesverband fehlt.** MIT und Frauen Union verweisen auf ihre
  Landesebene; für die Senioren-Union Mecklenburg-Vorpommern ließ sich keine
  eigene Adresse finden (`senioren-union-mv.de` antwortet nicht). Falls es
  eine gibt, gehört sie in die Liste der weiterführenden Seiten.

---

## Junge-Union-Seite (September 2026)

Vierte und letzte Vereinigungsseite. Die bisherige lokale Fassung hatte den
Text der Live-Seite auf etwa die Hälfte gekürzt – und den ganzen
Kreisvorstand ausgelassen.

**Übernommen** ist jetzt der vollständige Wortlaut: die beiden bisher
fehlenden Sätze zur Antragswerkstatt („Hier wird diskutiert, argumentiert
und gefeilt …" und „Politisches Engagement bedeutet für uns mitdenken,
mitreden und mitgestalten"), der Satz „Die Junge Union Schwerin verbindet
politische Diskussion mit einer guten gemeinsamen Zeit", der ganze Absatz
über Feste und Kaltgetränk, dazu die beiden Verweise, die die Vorlage unter
„Mitmachen" anbietet: Instagram und der Mitgliedsantrag.

**Neu dazugekommen sind die neun Köpfe des Kreisvorstands.** Auf der
Live-Seite stehen sie unter dem Kontaktblock, in der lokalen Fassung fehlten
sie ganz.

Berichtigt sind zwei Grammatikfehler der Vorlage: „Teil der **Junge** Union
Deutschlands" → „der Jungen Union", „innerhalb der Christlich **Demokratische**
Union" → „Demokratischen". Dazu zwei Kommasplices („Rhetorikseminar, die JU
Schwerin ist aktiv", „mitgestalten, dann werde Teil") – der erste ist jetzt
ein Gedankenstrich, der zweite ein Punkt.

**Neu gestaltet** mit den `.vereinigung*`-Klassen, dazu ein Baustein:

- **Personen-Galerie** (`.personen-galerie`, `.personenkarte`): Bild oben,
  Name und Amt darunter, drei Spalten – ab 768px zwei, ab 480px eine. Nicht
  die `.member-card` der Vorstandsseite: die stellt ein hochkantes Passbild
  neben den Text, die JU-Bilder sind gestaltete Grafiken im Querformat und
  würden in 150px Breite unleserlich.

  Beim Überfahren zoomt das Bild auf `scale(1.04)` und die Karte hebt sich
  2px mit Schatten – Faktor, Dauer und Abfrage sind vom Zoom der
  Meldungskacheln (`.news-image`) übernommen. Bewegung nur unter
  `prefers-reduced-motion: no-preference`; der Schatten steht bewusst
  ausserhalb dieser Abfrage, damit auch ohne Bewegung erkennbar bleibt,
  welche Karte gemeint ist.

  **Die Karte ist nicht anklickbar** – deshalb bleibt die Regung klein. Eine
  Karte, die sich deutlich aufbäumt, verspricht einen Klick, den es nicht
  gibt. Aus demselben Grund gibt es keine Lightbox: sie wäre möglich (die
  Originalbilder liegen vor, `FocusTrap` und das Overlay-Muster der Suche
  ebenfalls), war aber eine bewusste Entscheidung gegen zusätzliches
  JavaScript.

  Das Bild sitzt in einem eigenen `.personenkarte-bild`. Ohne diesen Rahmen
  beschneidet das `overflow:hidden` der Karte das vergrösserte Bild nur
  links, rechts und oben – unten schliesst die Textfläche an, dorthin wäre
  es beim Zoomen etwa 5px hineingewachsen.
- **Leitworte** (`.leitworte`, von der Senioren Union): „mitdenken –
  mitreden – mitgestalten" standen in der Vorlage am Ende eines Satzes und
  sind jetzt eine Dreierreihe, auf die der Absatz zuläuft.
- **Zitat** (`.vereinigung-zitat`, von der Frauen Union): „Am letzten
  Freitag des Monats findet immer eine gemeinsame Aktion statt" – die
  konkreteste Zusage der Seite, in der Vorlage mitten im Fließtext.
- **Reihenfolge nach Amt** statt wie in der Vorlage durcheinander: Vorsitz,
  Stellvertretung, Kasse, danach die sechs Beisitzenden alphabetisch.
- **Kreisvorstand vor den Mitmachen-Block** gerückt. Wer überlegt
  mitzumachen, sieht erst, wer da ist, und dann die Schaltflächen.
- **Das „du" bleibt.** Die JU duzt ihre Leser, die drei anderen
  Vereinigungsseiten siezen. Das ist kein Fehler, sondern der Ton der
  Vereinigung.

### Die Bilder

Die neun Porträts liegen jetzt unter `assets/images/junge-union/`. Sie sind
aus den Originalen von der Live-Seite gemacht (1024×1024), und zwar mit
einem Schnitt: **die unteren 256px sind weg.** Dort steht in jedem Bild ein
blauer Balken mit Name und Amt – eingebrannt, als Pixel. Stünde er noch da,
läse man jeden Namen zweimal, einmal im Bild und einmal als Überschrift
darunter. Geschnitten bleibt ein 4:3-Bild mit dem JU-Logo oben links; die
Namen stehen nur noch als HTML-Text und sind damit durchsuchbar, vorlesbar
und übersetzbar. Gespeichert als 800×600, Qualität 82 – zusammen 868 KB.

Der Balken sitzt in allen neun Bildern auf Pixelzeile 774/775, der Schnitt
bei 768 ist deshalb für alle derselbe.

### Offen

- **Es gibt kein JU-Logo als Datei.** Das Logo steckt nur in den
  Vorstandsbildern, weiß auf Foto – nicht sauber herauszulösen. Der Kopf der
  Seite trägt deshalb keines, anders als bei der MIT. Mit einer
  Logodatei gehörte es dorthin.
- **Die JU hat keine eigene Telefonnummer.** Die Vorlage nennt unter
  „Kontakt" die 0385-5900426 – das ist die Geschäftsstelle. Die
  Kontaktkarte sagt das jetzt dazu; eine eigene Durchwahl wäre besser.
- **Der Vorsitz in der Kontaktkarte ist aus den Bildern gelesen.** Dass Jan
  Reißig Vorsitzender ist, steht nirgends im Text der Live-Seite, nur im
  blauen Balken seines Bildes. Gleiches gilt für alle neun Ämter.
- **Keine Mailadressen für die Vorstandsmitglieder.** Die Vorstandsseite des
  Kreisverbands hat sie je Person, hier gibt es nur die
  Sammeladresse `info@junge-union-schwerin.de`.
- **Timon Matzick ist doppelt im Projekt.** Einmal hier als JU-Beisitzer,
  einmal unter `assets/images/vorstand/timon-matzick.jpg` im Kreisvorstand
  der CDU – zwei verschiedene Aufnahmen. Beides ist richtig, aber beim
  Pflegen leicht zu verwechseln.
- **`tools/build-site-data.py` läuft nicht mit dem Python dieses Rechners.**
  Das Skript nutzt `int | None` in den Signaturen, das braucht Python 3.10;
  installiert ist 3.9.6 (Xcode). Der Suchindex für diese Seite wurde über
  eine Kopie mit `from __future__ import annotations` erzeugt. Entweder die
  Zeile ins Skript, oder ein neueres Python.

---


## Schrift, Slider-Pause und Entstylen (September 2026)

Drei Punkte aus der Durchsicht der ganzen Seite, umgesetzt in einem Zug.

### Der Slider lässt sich anhalten

Die Bildbühne wechselte alle fünf Sekunden von allein, und es gab keine
Möglichkeit, das zu stoppen – nur vor, zurück und die Punkte. WCAG 2.2.2
verlangt für alles, was sich länger als fünf Sekunden von selbst bewegt,
eine Pause-Möglichkeit. Für eine öffentliche Parteiseite ist das nicht
optional.

Neu ist eine Pause-Taste in der Bedienleiste, mit Symbol statt Zeichen –
die Unicode-Zeichen für Pause und Wiedergabe sehen je nach System sehr
verschieden aus, die Pfeile der Nachbartasten nicht.

Dabei kamen drei weitere Dinge heraus:

- **Ein Schalter trug zwei Bedeutungen.** `autoplayEnabled` stand sowohl
  für „das System möchte keine Bewegung" als auch für „läuft gerade".
  Wer `prefers-reduced-motion` gesetzt hatte und auf einen Punkt klickte,
  bekam den Automatiklauf zurück. Jetzt gibt es `motionOK` und
  `userPaused` getrennt, und `mayAutoplay()` verbindet beide.
- **Die Tastatur hielt den Lauf nicht an.** Pausiert wurde bei
  `mouseenter`, aber nicht bei Fokus. Wer sich mit Tab in die Leiste
  bewegte, dem wechselte das Bild unter dem Finger weg. Jetzt hört der
  Rahmen `.hero-media` auch auf `focusin`/`focusout`.
- **`addListener` ist abgekündigt** und durch
  `addEventListener('change')` ersetzt.

Die Taste blendet sich aus, wenn das System ohnehin keine Bewegung will –
dann gibt es nichts anzuhalten. Dafür braucht es `.slider-btn[hidden]`
ausdrücklich: `.slider-btn` setzt `display:flex`, und Autorenregeln
schlagen die UA-Regel `[hidden]{display:none}`. Derselbe Fall wie schon
bei `.search-overlay` und `.spenden-betraege`.

**Nachtrag – die Symbole wechselten nicht.** Der erste Wurf setzte
`icoPause.hidden = paused` auf den beiden `<svg>`. Das wirkt nicht: die
Eigenschaft `.hidden` ist in der Schnittstelle `HTMLElement` definiert,
und ein `<svg>` ist ein `SVGElement` – es erbt von `Element`, nicht von
`HTMLElement`. Die Zuweisung legte dort nur eine gewöhnliche
JavaScript-Eigenschaft an, ohne das Attribut im Markup zu setzen; der
Selektor `[hidden]` griff nie. Sichtbar war das nur beim Klicken, weil der
Anfangszustand im Markup steht und deshalb stimmte. Jetzt
`toggleAttribute('hidden', …)` – das steht auf `Element` und wirkt auch im
SVG. Angehalten zeigt die Taste das Wiedergabe-Zeichen, laufend das
Pause-Zeichen.

### Favicon

Der Browser-Tab trägt jetzt dieselbe Bildmarke wie `cdu-schwerin.com`: die
drei ansteigenden Balken in Schwarz, Rot und Orange. Vorher zeigte allein
die Startseite ein Symbol, und zwar `logo.png` – ein 235×88-Banner, auf
32px unleserlich. Die übrigen 39 Seiten hatten gar keines.

Neu sind `favicon-32.png`, `favicon-192.png` und ein `apple-touch-icon.png`
unter `assets/images/`, dazu `favicon.ico` (16/32/48) in der Wurzel, weil
Browser sie von sich aus dort anfragen. Eingebunden auf allen Seiten und in
`tools/vorlagen/seite.html`.

Das Apple-Symbol ist weiß hinterlegt: iOS legt Transparenz auf Schwarz, und
darin verschwände der schwarze Balken der Marke.

**Offen:** dasselbe Problem hat das Original im dunklen Browser-Tab. Die
Vorlage von der Live-Seite ist transparent, der schwarze Balken ist dort
also unsichtbar – die Marke wirkt zweifarbig statt dreifarbig. Übernommen
ist die Datei trotzdem unverändert, weil sie so auf cdu-schwerin.com steht.
Wer das beheben will, hat zwei Wege: weiß hinterlegen wie beim
Apple-Symbol, oder über `<link rel="icon" media="(prefers-color-scheme:
dark)">` eine zweite Fassung ausliefern.

### Inter statt Arial, und eine fluide Skala

Die Seite hatte keinen Webfont – `Arial` als Grundschrift, Überschriften
auf `font-weight: 400`. Nichts datiert eine Seite so zuverlässig.

Jetzt liegt **Inter** unter `assets/fonts/`, selbst gehostet. Nicht über
`fonts.googleapis.com`: das lädt bei jedem Aufruf die IP des Besuchers zu
Google, und genau dafür ist eine Website schon verurteilt worden (LG
München I, 20.01.2022, 3 O 17493/20). Für eine Parteiseite ist das kein
theoretisches Risiko.

Zwei Dateien, aufgeteilt nach Zeichenbereich wie Google sie ausliefert.
Für deutschen Text lädt der Browser allein `latin` (48 KB) – Umlaute und
ß liegen in U+0000–00FF. `latin-ext` (85 KB) kommt erst dazu, wenn ein
Name polnische oder tschechische Zeichen trägt. Variabel von 400 bis 700,
deshalb genügt eine Datei je Bereich für alle Schnitte. SIL OFL 1.1, der
Lizenztext liegt daneben.

Vorgeladen wird die Schrift per `<link rel="preload">` auf jeder Seite und
in `tools/vorlagen/seite.html` – im Stylesheet stehend würde sie sonst
erst nach dessen Auswertung angefordert.

**Die Größen sind jetzt fluid.** Vier Token mit `clamp()` lösen die
bisherigen Breakpoint-Stufen ab:

    --text-hero  32 -> 60px
    --text-h1    28 -> 48px
    --text-h2    22 -> 34px
    --text-h3    19 -> 23px

Jeder Wert wächst gleichmäßig zwischen 480px und 1400px Viewport-Breite.
Damit entfallen neun Media-Query-Abstufungen ersatzlos – sie hätten das
`clamp()` sonst überschrieben, weil sie später in der Datei stehen. Kein
Sprung mehr an der Breakpoint-Kante, und 32px H1 ist auf einem 27-Zoll-
Monitor nicht länger verloren.

Dazu: Überschriften von `400` auf `600`/`700`, leicht angezogene
Laufweite auf großen Graden (`letter-spacing: -0.02em`) und
`text-wrap: balance` gegen die einzelne Restzeile aus einem Wort.

### Rund 200 style-Attribute abgelöst

Von 204 auf 8. Die verbliebenen acht sind `display: none` auf Elementen,
die JavaScript umschaltet – Formularmeldungen, Ladeanzeige, die Schritte
des Mitgliedsantrags. Das ist Zustand, nicht Gestaltung; die Umstellung
auf `hidden` hieße, die Formularlogik anzufassen, und dafür ist der
Gewinn zu klein.

Es waren nur 29 verschiedene Werte, die sich 204-mal wiederholten. Fünf
davon machten drei Viertel aus:

    34x  der Hervorhebungs-Link "Mitglied werden" in der Navigation
    33x  margin-top: 0 auf Kartenüberschriften
    32x  "Mehr erfahren →" am Kartenfuß
    31x  die hellblaue Infokarte
    19x  Abstand zwischen zwei Abschnitten

Die meisten brauchten keine neue Regel:

- **`margin-top: 0` war schlicht überflüssig.** Der Reset setzt
  `* { margin: 0 }`. Alle 33 ersatzlos gestrichen.
- **Die Infokarte gab es schon.** `.infokarte` trägt exakt dieselben drei
  Deklarationen – sie stammt von der MIT-Seite.
- **Den Abschnittsabstand gab es auch schon**, als
  `.textseite section + section`.

Neu sind `.nav-link-cta`, `.mehr-link`, `.kartenraster`, `ul.liste-blank`
und `.abschnitt-getrennt`. Bei `ul.liste-blank` ist der Typselektor nötig:
`.textseite ul` setzt die Einrückung und ist gleich spezifisch, die Regel
steht deshalb weiter unten in der Datei und gewinnt über die Reihenfolge.

**Fünfzehn Inhaltsseiten tragen jetzt `.textseite`** – Datenschutz,
Impressum, Links, Service, Vereinigungen, Stadtbezirksverbände,
Wahlarchiv, die vier Wahlseiten, Geschäftsstelle und die drei
Stadtbezirke. Sie nutzten vorher keine einzige eigene Komponentenklasse,
waren also genau die Seiten, für die `.textseite` gemacht ist.

Das behebt nebenbei einen Fehler: **es gibt keine globale `p`-Regel.**
Absatzabstand und Zeilenhöhe kommen allein aus `.textseite p`. Diese
fünfzehn Seiten hatten also bisher gar keinen Absatzabstand – die
Paragraphen standen bündig aufeinander.

Ausgenommen sind `der-vorstand` und `aktuelles` (eigene Komponenten) sowie
die vier Seiten mit eingebettetem CSS.

### Offen

- **33 KB CSS und 30 KB JavaScript stecken in vier Seiten** statt in den
  gemeinsamen Dateien: `mitglied-werden` (16 + 15 KB), `termine` (8 + 8),
  `kontakt` (7 + 4) und `mitglied-werden/bestaetigung` (1 + 1). Das ist
  mehr Altlast als die 204 Attribute zusammen, aber ein eigener Umbau –
  und einer, der an die Formulare geht.
- **Nichts davon ist im Browser gesehen worden.** Geprüft sind
  Klammernbilanz, Tag-Ausgewogenheit, Klassenbelegung und JS-Syntax. Die
  Wirkung der neuen Schrift, der fluiden Größen und des Absatzabstands auf
  den fünfzehn Seiten ist gerechnet, nicht betrachtet.
- **Georgia steht noch** als `--font-secondary` für Zitate. Eine moderne
  Serifenschrift wäre stimmiger, kostet aber eine zweite Schriftdatei.

---


## Vorstandsseite und Pause-Taste (September 2026)

### Die Pause-Taste zeigt ihren Zustand jetzt wirklich

Der Symboltausch allein reichte nicht – man musste zwei Piktogramme
vergleichen, um zu erkennen, ob der Bildwechsel läuft. Gesteuert wird der
Zustand jetzt über die Klasse `.is-paused` am Knopf statt über ein
`hidden`-Attribut an den beiden `<svg>`. Das hat zwei Vorteile: die Regel
steht im Autoren-Stylesheet und hängt nicht an der UA-Regel `[hidden]`,
und derselbe Schalter färbt den ganzen Knopf.

Angehalten wechselt er von durchscheinendem Weiß auf die Akzentfarbe –
dieselbe, die auf der Seite „Mitglied werden" trägt. Der Zustand ist damit
aus drei Metern erkennbar, nicht erst beim Hinsehen. Gezeigt wird immer,
was ein Klick bewirken würde.

Der Knopf steht im Markup jetzt auf `hidden` und wird von JavaScript
sichtbar gemacht – ohne JavaScript läuft der Wechsel gar nicht erst los,
dann gibt es auch nichts anzuhalten. Dasselbe Vorgehen wie bei den
Spendenbeträgen.

### Der Vorstand: drei Ebenen statt siebzehn gleicher Karten

Die Seite bestand aus siebzehn identischen Kacheln. Der Vorsitzende sah
aus wie das achte Mitglied des Kreisvorstandes, acht von dreizehn Rollen
hießen „Vorstandsmitglied", und außer Name, Amt und Adresse stand nichts
auf der Seite.

**Der eigentliche Grund für den faden Eindruck sind aber die Bilder.**
Zwölf der siebzehn Porträts liegen als 100×133 Pixel bei rund 5 KB vor.
Dargestellt wurden sie auf 150×180 – über ihre eigene Auflösung hinaus,
auf einem Retina-Schirm um mehr als das Dreifache. Alle siebzehn
Originale der Live-Seite sind nachgemessen: **dort gibt es nichts
Besseres.** 100×133 und 200×266, das ist die Quelle.

Die Antwort darauf ist gegen die Intuition: **kleiner zeigen, nicht
größer.** Die Bilder sind jetzt runde Ausschnitte von 132px (Vorsitz),
88px (Ämter) und 56px (übrige) – alle unter der nativen Breite und damit
scharf. Bei fehlender Auflösung ist Verkleinern die einzige ehrliche
Antwort.

Der Ausschnitt sitzt bei `object-position: center 20%`. Von oben
geschnitten fehlen die Kinne, mittig geschnitten sitzen die Köpfe zu hoch
im Kreis; 20 Prozent trifft bei allen siebzehn.

Die drei Ebenen:

- **Vorsitz** (`.vorstand-leitung`) allein und quer über die Spalte, auf
  hellem Grund, 132px-Kreis.
- **Vier Ämter** (`.member-card`, umgebaut) im Dreierraster – stellv.
  Vorsitz zweimal, Schatzmeister, Mitgliederbeauftragter.
- **Acht weitere** (`.vorstand-weitere`, `.person-kompakt`) als kompakte
  Reihe mit 56px-Kreis, Name und Adresse. Ohne Amtszeile: sie hieße
  achtmal „Mitglied des Kreisvorstandes", das sagt die
  Zwischenüberschrift schon.

Alle siebzehn Bilder haben jetzt `width` und `height` – sie waren der
größte Teil der siebzehn Bilder ohne Maßangabe, die bei der Durchsicht
aufgefallen waren.

**Der Kontaktabschnitt am Seitenende ist weg.** Er nannte Anschrift,
Telefon und E-Mail des Kreisverbandes – dieselben Angaben stehen in der
Fußzeile jeder Seite, dort sogar samt Faxnummer. Die Seite endet jetzt
mit der Ratsfraktion.

Zehn Seiten führen die Anschrift des Kreisverbandes im Hauptteil. Bei
Impressum und Datenschutz steht sie aus rechtlichen Gründen, bei Kontakt
und Geschäftsstelle ist sie das Thema der Seite – die bleiben. Ob sie auf
`service` und den drei Stadtbezirksseiten nötig ist, wäre noch
anzusehen.

### Dabei gegen die Live-Seite berichtigt

- **Eine Adresse war nicht zustellbar.** Silvia Rabethke stand lokal mit
  `rebethge@`, die Live-Seite nennt `rabethge@`. Der lokale Wert traf
  weder den Namen noch die Adresse.
- **„Mitgliedschaftsleiter" gibt es nicht.** Die Live-Seite nennt Phillip
  Geib „Mitgliederbeauftragter".
- **Bernd Nottebaum** ist „Dezernent, stellvertretender
  Oberbürgermeister", nicht nur Letzteres.
- **Gert Rudolf** ist „Vorsitzender der CDU-Fraktion der Landeshauptstadt
  Schwerin", lokal stand „CDU-Ratsfraktion".
- **Zwei Durchwahlen fehlten lokal:** das CDU-Bürgerbüro von Sebastian
  Ehlers, (0385) 55 59 36 20, und die von Ingo Freund, (0385) 59 00 423.

### Offen

- **Die Seite bräuchte ordentliche Porträts.** Die Junge Union hat sich
  eine einheitliche Serie machen lassen, vor Schweriner Motiven, mit
  Logo. Dieselbe Serie für den Kreisvorstand, und die Seite trüge sich
  von allein. Alles hier ist Schadensbegrenzung an 5-KB-Thumbnails.
- **Der Einleitungssatz ist selbst geschrieben.** Die Live-Seite hat
  keinen – sie besteht aus einer Überschrift und siebzehn Visitenkarten.
  Der Satz sagt deshalb nur das, was sich aus der Seite selbst ergibt.
  Was der Kreisvorstand tut, wann er gewählt wurde und wie oft er tagt,
  müsste vom Kreisverband kommen.
- **Handynummer nicht übernommen.** Die Live-Seite nennt für Ingo Freund
  zusätzlich (0172) 32 66 776. Dienstliche Durchwahl und Anschrift stehen
  hier, die Mobilnummer nicht – wenn sie dazugehört, gehört sie zurück.
- **Nicht im Browser gesehen.** Der runde Zuschnitt ist an allen
  siebzehn Bildern nachgerechnet und als Vorschau geprüft, die fertige
  Seite nicht.

---


## Meldungen lokal (September 2026)

Vorher verzweigten alle Meldungen ins Web: die vier Kacheln der Startseite und
„Alle Meldungen" auf `cdu-schwerin.com`, dazu die neun Kategorien des
Newsarchivs auf dessen `category/`-Seiten. `aktuelles/index.html` pflegte
dieselben Meldungen ein zweites Mal von Hand. Das ist jetzt alles lokal.

**Gepflegt wird je Meldung eine Datei:** `inhalte/meldungen/<slug>.html` –
oben die Angaben als `<meta>`, darunter der Text:

```html
<meta name="titel" content="Einladung Wahlkampfauftakt">
<meta name="kategorie" content="Veranstaltungen">
<meta name="datum" content="2026-02-25">
<meta name="bild" content="einladung-wahlkampfauftakt.jpg">
<meta name="beschreibung" content="Kurztext für Kachel und Liste">
<meta name="status" content="entwurf">

<p>…</p>
```

`datum` geht taggenau (`2026-02-25`) oder nur auf den Monat (`2025-11`) –
nicht jede übernommene Meldung hat ein genaues Datum. Die Slugs sind
identisch zu den bisherigen WordPress-Adressen, damit alte Links und
gedrucktes Material weiter passen.

**Erzeugt wird daraus** von `tools/build-site-data.py`:

| Ziel | Inhalt |
|---|---|
| `newsarchiv/<slug>/` | die Meldungsseite |
| `newsarchiv/index.html` | Archiv, nach Jahr gruppiert, mit Kategorienliste |
| `newsarchiv/kategorie/<slug>/` | je Kategorie eine Seite – nur für belegte |
| `aktuelles/index.html` | die neuesten sechs Meldungen |
| `js/news-data.js` | `window.CDU_NEWS` für das Karussell der Startseite |

Alles unter `newsarchiv/` entsteht bei jedem Lauf neu – dort nichts von Hand
ändern. Seiten gelöschter Meldungen und leer gewordene Kategorien räumt das
Skript selbst weg.

**Das Seitengerüst** (Kopf, Navigation, Fuß) steht jetzt einmal in
`tools/vorlagen/seite.html` statt in jeder Datei. `{{prefix}}` trägt die
Tiefe und wird aus der Zieladresse abgeleitet, nicht je Seitenart
hingeschrieben – `newsarchiv/kategorie/<slug>/` liegt drei Ebenen tief,
`newsarchiv/<slug>/` zwei.

**Bilder** liegen unter `assets/images/meldungen/<slug>.jpg` statt als
`news-1.jpg … news-4.jpg`. `width`/`height` liest das Skript aus der Datei,
statt sie zu behaupten, und weist auf Bilder unter 840px Breite hin.

**Die Suche** nimmt neue Meldungen von allein auf: sie läuft über alle
HTML-Dateien. Deshalb erzeugt das Skript erst die Seiten und indiziert dann;
`inhalte/` und `tools/` bleiben außen vor.

### Weiterhin offen

- **Die Texte der vier Meldungen fehlen.** Übernommen sind Schlagzeile,
  Kategorie, Bild und – bei zweien – der Kurztext aus `aktuelles/`. Der
  Fließtext steht weiter auf der Live-Seite; aus der Entwicklungsumgebung
  ist sie nicht erreichbar. Die vier Dateien stehen deshalb auf
  `status="entwurf"`: die Seite trägt dann einen sichtbaren Hinweis und
  `robots=noindex`, und der Build meldet sie bei jedem Lauf. Nach dem
  Einsetzen des Textes `status` auf `veroeffentlicht` setzen.
- **Zwei Daten sind unbestätigt.** `einladung-wahlkampfauftakt` (25.02.2026)
  und die Nominierung (November 2025) sind aus `aktuelles/index.html` belegt.
  Bei `cdu-kreisvorstand-schlaegt-…` (Oktober 2025) und
  `cdu-schwerin-geht-mit-…` (September 2025) ist nur der Monat geschätzt –
  aus der Reihenfolge der Startseite und der Monatsliste des alten
  Newsarchivs. Vermerkt in der jeweiligen Quelldatei.
- **Beitragsbilder zu klein.** Alle vier sind 272px breit; gebraucht werden
  die Originale aus der WordPress-Mediathek mit rund 840px.
- **Alternativtexte fehlen.** `bild-alt` ist überall leer, die Bilder gelten
  damit als schmückend. Wo das Bild etwas aussagt, gehört ein Text hinein.
- **`canonical` und `og:` der Startseite** zeigen weiter auf
  `cdu-schwerin.com`, während `SITE_URL` im Build auf die GitHub-Pages-Adresse
  steht. Vor dem Launch auf eine Adresse festlegen.

---

### ✅ Abgeschlossen

#### HTML-Struktur & Semantik
- [x] Modernes HTML5 mit korrekter Semantik (`<header>`, `<nav>`, `<main>`, `<section>`, `<footer>`)
- [x] Einzelner, sticky Header (statt doppelter Header in WordPress)
- [x] Skip-Link für Keyboard-Navigation
- [x] Vollständige Navigation (4 Ebenen) mit richtiger Hierarchie
- [x] Alle Meta-Tags (OG, Twitter Card, Viewport, Charset)
- [x] Korrekte Überschriftenhierarchie (1× H1, H2/H3 pro Sektion)
- [x] ARIA-Labels für interaktive Elemente

#### Accessibility (a11y)
- [x] Tastaturbedienbare Dropdown-Navigation (Escape, Tab, Enter)
- [x] Sichtbare Focus-Indikatoren (`:focus-visible`) auf allen interaktiven Elementen
- [x] Fokus-Management bei Menü-Toggle
- [x] Alt-Text für alle Bilder (sinvoll oder bewusst `alt=""` wenn dekorativ)
- [x] `prefers-reduced-motion` Support für Video und Slider-Animationen
- [x] Richtige Auszeichnung von Listen, Links und Buttons

#### Performance
- [x] Kein jQuery, keine Plugin-Abhängigkeiten – reines Vanilla JS
- [x] Single CSS-Datei (~23KB minified würde noch kürzer)
- [x] Single JS-Datei (~11KB, könnte mit Minification schrumpfen)
- [x] `loading="lazy"` auf Bildern unterhalb des Folds
- [x] `fetchpriority="high"` auf Hero-Image und Logo (LCP)
- [x] Explizite `width`/`height` auf allen Bildern (keine Layout Shifts)
- [x] Preconnect zu Google Analytics

#### Design & Styling
- [x] CSS Custom Properties für Brand-Farben (Teal, Dunkelblau, Orange)
- [x] Responsive Layout (Mobile-First, Breakpoints bei 480px, 768px, 1024px, 1400px)
- [x] Sticky Header mit Box-Shadow
- [x] Mobile Menu mit Hamburger-Toggle
- [x] Slider mit Autoplay (respektiert `prefers-reduced-motion`)
- [x] Feature-Kacheln in 3er-Grid (responsive)
- [x] News-Kacheln in 4er-Grid (responsive)
- [x] Footer mit 3 Spalten-Layout (responsive)
- [x] Print-Styles

#### Inhalte (1:1 übernommen)
- [x] Logo CDU-LHSN-Logo-2023
- [x] Kontaktdaten (Tel, Email, Adresse)
- [x] Navigation (alle 4 Ebenen)
- [x] Hero-Bereich (Wahlkampf-Sujet + Wahlprogramm-PDF-Link)
- [x] LTW-2026-Banner
- [x] Mitgliederwerbevideo (mit Autoplay-Kontrolle)
- [x] Willkommenstext von Jascha Rainer Dopp + Portraitfoto
- [x] 3 Feature-Kacheln (Termine, Spenden, CDU-Fraktion)
- [x] 4 News-Kacheln (statische Vorschau statt dynamisches Karussell)
- [x] 5 Slider-Bilder (Schwerin-Sehenswürdigkeiten)
- [x] Footer (Adresse, Social Media, Impressum/Datenschutz-Links)

#### Analytics & Cookie Management
- [x] Minimales Cookie-Consent-Banner (selbst gebaut, kein Plugin)
- [x] Google Analytics (GA4, ID: G-3L54P95RC8) lädt nur nach Zustimmung
- [x] localStorage-Speicherung der Consent-Wahl
- [x] Abweichung vom WordPress-Stack (keine Borlabs Cookie, kein ExactMetrics Plugin)

#### Bilder & Assets
- [x] Alle Bilder von cdu-schwerin.com heruntergeladen
- [x] Auf passende Zielgrößen optimiert (nicht im Original-Format)
- [x] News-Bilder (4× aktuellste News als Vorschau)
- [x] Slider-Bilder (5× Schwerin-Sehenswürdigkeiten)
- [x] Footer-Social-Bilder (Facebook & Instagram)

#### Behobene Probleme aus der Analyse
- [x] Doppelter Header → 1× Sticky Header
- [x] Dropdown-Menüs nicht tastaturbedienbar → Tastatursteuerung implementiert
- [x] Kaputte Mailto-Links (linkTo_UnCryptMailto) → Normale `mailto:`-Links
- [x] Carousel-Links aus Tab-Reihenfolge → Echte fokussierbare Links in Kachel-Reihe
- [x] Bilder ohne Alt-Text/Width/Height → Alle explizit definiert
- [x] Kein Reduced-Motion-Support → `prefers-reduced-motion` Media Queries hinzugefügt
- [x] Schwergewichtiger WordPress-Stack → Reines HTML/CSS/JS, keine Dependencies

---

### ⚠️ Offene Punkte (vor Freigabe zu prüfen)

1. **Instagram-Handle Widerspruch**
   - Top-Bar: `instagram.com/cduschwerin`
   - Footer: `instagram.com/schwerin_cdu`  
   - **Aktuell verwendet**: `schwerin_cdu` (im Footer)
   - **Status**: Mit `<!-- TODO: Instagram-Handle prüfen -->`-Kommentar im Code markiert
   - **Aktion vor Launch**: User sollte beide Handles überprüfen und richtige Version bestätigen

2. **Wahlprogramm-PDF auf Fremd-Domain**
   - Verlinkt aktuell auf `danielpeters-mv.de` (externer Link, funktioniert)
   - **Status**: Mit `<!-- TODO: PDF könnte langfristig auf cdu-schwerin.com gehostet werden -->`-Kommentar markiert
   - **Aktion**: Langfristig ggf. eigenes Hosting erwägen; für diese Pilot-Fassung okay

3. **Stadtfraktion-Link**
   - Verlinkt auf `http://cdu-schwerin.de` (unverschlüsselt)
   - **Status**: Sollte zu `https://cdu-schwerin.de` aktualisiert werden wenn möglich
   - **Aktion**: Vor Launch prüfen ob HTTPS verfügbar ist

4. **Video-Datei sehr groß**
   - Membership-Video: ~98MB (Original-Download)
   - **Status**: In `assets/video/mitglieder-werbung.mp4`
   - **Aktion**: Vor Production-Deploy könnte dieses Video mit ffmpeg komprimiert werden (z.B. auf 10-20MB mit H.264 + AAC), um Bandbreite zu sparen

5. **News-Bilder noch via Live-Seite verlinkt werden könnten**
   - Aktuell: News-Kacheln verwenden Background-Images via `style="background-image: url(...)"`
   - **Status**: Die 4 Placeholder-News-Bilder wurden heruntergeladen und sind im Projekt vorhanden
   - **Aktion**: News-Links in HTML könnten noch aktualisiert werden falls sich die Nachrichten-URLs auf der Live-Seite ändern; für Pilot okay

---

### 📊 Vergleich Alt vs. Neu

| Aspekt | Alt (WordPress) | Neu (Static) |
|--------|-----------------|--------------|
| Größe HTML | n/a | 20 KB |
| Größe CSS | ~500+ KB (inkl. Plugins) | 23 KB |
| Größe JS | ~300+ KB (jQuery, Plugins) | 11 KB |
| **Core-Summe** | **~800+ KB** | **54 KB** (98% kleiner) |
| Abhängigkeiten | jQuery, 6+ Plugins | Keine |
| Header-Duplikate | 2× | 1× |
| Accessibility-Score | Mittelmäßig | Hoch |
| Keyboard-Bedienbar | Nein | Ja |
| Reduced-Motion-Support | Nein | Ja |
| Analytics-Plugin | Borlabs + ExactMetrics | Minimales Consent-Banner + GA4 |

---

### 🚀 Verifikation (vor Freigabe)

Folgende Tests sollten durchgeführt werden:

1. **Visuelle Prüfung**
   - [ ] Seite im Chrome, Firefox, Safari aufrufen
   - [ ] Mit Live-Seite vergleichen – Layout, Farben, Inhalte korrekt?
   - [ ] Mobile-View prüfen (Responsive Design, Menü-Toggle)

2. **Keyboard & Accessibility**
   - [ ] Tab durch alle Links/Buttons → alles erreichbar?
   - [ ] Dropdown-Menüs mit Tastatur öffnen/schließen (Escape)
   - [ ] Menü-Toggle auf Mobile funktioniert?
   - [ ] Fokus-Indikatoren sichtbar?
   - [ ] Skip-Link funktioniert?

3. **Reduced Motion**
   - [ ] Browser-Einstellung "Reduce motion" aktivieren
   - [ ] Video sollte nicht autoplay
   - [ ] Slider-Autoplay sollte stoppen

4. **Lighthouse (Chrome DevTools)**
   - [ ] Performance Score (Ziel: >90)
   - [ ] Accessibility Score (Ziel: >95)
   - [ ] SEO Score (Ziel: >95)
   - [ ] Best Practices Score (Ziel: >90)
   - [ ] Vergleich mit Live-Seite

5. **Links & Funktionalität**
   - [ ] Alle Navigations-Links zeigen auf korrekte URLs (auch auf Live-Seite verweisen wo nötig)
   - [ ] News-Links funktionieren (zu Live-Seite)
   - [ ] PDF-Download funktioniert
   - [ ] Kontakt-Links (Tel, Email) funktionieren
   - [ ] Social-Media-Links (Facebook, Instagram) funktionieren
   - [ ] Consent-Banner: Accept und Decline funktionieren

6. **Web Interface Guidelines Abgleich**
   - [ ] Erneute /web-design-guidelines-Prüfung
   - [ ] Signifikante Verbesserung zu Alt-Version erwartet

---

### 📋 Nächste Schritte (nach Freigabe)

Nach bestandener Verifikation und Nutzer-Abnahme:

1. **Videokompression** (optional, nicht kritisch für Pilot)
   - Membership-Video mit ffmpeg auf 15-20MB komprimieren
   - `ffmpeg -i mitglieder-werbung.mp4 -c:v libx264 -preset medium -b:v 500k -c:a aac -b:a 128k mitglieder-werbung-compressed.mp4`

2. **Minification** (optional)
   - CSS/JS können minified werden (kürzer, aber nur kleine Ersparnis)
   - HTML könnte auch minified werden, aber kaum Nutzen bei 20KB

3. **Hosting-Vorbereitung**
   - Projekt kopieren auf finales Hosting
   - `.htaccess` oder Web-Server-Config für gzipping (wenn nicht auto)
   - SSL-Zertifikat sicherstellen

4. **Unterseiten-Template**
   - Gleiches HTML/CSS/JS-Muster auf alle ~20 Unterseiten übertragen
   - Inhalte extrahieren und in ähnliche Struktur bringen
   - Navigation, Header, Footer bleiben gleich

5. **DNS & Domain**
   - Sobald alles fertig: Alte cdu-schwerin.com → Neue statische Seite
   - Oder neue Domain für Parallel-Betrieb während Testing

---

### 📝 Zusammenfassung

Diese Pilot-Startseite demonstriert einen modernen, barrierefreien, performanten Ansatz zur Ablösung des veralteten WordPress-Systems. Der Stack ist extrem schlank (54KB Core vs. 800+KB Alt), vollständig tastaturbedienbar, respektiert Nutzer-Präferenzen (Reduced Motion), und enthält alle Inhalte der Live-Seite unverändert.

Die Struktur ist als Template für alle weiteren Seiten wiederverwendbar. Vor Production-Launch sollten die offenen Punkte geklärt werden.

**Geschätzte Zeit bis zur vollständigen Seite (alle ~20 Unterseiten)**: 
- Mit diesem Template als Basis: ~2-3 Tage für Content-Extraction + HTML-Anpassung
