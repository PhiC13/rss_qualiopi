// ------------------------------------------------------------
//  Formatage de la date en français
// ------------------------------------------------------------	

function formatDateFR(rawDate) {
    if (!rawDate) return "";
    return new Date(rawDate).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


// ------------------------------------------------------------
//  Chargement du flux global (colonne latérale)
// ------------------------------------------------------------
async function loadGlobalFeed() {
    const container = document.getElementById("articles-global");
    if (!container) return;

    try {
        const response = await fetch("xml/rss_final.xml");
        const text = await response.text();

        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");

        // Extraction des items
        let items = Array.from(xml.querySelectorAll("item")).map(item => {
            const title = item.querySelector("title")?.textContent ?? "Sans titre";
            const link = item.querySelector("link")?.textContent ?? "#";
            const rawDate = item.querySelector("pubDate")?.textContent ?? "";
            const dateObj = rawDate ? new Date(rawDate) : null;

            return {
                title,
                link,
                rawDate,
                dateObj
            };
        });

        // TRI DYNAMIQUE PAR DATE (du plus récent au plus ancien)
        items = items
            .filter(i => i.dateObj instanceof Date && !isNaN(i.dateObj))
            .sort((a, b) => b.dateObj - a.dateObj)
            .slice(0, 10); // Limite aux 10 derniers articles

        // AFFICHAGE
        items.forEach(item => {
            const div = document.createElement("div");
            div.className = "article-mini";

            const date = formatDateFR(item.rawDate);

            div.innerHTML = `
                <a href="${item.link}" target="_blank">${item.title}</a>
                <small>${date}</small>
            `;
            container.appendChild(div);
        });

        // Données pour le graphique
        const dates = items.map(i => i.dateObj);
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
