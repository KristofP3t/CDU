#!/usr/bin/env python3
"""Erzeugt die generierten Datendateien der Seite.

  js/search-index.js  – Suchindex ueber alle Seiten
  js/events-data.js   – Termine aus termine/index.html, fuer die Startseite
  termine/ics/*.ics   – je Termin eine Kalenderdatei zum Herunterladen
  js/news-data.js     – Meldungen aus inhalte/meldungen/, fuer die Startseite
  newsarchiv/**       – Meldungsseiten, Archivliste und Kategorieseiten
  aktuelles/index.html – die neuesten Meldungen

Gepflegt wird je Meldung genau eine Datei in inhalte/meldungen/<slug>.html:
oben die Angaben als <meta>, darunter der Text. Alles unter newsarchiv/
entsteht daraus und wird bei jedem Lauf ueberschrieben – dort nichts von
Hand aendern. Das Seitengeruest (Kopf, Navigation, Fuss) steht einmal in
tools/vorlagen/seite.html.

Die Seite ist statisch und liegt auf GitHub Pages – es gibt keinen Server,
der suchen oder Termine ausliefern koennte. Beide Dateien werden deshalb
vorab erzeugt und als normale Skripte eingebunden (nicht per fetch), damit
alles auch beim lokalen Oeffnen per Doppelklick funktioniert, wo fetch an
file:// scheitert.

Aufruf nach inhaltlichen Aenderungen:
    python3 tools/build-site-data.py
"""
import json
import pathlib
import re
import struct
import sys
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_SEARCH = ROOT / "js" / "search-index.js"
OUT_EVENTS = ROOT / "js" / "events-data.js"
TERMINE = ROOT / "termine" / "index.html"
OUT_ICS = ROOT / "termine" / "ics"
QUELLEN_NEWS = ROOT / "inhalte" / "meldungen"
OUT_NEWS = ROOT / "newsarchiv"
OUT_NEWS_DATA = ROOT / "js" / "news-data.js"
OUT_AKTUELLES = ROOT / "aktuelles" / "index.html"
VORLAGE = ROOT / "tools" / "vorlagen" / "seite.html"

# Wie viele Meldungen auf der Startseite und unter aktuelles/ stehen.
NEWS_START = 4
NEWS_AKTUELLES = 6

# Ortszeit der Termine. Die Kalenderdateien speichern UTC, damit sie in
# jeder Zeitzone dieselbe Sekunde meinen – die Umrechnung beachtet
# ueber zoneinfo automatisch Sommer- und Winterzeit.
TZ = ZoneInfo("Europe/Berlin")

# Fuer die URL in den Kalendereintraegen. Bei einem Umzug auf eine eigene
# Domain hier anpassen.
SITE_URL = "https://kristofp3t.github.io/CDU/"

# Bestaetigungsseite nach dem Absenden – kein sinnvolles Suchergebnis.
EXCLUDE = {"mitglied-werden/bestaetigung/"}

TAG = re.compile(r"<[^>]+>")
SCRIPT_STYLE = re.compile(r"<(script|style|svg)\b.*?</\1>", re.S | re.I)
TITLE = re.compile(r"<title>(.*?)</title>", re.S | re.I)
DESC = re.compile(r'<meta\s+name="description"\s+content="([^"]*)"', re.I)
HEADINGS = re.compile(r"<h[1-3][^>]*>(.*?)</h[1-3]>", re.S | re.I)
MAIN = re.compile(r"<main\b.*?</main>", re.S | re.I)
# Header und Footer stehen auf jeder Seite identisch drin und wuerden
# jede Suche auf alle Seiten passen lassen.
NAV_CHROME = re.compile(r"<(header|footer|nav)\b.*?</\1>", re.S | re.I)


def clean(raw: str) -> str:
    return " ".join(TAG.sub(" ", raw).replace("&nbsp;", " ").split())


