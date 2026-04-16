export function renderDeckRanking(canvasId, rawData, filteredUses, currentChart = null, limit = 10) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !filteredUses) return null;
    if (currentChart) currentChart.destroy();

    const ctx = canvas.getContext('2d');
    const { deckInfos, cards, decks } = rawData;
    
    // Đọc chế độ sắp xếp từ UI
    const viewMode = document.getElementById('deckSortMode')?.value || 'usage';

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

    const sortedDecks = Object.values(deckStatsMap)
        .map(stats => {
            const deck = deckMap.get(String(stats.id));
            const composition = deckInfos.filter(di => di.deckid == stats.id);
            return {
                ...stats,
                displayName: deck ? deck.name : `Deck #${stats.id}`,
                avgWinrate: (stats.totalWin / stats.count).toFixed(1),
                avgRank: (stats.totalRank / stats.count).toFixed(1),
                composition: composition
            };
        });

    // --- LOGIC SẮP XẾP MỚI ---
    if (viewMode === 'winrate') {
        sortedDecks.sort((a, b) => b.avgWinrate - a.avgWinrate);
    } else if (viewMode === 'rank') {
        sortedDecks.sort((a, b) => a.avgRank - b.avgRank);
    } else {
        sortedDecks.sort((a, b) => b.count - a.count);
    }

    const finalDecks = sortedDecks.slice(0, limit);
    // -------------------------

    const uniqueCardIds = [...new Set(finalDecks.flatMap(d => d.composition.map(c => c.cardid)))];
    const cardMap = new Map(cards.map(c => [c.id, c]));

    const datasets = uniqueCardIds.map(cid => {
        const cardInfo = cardMap.get(cid);
        return {
            label: cardInfo ? cardInfo.name : `Card ${cid}`,
            data: finalDecks.map(d => {
                const item = d.composition.find(c => c.cardid == cid);
                return item ? item.quantity : 0;
            }),
            backgroundColor: MetaEngine.getColorCode(cardInfo ? cardInfo.color : 'G'),
            stack: 'Stack 0'
        };
    });

    return new Chart(ctx, {
        type: 'bar',
        data: {
            // Hiển thị thông số tương ứng lên nhãn
            labels: finalDecks.map(d => `${d.displayName} (${viewMode === 'rank' ? 'Hạng ' + d.avgRank : d.avgWinrate + '%'})`),
            datasets: datasets
        },
        options: {
            plugins: {
                title: { display: true, text: `Top 10 Bộ bài theo ${viewMode}` },
                legend: { display: false }
            },
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true },
                y: { stacked: true, title: { display: true, text: 'Số lượng card' } }
            }
        }
    });
}