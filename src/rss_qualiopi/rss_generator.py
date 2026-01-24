from datetime import datetime
from email.utils import format_datetime
from xml.sax.saxutils import escape

def generate_rss(articles, output_file="rss.xml"):
    rss_items = ""

    for art in articles:
        # Conversion date ISO → RFC 822
        pub_date = ""
        if art["date"]:
            try:
                dt = datetime.fromisoformat(art["date"])
                pub_date = format_datetime(dt)
            except Exception:
                pub_date = art["date"]

        rss_items += f"""
        <item>
            <title>{escape(art['title'])}</title>
            <link>{escape(art['link'])}</link>
            <guid>{escape(art['link'])}</guid>
            <description>{escape(art['description'])}</description>
            <pubDate>{pub_date}</pubDate>
        </item>
        """

    rss_feed = f"""<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0">
        <channel>
            <title>Flux RSS COSMOS</title>
            <link>https://www.cosmos-sports.fr/actualites</link>
            <description>Flux RSS généré automatiquement</description>
            <lastBuildDate>{format_datetime(datetime.utcnow())}</lastBuildDate>
            {rss_items}
        </channel>
    </rss>
    """

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(rss_feed)