def page_url(path: pathlib.Path) -> str:
    rel = path.relative_to(ROOT)
    return "" if rel.name == "index.html" and rel.parent == pathlib.Path(".") else f"{rel.parent}/"


def main() -> int:
    # Reihenfolge: erst die Meldungsseiten erzeugen, dann den Index – sonst
    # fehlen neue Meldungen in der Suche, bis der naechste Lauf kommt.
    build_news()
    build_events()
    return build_search()


def build_search() -> int:
    entries = []
    for path in sorted(ROOT.rglob("*.html")):
        if ".git" in path.parts:
            continue
        # inhalte/ und tools/ sind Quellen bzw. Vorlagen, keine Seiten.
        if path.parts[len(ROOT.parts):][0] in {"inhalte", "tools"}:
            continue
        # Seiten, die man nicht direkt ansteuert, gehoeren nicht in die Suche.
        if page_url(path) in EXCLUDE:
            continue
        html = path.read_text(encoding="utf-8")

        title = clean(TITLE.search(html).group(1)) if TITLE.search(html) else path.stem
        desc_m = DESC.search(html)
        desc = clean(desc_m.group(1)) if desc_m else ""

        body = MAIN.search(html)
        body = body.group(0) if body else html
        body = NAV_CHROME.sub(" ", SCRIPT_STYLE.sub(" ", body))
        text = clean(body)

        headings = " ".join(clean(h) for h in HEADINGS.findall(body))

        entries.append({
            "u": page_url(path),
            "t": title,
            "d": desc or text[:160],
            # Durchsuchbarer Rumpf: Titel, Beschreibung, Ueberschriften und
            # der Anfang des Fliesstextes. Begrenzt, damit die Datei klein bleibt.
            "k": clean(f"{title} {desc} {headings} {text[:1200]}").lower(),
        })

    OUT_SEARCH.parent.mkdir(exist_ok=True)
    payload = json.dumps(entries, ensure_ascii=False, separators=(",", ":"))
    OUT_SEARCH.write_text(
        "/* Automatisch erzeugt von tools/build-site-data.py – nicht von Hand aendern. */\n"
        f"window.CDU_SEARCH_INDEX = {payload};\n",
        encoding="utf-8",
    )
    print(f"{len(entries)} Seiten indiziert -> {OUT_SEARCH.relative_to(ROOT)} ({OUT_SEARCH.stat().st_size / 1024:.1f} KB)")
    return 0


CARD = re.compile(r'<article class="event-card"[^>]*data-category="([^"]+)"[^>]*data-date="([^"]+)"[^>]*>(.*?)</article>', re.S)
FIELD = re.compile(r'<(?:h3|p)[^>]*class="([a-z-]+)"[^>]*>(.*?)</(?:h3|p)>', re.S)
H3 = re.compile(r"<h3[^>]*>(.*?)</h3>", re.S)
FILTER_BTN = re.compile(r'data-filter="([^"]+)"[^>]*>([^<]+)</button>')


def build_events() -> None:
    """Liest die Termine aus termine/index.html.

    Die Terminseite bleibt die einzige Pflegestelle – die Startseite
    bekommt hier nur eine Kopie fuer ihre Vorschau. Die Badge-Beschriftung
    stammt wie dort aus den Filter-Buttons.
    """
    html = TERMINE.read_text(encoding="utf-8")
    labels = {s: clean(t) for s, t in FILTER_BTN.findall(html) if s != "all"}

    events = []
    used: dict[str, int] = {}
    for category, date, body in CARD.findall(html):
        fields = {cls: clean(val) for cls, val in FIELD.findall(body)}
        title_m = H3.search(body)
        # Muss der Regel in termine/index.html entsprechen (assignAnchors),
        # sonst zeigen die Links der Startseite ins Leere.
        used[date] = used.get(date, 0) + 1
        anchor = f"termin-{date}" if used[date] == 1 else f"termin-{date}-{used[date]}"
        events.append({
            "datum": date,
            "anker": anchor,
            "kategorie": category,
            "kategorieLabel": labels.get(category, category),
            "titel": clean(title_m.group(1)) if title_m else "",
            "zeit": fields.get("event-time", ""),
            "ort": fields.get("event-location", ""),
            "veranstalter": fields.get("event-organizer", ""),
        })

    events.sort(key=lambda e: e["datum"])
    payload = json.dumps(events, ensure_ascii=False, indent=2)
    OUT_EVENTS.write_text(
        "/* Automatisch erzeugt von tools/build-site-data.py aus termine/index.html.\n"
        "   Termine werden dort gepflegt, nicht hier. */\n"
        f"window.CDU_EVENTS = {payload};\n",
        encoding="utf-8",
    )
    print(f"{len(events)} Termine uebernommen -> {OUT_EVENTS.relative_to(ROOT)}")
    build_ics(events)


