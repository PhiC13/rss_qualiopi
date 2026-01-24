// --------- Flux global détaillé (rss_final.xml) ----------
async function loadArticles() {
    const container = document.getElementById("articles");
    if (!container) return;

    const response = await fetch("rss_final.xml");
    const text = await response.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");

    const items = [...xml.querySelectorAll("item")].slice(0, 10);

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

    // Condensé global
    loadFeed("rss_final.xml", "articles-global", 10, true);
}
