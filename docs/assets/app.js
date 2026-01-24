// --------- Flux global détaillé (rss_final.xml) ----------
async function loadArticles() {
    const response = await fetch("rss_final.xml");
    const text = await response.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");

    const items = [...xml.querySelectorAll("item")].slice(0, 10);
    const container = document.getElementById("articles");
    if (!container) return;

    items.forEach(item => {
        const title = item.querySelector("title")?.textContent || "";
        const link = item.querySelector("link")?.textContent || "";
        const date = item.querySelector("pubDate")?.textContent || "";
        const desc = item.querySelector("description")?.textContent || "";

        const div = document.createElement("div");
        div.className = "article";

        div.innerHTML = `
            <h3><a href="${link}" target="_blank">${title}</a></h3>
            <small>${date}</small>
            <p>${desc}</p>
        `;

        container.appendChild(div);
    });
}

// --------- Flux XML locaux (3 rubriques + condensé global) ----------
async function loadFeed(url, containerId, limit = 5, mini = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const response = await fetch(url);
    const text = await response.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");

    const items = [...xml.querySelectorAll("item")].slice(0, limit);

    items.forEach(item => {
        const title = item.querySelector("title")?.textContent || "";
        const link = item.querySelector("link")?.textContent || "";
        const date = item.querySelector("pubDate")?.textContent || "";

        const div = document.createElement("div");
        div.className = mini ? "article-mini" : "article";

        div.innerHTML = mini
            ? `<a href="${link}" target="_blank">${title}</a><small>${date}</small>`
            : `<h3><a href="${link}" target="_blank">${title}</a></h3><small>${date}</small>`;

        container.appendChild(div);
    });
}

function loadLocalFeeds() {
    loadFeed("flux_legal.xml", "articles-legal");
    loadFeed("flux_pedago.xml", "articles-pedago");
    loadFeed("flux_metiers.xml", "articles-metiers");
    loadFeed("rss_final.xml", "articles-global", 10, true);
}

// --------- Flux externes via rss2json, regroupés par source ----------
async function loadExternalRSS(url, containerId, label) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const api = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(url);
    const response = await fetch(api);
    const data = await response.json();

    const items = data.items.slice(0, 10);

    const details = document.createElement("details");
    details.className = "article-group";
    details.innerHTML = `<summary>${label} (${items.length})</summary>`;
    container.appendChild(details);

    items.forEach(item => {
        const div = document.createElement("div");
        div.className = "article-mini";
        div.innerHTML = `
            <a href="${item.link}" target="_blank">${item.title}</a>
            <small>${item.pubDate}</small>
        `;
        details.appendChild(div);
    });
}

function loadExternalFeeds() {
    // Légal
    loadExternalRSS("https://www.service-public.fr/rss/actualites.rss", "legal-service-public", "Service-public.fr");
    loadExternalRSS("https://travail-emploi.gouv.fr/actualites.rss", "legal-travail", "Travail-emploi.gouv.fr");
    loadExternalRSS("https://www.economie.gouv.fr/rss/actualites", "legal-economie", "Economie.gouv.fr");

    // Pédago
    loadExternalRSS("https://www.digiforma.com/feed/", "pedago-digiforma", "Digiforma");

    // Métiers (à compléter)
    // loadExternalRSS("URL_INJEP", "metiers-injep", "INJEP");
    // loadExternalRSS("URL_FFESSM", "metiers-ffessm", "FFESSM");
}

// --------- Graphique d’activité (rss_final.xml + Chart.js) ----------
async function loadActivityChart() {
    const canvas = document.getElementById("activityChart");
    if (!canvas) return;

    const response = await fetch("rss_final.xml");
    const text = await response.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");

    const items = [...xml.querySelectorAll("item")];

    const counts = {};
    items.forEach(item => {
        const pub = item.querySelector("pubDate");
        if (!pub) return;
        const date = new Date(pub.textContent);
        if (isNaN(date)) return;
        const key = date.toISOString().split("T")[0];
        counts[key] = (counts[key] || 0) + 1;
    });

    const labels = Object.keys(counts).sort();
    const values = labels.map(l => counts[l]);

    const ctx = canvas.getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Articles par jour",
                data: values,
                borderColor: "#003366",
                backgroundColor: "rgba(0, 51, 102, 0.2)",
                borderWidth: 2,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { maxRotation: 45, minRotation: 45 } },
                y: { beginAtZero: true }
            }
        }
    });
}

// --------- Point d’entrée ----------
document.addEventListener("DOMContentLoaded", () => {
    loadArticles();
    loadLocalFeeds();
    loadExternalFeeds();
    loadActivityChart();
});
