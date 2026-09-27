#!/usr/bin/env python3
"""Laedt das Schweriner Strassenverzeichnis aus OpenStreetMap.

  js/strassen-schwerin.js – Strassenname -> Postleitzahlen, fuer die
                            Adresspruefung im Mitgliedsantrag

Getrennt von build-site-data.py, weil es das Netz braucht und Strassen
sich selten aendern - etwa einmal im Jahr neu laden reicht:

    python3 tools/strassen-laden.py

Die Daten stehen unter der Open Database License (ODbL). Der
Quellenhinweis "© OpenStreetMap-Mitwirkende" gehoert deshalb auf die
Seite, die sie nutzt (mitglied-werden/index.html, Schritt 3), und in den
Kopf der erzeugten Datei.
"""
from __future__ import annotations

import collections
import json
import pathlib
import re
import sys
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "js" / "strassen-schwerin.js"

# Amtlicher Gemeindeschluessel der Landeshauptstadt. Ueber den Namen
# allein kaeme auch das Dorf Schwerin in Brandenburg (PLZ 15755) mit.
ABFRAGE = """[out:json][timeout:180];
area["boundary"="administrative"]["de:amtlicher_gemeindeschluessel"="13004000"]->.stadt;
(
  way(area.stadt)["highway"]["name"];
  nwr(area.stadt)["addr:street"];
  nwr(area.stadt)["addr:place"];
);
out tags;
"""

SERVER = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
]

# Nur Wege, an denen jemand wohnen kann. Ohne diese Auswahl kaemen
# benannte Zufahrten ("Burger King"), Bruecken und Fusswege mit.
WOHNSTRASSEN = {
    "residential", "living_street", "primary", "secondary", "tertiary",
    "unclassified", "pedestrian", "road", "trunk",
}

SCHWERIN_PLZ = {"19053", "19055", "19057", "19059", "19061", "19063"}


def schluessel(name: str) -> str:
    """Vergleichsform eines Strassennamens.

    Muss genau der Funktion strassenSchluessel() in
    mitglied-werden/index.html entsprechen: "Hagenower Str.",
    "hagenower strasse" und "Hagenower Straße" werden gleich.
    """
    s = name.lower()
    for alt, neu in (("ß", "ss"), ("ä", "ae"), ("ö", "oe"), ("ü", "ue")):
        s = s.replace(alt, neu)
    s = re.sub(r"str\.?(?=\s|$)", "strasse", s)
    return re.sub(r"[^a-z0-9]", "", s)


def laden() -> dict:
    daten = urllib.parse.urlencode({"data": ABFRAGE}).encode()
    letzter_fehler = None
    for url in SERVER:
        anfrage = urllib.request.Request(url, data=daten, headers={
            "User-Agent": "CDU-Schwerin-Website (tools/strassen-laden.py)",
        })
        try:
            with urllib.request.urlopen(anfrage, timeout=240) as antwort:
                return json.load(antwort)
        except (OSError, ValueError) as fehler:
            # Overpass meldet Ueberlast gelegentlich als HTML-Seite statt JSON.
            letzter_fehler = fehler
    raise SystemExit(f"Overpass nicht erreichbar: {letzter_fehler}")


def main() -> int:
    antwort = laden()
    elemente = antwort.get("elements", [])

    plz_je = collections.defaultdict(set)
    haeufigkeit = collections.Counter()
    for e in elemente:
        t = e.get("tags", {})
        name = t.get("addr:street") or t.get("addr:place")
        if name:
            haeufigkeit[name] += 1
            if t.get("addr:postcode") in SCHWERIN_PLZ:
                plz_je[name].add(t["addr:postcode"])
        elif t.get("highway") in WOHNSTRASSEN and t.get("name"):
            plz_je.setdefault(t["name"], set())

    # Schreibvarianten zusammenfassen; es gewinnt die Schreibweise mit den
    # meisten Adressen, bei Gleichstand die ausgeschriebene ("Straße").
    gruppen = collections.defaultdict(list)
    for name in plz_je:
        gruppen[schluessel(name)].append(name)
    strassen = {}
    for namen in gruppen.values():
        besser = max(namen, key=lambda n: (haeufigkeit[n], "Str." not in n, len(n)))
        strassen[besser] = sorted(set().union(*(plz_je[n] for n in namen)))

    if len(strassen) < 400:
        print(f"ACHTUNG: nur {len(strassen)} Strassen gefunden - "
              f"{OUT.relative_to(ROOT)} unveraendert.")
        return 1

    stand = antwort.get("osm3s", {}).get("timestamp_osm_base", "")[:10]
    sortiert = dict(sorted(strassen.items(), key=lambda kv: schluessel(kv[0])))
    daten = json.dumps(sortiert, ensure_ascii=False, separators=(",", ":"))
    OUT.write_text(
        "/* Automatisch erzeugt von tools/strassen-laden.py – nicht von Hand aendern.\n"
        f"   Strassen der Landeshauptstadt Schwerin, Stand {stand}.\n"
        "   Daten © OpenStreetMap-Mitwirkende, Open Database License (ODbL) 1.0,\n"
        "   https://www.openstreetmap.org/copyright */\n"
        f"window.CDU_STRASSEN = {daten};\n",
        encoding="utf-8",
    )
    ohne_plz = sum(1 for v in strassen.values() if not v)
    print(f"{len(strassen)} Strassen (davon {ohne_plz} ohne bekannte PLZ), Stand {stand}"
          f" -> {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
