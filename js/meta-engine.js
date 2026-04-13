// js/meta-engine.js
export const MetaEngine = {
    // Hàm tính toán winrate và số lần sử dụng cho từng lá bài
    calculateCardStats(rawData, competitionId = 'all') {
        const { cards, compUses, deckInfos } = rawData;
        
        // Lọc theo giải đấu nếu có yêu cầu
        const filteredUses = competitionId === 'all' 
            ? compUses 
            : compUses.filter(u => u.competitionid == competitionId);

        const stats = {};
        cards.forEach(c => {
            stats[c.id] = { id: c.id, name: c.name, color: c.color, count: 0, totalWinrate: 0 };
        });

        filteredUses.forEach(use => {
            const cardsInDeck = deckInfos.filter(di => di.deckid === use.deckid);
            cardsInDeck.forEach(item => {
                if (stats[item.cardid]) {
                    stats[item.cardid].count++;
                    stats[item.cardid].totalWinrate += use.winrate;
                }
            });
        });

        return Object.values(stats).map(s => ({
            ...s,
            winrate: s.count > 0 ? (s.totalWinrate / s.count).toFixed(1) : 0
        })).sort((a, b) => b.count - a.count);
    },

    // Lấy mã màu dựa trên ký hiệu hệ (R, P, Y, G)
    getColorCode(symbol) {
        const colors = { 'R': '#ef4444', 'P': '#a855f7', 'Y': '#eab308', 'G': '#22c55e' };
        return colors[symbol] || '#64748b';
    }
};