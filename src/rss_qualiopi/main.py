import logging
from .scraper import fetch_articles
from .rss_generator import generate_rss
from .diff import load_cache, save_cache, diff_articles
from .json_logger import log_json

logging.basicConfig(
    level=logging.INFO,
    format="[%(levelname)s] %(message)s"
)

def main():
    log_json("INFO", "start")

    logging.info("Chargement du cache…")
    log_json("INFO", "cache_load_start")
    old_articles = load_cache()
    log_json("INFO", "cache_load_end", count=len(old_articles))

    logging.info("Scraping des articles…")
    log_json("INFO", "scrape_start")
    new_articles = fetch_articles()
    log_json("INFO", "scrape_end", count=len(new_articles))

    logging.info("Comparaison avec le cache…")
    log_json("INFO", "diff_start")
    new_items = diff_articles(old_articles, new_articles)
    log_json("INFO", "diff_end", new_count=len(new_items))

    if new_items:
        logging.info(f"{len(new_items)} nouveaux articles détectés")
        log_json("INFO", "new_articles_detected", articles=new_items)
    else:
        logging.info("Aucun nouvel article")
        log_json("INFO", "no_new_articles")

    logging.info("Génération du flux RSS…")
    log_json("INFO", "rss_generation_start")
    generate_rss(new_articles)
    log_json("INFO", "rss_generation_end")

    logging.info("Mise à jour du cache…")
    log_json("INFO", "cache_update_start")
    save_cache(new_articles)
    log_json("INFO", "cache_update_end")

    log_json("INFO", "end")

if __name__ == "__main__":
    main()
