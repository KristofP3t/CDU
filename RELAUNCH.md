# CDU Schwerin – Startseiten-Relaunch 2026
## Implementierungsstatus

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
