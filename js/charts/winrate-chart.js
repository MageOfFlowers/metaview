// js/charts/winrate-chart.js
export function renderWinrateChart(canvasId, cardStats, currentChart = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // HỦY BIỂU ĐỒ CŨ NẾU TỒN TẠI (Quan trọng)
    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = canvas.getContext('2d');

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cardStats.map(c => c.name),
            datasets: [{
                label: 'Giá trị',
                data: cardStats.map(c => {
                    // Tự động lấy Winrate hoặc UseCount tùy vào dữ liệu truyền vào
                    return c.avgWinrate !== undefined ? c.avgWinrate : c.useCount;
                }),
                backgroundColor: '#2563eb'
            }]
        },
        options: {
            indexAxis: 'y',
            scales: { x: { beginAtZero: true } },
            maintainAspectRatio: false,
            responsive: true
        }
    });
}