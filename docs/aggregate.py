import feedparser
import json
import os
import sys
import requests
from datetime import datetime
from xml.sax.saxutils import escape
from pathlib import Path
from urllib.parse import urlparse
from concurrent.futures import ThreadPoolExecutor, as_completed

# ------------------------------------------------------------
#  Configuration
# ------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = BASE_DIR / "xml"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

os.chdir(BASE_DIR)
sys.path.append(str(BASE_DIR))

IS_CI = os.getenv("CI") == "true"   # Mode GitHub Actions

# Import des listes de sources externes et locales
from sources import (
    EXTERNAL_LEGAL, EXTERNAL_PEDAGO, EXTERNAL_METIERS,
    LOCAL_LEGAL, LOCAL_PEDAGO, LOCAL_METIERS
)

# ------------------------------------------------------------
#  Utilitaires
# ------------------------------------------------------------
def log(event: str):
    """Écrit un log lisible + log JSON."""
    print(f"[LOG] {event}")
    with open(OUTPUT_DIR / "logs.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps({
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event": event,
        }) + "\n")


def url_to_filename(url: str) -> str:
    parsed = urlparse(url)
    host = parsed.netloc.replace("www.", "").replace(".", "_")
    return f"rss_{host}.xml"


# ------------------------------------------------------------
#  Lecture RSS avec timeout + fallback
# ------------------------------------------------------------
def read_rss(source: str):
    """Lit un flux RSS (local ou distant) avec timeout et fallback."""
    if not source.startswith("http"):
        # Lecture locale
        source_path = OUTPUT_DIR / source
        feed = feedparser.parse(str(source_path))
    else:
        # Lecture distante avec timeout
        try:
            resp = requests.get(
                source,
                timeout=10,
                headers={"User-Agent": "Mozilla/5.0"}
            )
            resp.raise_for_status()
            feed = feedparser.parse(resp.content)
        except Exception as e:
            log(f"⚠️ Erreur ou timeout sur {source}: {e}")
            return []

    log(f"Lecture de : {source} → {len(feed.entries)} entrées")

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


# ------------------------------------------------------------
#  Génération d’un fichier RSS local
# ------------------------------------------------------------
def generate_rss_file(filename: str, articles: list):
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
#  Étape 1 : Téléchargement des flux externes (parallélisé)
# ------------------------------------------------------------
def generate_local_sources():
    all_sources = {
        "legal": EXTERNAL_LEGAL,
        "pedago": EXTERNAL_PEDAGO,
        "metiers": EXTERNAL_METIERS,
    }

    # Mode CI : on réduit les flux pour accélérer
    if IS_CI:
        log("Mode CI : réduction des flux externes")
      #  all_sources["metiers"] = []  # Les plus lents

    local_files = {"legal": [], "pedago": [], "metiers": []}

    def process(url):
        filename = url_to_filename(url)
        articles = read_rss(url)
        generate_rss_file(filename, articles)
        return filename

    for category, urls in all_sources.items():
        if not urls:
            continue

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(process, url): url for url in urls}

            for future in as_completed(futures):
                filename = future.result()
                local_files[category].append(filename)
                log(f"→ Généré : {filename}")

    return local_files


# ------------------------------------------------------------
#  Étape 2 : Consolidation
# ------------------------------------------------------------
def aggregate_grouped(local_files):
    data = {"legal": [], "pedago": [], "metiers": [], "global": []}

    for src in local_files["legal"] + LOCAL_LEGAL:
        data["legal"].extend(read_rss(src))

    for src in local_files["pedago"] + LOCAL_PEDAGO:
        data["pedago"].extend(read_rss(src))

    for src in local_files["metiers"] + LOCAL_METIERS:
        data["metiers"].extend(read_rss(src))

    # Fusion globale
    data["global"] = data["legal"] + data["pedago"] + data["metiers"]

    # Déduplication
    seen = set()
    unique = []
    for a in data["global"]:
        if a["link"] not in seen:
            unique.append(a)
            seen.add(a["link"])

    # Tri par date
    unique.sort(key=lambda x: x["date"], reverse=True)
    data["global"] = unique

    return data


# ------------------------------------------------------------
#  Étape 3 : sources.json
# ------------------------------------------------------------
def generate_sources_json(local_files):
    sources_dict = {
        "legal": [f"xml/{x}" for x in (local_files["legal"] + LOCAL_LEGAL)],
        "pedago": [f"xml/{x}" for x in (local_files["pedago"] + LOCAL_PEDAGO)],
        "metiers": [f"xml/{x}" for x in (local_files["metiers"] + LOCAL_METIERS)],
    }

    with open(OUTPUT_DIR / "sources.json", "w", encoding="utf-8") as f:
        json.dump(sources_dict, f, indent=2, ensure_ascii=False)


# ------------------------------------------------------------
# MAIN
# ------------------------------------------------------------
if __name__ == "__main__":
    log("start")

    # 1. Génération des flux locaux (externes)
    local_files = generate_local_sources()

    # 2. Agrégation
    data = aggregate_grouped(local_files)
    generate_rss_file("flux_legal.xml", data["legal"])
    generate_rss_file("flux_pedago.xml", data["pedago"])
    generate_rss_file("flux_metiers.xml", data["metiers"])
    generate_rss_file("rss_final.xml", data["global"])

    # 3. sources.json
    generate_sources_json(local_files)

    log(f"done: {len(data['global'])} articles")


    # 4. Historique d'activité (activity_history.jsonl)
    history_path = OUTPUT_DIR / "activity_history.jsonl"

    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "count": len(data["global"])
    }

    with open(history_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry) + "\n")

    log(f"Historique mis à jour : {history_path}")

    # 5. Mise à jour du timestamp de dernière génération
    from datetime import datetime, UTC
    import json

    last_update_path = OUTPUT_DIR / "last_update.json"

    with open(last_update_path, "w", encoding="utf-8") as f:
        json.dump({
            "last_update": datetime.now(UTC).isoformat()
        }, f, indent=2)

    log(f"last_update.json mis à jour : {last_update_path}")