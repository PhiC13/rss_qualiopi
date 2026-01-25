// ------------------------------------------------------------
//  Lecture d'un flux RSS local
// ------------------------------------------------------------
async function loadLocalRSS(url, containerId, label) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const response = await fetch(url);
        const text = await response.text();

        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");

        const items = Array.from(xml.querySelectorAll("item")).slice(0, 10);

        // Création du bloc source
        const details = document.createElement("details");
        details.className = "article-group";

        // Summary AVANT d'ajouter la classe empty-source
        const summary = document.createElement("summary");
        summary.textContent = `${label} (${items.length})`;
        details.appendChild(summary);

        // Si aucun article → style spécial + bloc non ouvrable
        if (items.length === 0) {
            details.classList.add("empty-source");

            summary.addEventListener("click", (e) => {
                e.preventDefault();   // empêche l'ouverture
                e.stopPropagation();
            });
        }

        container.appendChild(details);

        // Articles
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
            details.appendChild(div);
        });

    } catch (err) {
        console.error("Erreur flux local :", url, err);
    }
}


// ------------------------------------------------------------
//  Chargement automatique via sources.json
// ------------------------------------------------------------
async function loadLocalFeeds() {
    const response = await fetch("xml/sources.json");
    const sources = await response.json();

    // Fonction utilitaire pour générer un label propre
    const cleanLabel = (src) =>
        src.replace("xml/", "")
           .replace(".xml", "")
           .replace("rss_", "")
           .toUpperCase();

    // Légal
    sources.legal.forEach(src => {
        loadLocalRSS(src, "articles-legal", cleanLabel(src));
    });

    // Pédago
    sources.pedago.forEach(src => {
        loadLocalRSS(src, "articles-pedago", cleanLabel(src));
    });

    // Métiers
    sources.metiers.forEach(src => {
        loadLocalRSS(src, "articles-metiers", cleanLabel(src));
    });
}


// ------------------------------------------------------------
//  Lancement
// ------------------------------------------------------------
loadLocalFeeds();
