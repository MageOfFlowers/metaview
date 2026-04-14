export const MetaEngine = {
    RARITY_ORDER: { 'SCR': 1, 'EX': 2, '5S': 3, 'UR': 4, 'SR': 5, 'R': 6, 'U': 7, 'C': 8 },

    getColorCode(s) {
        const map = { 'R': '#ef4444', 'P': '#a855f7', 'Y': '#eab308', 'G': '#22c55e' };
        return map[s] || '#64748b';
    },

    getRarityColor(r) {
        const colors = { 
            'SCR': '#ff00ff', 'EX': '#00ffff', '5S': '#ffd700', 
            'UR': '#f59e0b', 'SR': '#a855f7', 'R': '#2563eb', 'U': '#22c55e', 'C': '#94a3b8' 
        };
        return colors[r] || '#ccc';
    },

    calculateStats(rawData, filters = {}) {
    let { compUses, deckInfos, cards, competitions } = rawData; // Thêm competitions vào đầu vào
    const { compId, startDate, endDate, mode = 'deck', region = 'all' } = filters;

    // 1. Xác định danh sách các ID giải đấu thuộc Region đã chọn
    let validCompIds = [];
    if (region !== 'all' && competitions) {
        validCompIds = competitions
            .filter(c => c.region === region)
            .map(c => c.id);
    }

    let filteredUses = compUses.filter(use => {
        const matchComp = compId === 'all' || use.competitionid == compId;
        
        // Lọc theo Region: Nếu không chọn 'all', chỉ lấy những 'use' thuộc giải đấu hợp lệ
        const matchRegion = region === 'all' || validCompIds.includes(use.competitionid);

        const useDate = new Date(use.createdAt);
        const matchDate = (!startDate || useDate >= new Date(startDate)) && 
                          (!endDate || useDate <= new Date(endDate));
        
        return matchComp && matchRegion && matchDate;
    });

        const cardStats = {};
        const colorStats = { 'R': 0, 'P': 0, 'Y': 0, 'G': 0 };
        const rarityStats = {};

        cards.forEach(c => cardStats[c.id] = { ...c, useCount: 0, totalWin: 0 });

        filteredUses.forEach(use => {
            const cardsInDeck = deckInfos.filter(di => di.deckid === use.deckid);
            cardsInDeck.forEach(item => {
                const card = cardStats[item.cardid];
                if (card) {
                    const count = mode === 'total' ? item.quantity : 1;
                    card.useCount += count;
                    card.totalWin += (use.winrate * count);
                    if (colorStats[card.color] !== undefined) colorStats[card.color] += count;
                    if (card.rarity) rarityStats[card.rarity] = (rarityStats[card.rarity] || 0) + count;
                }
            });
        });

        return { 
            cards: Object.values(cardStats).map(c => ({
                ...c,
                avgWinrate: c.useCount > 0 ? (c.totalWin / c.useCount).toFixed(1) : 0
            })).sort((a, b) => b.useCount - a.useCount),
            colors: colorStats,
            rarities: rarityStats
        };
    },

    calculateQuantityStats(rawData, cardId) {
        const { compUses, deckInfos } = rawData;
        const statsByQty = { 1: { win: 0, count: 0 }, 2: { win: 0, count: 0 }, 3: { win: 0, count: 0 }, 4: { win: 0, count: 0 } };
        compUses.forEach(use => {
            const cardInDeck = deckInfos.find(di => di.deckid === use.deckid && di.cardid == cardId);
            if (cardInDeck) {
                const qty = cardInDeck.quantity;
                if (statsByQty[qty]) { statsByQty[qty].count++; statsByQty[qty].win += use.winrate; }
            }
        });
        return Object.keys(statsByQty).map(qty => ({
            quantity: qty,
            count: statsByQty[qty].count,
            avgWinrate: statsByQty[qty].count > 0 ? (statsByQty[qty].win / statsByQty[qty].count).toFixed(1) : 0
        }));
    }
};