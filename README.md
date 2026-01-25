📘 README — Agrégateur RSS Qualiopi & Dashboard Web
Ce dépôt contient deux projets complémentaires :

Un projet Python (basé sur Poetry)
→ Scraper COSMOS + générateur RSS + outils d’analyse

Un projet Web statique  
→ Agrégateur RSS local + interface de veille + dashboard des logs
→ Déployé automatiquement via GitHub Pages

Les deux projets coopèrent grâce à un pipeline GitHub Actions qui génère automatiquement les flux RSS consolidés.

🟦 1) Projet Python : Scraper & Générateur RSS
📁 Répertoire : src/rss_qualiopi/  
📄 Fichiers principaux :

scraper.py  
→ Scrape les données COSMOS (ou autres sources internes)
→ Génère un flux RSS local : docs/xml/rss_cosmos.xml

rss_generator.py  
→ Outils génériques pour produire des flux RSS

json_logger.py  
→ Système de logs JSONL compatible avec le dashboard web

main.py  
→ Point d’entrée possible pour exécuter le pipeline Python localement

export_csv.py, diff.py  
→ Outils d’analyse et d’export

📦 Gestion des dépendances :  
Le projet utilise Poetry :

bash
poetry install
poetry run python src/rss_qualiopi/scraper.py
📝 Sortie du scraper :  
Le scraper écrit directement dans le site web, dans :

Code
docs/xml/rss_cosmos.xml
Ce fichier est ensuite intégré dans l’agrégateur web.

🟦 2) Projet Web : Agrégateur RSS statique
📁 Répertoire : docs/  
Ce dossier est la racine du site GitHub Pages.

🔹 Fonctionnalités
Lecture de tous les flux RSS locaux (générés automatiquement)

Consolidation par thématique :

Légal & réglementaire

Pédagogique & technologique

Métiers & compétences

Affichage :

Derniers articles

Activité récente (graphique Chart.js)

Recherche instantanée

Sources vides affichées mais grisées

Dashboard des logs JSONL

🔹 Fichiers clés
index.html  
→ Interface principale de veille

dashboard.html  
→ Visualisation des logs (filtres + graphique)

aggregate.py  
→ Agrégateur RSS local
→ Génère :

docs/xml/rss_*.xml

docs/xml/flux_*.xml

docs/xml/rss_final.xml

docs/xml/sources.json

assets/js/*.js  
→ Scripts d’affichage, parsing RSS, recherche, graphiques

xml/  
→ Tous les flux générés automatiquement

🟦 3) Pipeline GitHub Actions
📁 Fichier : .github/workflows/generate-rss.yml

Le pipeline :

Installe Poetry

Installe les dépendances du projet Python

Exécute le scraper COSMOS

Exécute l’agrégateur RSS

Met à jour automatiquement les fichiers dans docs/xml/

Pousse les modifications sur main

GitHub Pages met à jour le site

🔹 Exécution automatique
Toutes les heures (cron: "0 * * * *")

Ou manuellement via l’interface GitHub

🟦 4) Déploiement GitHub Pages
Le site est servi depuis :

Code
/docs
Ce qui permet :

un site statique léger

aucune dépendance serveur

un hébergement gratuit

une mise à jour automatique via GitHub Actions

🟦 5) Développement local
Installer les dépendances Python
bash
poetry install
Lancer le scraper
bash
poetry run python src/rss_qualiopi/scraper.py
Lancer l’agrégateur
bash
poetry run python docs/aggregate.py
Ouvrir le site localement
Ouvrir simplement :

Code
docs/index.html
docs/dashboard.html
🟦 6) Structure du dépôt
Code
.
├── docs/                     # Site web statique (GitHub Pages)
│   ├── index.html
│   ├── dashboard.html
│   ├── aggregate.py
│   ├── sources.py
│   ├── assets/
│   ├── xml/                  # Flux générés automatiquement
│   └── ...
│
├── src/rss_qualiopi/         # Projet Python (scraper + outils)
│   ├── scraper.py
│   ├── rss_generator.py
│   ├── json_logger.py
│   ├── main.py
│   └── ...
│
├── .github/workflows/        # Pipeline GitHub Actions
│   └── generate-rss.yml
│
├── pyproject.toml            # Configuration Poetry
└── README.md
🟦 7) Licence & contact
Projet développé par PhiC13  
Objectif : automatiser la veille Qualiopi / réglementaire / pédagogique.