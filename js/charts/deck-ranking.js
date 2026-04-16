import { MetaEngine } from '../meta-engine.js';

export function renderDeckRanking(canvasId, rawData, filteredUses, currentChart = null, limit = 10) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !filteredUses) return null;
    if (currentChart) currentChart.destroy();

    const ctx = canvas.getContext('2d');
    const { deckInfos, cards, decks } = rawData;

    const deckStatsMap = {};
    const deckMap = new Map(decks.map(d => [String(d.id), d]));

    // Sử dụng filteredUses thay vì rawData.compUses
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
            const composition = deckInfos.filter(di => di.deckid === stats.id);
            return {
                ...stats,
                displayName: deck ? deck.name : `Deck #${stats.id}`,
                avgWinrate: (stats.totalWin / stats.count).toFixed(1),
                avgRank: (stats.totalRank / stats.count).toFixed(1),
                composition: composition
            };
        })
        .sort((a, b) => b.count - a.count || b.avgWinrate - a.avgWinrate)
        .slice(0, limit);

    const uniqueCardIds = [...new Set(sortedDecks.flatMap(d => d.composition.map(c => c.cardid)))];
    const cardMap = new Map(cards.map(c => [c.id, c]));

    const datasets = uniqueCardIds.map(cid => {
        const cardInfo = cardMap.get(cid);
        return {
            label: cardInfo ? cardInfo.name : `Card ${cid}`,
            data: sortedDecks.map(d => {
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
            labels: sortedDecks.map(d => `${d.displayName} (Avg Rank: ${d.avgRank})`),
            datasets: datasets
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { stacked: true }, y: { stacked: true } },
            plugins: { legend: { display: false } }
        }
    });
}