/* ============================================================
   ADMIN UI — Version nettoyée (sans pastilles, sans test)
   ============================================================ */

let isEditing = false;

/* ------------------------------------------------------------
   RENDU DES CARTES PAR CATÉGORIE
------------------------------------------------------------ */
function renderCategories() {
    const container = document.getElementById("sources-list");
    container.innerHTML = "";

    const categories = [
        { key: "legal", label: "Volet légal" },
        { key: "pedago", label: "Volet pédagogique" },
        { key: "metiers", label: "Volet métiers" }
    ];

    categories.forEach(cat => {
        const card = document.createElement("section");
        card.className = "source-card";

        const externalList = externalSources[cat.key] || [];
        const localList = localSources[cat.key] || [];

        card.innerHTML = `
            <h3>${cat.label}</h3>
            <div class="source-items external-items"></div>

            <div class="local-section">
                <div class="local-title">Flux locaux (lecture seule)</div>
                <ul class="local-list"></ul>
            </div>
        `;

        const externalContainer = card.querySelector(".external-items");
        const localContainer = card.querySelector(".local-list");

        /* EXTERNAL_* */
        externalList.forEach((url, index) => {
            const item = document.createElement("div");
            item.className = "source-item";

            item.innerHTML = `
                <span class="source-url" title="${url}">
                    <span class="icon-rss"></span>
                    <span class="url-text">${url}</span>
                </span>

                <div class="source-actions">
                    <button class="btn-edit" data-cat="${cat.key}" data-index="${index}">Modifier</button>
                    <button class="btn-delete" data-cat="${cat.key}" data-index="${index}">Supprimer</button>
                </div>
            `;

            externalContainer.appendChild(item);
        });

        /* LOCAL_* */
        localList.forEach(filename => {
            const li = document.createElement("li");
            li.innerHTML = `<span class="icon-file"></span>${filename}`;
            localContainer.appendChild(li);
        });

        container.appendChild(card);
    });

    attachItemListeners();
}

/* ------------------------------------------------------------
   RECHERCHE INSTANTANÉE
------------------------------------------------------------ */
document.addEventListener("input", (e) => {
    if (e.target.id !== "search-input") return;

    const query = e.target.value.toLowerCase();
    const cards = document.querySelectorAll(".source-card");

    cards.forEach(card => {
        const urls = [...card.querySelectorAll(".url-text")].map(u => u.textContent.toLowerCase());
        const match = urls.some(u => u.includes(query));
        card.style.display = match || query === "" ? "" : "none";
    });
});

/* ------------------------------------------------------------
   LISTENERS
------------------------------------------------------------ */
function attachItemListeners() {
    document.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", onEditSource);
    });

    document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", onDeleteSource);
    });
}

/* ------------------------------------------------------------
   MODE FORMULAIRE
------------------------------------------------------------ */
function setFormMode(editMode) {
    isEditing = editMode;
    const title = document.getElementById("form-title");
    const cancelBtn = document.getElementById("cancel-edit");

    if (editMode) {
        title.textContent = "Modifier un flux distant";
        cancelBtn.style.display = "inline-block";
    } else {
        title.textContent = "Ajouter un flux distant";
        cancelBtn.style.display = "none";
        document.getElementById("source-form").reset();
        document.getElementById("src-index").value = "";
        document.getElementById("validation-status").textContent = "";
    }
}

/* ------------------------------------------------------------
   EDITION
------------------------------------------------------------ */
function onEditSource(e) {
    const cat = e.target.dataset.cat;
    const index = parseInt(e.target.dataset.index, 10);
    const url = externalSources[cat][index];

    document.getElementById("src-cat").value = cat;
    document.getElementById("src-url").value = url;
    document.getElementById("src-index").value = index;

    setFormMode(true);
}

/* ------------------------------------------------------------
   SUPPRESSION
------------------------------------------------------------ */
function onDeleteSource(e) {
    const cat = e.target.dataset.cat;
    const index = parseInt(e.target.dataset.index, 10);

    if (!confirm("Supprimer ce flux distant ?")) return;

    externalSources[cat].splice(index, 1);
    renderCategories();
    saveSourcesPy();
}

/* ------------------------------------------------------------
   SUBMIT FORMULAIRE
------------------------------------------------------------ */
async function onSubmitForm(e) {
    e.preventDefault();

    const cat = document.getElementById("src-cat").value;
    const url = document.getElementById("src-url").value.trim();
    const index = document.getElementById("src-index").value;
    const status = document.getElementById("validation-status");

    if (!cat) {
        status.textContent = "Veuillez choisir une catégorie.";
        status.style.color = "#990000";
        return;
    }

    if (!url) {
        status.textContent = "Veuillez saisir une URL.";
        status.style.color = "#990000";
        return;
    }

    try {
        new URL(url);
    } catch {
        status.textContent = "URL invalide.";
        status.style.color = "#990000";
        return;
    }

    if (isEditing && index !== "") {
        externalSources[cat][parseInt(index, 10)] = url;
    } else {
        externalSources[cat].push(url);
    }

    status.textContent = "Flux enregistré.";
    status.style.color = "#006600";

    renderCategories();
    setFormMode(false);

    await saveSourcesPy();
}

/* ------------------------------------------------------------
   INIT
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
    initToken();
    loadSourcesPy();

    document.getElementById("source-form").addEventListener("submit", onSubmitForm);
    document.getElementById("cancel-edit").addEventListener("click", () => setFormMode(false));
    document.getElementById("export-sources").addEventListener("click", exportSourcesPy);
});
