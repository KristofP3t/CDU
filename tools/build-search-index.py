#!/usr/bin/env python3
"""Erzeugt js/search-index.js aus den HTML-Seiten.

Die Seite ist statisch und liegt auf GitHub Pages – es gibt keinen Server,
der suchen koennte. Der Index wird deshalb vorab erzeugt und als normales
Skript eingebunden (nicht per fetch), damit die Suche auch beim lokalen
Oeffnen per Doppelklick funktioniert, wo fetch an file:// scheitert.

Aufruf nach inhaltlichen Aenderungen:
    python3 tools/build-search-index.py
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "js" / "search-index.js"

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

    OUT.parent.mkdir(exist_ok=True)
    payload = json.dumps(entries, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(
        "/* Automatisch erzeugt von tools/build-search-index.py – nicht von Hand aendern. */\n"
        f"window.CDU_SEARCH_INDEX = {payload};\n",
        encoding="utf-8",
    )
    print(f"{len(entries)} Seiten indiziert -> {OUT.relative_to(ROOT)} ({OUT.stat().st_size / 1024:.1f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
