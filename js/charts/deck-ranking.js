import { MetaEngine } from '../meta-engine.js';

export function renderDeckRanking(canvasId, rawData, currentChart = null, limit = 10) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    if (currentChart) currentChart.destroy();

    const ctx = canvas.getContext('2d');
    const { compUses, deckInfos, cards, decks } = rawData;

    // 1. Tính toán thống kê
    const deckStats = {};
    compUses.forEach(use => {
        // Chỉ tính toán nếu Deck này tồn tại trong danh sách đã lọc (rawData.decks)
        const isMatch = decks.some(d => d.id == use.deckid);
        if (!isMatch) return;

        if (!deckStats[use.deckid]) {
            deckStats[use.deckid] = { id: use.deckid, totalWin: 0, count: 0, totalRank: 0 };
        }
        deckStats[use.deckid].totalWin += use.winrate;
        deckStats[use.deckid].totalRank += (use.rank || 99);
        deckStats[use.deckid].count++;
    });

    // 2. Sắp xếp lại thứ tự và giới hạn hiển thị
    const sortedDecks = Object.values(deckStats)
        .map(d => {
            const deckInfo = decks.find(item => item.id == d.id);
            return {
                ...d,
                displayName: deckInfo ? deckInfo.name : `Deck #${d.id}`,
                avgRank: parseFloat((d.totalRank / d.count).toFixed(1)),
                avgWin: (d.totalWin / d.count).toFixed(1),
                composition: deckInfos.filter(di => di.deckid === d.id)
            };
        })
        // CẬP NHẬT THỨ TỰ: Rank nhỏ lên trước (hạng cao)
        .sort((a, b) => a.avgRank - b.avgRank || b.avgWin - a.avgWin)
        // GIỚI HẠN HIỂN THỊ
        .slice(0, limit);
    const datasets = allCardIds.map(cid => {
        const cardInfo = cards.find(c => c.id == cid);
        return {
            label: cardInfo ? cardInfo.name : `Card ${cid}`,
            data: sortedDecks.map(d => {
                const item = d.composition.find(c => c.cardid == cid);
                return item ? item.quantity : 0;
            }),
            backgroundColor: MetaEngine.getColorCode(cardInfo ? cardInfo.color : 'G'),
            cardUrl: cardInfo ? cardInfo.url : ''
        };
    });

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedDecks.map(d => `${d.displayName} (Avg Rank: ${d.avgRank})`),
            datasets: datasets
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, title: { display: true, text: 'Số lượng Card trong Deck' } },
                y: { stacked: true }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.dataset.label}: ${context.raw} bản`;
                        }
                    }
                },
                legend: { display: false }
            }
        }
    });
}