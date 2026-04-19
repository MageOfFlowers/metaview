export const MetaEngine = {
    RARITY_ORDER: { 'SCR': 1, 'EX': 2, 'UR': 3, 'SR': 4, 'R': 5, 'U': 6, 'C': 7 },
    
    getRarityColor(r) {
        const colors = {
            'SCR': '#f43f5e', 'EX': '#fb923c', 'UR': '#fbbf24', 
            'SR': '#a855f7', 'R': '#3b82f6', 'U': '#94a3b8', 'C': '#cbd5e1'
        };
        return colors[r] || '#64748b';
    },

    getColorCode(s) {
        const map = { 'R': '#ef4444', 'P': '#a855f7', 'Y': '#eab308', 'G': '#22c55e' };
        return map[s] || '#64748b';
    },

    // meta-engine.js - Cập nhật hàm calculateStats
// meta-engine.js

calculateStats(rawData, filters = {}) {
    let { compUses, deckInfos, cards, competitions } = rawData;
    // Lấy thêm 'mode' từ filters
    const { compId, startDate, endDate, mode } = filters; 

    const compDateMap = new Map();
    const compRegionMap = new Map();
    if (competitions) {
        competitions.forEach(c => {
            if (c.id) {
                compDateMap.set(Number(c.id), c.competition_date);
                compRegionMap.set(Number(c.id), c.region); // Lưu region theo id giải đấu
            }
        });
    }

    let filteredUses = compUses.filter(use => {

        let { compUses, deckInfos, cards, competitions } = rawData;
    // Bổ sung 'region' vào danh sách lấy từ filters
    const { compId, startDate, endDate, mode, region } = filters;
        const cId = Number(use.competitionid);
        
        // 1. Lọc theo Giải đấu cụ thể
        const matchComp = compId === 'all' || cId === Number(compId);
        if (!matchComp) return false;

        // 2. Lọc theo Khu vực (N hoặc S)
        const compRegion = compRegionMap.get(cId);
        const matchRegion = !region || region === 'all' || compRegion === region;
        if (!matchRegion) return false;

        // 3. Lọc theo Ngày tháng
        const dateValue = compDateMap.get(cId);
        if (!dateValue) return !startDate && !endDate;

        const useTime = new Date(dateValue).setHours(0,0,0,0);
        if (startDate) {
            const startTime = new Date(startDate).setHours(0,0,0,0);
            if (useTime < startTime) return false;
        }
        if (endDate) {
            const endTime = new Date(endDate).setHours(0,0,0,0);
            if (useTime > endTime) return false;
        }

        return true;
    });

    const cardStats = {};
    const colorStats = { 'R': 0, 'P': 0, 'Y': 0, 'G': 0 };
    const rarityStats = { 'SCR': 0, 'EX': 0, 'UR': 0, 'SR': 0, 'R': 0, 'U': 0, 'C': 0 };

    cards.forEach(c => cardStats[c.id] = { ...c, useCount: 0, totalWin: 0 });

    filteredUses.forEach(use => {
        const cardsInDeck = deckInfos.filter(di => di.deckid === use.deckid);
        cardsInDeck.forEach(item => {
            const card = cardStats[item.cardid];
            if (card) {
                // Đảm bảo mode đã có giá trị (mặc định là 'deck' nếu undefined)
                const currentMode = mode || 'deck';
                const count = (currentMode === 'total') ? (item.quantity || 0) : 1;
                
                card.useCount += count;
                card.totalWin += (parseFloat(use.winrate || 0) * count);
                
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
   calculatePlayerStats(filteredUses, users = [], deckInfos = [], decks = [], competitions = []) {
    const userMap = new Map(users.map(u => [u.id, u.username || u.name]));
    const deckMap = new Map(decks.map(d => [d.id, d.name]));
    const compMap = new Map(competitions.map(c => [c.id, c.name]));

    const playerStats = {};

    filteredUses.forEach(use => {
        const pName = userMap.get(use.userid) || `User ${use.userid}`;
        if (!playerStats[pName]) {
            playerStats[pName] = { name: pName, wins: 0, count: 0, totalRank: 0, decksUsed: {} };
        }

        playerStats[pName].wins += parseFloat(use.winrate || 0);
        playerStats[pName].totalRank += parseInt(use.rank || 0);
        playerStats[pName].count++;

        // Theo dõi stats từng deck của người chơi này
        if (!playerStats[pName].decksUsed[use.deckid]) {
            playerStats[pName].decksUsed[use.deckid] = { 
                winrate: use.winrate, 
                bestRank: use.rank, 
                compId: use.competitionid 
            };
        } else {
            if (parseInt(use.rank) < parseInt(playerStats[pName].decksUsed[use.deckid].bestRank)) {
                playerStats[pName].decksUsed[use.deckid].bestRank = use.rank;
                playerStats[pName].decksUsed[use.deckid].compId = use.competitionid;
            }
        }
    });

    return Object.values(playerStats).map(p => ({
        name: p.name,
        avgWinrate: (p.wins / p.count).toFixed(1),
        avgRank: (p.totalRank / p.count).toFixed(1),
        deckDetails: Object.keys(p.decksUsed).map(did => ({
            name: deckMap.get(parseInt(did)) || "N/A",
            winrate: p.decksUsed[did].winrate,
            bestRank: p.decksUsed[did].bestRank,
            compName: compMap.get(p.decksUsed[did].compId) || "N/A"
        }))
    }));
},

// Trong file meta-engine.js
calculateQuantityStats(rawData, cardId) {
    const { compUses, deckInfos } = rawData;
    // Chỉ khởi tạo từ 1 đến 3
    const statsByQty = { 
        1: { win: 0, count: 0 }, 
        2: { win: 0, count: 0 }, 
        3: { win: 0, count: 0 } 
    };

    compUses.forEach(use => {
        const cardInDeck = deckInfos.find(di => di.deckid === use.deckid && di.cardid == cardId);
        if (cardInDeck && statsByQty[cardInDeck.quantity]) {
            statsByQty[cardInDeck.quantity].count++;
            statsByQty[cardInDeck.quantity].win += parseFloat(use.winrate || 0);
        }
    });

    return Object.keys(statsByQty).map(q => ({
        quantity: q,
        count: statsByQty[q].count,
        avgWinrate: statsByQty[q].count > 0 ? (statsByQty[q].win / statsByQty[q].count).toFixed(1) : 0
    }));
}
};