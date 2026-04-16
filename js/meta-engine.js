export const MetaEngine = {
    getColorCode(s) {
        const map = { 'R': '#ef4444', 'P': '#a855f7', 'Y': '#eab308', 'G': '#22c55e' };
        return map[s] || '#64748b';
    },

    calculateStats(rawData, filters = {}) {
        let { compUses, deckInfos, cards, competitions } = rawData;
        const { compId, startDate, endDate, mode = 'deck', region = 'all' } = filters;

        let validCompIdsByRegion = [];
        if (region !== 'all' && competitions) {
            validCompIdsByRegion = competitions.filter(c => c.region === region).map(c => c.id);
        }

        // Bước lọc dữ liệu
        let filteredUses = compUses.filter(use => {
            const matchComp = compId === 'all' || use.competitionid == compId;
            const matchRegion = region === 'all' || validCompIdsByRegion.includes(Number(use.competitionid));
            const useDate = new Date(use.createdAt);
            const matchDate = (!startDate || useDate >= new Date(startDate)) && 
                              (!endDate || useDate <= new Date(endDate));
            return matchComp && matchRegion && matchDate;
        });

        const cardStats = {};
        cards.forEach(c => cardStats[c.id] = { ...c, useCount: 0, totalWin: 0 });

        filteredUses.forEach(use => {
            const cardsInDeck = deckInfos.filter(di => di.deckid === use.deckid);
            cardsInDeck.forEach(item => {
                const card = cardStats[item.cardid];
                if (card) {
                    const count = mode === 'total' ? item.quantity : 1;
                    card.useCount += count;
                    card.totalWin += (use.winrate * count);
                }
            });
        });

        return { 
            cards: Object.values(cardStats).map(c => ({
                ...c,
                avgWinrate: c.useCount > 0 ? (c.totalWin / c.useCount).toFixed(1) : 0
            })).sort((a, b) => b.useCount - a.useCount),
            filteredUses: filteredUses // QUAN TRỌNG: Phải thêm dòng này để trả về dữ liệu thô
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