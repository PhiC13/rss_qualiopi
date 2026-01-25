// ------------------------------------------------------------
//  Chargement du flux global (colonne latérale)
// ------------------------------------------------------------
async function loadGlobalFeed() {
    const container = document.getElementById("articles-global");
    if (!container) return;

    try {
        // IMPORTANT : chemin mis à jour vers /xml/
        const response = await fetch("xml/rss_final.xml");
        const text = await response.text();

        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");

        const items = Array.from(xml.querySelectorAll("item")).slice(0, 20);

        // Affichage des derniers articles
        items.forEach(item => {
            const div = document.createElement("div");
            div.className = "article-mini";

            const title = item.querySelector("title")?.textContent ?? "Sans titre";
            const link = item.querySelector("link")?.textContent ?? "#";
            const date = item.querySelector("pubDate")?.textContent ?? "";

            div.innerHTML = `
                <a href="${link}" target="_blank">${title}</a>
                <small>${date}</small>
            `;
            container.appendChild(div);
        });

        // Données pour le graphique
        const dates = items.map(i => new Date(i.querySelector("pubDate")?.textContent));
        updateActivityChart(dates);

    } catch (err) {
        console.error("Erreur flux global :", err);
    }
}


// ------------------------------------------------------------
//  Recherche interne (toutes colonnes)
// ------------------------------------------------------------
function setupSearch() {
    const input = document.getElementById("searchInput");
    if (!input) return;

    input.addEventListener("input", function () {
        const query = this.value.toLowerCase();

        // Tous les articles du dashboard
        const articles = document.querySelectorAll(".article-mini");

        articles.forEach(article => {
            const text = article.innerText.toLowerCase();
            article.style.display = text.includes(query) ? "block" : "none";
        });

        // Les blocs vides restent visibles (pas de masquage)
    });
}


// ------------------------------------------------------------
//  Initialisation
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadGlobalFeed();
    setupSearch();
});