def ics_escape(value: str) -> str:
    """Maskiert Sonderzeichen nach RFC 5545."""
    return (value.replace("\\", "\\\\")
                 .replace(";", "\\;")
                 .replace(",", "\\,")
                 .replace("\n", "\\n"))


def ics_fold(line: str) -> str:
    """Bricht Zeilen auf 75 Oktette um, Folgezeilen beginnen mit Leerzeichen.

    Gezaehlt wird in Bytes, nicht in Zeichen – Umlaute belegen in UTF-8 zwei.
    """
    raw = line.encode("utf-8")
    if len(raw) <= 75:
        return line
    parts, rest = [], raw
    parts.append(rest[:75])
    rest = rest[75:]
    while rest:
        parts.append(rest[:74])
        rest = rest[74:]
    # An Byte-Grenzen kann ein Mehrbyte-Zeichen zerschnitten werden; die
    # Teile werden vor dem Dekodieren wieder zusammengefuegt.
    out = parts[0].decode("utf-8", "ignore")
    for part in parts[1:]:
        out += "\r\n " + part.decode("utf-8", "ignore")
    return out


def build_ics(events: list[dict]) -> None:
    """Schreibt je Termin eine .ics-Datei.

    Termine ohne Uhrzeit werden als ganztaegig eingetragen, Termine mit
    Uhrzeit mit zwei Stunden Dauer – eine echte Endzeit pflegt die
    Terminseite nicht.
    """
    OUT_ICS.mkdir(parents=True, exist_ok=True)
    geschrieben = set()

    for ev in events:
        tag = datetime.strptime(ev["datum"], "%Y-%m-%d").date()
        zeit = re.match(r"(\d{1,2}):(\d{2})", ev["zeit"] or "")

        if zeit:
            start = datetime(tag.year, tag.month, tag.day,
                             int(zeit.group(1)), int(zeit.group(2)), tzinfo=TZ)
            ende = start + timedelta(hours=2)
            dt = [f"DTSTART:{start.astimezone(ZoneInfo('UTC')):%Y%m%dT%H%M%SZ}",
                  f"DTEND:{ende.astimezone(ZoneInfo('UTC')):%Y%m%dT%H%M%SZ}"]
        else:
            dt = [f"DTSTART;VALUE=DATE:{tag:%Y%m%d}",
                  f"DTEND;VALUE=DATE:{tag + timedelta(days=1):%Y%m%d}"]

        beschreibung = " · ".join(filter(None, [
            ev["kategorieLabel"],
            f"Veranstalter: {ev['veranstalter']}" if ev["veranstalter"] else "",
        ]))

        zeilen = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//CDU Kreisverband Schwerin//Termine//DE",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH",
            "BEGIN:VEVENT",
            f"UID:{ev['anker']}@cdu-schwerin.com",
            # Fester Wert statt "jetzt": sonst aendert sich jede Datei bei
            # jedem Build und der Verlauf laeuft mit Rauschen voll.
            f"DTSTAMP:{tag:%Y%m%d}T000000Z",
            *dt,
            f"SUMMARY:{ics_escape(ev['titel'])}",
            f"URL:{SITE_URL}termine/#{ev['anker']}",
        ]
        if ev["ort"]:
            zeilen.append(f"LOCATION:{ics_escape(ev['ort'])}")
        if beschreibung:
            zeilen.append(f"DESCRIPTION:{ics_escape(beschreibung)}")
        zeilen += ["END:VEVENT", "END:VCALENDAR"]

        ziel = OUT_ICS / f"{ev['anker']}.ics"
        # RFC 5545 schreibt CRLF vor.
        ziel.write_bytes(("\r\n".join(ics_fold(z) for z in zeilen) + "\r\n").encode("utf-8"))
        geschrieben.add(ziel.name)

    # Dateien geloeschter Termine entfernen, sonst bleiben Leichen liegen.
    for alt in OUT_ICS.glob("*.ics"):
        if alt.name not in geschrieben:
            alt.unlink()
            print(f"  entfernt: {alt.relative_to(ROOT)}")

    print(f"{len(geschrieben)} Kalenderdateien -> {OUT_ICS.relative_to(ROOT)}/")


