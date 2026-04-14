import { MetaEngine } from '../meta-engine.js';

export function renderDeckRanking(canvasId, rawData, currentChart = null, limit = 10) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    if (currentChart) currentChart.destroy();

    const ctx = canvas.getContext('2d');
    
    // Đảm bảo các thuộc tính tồn tại, nếu không có thì gán mảng rỗng
    const compUses = rawData.compUses || [];
    const deckInfos = rawData.deckInfos || [];
    const cards = rawData.cards || [];
    const decks = rawData.decks || []; // Lỗi xảy ra tại đây nếu decks không phải Array

    const deckStats = {};
    compUses.forEach(use => {
        // Kiểm tra an toàn: chỉ chạy .some nếu decks là mảng
        const isMatch = Array.isArray(decks) && decks.some(d => d.id == use.deckid);
        if (!isMatch) return;

        if (!deckStats[use.deckid]) {
            deckStats[use.deckid] = { id: use.deckid, totalWin: 0, count: 0, totalRank: 0 };
        }
        deckStats[use.deckid].totalWin += use.winrate;
        deckStats[use.deckid].totalRank += (use.rank || 99);
        deckStats[use.deckid].count++;
    });

    // Sắp xếp và giới hạn
    const sortedDecks = Object.values(deckStats)
        .map(d => {
            const deckInfo = Array.isArray(decks) ? decks.find(item => item.id == d.id) : null;
            return {
                ...d,
                displayName: deckInfo ? deckInfo.name : `Deck #${d.id}`,
                avgRank: parseFloat((d.totalRank / d.count).toFixed(1)),
                avgWin: parseFloat((d.totalWin / d.count).toFixed(1)),
                composition: deckInfos.filter(di => di.deckid === d.id)
            };
        })
        .sort((a, b) => a.avgRank - b.avgRank)
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