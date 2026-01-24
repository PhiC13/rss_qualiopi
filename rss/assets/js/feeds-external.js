// --------- Flux externes via rss2json, regroupés par source ----------
async function loadExternalRSS(url, containerId, label) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const api = "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(url);
    const response = await fetch(api);
    const data = await response.json();

	if (!data.items) {
		const error = document.createElement("p");
		error.textContent = `Impossible de charger la source : ${label}`;
		error.style.color = "red";
		container.appendChild(error);
		return;
	}

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