# ============================================================================
# Meldungen
# ============================================================================

META = re.compile(r'<meta\s+name="([a-z-]+)"\s+content="([^"]*)"\s*/?>', re.I)
KOMMENTAR = re.compile(r"<!--.*?-->", re.S)

MONATE = ["Januar", "Februar", "Maerz", "April", "Mai", "Juni",
          "Juli", "August", "September", "Oktober", "November", "Dezember"]
MONATE[2] = "M\u00e4rz"

UMLAUTE = {"\u00e4": "ae", "\u00f6": "oe", "\u00fc": "ue", "\u00df": "ss"}


def slugify(text: str) -> str:
    """Macht aus 'OB-Wahl' ob-wahl – wie die Kategorie-Adressen in WordPress."""
    text = text.lower()
    for zeichen, ersatz in UMLAUTE.items():
        text = text.replace(zeichen, ersatz)
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", text)).strip("-")


def esc(text: str) -> str:
    """Maskiert Zeichen, die in HTML-Text und -Attributen eigene Bedeutung haben."""
    return (text.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace('"', "&quot;"))


def datum_teile(roh: str) -> tuple[str, str, str]:
    """Nimmt JJJJ-MM-TT oder JJJJ-MM entgegen.

    Nicht jede uebernommene Meldung hat ein taggenaues Datum – dann steht
    nur der Monat da und die Seite zeigt auch nur ihn. Zurueck kommen
    Sortierschluessel, Wert fuer <time datetime> und die Anzeige.
    """
    teile = roh.split("-")
    jahr, monat = int(teile[0]), int(teile[1])
    name = f"{MONATE[monat - 1]} {jahr}"
    if len(teile) == 3:
        tag = int(teile[2])
        return f"{jahr:04d}-{monat:02d}-{tag:02d}", roh, f"{tag}. {name}"
    # Ohne Tag nach hinten im Monat einsortieren, damit taggenaue
    # Meldungen desselben Monats davor stehen.
    return f"{jahr:04d}-{monat:02d}-00", roh, name


# Fuer die Beitragsbilder sinnvolle Breite auf grossen Bildschirmen.
BILD_SOLL = 840


def bild_masse(pfad: pathlib.Path) -> tuple[int, int]:
    """Liest Breite und Hoehe aus JPEG oder PNG.

    width/height gehoeren ans Bild, damit der Browser den Platz schon vor
    dem Laden freihaelt und nichts nachrutscht. Geraten waeren die Werte
    falsch, sobald jemand ein Bild austauscht – also aus der Datei lesen.
    """
    daten = pfad.read_bytes()
    if daten[:8] == b"\x89PNG\r\n\x1a\n":
        return struct.unpack(">II", daten[16:24])
    i = 2
    while i < len(daten) - 9:
        if daten[i] != 0xFF:
            i += 1
            continue
        if daten[i + 1] in (0xC0, 0xC1, 0xC2, 0xC3):
            hoehe, breite = struct.unpack(">HH", daten[i + 5:i + 9])
            return breite, hoehe
        i += 2 + struct.unpack(">H", daten[i + 2:i + 4])[0]
    raise SystemExit(f"{pfad.relative_to(ROOT)}: Masse nicht lesbar")


