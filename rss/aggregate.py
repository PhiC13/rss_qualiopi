import feedparser
import json
from datetime import datetime
from xml.sax.saxutils import escape
from pathlib import Path

# Import des listes de sources
from sources import LEGAL, PEDAGO, METIERS

# Dossier de sortie = dossier où se trouve ce script (rss/)
OUTPUT_DIR = Path(__file__).parent


def read_rss(url):
    feed = feedparser.parse(url)
    articles = []
    for e in feed.entries:
        articles.append({
            "title": e.get("title", ""),
            "link": e.get("link", ""),
            "date": e.get("published", "") or e.get("updated", ""),
            "description": e.get("summary", ""),
            "source": url
        })
    return articles


def aggregate_grouped():
    """Retourne un dict avec 3 catégories + global."""
    data = {
        "legal": [],
        "pedago": [],
        "metiers": [],
        "global": []
    }

    # Légal
    for url in LEGAL:
        data["legal"].extend(read_rss(url))

    # Pédago
    for url in PEDAGO:
        data["pedago"].extend(read_rss(url))

    # Métiers
    for url in METIERS:
        data["metiers"].extend(read_rss(url))

    # Global = tout mélangé
    data["global"] = data["legal"] + data["pedago"] + data["metiers"]

    # Déduplication globale
    seen = set()
    unique_global = []
    for a in data["global"]:
        if a["link"] not in seen:
            unique_global.append(a)
            seen.add(a["link"])

    # Tri global
    unique_global.sort(key=lambda x: x["date"], reverse=True)
    data["global"] = unique_global

    return data


def generate_rss_file(filename, articles):
    """Génère un fichier RSS dans OUTPUT_DIR."""
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

    out_path = OUTPUT_DIR / filename
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(rss)


def log(event):
    with open(OUTPUT_DIR / "logs.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event": event
        }) + "\n")


if __name__ == "__main__":
    log("start")

    data = aggregate_grouped()

    # Génération des 4 flux
    generate_rss_file("flux_legal.xml", data["legal"])
    generate_rss_file("flux_pedago.xml", data["pedago"])
    generate_rss_file("flux_metiers.xml", data["metiers"])
    generate_rss_file("rss_final.xml", data["global"])

    log(f"done: {len(data['global'])} articles")
