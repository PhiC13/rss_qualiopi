import feedparser
import json
import os
import sys
from datetime import datetime
from xml.sax.saxutils import escape
from pathlib import Path
from urllib.parse import urlparse

# ------------------------------------------------------------
#  Dossier de sortie = /docs/xml
# ------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR /  "xml"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

os.chdir(BASE_DIR)
sys.path.append(str(BASE_DIR))

# Import des listes de sources externes et locales
from sources import (
    EXTERNAL_LEGAL, EXTERNAL_PEDAGO, EXTERNAL_METIERS,
    LOCAL_LEGAL, LOCAL_PEDAGO, LOCAL_METIERS
)

# ------------------------------------------------------------
#  Utilitaires
# ------------------------------------------------------------
def url_to_filename(url: str) -> str:
    """Transforme une URL en nom de fichier local stable."""
    parsed = urlparse(url)
    host = parsed.netloc.replace("www.", "").replace(".", "_")
    return f"rss_{host}.xml"


def read_rss(source: str):
    """Lit un flux RSS (local ou distant) et retourne une liste d'articles."""
    # Si source est un fichier local, on le lit depuis /docs/xml/
    if not source.startswith("http"):
        source = str(OUTPUT_DIR / source)

    feed = feedparser.parse(
        source,
        request_headers={"User-Agent": "Mozilla/5.0"}
    )

    print(f"Lecture de : {source} → {len(feed.entries)} entrées")

    articles = []
    for e in feed.entries:
        articles.append({
            "title": e.get("title", ""),
            "link": e.get("link", ""),
            "date": e.get("published", "") or e.get("updated", ""),
            "description": e.get("summary", ""),
            "source": source,
        })
    return articles


def generate_rss_file(filename: str, articles: list):
    """Génère un fichier RSS local dans /docs/xml/."""
    items = ""
    for a in articles:
        items += f"""
        <item>
            <title>{escape(a['title'])}</title>
            <link>{escape(a['link'])}</link>
            <guid>{escape(a['link'])}</guid>
            <description>{escape(a['description'])}</description>
            <pubDate>{a['date']}</pubDate>
        </item>
        """

    rss = f"""<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
        <channel>
            <title>Agrégateur RSS Philippe</title>
            <link>https://ton-domaine.fr/rss/</link>
            <description>Flux généré automatiquement</description>
            {items}
        </channel>
    </rss>
    """

    with open(OUTPUT_DIR / filename, "w", encoding="utf-8") as f:
        f.write(rss)


# ------------------------------------------------------------
#  Étape 1 : Génération des flux locaux
# ------------------------------------------------------------
def generate_local_sources():
    """Scrape les flux externes et génère les fichiers rss_*.xml."""
    all_sources = {
        "legal": EXTERNAL_LEGAL,
        "pedago": EXTERNAL_PEDAGO,
        "metiers": EXTERNAL_METIERS,
    }

    local_files = { "legal": [], "pedago": [], "metiers": [] }

    for category, urls in all_sources.items():
        for url in urls:
            filename = url_to_filename(url)
            articles = read_rss(url)
            generate_rss_file(filename, articles)
            local_files[category].append(filename)
            print(f"→ Généré : {filename}")

    return local_files


# ------------------------------------------------------------
#  Étape 2 : Consolidation
# ------------------------------------------------------------
def aggregate_grouped(local_files):
    """Lit les flux locaux et génère les flux consolidés."""
    data = {"legal": [], "pedago": [], "metiers": [], "global": []}

    for src in local_files["legal"] + LOCAL_LEGAL:
        data["legal"].extend(read_rss(src))

    for src in local_files["pedago"] + LOCAL_PEDAGO:
        data["pedago"].extend(read_rss(src))

    for src in local_files["metiers"] + LOCAL_METIERS:
        data["metiers"].extend(read_rss(src))

    data["global"] = data["legal"] + data["pedago"] + data["metiers"]

    # Déduplication
    seen = set()
    unique_global = []
    for a in data["global"]:
        if a["link"] not in seen:
            unique_global.append(a)
            seen.add(a["link"])

    unique_global.sort(key=lambda x: x["date"], reverse=True)
    data["global"] = unique_global

    return data


# ------------------------------------------------------------
#  Étape 3 : sources.json
# ------------------------------------------------------------
def generate_sources_json(local_files):
    """Génère sources.json dans /docs/xml/."""
    sources_dict = {
        "legal": [f"xml/{x}" for x in (local_files["legal"] + LOCAL_LEGAL)],
        "pedago": [f"xml/{x}" for x in (local_files["pedago"] + LOCAL_PEDAGO)],
        "metiers": [f"xml/{x}" for x in (local_files["metiers"] + LOCAL_METIERS)],
    }

    with open(OUTPUT_DIR / "sources.json", "w", encoding="utf-8") as f:
        json.dump(sources_dict, f, indent=2, ensure_ascii=False)


# ------------------------------------------------------------
#  Logging
# ------------------------------------------------------------
def log(event: str):
    with open(OUTPUT_DIR / "logs.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event": event,
        }) + "\n")


# ------------------------------------------------------------
#  MAIN
# ------------------------------------------------------------
if __name__ == "__main__":
    log("start")

    local_files = generate_local_sources()

    data = aggregate_grouped(local_files)
    generate_rss_file("flux_legal.xml", data["legal"])
    generate_rss_file("flux_pedago.xml", data["pedago"])
    generate_rss_file("flux_metiers.xml", data["metiers"])
    generate_rss_file("rss_final.xml", data["global"])

    generate_sources_json(local_files)

    log(f"done: {len(data['global'])} articles")
