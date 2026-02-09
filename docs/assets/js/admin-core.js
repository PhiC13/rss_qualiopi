/* ============================================================
   ADMIN CORE — Gestion de docs/sources.py (EXTERNAL_* uniquement)
   ============================================================ */

let githubToken = localStorage.getItem("githubToken") || "";
let sourcesPyRaw = "";
let externalSources = { legal: [], pedago: [], metiers: [] };
let localSources = { legal: [], pedago: [], metiers: [] };

/* ------------------------------------------------------------
   TOKEN
------------------------------------------------------------ */
function initToken() {
    const tokenInput = document.getElementById("token");
    const saveBtn = document.getElementById("save-token");

    tokenInput.value = githubToken;

    saveBtn.addEventListener("click", () => {
        githubToken = tokenInput.value.trim();
        localStorage.setItem("githubToken", githubToken);
        alert("Token enregistré.");
    });
}

/* ------------------------------------------------------------
   CHARGEMENT DE sources.py
------------------------------------------------------------ */
async function loadSourcesPy() {
    const res = await fetch("../sources.py", { cache: "no-store" });
    sourcesPyRaw = await res.text();

    parseSourcesPy(sourcesPyRaw);
    renderCategories();
}

/* ------------------------------------------------------------
   PARSE TOLÉRANT DE sources.py
------------------------------------------------------------ */
function parseSourcesPy(text) {
    const lines = text.split("\n");

    let current = null;

    for (let line of lines) {
        line = line.trim();

        if (line.startsWith("EXTERNAL_LEGAL")) current = "external_legal";
        else if (line.startsWith("EXTERNAL_PEDAGO")) current = "external_pedago";
        else if (line.startsWith("EXTERNAL_METIERS")) current = "external_metiers";
        else if (line.startsWith("LOCAL_LEGAL")) current = "local_legal";
        else if (line.startsWith("LOCAL_PEDAGO")) current = "local_pedago";
        else if (line.startsWith("LOCAL_METIERS")) current = "local_metiers";

        if (line.startsWith("]")) current = null;

        if (current && line.includes('"')) {
            const match = line.match(/"([^"]+)"/);
            if (match) {
                const url = match[1];
                if (current.startsWith("external_")) {
                    const key = current.replace("external_", "");
                    externalSources[key].push(url);
                } else if (current.startsWith("local_")) {
                    const key = current.replace("local_", "");
                    localSources[key].push(url);
                }
            }
        }
    }
}

/* ------------------------------------------------------------
   RÉÉCRITURE SÛRE DE sources.py
------------------------------------------------------------ */
function rewriteSourcesPy() {
    const lines = sourcesPyRaw.split("\n");
    const newLines = [];
    let current = null;
    let index = 0;

    for (let line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith("EXTERNAL_LEGAL")) {
            current = "legal";
            newLines.push(line);
            continue;
        }
        if (trimmed.startsWith("EXTERNAL_PEDAGO")) {
            current = "pedago";
            newLines.push(line);
            continue;
        }
        if (trimmed.startsWith("EXTERNAL_METIERS")) {
            current = "metiers";
            newLines.push(line);
            continue;
        }

        if (current && trimmed.startsWith("]")) {
            // inject new URLs with same indentation
            const indent = line.match(/^\s*/)[0];
            externalSources[current].forEach(url => {
                newLines.push(`${indent}    "${url}",`);
            });
            newLines.push(line);
            current = null;
            continue;
        }

        // skip old EXTERNAL_* URLs
        if (current && trimmed.includes('"')) {
            continue;
        }

        newLines.push(line);
    }

    return newLines.join("\n");
}

/* ------------------------------------------------------------
   EXPORT LOCAL
------------------------------------------------------------ */
function exportSourcesPy() {
    const blob = new Blob([sourcesPyRaw], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "sources.py";
    a.click();

    URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------
   SAUVEGARDE GITHUB
------------------------------------------------------------ */
async function saveSourcesPy() {
    if (!githubToken) {
        alert("Token GitHub manquant.");
        return;
    }

    const updated = rewriteSourcesPy();
    const contentBase64 = btoa(unescape(encodeURIComponent(updated)));

    const sha = await getCurrentSourcesPySha();

    const res = await fetch(
        "https://api.github.com/repos/PhiC13/rss_qualiopi/contents/docs/sources.py",
        {
            method: "PUT",
            headers: {
                "Authorization": `token ${githubToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: "Mise à jour EXTERNAL_* via admin",
                content: contentBase64,
                sha: sha
            })
        }
    );

    if (res.ok) {
        alert("sources.py mis à jour !");
        await loadSourcesPy();
    } else {
        alert("Erreur lors de la sauvegarde.");
    }
}

/* ------------------------------------------------------------
   SHA
------------------------------------------------------------ */
async function getCurrentSourcesPySha() {
    const res = await fetch(
        "https://api.github.com/repos/PhiC13/rss_qualiopi/contents/docs/sources.py",
        {
            headers: { "Authorization": `token ${githubToken}` }
        }
    );
    const data = await res.json();
    return data.sha;
}