def lies_meldungen() -> list[dict]:
    """Liest inhalte/meldungen/<slug>.html – je Datei eine Meldung."""
    meldungen = []
    for pfad in sorted(QUELLEN_NEWS.glob("*.html")):
        roh = pfad.read_text(encoding="utf-8")
        felder = {k.lower(): v for k, v in META.findall(roh)}
        fehlend = [f for f in ("titel", "datum", "kategorie") if not felder.get(f)]
        if fehlend:
            raise SystemExit(f"{pfad.relative_to(ROOT)}: es fehlt {', '.join(fehlend)}")

        # Alles nach der letzten <meta>-Zeile ist der Text der Meldung.
        # HTML-Kommentare darin sind Hinweise fuer die Redaktion und
        # gehoeren nicht in die ausgelieferte Seite.
        treffer = list(META.finditer(roh))
        text = KOMMENTAR.sub("", roh[treffer[-1].end():]).strip()

        sortier, iso, anzeige = datum_teile(felder["datum"])
        kategorie = felder["kategorie"]

        bild = felder.get("bild", "")
        breite = hoehe = 0
        if bild:
            bildpfad = ROOT / "assets" / "images" / "meldungen" / bild
            if not bildpfad.exists():
                raise SystemExit(f"{pfad.relative_to(ROOT)}: Bild {bild} fehlt")
            breite, hoehe = bild_masse(bildpfad)
        meldungen.append({
            "slug": pfad.stem,
            "titel": felder["titel"],
            "kategorie": kategorie,
            "kategorieSlug": slugify(kategorie),
            "datum": iso,
            "datumSortier": sortier,
            "datumAnzeige": anzeige,
            "jahr": sortier[:4],
            "bild": bild,
            "bildBreite": breite,
            "bildHoehe": hoehe,
            "bildAlt": felder.get("bild-alt", ""),
            "beschreibung": felder.get("beschreibung", ""),
            "entwurf": felder.get("status", "") == "entwurf",
            "text": text,
        })

    meldungen.sort(key=lambda m: m["datumSortier"], reverse=True)
    return meldungen


def prefix_fuer(url: str) -> str:
    """Wie viele Ebenen es von dieser Seite zur Wurzel sind.

    newsarchiv/ -> ../   newsarchiv/<slug>/ -> ../../
    newsarchiv/kategorie/<slug>/ -> ../../../
    Abgeleitet statt je Seitenart hingeschrieben, sonst zeigt beim
    naechsten Verzeichnis eine ganze Seite voller Links ins Leere.
    """
    return "../" * url.rstrip("/").count("/") + ("../" if url else "")


def seite(url: str, titel: str, beschreibung: str,
          inhalt: str, kopfzusatz: str = "") -> str:
    """Setzt eine Seite aus tools/vorlagen/seite.html zusammen.

    Das Geruest steht dort einmal; {{prefix}} traegt die Tiefe, damit
    dieselbe Vorlage fuer newsarchiv/ und newsarchiv/<slug>/ passt.
    """
    prefix = prefix_fuer(url)
    vorlage = VORLAGE.read_text(encoding="utf-8")
    # {{inhalt}} zuerst, damit der Inhalt selbst {{prefix}} benutzen darf.
    return (vorlage
            .replace("{{inhalt}}", inhalt)
            .replace("{{titel}}", esc(titel))
            .replace("{{beschreibung}}", esc(beschreibung))
            .replace("{{canonical}}", SITE_URL + url)
            .replace("{{kopfzusatz}}", kopfzusatz)
            .replace("{{prefix}}", prefix))


