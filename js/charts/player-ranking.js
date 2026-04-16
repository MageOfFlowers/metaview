import { MetaEngine } from '../meta-engine.js';

export function renderPlayerRanking(canvasId, filteredUses, rawData, currentChart = null) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    if (currentChart) currentChart.destroy();

    const ctx = canvas.getContext('2d');
    const viewMode = document.getElementById('playerSortMode')?.value || 'winrate';
    
    // Tính toán dữ liệu người chơi từ MetaEngine
    const players = MetaEngine.calculatePlayerStats(filteredUses, rawData.users, rawData.deckInfos, rawData.decks, rawData.competitions);

    // Sắp xếp theo chế độ xem
    if (viewMode === 'winrate') {
        players.sort((a, b) => b.avgWinrate - a.avgWinrate);
    } else {
        players.sort((a, b) => a.avgRank - b.avgRank);
    }

    const topPlayers = players.slice(0, 10);

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topPlayers.map(p => p.name),
            datasets: [{
                label: viewMode === 'winrate' ? 'Winrate (%)' : 'Hạng trung bình',
                data: topPlayers.map(p => viewMode === 'winrate' ? p.avgWinrate : p.avgRank),
                backgroundColor: viewMode === 'winrate' ? '#10b981' : '#f59e0b',
                borderRadius: 5
            }]
        },
        options: {
            indexAxis: 'y',
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    enabled: true,
                    callbacks: {
                        label: (context) => {
                            const p = topPlayers[context.dataIndex];
                            return viewMode === 'winrate' ? ` Winrate: ${p.avgWinrate}%` : ` Hạng TB: ${p.avgRank}`;
                        },
                        afterLabel: (context) => {
                            const p = topPlayers[context.dataIndex];
                            let lines = ['\nCác bộ bài đã dùng:'];
                            p.deckDetails.slice(0, 3).forEach(d => {
                                lines.push(`- ${d.name}: WR ${d.winrate}% (Hạng ${d.bestRank} tại ${d.compName})`);
                            });
                            if (p.deckDetails.length > 3) lines.push('...');
                            return lines;
                        }
                    }
                }
            },
            scales: {
                x: { reverse: viewMode === 'rank', beginAtZero: true }
            }
        }
    });
}