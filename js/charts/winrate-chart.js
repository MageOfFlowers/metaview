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
                // Lưu URL vào dataset để dùng cho tooltip
                imageUrls: cardStats.map(c => c.url || 'placeholder.jpg'), 
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        // Hiển thị thêm hướng dẫn hoặc giữ nguyên label
                        label: (context) => `${context.dataset.label}: ${context.raw}`,
                        // Tạo hiệu ứng hiển thị ảnh (logic xử lý ảnh sẽ nằm ở phần chung phía dưới)
                        afterBody: (context) => {
                            const url = context[0].dataset.imageUrls[context[0].dataIndex];
                            return `URL: ${url}`; 
                        }
                    }
                }
            }
        }
    });
}