def schreibe(ziel: pathlib.Path, inhalt: str) -> None:
    ziel.parent.mkdir(parents=True, exist_ok=True)
    ziel.write_text(inhalt, encoding="utf-8")


def kachel(m: dict, prefix: str) -> str:
    """Eine Meldung als Kachel fuer die Listen – Bild, Kategorie, Titel, Datum."""
    bild = (f'<img class="meldung-kachel-bild" src="{prefix}assets/images/meldungen/{m["bild"]}"'
            f' alt="{esc(m["bildAlt"])}" width="{m["bildBreite"]}" height="{m["bildHoehe"]}"'
            f' loading="lazy">' if m["bild"] else "")
    text = f'<p class="meldung-kachel-text">{esc(m["beschreibung"])}</p>' if m["beschreibung"] else ""
    return f"""                <li class="meldung-kachel">
                    <a href="{prefix}newsarchiv/{m['slug']}/" class="meldung-kachel-link">
                        {bild}
                        <div class="meldung-kachel-inhalt">
                            <span class="meldung-kachel-kategorie">{esc(m['kategorie'])}</span>
                            <h3 class="meldung-kachel-titel">{esc(m['titel'])}</h3>
                            {text}
                            <time class="meldung-kachel-datum" datetime="{m['datum']}">{m['datumAnzeige']}</time>
                        </div>
                    </a>
                </li>
"""


def liste(meldungen: list[dict], prefix: str) -> str:
    return ('            <ul class="meldung-liste">\n'
            + "".join(kachel(m, prefix) for m in meldungen)
            + "            </ul>\n")


HINWEIS = """                <aside class="meldung-hinweis">
                    <p><strong>Der Text dieser Meldung fehlt noch.</strong> \u00dcbernommen
                    sind bisher Schlagzeile, Kategorie und Bild. Der vollst\u00e4ndige Text
                    steht auf der bisherigen Seite und geh\u00f6rt nach
                    <code>inhalte/meldungen/{slug}.html</code>.</p>
                </aside>
"""


def meldungsseite(m: dict) -> str:
    url = f"newsarchiv/{m['slug']}/"
    prefix = prefix_fuer(url)
    bild = (f'                <img class="meldung-bild" src="{prefix}assets/images/meldungen/{m["bild"]}"'
            f' alt="{esc(m["bildAlt"])}" width="{m["bildBreite"]}" height="{m["bildHoehe"]}">\n'
            if m["bild"] else "")
    hinweis = HINWEIS.format(slug=m["slug"]) if m["entwurf"] else ""
    text = ("""                <div class="meldung-text">\n"""
            + "\n".join("                " + z for z in m["text"].splitlines())
            + "\n                </div>\n") if m["text"] else ""

    inhalt = f"""            <nav class="brotkrumen" aria-label="Sie sind hier">
                <a href="{prefix}">Startseite</a> <span aria-hidden="true">/</span>
                <a href="{prefix}newsarchiv/">Newsarchiv</a> <span aria-hidden="true">/</span>
                <span aria-current="page">{esc(m['titel'])}</span>
            </nav>

            <article class="meldung">
                <header class="meldung-kopf">
                    <a class="meldung-kategorie" href="{prefix}newsarchiv/kategorie/{m['kategorieSlug']}/">{esc(m['kategorie'])}</a>
                    <h1>{esc(m['titel'])}</h1>
                    <time class="meldung-datum" datetime="{m['datum']}">{m['datumAnzeige']}</time>
                </header>
{bild}{hinweis}{text}            </article>

            <p class="meldung-zurueck"><a href="{prefix}newsarchiv/">Alle Meldungen</a></p>
"""
    # Entwuerfe gehoeren nicht in die Suchmaschinen, solange der Text fehlt.
    kopfzusatz = '    <meta name="robots" content="noindex">\n' if m["entwurf"] else ""
    kopfzusatz += f'    <meta property="article:published_time" content="{m["datum"]}">\n'
    kopfzusatz += f'    <meta property="article:section" content="{esc(m["kategorie"])}">\n'
    if m["bild"]:
        kopfzusatz += f'    <meta property="og:image" content="{SITE_URL}assets/images/meldungen/{m["bild"]}">\n'
    return seite(url, m["titel"], m["beschreibung"] or m["titel"], inhalt, kopfzusatz)


