// js/charts/winrate-chart.js
export function renderWinrateChart(canvasId, cardStats) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const topWin = [...cardStats]
        .filter(c => c.useCount > 0)
        .sort((a, b) => b.avgWinrate - a.avgWinrate)
        .slice(0, 10);

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topWin.map(c => c.name),
            datasets: [{
                label: 'Winrate (%)',
                data: topWin.map(c => c.avgWinrate),
                backgroundColor: '#2563eb' // Màu xanh cố định cho card
            }]
        },
        options: {
            indexAxis: 'y',
            scales: { x: { beginAtZero: true, max: 100 } },
            maintainAspectRatio: false
        }
    });
}