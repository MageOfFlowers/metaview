import { MetaEngine } from '../meta-engine.js';

export function renderDeckRanking(canvasId, rawData, currentChart = null) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (currentChart) currentChart.destroy();

    const { compUses, deckInfos, cards, decks } = rawData;

    // 1. Tính toán Thống kê cho từng Deck
    const deckStats = {};
    compUses.forEach(use => {
        if (!deckStats[use.deckid]) {
            deckStats[use.deckid] = { 
                id: use.deckid, 
                totalWin: 0, 
                count: 0, 
                totalRank: 0 
            };
        }
        deckStats[use.deckid].totalWin += use.winrate;
        deckStats[use.deckid].totalRank += (use.rank || 99); // Nếu không có rank thì mặc định là thấp
        deckStats[use.deckid].count++;
    });

    // 2. Xử lý danh sách và Sắp xếp theo Rank (Rank thấp là hạng cao)
    const sortedDecks = Object.values(deckStats)
        .map(d => {
            const avgRank = (d.totalRank / d.count).toFixed(1);
            const avgWin = (d.totalWin / d.count).toFixed(1);
            
            // Tìm tên Deck trong danh sách decks, nếu không có mới dùng ID
            const deckInfo = decks ? decks.find(item => item.id == d.id) : null;
            const displayName = (deckInfo && deckInfo.name) ? deckInfo.name : `Deck #${d.id}`;
            
            return {
                ...d,
                displayName,
                avgRank: parseFloat(avgRank),
                avgWin,
                composition: deckInfos.filter(di => di.deckid === d.id)
            };
        })
        // Sắp xếp: Ưu tiên Rank nhỏ (1, 2, 3...), sau đó đến Winrate cao
        .sort((a, b) => a.avgRank - b.avgRank || b.avgWin - a.avgWin)
        .slice(0, 10); // Lấy Top 10 Deck xuất sắc nhất

    // 3. Chuẩn bị dữ liệu cho Stacked Bar Chart
    const allCardIds = [...new Set(sortedDecks.flatMap(d => d.composition.map(c => c.cardid)))];
    
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