#!/usr/bin/env python3
"""Erzeugt die generierten Datendateien der Seite.

  js/search-index.js  – Suchindex ueber alle Seiten
  js/events-data.js   – Termine aus termine/index.html, fuer die Startseite

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
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT_SEARCH = ROOT / "js" / "search-index.js"
OUT_EVENTS = ROOT / "js" / "events-data.js"
TERMINE = ROOT / "termine" / "index.html"

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
    entries = []
    for path in sorted(ROOT.rglob("*.html")):
        if ".git" in path.parts:
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

    build_events()
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


if __name__ == "__main__":
    sys.exit(main())
