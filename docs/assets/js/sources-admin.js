let sources = [];
let githubToken = localStorage.getItem("githubToken") || "";

// -----------------------------
// Chargement initial
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("token").value = githubToken;

  document.getElementById("save-token").addEventListener("click", () => {
    githubToken = document.getElementById("token").value.trim();
    localStorage.setItem("githubToken", githubToken);
    alert("Token enregistré localement.");
  });

  loadSources();
});

// -----------------------------
// Charger sources.json
// -----------------------------
async function loadSources() {
  const res = await fetch("../data/sources.json");
  sources = await res.json();
  renderSources();
}

// -----------------------------
// Normalisation URL
// -----------------------------
function normalizeURL(url) {
  try {
    let u = new URL(url.trim());

    if (u.protocol === "http:") {
      u.protocol = "https:";
    }

    u.search = "";
    u.hash = "";

    if (u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }

    return u.toString();
  } catch (e) {
    return null;
  }
}

// -----------------------------
// Détection favicon
// -----------------------------
async function detectFavicon(url) {
  try {
    const u = new URL(url);
    const base = `${u.protocol}//${u.hostname}`;

    const ico = `${base}/favicon.ico`;
    const resIco = await fetch(ico, { method: "HEAD" });

    if (resIco.ok) return ico;

    const resHTML = await fetch(base);
    const html = await resHTML.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const link =
      doc.querySelector("link[rel='icon']") ||
      doc.querySelector("link[rel='shortcut icon']") ||
      doc.querySelector("link[rel='apple-touch-icon']");

    if (link) {
      let href = link.getAttribute("href");
      if (!href.startsWith("http")) {
        href = base + (href.startsWith("/") ? href : "/" + href);
      }
      return href;
    }

    return null;
  } catch (e) {
    return null;
  }
}

// -----------------------------
// Validation RSS
// -----------------------------
async function validateRSS(url) {
  const statusBox = document.getElementById("validation-status");
  statusBox.innerHTML = "⏳ Vérification du flux RSS…";

  try {
    const res = await fetch(url);

    if (!res.ok) {
      statusBox.innerHTML = `❌ Erreur HTTP : ${res.status}`;
      return false;
    }

    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "application/xml");

    if (xml.querySelector("parsererror")) {
      statusBox.innerHTML = "❌ Le contenu n'est pas un XML valide.";
      return false;
    }

    const isRSS = xml.querySelector("rss > channel > item");
    const isAtom = xml.querySelector("feed > entry");

    if (!isRSS && !isAtom) {
      statusBox.innerHTML = "⚠ Le flux est accessible mais ne contient pas d’articles.";
      return false;
    }

    const title =
      xml.querySelector("channel > title")?.textContent ||
      xml.querySelector("feed > title")?.textContent ||
      null;

    statusBox.innerHTML = `✔ Flux valide${title ? " — Titre : " + title : ""}`;

    return { valid: true, title: title };

  } catch (e) {
    statusBox.innerHTML = "❌ Impossible d'accéder au flux.";
    return false;
  }
}

// -----------------------------
// Affichage des sources
// -----------------------------
function renderSources() {
  const container = document.getElementById("sources-list");
  container.innerHTML = "";

  sources.forEach((src, index) => {
    const div = document.createElement("div");
    div.className = "source-item";

    div.innerHTML = `
      <div class="source-info">
        <img src="${src.favicon || '../assets/img/default-icon.png'}" class="favicon">
        <strong>${src.name}</strong>
        <small>${src.url}</small>
        <em>${src.category || ""}</em>
      </div>

      <div class="source-actions">
        <button class="btn-edit" onclick="editSource(${index})">Modifier</button>
        <button class="btn-delete" onclick="deleteSource(${index})">Supprimer</button>
      </div>
    `;

    container.appendChild(div);
  });
}

// -----------------------------
// Modifier une source
// -----------------------------
function editSource(index) {
  const src = sources[index];

  document.getElementById("src-name").value = src.name;
  document.getElementById("src-url").value = src.url;
  document.getElementById("src-cat").value = src.category || "";
  document.getElementById("src-index").value = index;

  document.getElementById("form-title").textContent = "Modifier une source";
}

// -----------------------------
// Supprimer une source
// -----------------------------
function deleteSource(index) {
  if (!confirm("Supprimer cette source ?")) return;

  sources.splice(index, 1);
  saveSources();
}

// -----------------------------
// Soumission du formulaire
// -----------------------------
document.getElementById("source-form").addEventListener("submit", async e => {
  e.preventDefault();

  const nameInput = document.getElementById("src-name");
  const urlInput = document.getElementById("src-url");
  const catInput = document.getElementById("src-cat");
  const index = document.getElementById("src-index").value;

  let url = urlInput.value;

  // 1. Normalisation
  url = normalizeURL(url);
  if (!url) {
    alert("L’URL est invalide.");
    return;
  }
  urlInput.value = url;

  // 2. Validation RSS
  const validation = await validateRSS(url);
  if (!validation || validation.valid === false) {
    alert("Le flux n'est pas valide. Impossible d'enregistrer.");
    return;
  }

  // 3. Auto-remplissage du nom
  if (nameInput.value.trim() === "" && validation.title) {
    nameInput.value = validation.title;
  }

  // 4. Détection du favicon
  const favicon = await detectFavicon(url);

  const newSource = {
    name: nameInput.value,
    url: url,
    category: catInput.value,
    favicon: favicon || null
  };

  if (index === "") {
    sources.push(newSource);
  } else {
    sources[index] = newSource;
  }

  saveSources();
});

// -----------------------------
// Sauvegarde via GitHub API
// -----------------------------
async function saveSources() {
  if (!githubToken) {
    alert("Veuillez saisir un token GitHub.");
    return;
  }

  const content = btoa(JSON.stringify(sources, null, 2));
  const sha = await getCurrentSha();

  const res = await fetch(
    "https://api.github.com/repos/PhiC13/rss_qualiopi/contents/docs/data/sources.json",
    {
      method: "PUT",
      headers: {
        "Authorization": `token ${githubToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Mise à jour des sources via interface web",
        content: content,
        sha: sha
      })
    }
  );

  if (res.ok) {
    alert("Sources mises à jour !");
    loadSources();
  } else {
    alert("Erreur lors de la sauvegarde.");
  }
}

// -----------------------------
// Récupérer le SHA du fichier
// -----------------------------
async function getCurrentSha() {
  const res = await fetch(
    "https://api.github.com/repos/PhiC13/rss_qualiopi/contents/docs/data/sources.json",
    {
      headers: { "Authorization": `token ${githubToken}` }
    }
  );

  const data = await res.json();
  return data.sha;
}