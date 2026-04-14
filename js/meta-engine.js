// js/meta-engine.js
export const MetaEngine = {
    // Tính toán thống kê tổng hợp
    calculateStats(rawData, filters = {}) {
        let { compUses, deckInfos, cards } = rawData;
        const { compId, startDate, endDate, mode = 'deck' } = filters; // mode: 'deck' hoặc 'total'

        let filteredUses = compUses.filter(use => {
            const matchComp = compId === 'all' || use.competitionid == compId;
            const useDate = new Date(use.createdAt || Date.now());
            const matchDate = (!startDate || useDate >= new Date(startDate)) && 
                              (!endDate || useDate <= new Date(endDate));
            return matchComp && matchDate;
        });

        const cardStats = {};
        // Rarity stats thay vì Color stats
        const rarityStats = { 'C': 0, 'U': 0, 'R': 0, 'SR': 0, 'UR': 0 };
        
        cards.forEach(c => cardStats[c.id] = { ...c, useCount: 0, totalWin: 0 });

        filteredUses.forEach(use => {
            const cardsInDeck = deckInfos.filter(di => di.deckid === use.deckid);
            cardsInDeck.forEach(item => {
                if (cardStats[item.cardid]) {
                    // Chế độ 'total': cộng dồn số lượng card (quantity)
                    // Chế độ 'deck': chỉ cộng 1 (số lượng deck có mặt)
                    const countToAdd = mode === 'total' ? item.quantity : 1;
                    
                    cardStats[item.cardid].useCount += countToAdd;
                    cardStats[item.cardid].totalWin += (use.winrate * (mode === 'total' ? item.quantity : 1));
                    
                    if (rarityStats[cardStats[item.cardid].rarity] !== undefined) {
                        rarityStats[cardStats[item.cardid].rarity] += countToAdd;
                    }
                }
            });
        });

        const finalCards = Object.values(cardStats).map(c => ({
            ...c,
            avgWinrate: c.useCount > 0 ? (c.totalWin / c.useCount).toFixed(1) : 0
        })).sort((a, b) => b.useCount - a.useCount);

        return { cards: finalCards, rarities: rarityStats, usesCount: filteredUses.length };
    },
    
    // Hàm hỗ trợ lấy màu theo độ hiếm
    getRarityColor(rarity) {
        const colors = { 'C': '#94a3b8', 'U': '#22c55e', 'R': '#2563eb', 'SR': '#a855f7', 'UR': '#f59e0b' };
        return colors[rarity] || '#ccc';
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