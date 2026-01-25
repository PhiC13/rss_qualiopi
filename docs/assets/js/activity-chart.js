// ------------------------------------------------------------
//  activity-chart.js
//  Met à jour le graphique d'activité à partir d'une liste de dates
// ------------------------------------------------------------

let activityChart = null;

function updateActivityChart(dates) {
    if (!dates || dates.length === 0) return;

    // Regrouper les dates par jour
    const counts = {};
    dates.forEach(d => {
        if (isNaN(d)) return;
        const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
        counts[key] = (counts[key] || 0) + 1;
    });

    // Trier les dates
    const sortedKeys = Object.keys(counts).sort();

    const labels = sortedKeys;
    const values = sortedKeys.map(k => counts[k]);

    const ctx = document.getElementById("activityChart").getContext("2d");

    // Détruire l'ancien graphique si nécessaire
    if (activityChart) {
        activityChart.destroy();
    }

    // Nouveau graphique
    activityChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Articles publiés",
                data: values,
                backgroundColor: "rgba(0, 102, 204, 0.6)",
                borderColor: "rgba(0, 102, 204, 1)",
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: { maxRotation: 45, minRotation: 45 }
                },
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });
}
