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
            borderColor: '#059669',
            borderWidth: 1,
            borderRadius: 4,
            categoryPercentage: 0.8, // Điều chỉnh độ rộng nhóm
            barPercentage: 0.9      // Điều chỉnh độ rộng cột trong nhóm
        });
    }

    // Cột Lượt dùng (Xanh dương)
    if (viewMode === 'rank' || viewMode === 'both') {
        datasets.push({
            label: 'Số lượt sử dụng',
            data: cardStats.map(c => c.useCount),
            backgroundColor: '#2563eb',
            borderColor: '#1d4ed8',
            borderWidth: 1,
            borderRadius: 4,
            categoryPercentage: 0.8,
            barPercentage: 0.9
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
                x: {
                    beginAtZero: true,
                    // Nếu ở mode 'both', không giới hạn max để cột Usage có thể dài hơn 100
                    max: viewMode === 'winrate' ? 100 : undefined,
                    title: { display: true, text: 'Giá trị' }
                },
                y: {
                    ticks: { autoSkip: false } // Đảm bảo hiện đủ tên card
                }
            },
            plugins: {
                legend: { display: true, position: 'top' },
                tooltip: {
                    mode: 'index', // Hiện cả 2 giá trị khi di chuột vào một card
                    intersect: false
                }
            }
        }
    });
}