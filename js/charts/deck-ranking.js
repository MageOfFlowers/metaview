import { MetaEngine } from '../meta-engine.js';

export function renderDeckRanking(canvasId, rawData, currentChart = null, limit = 10) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !filteredUses) return null; // Kiểm tra an toàn
    if (currentChart) currentChart.destroy();

    const ctx = canvas.getContext('2d');
    const { deckInfos, cards, decks } = rawData;

    // Tính toán thống kê Deck dựa trên filteredUses
    const deckStatsMap = {};
    const deckMap = new Map(decks.map(d => [String(d.id), d]));

    filteredUses.forEach(use => {
        const deckIdStr = String(use.deckid);
        if (!deckMap.has(deckIdStr)) return;

        if (!deckStatsMap[deckIdStr]) {
            deckStatsMap[deckIdStr] = { id: use.deckid, totalWin: 0, count: 0, totalRank: 0 };
        }
        deckStatsMap[deckIdStr].totalWin += parseFloat(use.winrate || 0);
        deckStatsMap[deckIdStr].totalRank += parseInt(use.rank || 99);
        deckStatsMap[deckIdStr].count++;
    });

    // Sắp xếp và lấy Top
    const sortedDecks = Object.values(deckStatsMap)
        .map(d => {
            const deckInfo = deckMap.get(String(d.id));
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

    // Lấy danh sách duy nhất các Card IDs xuất hiện trong các Top Deck này để tạo Dataset
    const allCardIdsInTop = [...new Set(sortedDecks.flatMap(d => d.composition.map(c => c.cardid)))];
    const cardInfoMap = new Map(cards.map(c => [c.id, c]));

    const datasets = allCardIdsInTop.map(cid => {
        const cardInfo = cardInfoMap.get(cid);
        return {
            label: cardInfo ? cardInfo.name : `Card ${cid}`,
            data: sortedDecks.map(d => {
                const item = d.composition.find(c => c.cardid == cid);
                return item ? item.quantity : 0;
            }),
            backgroundColor: MetaEngine.getColorCode(cardInfo ? cardInfo.color : 'G'),
            borderWidth: 1,
            borderColor: '#ffffff'
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
                x: { 
                    stacked: true, // Xếp chồng
                    title: { display: true, text: 'Số lượng Card trong Deck' } 
                },
                y: { 
                    stacked: true // Xếp chồng
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return ` ${context.dataset.label}: ${context.raw} bản`;
                        }
                    }
                },
                // QUAN TRỌNG: Ẩn phần chú thích liệt kê tên thẻ bài ở trên
                legend: { display: false }
            }
        }
    });
}