def archivseite(meldungen: list[dict], kategorien: list[tuple[str, str, int]]) -> str:
    url = "newsarchiv/"
    prefix = prefix_fuer(url)
    # Nach Jahr gruppiert, nicht nach Monat: bei wenigen Meldungen stuende
    # sonst unter jeder Ueberschrift eine einzelne Kachel. Das genaue Datum
    # steht auf der Kachel.
    jahre = []
    for m in meldungen:
        if m["jahr"] not in jahre:
            jahre.append(m["jahr"])

    teile = [f"""            <h1>Newsarchiv</h1>
            <p class="seiten-einleitung">Alle {len(meldungen)} Meldungen der CDU Schwerin.</p>
"""]
    for jahr in jahre:
        teile.append(f'\n            <h2 class="meldung-jahr">{jahr}</h2>\n')
        teile.append(liste([m for m in meldungen if m["jahr"] == jahr], prefix))

    eintraege = "".join(
        f'                    <li><a href="{prefix}newsarchiv/kategorie/{s}/">{esc(n)} '
        f'<span class="meldung-kategorie-zahl">{z}</span></a></li>\n'
        for n, s, z in kategorien)
    teile.append(f"""
            <section class="meldung-kategorien" aria-labelledby="kategorien-titel">
                <h2 id="kategorien-titel">Kategorien</h2>
                <ul class="meldung-kategorie-liste">
{eintraege}                </ul>
            </section>
""")
    return seite(url, "Newsarchiv", "Alle Meldungen der CDU Kreisverband Schwerin.",
                 "".join(teile))


def kategorieseite(name: str, slug: str, meldungen: list[dict]) -> str:
    url = f"newsarchiv/kategorie/{slug}/"
    prefix = prefix_fuer(url)
    inhalt = f"""            <nav class="brotkrumen" aria-label="Sie sind hier">
                <a href="{prefix}">Startseite</a> <span aria-hidden="true">/</span>
                <a href="{prefix}newsarchiv/">Newsarchiv</a> <span aria-hidden="true">/</span>
                <span aria-current="page">{esc(name)}</span>
            </nav>

            <h1>{esc(name)}</h1>
            <p class="seiten-einleitung">{len(meldungen)} Meldung{'en' if len(meldungen) != 1 else ''} in dieser Kategorie.</p>
{liste(meldungen, prefix)}
            <p class="meldung-zurueck"><a href="{prefix}newsarchiv/">Alle Meldungen</a></p>
"""
    return seite(url, name, f"Meldungen der CDU Schwerin zum Thema {name}.", inhalt)


def aktuellesseite(meldungen: list[dict]) -> str:
    url = "aktuelles/"
    prefix = prefix_fuer(url)
    inhalt = f"""            <h1>Aktuelles</h1>
            <p class="seiten-einleitung">Die neuesten Meldungen der CDU Kreisverband
            Schwerin. \u00c4ltere finden Sie im <a href="{prefix}newsarchiv/">Newsarchiv</a>,
            anstehende Veranstaltungen unter <a href="{prefix}termine/">Termine</a>.</p>
{liste(meldungen[:NEWS_AKTUELLES], prefix)}
            <p class="meldung-zurueck"><a href="{prefix}newsarchiv/">Zum kompletten Newsarchiv</a></p>
"""
    return seite(url, "Aktuelles",
                 "Aktuelle Meldungen der CDU Kreisverband Schwerin.", inhalt)


