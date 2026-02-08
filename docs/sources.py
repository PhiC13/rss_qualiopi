# sources.py
# --------------------------------------------------------------------
# LISTES DES FLUX EXTERNES (scrapés automatiquement par aggregate.py)
# --------------------------------------------------------------------

EXTERNAL_LEGAL = [
    "https://www.service-public.fr/rss/actualites.rss",
    "https://travail-emploi.gouv.fr/actualites.rss",
    "https://www.economie.gouv.fr/rss/actualites",
]

EXTERNAL_PEDAGO = [
    "https://eduscol.education.fr/rss.xml",
    "https://www.economie.gouv.fr/rss/actualites",
    "https://www.digiforma.com/feed/",
    "https://www.digiforma-veille.com/feed/",
    "https://www.centre-inffo.fr/feed",
]

EXTERNAL_METIERS = [
    "https://phic13.github.io/rss_qualiopi/rss.xml",
    "https://www.ffessm.fr/actualites/rss",
    "https://injep.fr/feed/",
    "https://www.plongez.fr/feed",
]

# --------------------------------------------------------------------
# LISTES DES FLUX LOCAUX PERMANENTS (déjà existants, non scrapés)
# --------------------------------------------------------------------

LOCAL_LEGAL = [
    "rss_cosmos.xml",   # Flux local produit par ton scraper COSMOS
]

LOCAL_PEDAGO = [
    # Rien pour l’instant
]

LOCAL_METIERS = [
    # Rien pour l’instant
]