// js/charts/winrate-chart.js
export function renderWinrateChart(canvasId, cardStats, currentChart = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    const viewMode = document.getElementById('topCardMode').value; // 'winrate' hoặc 'rank'
    
    // Thiết lập cấu hình theo chế độ
    const isWinrate = viewMode === 'winrate';
    const label = isWinrate ? 'Tỷ lệ thắng (%)' : 'Số lượt sử dụng';
    const color = isWinrate ? '#10b981' : '#2563eb'; // Xanh lá cho Winrate, Xanh dương cho Rank

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cardStats.map(c => c.name),
            datasets: [{
                label: label,
                data: cardStats.map(c => isWinrate ? parseFloat(c.avgWinrate) : c.useCount),
                backgroundColor: color,
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            scales: { 
                x: { 
                    beginAtZero: true,
                    max: isWinrate ? 100 : undefined 
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