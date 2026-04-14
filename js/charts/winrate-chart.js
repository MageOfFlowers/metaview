// js/charts/winrate-chart.js
export function renderWinrateChart(canvasId, cardStats, currentChart = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    if (currentChart) currentChart.destroy();
    const ctx = canvas.getContext('2d');
    
    const viewMode = document.getElementById('topCardMode').value;
    const isWinrate = viewMode === 'winrate';

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cardStats.map(c => c.name),
            datasets: [{
                label: isWinrate ? 'Tỷ lệ thắng (%)' : 'Số lượt sử dụng',
                data: cardStats.map(c => isWinrate ? parseFloat(c.avgWinrate) : c.useCount),
                backgroundColor: isWinrate ? '#10b981' : '#2563eb',
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                x: {
                    beginAtZero: true,
                    max: isWinrate ? 100 : undefined
                }
            },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { enabled: true } // Sử dụng tooltip mặc định
            }
        }
    });
}