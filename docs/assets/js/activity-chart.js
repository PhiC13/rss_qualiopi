// ======================================================================
//  activity-chart.js
//  Gestion complète du graphique d'activité (historique + filtrage)
// ======================================================================

let activityChart = null;

// ======================================================================
//  1. FONCTIONS UTILITAIRES
// ======================================================================

// Convertit une date en clé "YYYY-MM-DD"
function getDayKey(date) {
    return date.toISOString().slice(0, 10);
}

// Clé de semaine : YYYY-Sxx
function getWeekKey(date) {
    const year = date.getFullYear();
    const week = Math.ceil((((date - new Date(year, 0, 1)) / 86400000) +
        new Date(year, 0, 1).getDay() + 1) / 7);
    return `${year}-S${String(week).padStart(2, "0")}`;
}

// Filtrer l'historique selon une période (7, 30, 90 jours ou "all")
function filterByDays(entries, days) {
    if (days === "all") return entries;

    const now = new Date();
    const limit = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return entries.filter(e => e.date >= limit);
}

// ======================================================================
//  2. CHARGEMENT DE L'HISTORIQUE
// ======================================================================

async function loadActivityHistory() {
    try {
        const response = await fetch("xml/activity_history.jsonl");
        const text = await response.text();

        const lines = text.trim().split("\n");
        const entries = lines.map(line => JSON.parse(line));

        // Convertir timestamp → Date
        entries.forEach(e => {
            e.date = new Date(e.timestamp);
        });

        return entries;

    } catch (err) {
        console.error("Erreur lecture historique :", err);
        return [];
    }
}

// ======================================================================
//  3. REGROUPEMENTS (jour / semaine)
// ======================================================================

// Regroupement par jour
function groupByDay(entries) {
    const counts = {};
    entries.forEach(e => {
        const key = getDayKey(e.date);
        counts[key] = (counts[key] || 0) + e.count;
    });
    return counts;
}

// Regroupement par semaine
function groupByWeek(entries) {
    const weeks = {};
    entries.forEach(e => {
        const key = getWeekKey(e.date);
        weeks[key] = (weeks[key] || 0) + e.count;
    });
    return weeks;
}

// Regroupement par mois : YYYY-MM
function groupByMonth(entries) {
    const months = {};

    entries.forEach(e => {
        const d = e.date;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        months[key] = (months[key] || 0) + e.count;
    });

    return months;
}

// ======================================================================
//  4. RENDU DU GRAPHIQUE
// ======================================================================

function renderChart(labels, values, labelText) {
    const ctx = document.getElementById("activityChart").getContext("2d");

    if (activityChart) activityChart.destroy();

    activityChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: labelText,
                data: values,
                backgroundColor: "rgba(0, 102, 204, 0.6)",
                borderColor: "rgba(0, 102, 204, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { ticks: { maxRotation: 45, minRotation: 45 } },
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            }
        }
    });
}

// ======================================================================
//  5. GRAPHIQUES SELON LA PÉRIODE
// ======================================================================

// Graphique quotidien filtré (7, 30, 90 jours, all)
async function updateActivityChartWithRange(days) {
    const entries = await loadActivityHistory();
    const filtered = filterByDays(entries, days);

    const counts = groupByDay(filtered);
    const sortedKeys = Object.keys(counts).sort();

    const labels = sortedKeys.map(key => {
        const d = new Date(key);
        return d.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    });

    const values = sortedKeys.map(k => counts[k]);

    renderChart(labels, values,
        `Articles publiés (${days === "all" ? "total" : days + " jours"})`
    );
}

// Graphique hebdomadaire (optionnel)
async function updateWeeklyChart() {
    const entries = await loadActivityHistory();
    const weeks = groupByWeek(entries);

    const labels = Object.keys(weeks).sort();
    const values = labels.map(k => weeks[k]);

    renderChart(labels, values, "Articles par semaine");
}

// Graphique mensuel (optionnel)
async function updateMonthlyChart() {
    const entries = await loadActivityHistory();
    const months = groupByMonth(entries);

    const labels = Object.keys(months).sort().map(key => {
        const [year, month] = key.split("-");
        return `${month}/${year}`;
    });

    const values = Object.keys(months).sort().map(k => months[k]);

    renderChart(labels, values, "Articles par mois");
}

// ======================================================================
//  6. INITIALISATION
// ======================================================================

document.addEventListener("DOMContentLoaded", () => {
    const select = document.getElementById("activityRange");

    if (select) {
        updateActivityChartWithRange(select.value);

        select.addEventListener("change", () => {
            updateActivityChartWithRange(select.value);
        });
    }
});


//  Mode Semaine / Mois (optionnel)
document.addEventListener("DOMContentLoaded", () => {
    const modeSelect = document.getElementById("activityMode");
    const rangeSelect = document.getElementById("activityRange");

    function refresh() {
        const mode = modeSelect.value;
        const range = rangeSelect.value;

        if (mode === "day") {
            updateActivityChartWithRange(range);
        } else if (mode === "week") {
            updateWeeklyChart();
        } else if (mode === "month") {
            updateMonthlyChart();
        }
    }

    // Initialisation
    refresh();

    // Listeners
    modeSelect.addEventListener("change", refresh);
    rangeSelect.addEventListener("change", refresh);
});