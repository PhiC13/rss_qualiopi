let legalData = null;

// Charger le JSON
fetch("../legal/data/legal.json")
  .then(r => r.json())
  .then(data => {
    legalData = data;
    populateCategorySelect();
    renderCategories();
  });

/* ------------------------------
   RENDU DES CARTES
--------------------------------*/
function renderCategories() {
  const container = document.getElementById("legal-list");
  container.innerHTML = "";

  legalData.categories.forEach((cat, catIndex) => {

    const card = document.createElement("div");
    card.className = "source-card";

    card.innerHTML = `
      <h3>${cat.title}</h3>
      <div class="source-items">
        ${cat.items.map((item, itemIndex) => `
          <div class="source-item" data-search="${item.reference} ${item.description}">
            <span class="source-url">🔗 ${item.reference}</span>
            <span class="source-desc">${item.description}</span>
            <div class="source-actions">
              <button class="btn-edit" onclick="editItem(${catIndex}, ${itemIndex})">Modifier</button>
              <button class="btn-delete" onclick="deleteItem(${catIndex}, ${itemIndex})">Supprimer</button>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    container.appendChild(card);
  });
}

/* ------------------------------
   FORMULAIRE
--------------------------------*/
function populateCategorySelect() {
  const select = document.getElementById("cat-select");
  legalData.categories.forEach((cat, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = cat.title;
    select.appendChild(opt);
  });
}

document.getElementById("legal-form").onsubmit = (e) => {
  e.preventDefault();

  const catIndex = document.getElementById("cat-select").value;
  const ref = document.getElementById("ref-input").value.trim();
  const desc = document.getElementById("desc-input").value.trim();
  const url = document.getElementById("url-input").value.trim();

  const editCat = document.getElementById("edit-cat-index").value;
  const editItem = document.getElementById("edit-item-index").value;

  if (editCat !== "" && editItem !== "") {
    // Mode édition
    legalData.categories[editCat].items[editItem] = { reference: ref, description: desc, url };
  } else {
    // Mode ajout
    legalData.categories[catIndex].items.push({ reference: ref, description: desc, url });
  }

  resetForm();
  renderCategories();
};

function editItem(catIndex, itemIndex) {
  const item = legalData.categories[catIndex].items[itemIndex];

  document.getElementById("cat-select").value = catIndex;
  document.getElementById("ref-input").value = item.reference;
  document.getElementById("desc-input").value = item.description;
  document.getElementById("url-input").value = item.url;

  document.getElementById("edit-cat-index").value = catIndex;
  document.getElementById("edit-item-index").value = itemIndex;

  document.querySelector(".btn-primary").textContent = "Enregistrer";
  document.getElementById("cancel-edit").style.display = "inline-block";
  document.getElementById("form-title").scrollIntoView({ behavior: "smooth" });
}

function deleteItem(catIndex, itemIndex) {
  if (confirm("Supprimer cet article ?")) {
    legalData.categories[catIndex].items.splice(itemIndex, 1);
    renderCategories();
  }
}

function resetForm() {
  document.getElementById("legal-form").reset();
  document.getElementById("edit-cat-index").value = "";
  document.getElementById("edit-item-index").value = "";
  document.querySelector(".btn-primary").textContent = "Ajouter";
  document.getElementById("cancel-edit").style.display = "none";
}

/* ------------------------------
   RECHERCHE
--------------------------------*/
document.getElementById("search-input").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll(".source-item").forEach(item => {
    item.style.display = item.dataset.search.toLowerCase().includes(q) ? "" : "none";
  });
});

/* ------------------------------
   EXPORT JSON
--------------------------------*/
document.getElementById("export-legal").onclick = () => {
  legalData.last_update = new Date().toISOString().split("T")[0];

  const blob = new Blob([JSON.stringify(legalData, null, 2)], {
    type: "application/json"
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "legal.json";
  a.click();
};
