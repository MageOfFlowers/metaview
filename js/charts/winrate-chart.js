// js/charts/winrate-chart.js
export function renderWinrateChart(canvasId, cardStats, currentChart = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    const viewMode = document.getElementById('topCardMode').value; // 'winrate', 'rank', hoặc 'both'

    const datasets = [];

    // Cấu hình cột Winrate
    if (viewMode === 'winrate' || viewMode === 'both') {
        datasets.push({
            label: 'Tỷ lệ thắng (%)',
            data: cardStats.map(c => parseFloat(c.avgWinrate)),
            backgroundColor: '#10b981',
            borderRadius: 4,
            yAxisID: 'y' // Trục tọa độ mặc định
        });
    }

    // Cấu hình cột Số lượt dùng (Rank)
    if (viewMode === 'rank' || viewMode === 'both') {
        datasets.push({
            label: 'Số lượt sử dụng',
            data: cardStats.map(c => c.useCount),
            backgroundColor: '#2563eb',
            borderRadius: 4,
            yAxisID: viewMode === 'both' ? 'y1' : 'y' // Dùng trục phụ nếu hiển thị cả hai
        });
    }

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cardStats.map(c => c.name),
            datasets: datasets
        },
        options: {
            indexAxis: 'y', // Biểu đồ ngang
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                },
                y1: {
                    display: viewMode === 'both',
                    position: 'right',
                    grid: { drawOnChartArea: false }, // Không vẽ lưới chồng lên nhau
                    beginAtZero: true
                },
                x: {
                    beginAtZero: true,
                    max: (viewMode === 'winrate') ? 100 : undefined
                }
            },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: { mode: 'index', intersect: false }
            }
        }
    });
}