def build_news() -> None:
    """Erzeugt alle Seiten und Daten rund um die Meldungen."""
    meldungen = lies_meldungen()
    if not meldungen:
        print("keine Meldungen in inhalte/meldungen/ – uebersprungen")
        return

    # Nur Kategorien, zu denen es wirklich Meldungen gibt – sonst stehen
    # leere Seiten herum, so wie vorher die neun Verweise ins Web.
    kategorien = []
    for m in meldungen:
        if m["kategorieSlug"] not in [k[1] for k in kategorien]:
            zahl = sum(1 for x in meldungen if x["kategorieSlug"] == m["kategorieSlug"])
            kategorien.append((m["kategorie"], m["kategorieSlug"], zahl))
    kategorien.sort(key=lambda k: k[0])

    for m in meldungen:
        schreibe(OUT_NEWS / m["slug"] / "index.html", meldungsseite(m))
    schreibe(OUT_NEWS / "index.html", archivseite(meldungen, kategorien))
    for name, slug, _ in kategorien:
        schreibe(OUT_NEWS / "kategorie" / slug / "index.html",
                 kategorieseite(name, slug, [m for m in meldungen if m["kategorieSlug"] == slug]))
    schreibe(OUT_AKTUELLES, aktuellesseite(meldungen))

    # Seiten geloeschter Meldungen und Kategorien entfernen.
    behalten = {m["slug"] for m in meldungen} | {"kategorie"}
    for alt in OUT_NEWS.iterdir():
        if alt.is_dir() and alt.name not in behalten:
            for datei in sorted(alt.rglob("*"), reverse=True):
                datei.unlink() if datei.is_file() else datei.rmdir()
            alt.rmdir()
            print(f"  entfernt: {alt.relative_to(ROOT)}/")
    kat_verzeichnis = OUT_NEWS / "kategorie"
    if kat_verzeichnis.exists():
        gueltig = {s for _, s, _ in kategorien}
        for alt in kat_verzeichnis.iterdir():
            if alt.is_dir() and alt.name not in gueltig:
                (alt / "index.html").unlink(missing_ok=True)
                alt.rmdir()
                print(f"  entfernt: {alt.relative_to(ROOT)}/")

    # Vorschau fuer die Startseite – wie events-data.js bei den Terminen.
    vorschau = [{
        "slug": m["slug"],
        "titel": m["titel"],
        "kategorie": m["kategorie"],
        "datum": m["datum"],
        "datumAnzeige": m["datumAnzeige"],
        "bild": m["bild"],
        "bildAlt": m["bildAlt"],
        "bildBreite": m["bildBreite"],
        "bildHoehe": m["bildHoehe"],
    } for m in meldungen[:NEWS_START]]
    OUT_NEWS_DATA.write_text(
        "/* Automatisch erzeugt von tools/build-site-data.py aus inhalte/meldungen/.\n"
        "   Meldungen werden dort gepflegt, nicht hier. */\n"
        f"window.CDU_NEWS = {json.dumps(vorschau, ensure_ascii=False, indent=2)};\n",
        encoding="utf-8",
    )

    print(f"{len(meldungen)} Meldungen, {len(kategorien)} Kategorien -> {OUT_NEWS.relative_to(ROOT)}/")
    klein = [m for m in meldungen if m["bild"] and m["bildBreite"] < BILD_SOLL]
    if klein:
        print(f"  Hinweis: {len(klein)} Beitragsbild(er) schmaler als {BILD_SOLL}px – "
              "auf grossen Bildschirmen sichtbar weich:")
        for m in klein:
            print(f"    {m['bildBreite']}px  assets/images/meldungen/{m['bild']}")
    entwuerfe = [m["slug"] for m in meldungen if m["entwurf"]]
    if entwuerfe:
        print(f"  ACHTUNG: {len(entwuerfe)} Meldung(en) ohne vollstaendigen Text (noindex):")
        for slug in entwuerfe:
            print(f"    inhalte/meldungen/{slug}.html")


if __name__ == "__main__":
    sys.exit(main())
