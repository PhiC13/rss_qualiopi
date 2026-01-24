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
