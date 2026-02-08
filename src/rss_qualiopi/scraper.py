import requests
from bs4 import BeautifulSoup
from pathlib import Path
from datetime import datetime
from xml.sax.saxutils import escape

URL = "https://www.cosmos-sports.fr/actualites"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
}

def fetch_articles():
    try:
        response = requests.get(URL, headers=HEADERS, timeout=10)
        response.raise_for_status()
    except Exception as e:
        print(f"[ERROR] Impossible de récupérer la page : {e}")
        return []

    soup = BeautifulSoup(response.text, "lxml")
    articles = []

    for item in soup.select("article.teaser"):
        title_tag = item.select_one("h2.teaser_title a")
        date_tag = item.select_one("time.teaser_date")
        desc_tag = item.select_one("p.teaser_desc")

        if not title_tag:
            continue

        title = title_tag.get_text(strip=True)
        link = title_tag["href"]
        if link.startswith("/"):
            link = "https://www.cosmos-sports.fr" + link

        date = date_tag.get("datetime") if date_tag else None
        description = desc_tag.get_text(strip=True) if desc_tag else ""

        articles.append({
            "title": title,
            "link": link,
            "date": date,
            "description": description
        })

    return articles


def generate_rss(articles, output_path):
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
            <title>COSMOS – Actualités</title>
            <link>{URL}</link>
            <description>Flux généré automatiquement</description>
            {items}
        </channel>
    </rss>
    """

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(rss)

    print(f"[OK] Flux COSMOS généré : {output_path}")


if __name__ == "__main__":
    articles = fetch_articles()

    if not articles:
        print("[WARN] Aucun article trouvé.")
    else:
        print(f"[INFO] {len(articles)} articles récupérés.")

    # On génère le flux directement dans /docs
    output_file = Path(__file__).resolve().parents[2] / "docs" / "xml""rss_cosmos.xml"
    generate_rss(articles, output_file)
