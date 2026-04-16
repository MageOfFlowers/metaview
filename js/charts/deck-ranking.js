import { MetaEngine } from '../meta-engine.js';

export function renderDeckRanking(canvasId, rawData, filteredUses, currentChart = null, limit = 10) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !filteredUses) return null;
    if (currentChart) currentChart.destroy();

    const ctx = canvas.getContext('2d');
    const { deckInfos, cards, decks } = rawData;
    const viewMode = document.getElementById('deckSortMode')?.value || 'usage';
    const cardMap = new Map(cards.map(c => [c.id, c]));
    const deckMap = new Map(decks.map(d => [String(d.id), d]));

    // 1. Gom nhóm dữ liệu
    const deckStatsMap = {};
    filteredUses.forEach(use => {
        const dId = String(use.deckid);
        if (!deckMap.has(dId)) return;
        if (!deckStatsMap[dId]) {
            deckStatsMap[dId] = { id: use.deckid, totalWin: 0, count: 0, totalRank: 0 };
        }
        deckStatsMap[dId].totalWin += parseFloat(use.winrate || 0);
        deckStatsMap[dId].totalRank += parseInt(use.rank || 99);
        deckStatsMap[dId].count++;
    });

    // 2. Tính toán chỉ số và xác định màu chủ đạo
    const processedDecks = Object.values(deckStatsMap).map(stats => {
        const deck = deckMap.get(String(stats.id));
        const composition = deckInfos.filter(di => di.deckid == stats.id);
        
        // Tìm màu chiếm tỷ lệ lớn nhất
        const colorCounts = {};
        composition.forEach(item => {
            const card = cardMap.get(item.cardid);
            const cCode = card ? card.color : 'G';
            colorCounts[cCode] = (colorCounts[cCode] || 0) + item.quantity;
        });
        const dominantColor = Object.keys(colorCounts).reduce((a, b) => colorCounts[a] > colorCounts[b] ? a : b, 'G');

        return {
            ...stats,
            displayName: deck ? deck.name : `Deck #${stats.id}`,
            avgWinrate: (stats.totalWin / stats.count).toFixed(1),
            avgRank: (stats.totalRank / stats.count).toFixed(1),
            mainColor: MetaEngine.getColorCode(dominantColor),
            composition: composition.map(ci => ({
                ...ci,
                name: cardMap.get(ci.cardid)?.name || 'Unknown'
            }))
        };
    });

    // 3. Sắp xếp theo Filter
    if (viewMode === 'winrate') processedDecks.sort((a, b) => b.avgWinrate - a.avgWinrate);
    else if (viewMode === 'rank') processedDecks.sort((a, b) => a.avgRank - b.avgRank);
    else processedDecks.sort((a, b) => b.count - a.count);

    const finalDecks = processedDecks.slice(0, limit);

    // 4. Khởi tạo Chart
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: finalDecks.map(d => d.displayName),
            datasets: [{
                label: 'Chỉ số',
                data: finalDecks.map(d => {
                    if (viewMode === 'winrate') return d.avgWinrate;
                    if (viewMode === 'rank') return d.avgRank;
                    return d.count;
                }),
                backgroundColor: finalDecks.map(d => d.mainColor), // Màu theo thẻ chính
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => {
                            const d = finalDecks[items[0].dataIndex];
                            return `${d.displayName} (${viewMode}: ${items[0].raw})`;
                        },
                        label: (item) => {
                            const d = finalDecks[item.dataIndex];
                            // Hiển thị cấu trúc bộ bài trong tooltip
                            let lines = ['Cấu trúc bộ bài:'];
                            d.composition.slice(0, 10).forEach(c => {
                                lines.push(`• ${c.name} x${c.quantity}`);
                            });
                            if (d.composition.length > 10) lines.push('...');
                            return lines;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    reverse: viewMode === 'rank', // Hạng 1 nằm trên cùng
                    title: { display: true, text: viewMode.toUpperCase() }
                }
            }
        }
    });
}