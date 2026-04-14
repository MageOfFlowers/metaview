// js/charts/winrate-chart.js
export function renderWinrateChart(canvasId, cardStats, currentChart = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    
    // Kiểm tra xem đang hiển thị Winrate hay Usage để đặt label cho đúng
    const isWinrateMode = cardStats.length > 0 && cardStats[0].avgWinrate !== undefined;
    const datasetLabel = isWinrateMode ? 'Tỉ lệ thắng (%)' : 'Số lượt sử dụng';

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cardStats.map(c => c.name),
            datasets: [{
                label: datasetLabel,
                data: cardStats.map(c => isWinrateMode ? c.avgWinrate : c.useCount),
                backgroundColor: '#2563eb',
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            scales: { 
                x: { 
                    beginAtZero: true,
                    // Nếu là winrate thì giới hạn max 100 cho đẹp
                    max: isWinrateMode ? 100 : undefined 
                } 
            },
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: { display: true, position: 'top' }
            }
        }
    });
}