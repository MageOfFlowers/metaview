export const MetaEngine = {
    RARITY_ORDER: { 'SCR': 1, 'EX': 2, 'UR': 3, 'SR': 4, 'R': 5, 'U': 6, 'C': 7 },
    
    getRarityColor(r) {
        const colors = {
            'SCR': '#f43f5e', 'EX': '#fb923c', 'UR': '#fbbf24', 
            'SR': '#a855f7', 'R': '#3b82f6', 'U': '#94a3b8', 'C': '#cbd5e1'
        };
        return colors[r] || '#64748b';
    },

    // meta-engine.js - Cập nhật hàm calculateStats
calculateStats(rawData, filters = {}) {
    let { compUses, deckInfos, cards } = rawData;
    const { compId, startDate, endDate, mode = 'deck' } = filters;

    let filteredUses = compUses.filter(use => {
        const matchComp = compId === 'all' || use.competitionid == compId;
        const useDate = new Date(use.createdAt);
        const matchDate = (!startDate || useDate >= new Date(startDate)) && 
                          (!endDate || useDate <= new Date(endDate));
        return matchComp && matchDate;
    });

    const cardStats = {};
    // Đảm bảo các hệ màu cơ bản luôn xuất hiện để Object.keys không lỗi
    const colorStats = { 'R': 0, 'P': 0, 'Y': 0, 'G': 0 };
    const rarityStats = { 'SCR': 0, 'EX': 0, 'UR': 0, 'SR': 0, 'R': 0, 'U': 0, 'C': 0 };

    cards.forEach(c => cardStats[c.id] = { ...c, useCount: 0, totalWin: 0 });

    filteredUses.forEach(use => {
        const cardsInDeck = deckInfos.filter(di => di.deckid === use.deckid);
        cardsInDeck.forEach(item => {
            const card = cardStats[item.cardid];
            if (card) {
                const count = (mode === 'total') ? (item.quantity || 0) : 1;
                card.useCount += count;
                card.totalWin += (parseFloat(use.winrate || 0) * count);
                
                // Kiểm tra an toàn trước khi cộng dồn
                if (card.color && colorStats.hasOwnProperty(card.color)) {
                    colorStats[card.color] += count;
                }
                if (card.rarity && rarityStats.hasOwnProperty(card.rarity)) {
                    rarityStats[card.rarity] += count;
                }
            }
        });
    });

    return { 
        cards: Object.values(cardStats).map(c => ({
            ...c,
            avgWinrate: c.useCount > 0 ? (c.totalWin / c.useCount).toFixed(1) : 0
        })),
        colors: colorStats,    
        rarities: rarityStats, 
        filteredUses: filteredUses 
    };
},

    calculatePlayerStats(filteredUses) {
        if (!filteredUses || filteredUses.length === 0) return [];
        
        const playerStats = {};
        filteredUses.forEach(use => {
            // Đọc trực tiếp từ key 'username' như bạn đã xác nhận
            const pName = use.username || "Người chơi ẩn danh";
            
            if (!playerStats[pName]) {
                playerStats[pName] = { 
                    name: pName, 
                    winSum: 0, 
                    count: 0, 
                    decks: new Set(), 
                    bestRank: 999 
                };
            }
            playerStats[pName].winSum += parseFloat(use.winrate || 0);
            playerStats[pName].count++;
            playerStats[pName].decks.add(use.deckid);
            
            const currentRank = parseInt(use.rank);
            if (!isNaN(currentRank) && currentRank < playerStats[pName].bestRank) {
                playerStats[pName].bestRank = currentRank;
            }
        });

        return Object.values(playerStats).map(p => ({
            name: p.name,
            avgWinrate: (p.winSum / p.count).toFixed(1),
            deckCount: p.decks.size,
            bestRank: p.bestRank === 999 ? '-' : p.bestRank,
            totalGames: p.count
        })).sort((a, b) => b.avgWinrate - a.avgWinrate);
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