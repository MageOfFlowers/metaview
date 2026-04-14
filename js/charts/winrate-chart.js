// js/charts/winrate-chart.js
export function renderWinrateChart(canvasId, cardStats, currentChart = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    if (currentChart) {
        currentChart.destroy();
    }

    const ctx = canvas.getContext('2d');
    
    // Kiểm tra chế độ xem dựa trên dữ liệu thực tế được truyền vào
    // Nếu phần tử đầu tiên có avgWinrate > 0 và đang chọn mode winrate
    const viewMode = document.getElementById('topCardMode').value;
    const isWinrate = viewMode === 'winrate';
    const label = isWinrate ? 'Tỷ lệ thắng (%)' : 'Số lượt sử dụng';

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cardStats.map(c => c.name),
            datasets: [{
                label: label,
                data: cardStats.map(c => isWinrate ? c.avgWinrate : c.useCount),
                backgroundColor: isWinrate ? '#10b981' : '#2563eb', // Xanh lá cho Winrate, Xanh dương cho Rank
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            scales: { 
                x: { 
                    beginAtZero: true,
                    max: isWinrate ? 100 : undefined // Chỉ giới hạn 100 nếu là % winrate
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