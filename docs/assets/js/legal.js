const ICONS = {
    "Code du sport – Plongée subaquatique (loisir)": "🤿",
    "Annexes réglementaires – Plongée subaquatique": "📎",
    "Diplômes professionnels – BPJEPS / DEJEPS / DESJEPS": "🎓",
    "Travaux hyperbares – Moniteurs professionnels": "🛠️",
    "Décrets officiels": "📜",
    "Circulaires et instructions officielles": "📄",
    "Code de la consommation": "🛡️"
};

let legalData = [];

function renderTOC(categories) {
    const toc = document.getElementById("legal-toc");
    toc.innerHTML = "";

    categories.forEach(cat => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="#cat-${cat.title.replace(/\s+/g, "-")}">${ICONS[cat.title] || "📘"} ${cat.title}</a>`;
        toc.appendChild(li);
    });
}

function renderCards() {
    const container = document.getElementById("legal-container");
    container.innerHTML = "";

    legalData.forEach(cat => {
        const details = document.createElement("details");
        details.className = "legal-card";
        details.id = "cat-" + cat.title.replace(/\s+/g, "-");

        const summary = document.createElement("summary");
        summary.innerHTML = `${ICONS[cat.title] || "📘"} ${cat.title}`;
        details.appendChild(summary);

        const content = document.createElement("div");
        content.className = "legal-content";

        cat.items.forEach(item => {
            const div = document.createElement("div");
            div.className = "legal-item";
            div.dataset.search = `${item.reference} ${item.description}`.toLowerCase();

            div.innerHTML = `
                <div class="legal-text">
                    <div class="legal-desc">${item.description}</div>
                    <span class="legal-ref">${item.reference}</span>
                </div>
                <a class="legal-btn" href="${item.url}" target="_blank">Voir</a>
            `;

            content.appendChild(div);
        });

        details.appendChild(content);
        container.appendChild(details);
    });
}

function applySearch() {
    const query = document.getElementById("legal-search").value.toLowerCase();
    const items = document.querySelectorAll(".legal-item");

    items.forEach(item => {
        item.style.display = item.dataset.search.includes(query) ? "" : "none";
    });
}

fetch("./data/legal.json")
    .then(r => r.json())
    .then(data => {
        legalData = data.categories;

        renderCards();
        renderTOC(legalData);

		// Conversion de la date en format français
		function formatDateFR(dateStr) {
			const date = new Date(dateStr);
			return date.toLocaleDateString("fr-FR", {
				day: "numeric",
				month: "long",
				year: "numeric"
			});
		}

		document.getElementById("legal-last-update").textContent =
			"Dernière mise à jour : " + formatDateFR(data.last_update);


        document.getElementById("legal-search").addEventListener("input", applySearch);
    })
    .catch(() => {
        document.getElementById("legal-container").innerHTML =
            "<p>Impossible de charger les références légales.</p>";
    });
