// js/meta-engine.js
export const MetaEngine = {
    // Tính toán thống kê tổng hợp
    calculateStats(rawData, filters = {}) {
        let { compUses, deckInfos, cards } = rawData;
        const { compId, startDate, endDate } = filters;

        // 1. Lọc theo Giải và Thời gian
        let filteredUses = compUses.filter(use => {
            const matchComp = compId === 'all' || use.competitionid == compId;
            const useDate = new Date(use.createdAt || Date.now()); // Giả định có field createdAt
            const matchDate = (!startDate || useDate >= new Date(startDate)) && 
                              (!endDate || useDate <= new Date(endDate));
            return matchComp && matchDate;
        });

        const cardStats = {};
        const colorStats = { 'R': { win: 0, count: 0 }, 'P': { win: 0, count: 0 }, 'Y': { win: 0, count: 0 }, 'G': { win: 0, count: 0 } };
        
        cards.forEach(c => cardStats[c.id] = { ...c, useCount: 0, totalWin: 0 });

        filteredUses.forEach(use => {
            const cardsInDeck = deckInfos.filter(di => di.deckid === use.deckid);
            cardsInDeck.forEach(item => {
                if (cardStats[item.cardid]) {
                    cardStats[item.cardid].useCount++;
                    cardStats[item.cardid].totalWin += use.winrate;
                    
                    // Thống kê màu
                    const color = cardStats[item.cardid].color;
                    if(colorStats[color]) {
                        colorStats[color].count++;
                        colorStats[color].win += use.winrate;
                    }
                }
            });
        });

        const finalCards = Object.values(cardStats).map(c => ({
            ...c,
            avgWinrate: c.useCount > 0 ? (c.totalWin / c.useCount).toFixed(1) : 0
        })).sort((a, b) => b.useCount - a.useCount);

        return { cards: finalCards, colors: colorStats, usesCount: filteredUses.length };
    },

    calculateQuantityStats(rawData, cardId) {
        const { compUses, deckInfos } = rawData;
        const statsByQty = {
            1: { win: 0, count: 0 },
            2: { win: 0, count: 0 },
            3: { win: 0, count: 0 },
            4: { win: 0, count: 0 }
        };

        // Lọc các bộ bài có chứa lá bài cardId này
        compUses.forEach(use => {
            const cardInDeck = deckInfos.find(di => di.deckid === use.deckid && di.cardid == cardId);
            if (cardInDeck) {
                const qty = cardInDeck.quantity;
                if (statsByQty[qty]) {
                    statsByQty[qty].count++;
                    statsByQty[qty].win += use.winrate;
                }
            }
        });

        return Object.keys(statsByQty).map(qty => ({
            quantity: qty,
            count: statsByQty[qty].count,
            avgWinrate: statsByQty[qty].count > 0 ? (statsByQty[qty].win / statsByQty[qty].count).toFixed(1) : 0
        }));
    },

    getColorCode(s) {
        const map = { 'R': '#ef4444', 'P': '#a855f7', 'Y': '#eab308', 'G': '#22c55e' };
        return map[s] || '#64748b';
    }
};