// js/charts/winrate-chart.js
export function renderWinrateChart(canvasId, cardStats, currentChart = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    if (currentChart) currentChart.destroy();
    const ctx = canvas.getContext('2d');
    
    const viewMode = document.getElementById('topCardMode').value;
    const datasets = [];

    // Cột Winrate (Xanh lá)
    if (viewMode === 'winrate' || viewMode === 'both') {
        datasets.push({
            label: 'Tỷ lệ thắng (%)',
            data: cardStats.map(c => parseFloat(c.avgWinrate)),
            backgroundColor: '#10b981',
            borderRadius: 4,
            xAxisID: 'xWinrate' // Chỉ định trục X riêng cho Winrate
        });
    }

    // Cột Lượt dùng (Xanh dương)
    if (viewMode === 'rank' || viewMode === 'both') {
        datasets.push({
            label: 'Số lượt sử dụng',
            data: cardStats.map(c => c.useCount),
            backgroundColor: '#2563eb',
            borderRadius: 4,
            xAxisID: 'xUsage' // Chỉ định trục X riêng cho Usage
        });
    }

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cardStats.map(c => c.name),
            datasets: datasets
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                xWinrate: {
                    type: 'linear',
                    position: 'bottom',
                    beginAtZero: true,
                    max: 100,
                    display: viewMode === 'winrate' || viewMode === 'both',
                    title: { display: true, text: 'Tỷ lệ thắng (%)' }
                },
                xUsage: {
                    type: 'linear',
                    position: 'top', // Đưa trục Usage lên trên để tránh đè nhau
                    beginAtZero: true,
                    display: viewMode === 'rank' || viewMode === 'both',
                    grid: { drawOnChartArea: false }, // Tránh rối mắt bởi nhiều đường lưới
                    title: { display: true, text: 'Số lượt sử dụng' }
                }
            },
            plugins: {
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                legend: { display: true, position: 'top' }
            }
        }
    });
}