import { MetaEngine } from '../meta-engine.js';

let currentPage = 1;
const pageSize = 6;
// Biến lưu trạng thái sắp xếp cục bộ cho tab này
let deckSortMode = 'winrate'; 

export function renderDeckComposition(containerId, cardId, rawData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { deckInfos, cards, decks, compUses } = rawData;
    const cardMap = new Map(cards.map(c => [c.id, c]));

    // 1. Tìm tất cả các bộ bài có chứa cardId này
    const decksWithCard = deckInfos.filter(di => di.cardid == cardId);
    if (decksWithCard.length === 0) {
        container.innerHTML = "";
        return;
    }

    // 2. Gom nhóm và tính toán chỉ số cho từng bộ bài
    const uniqueDeckIds = [...new Set(decksWithCard.map(d => d.deckid))];
    let deckList = uniqueDeckIds.map(dId => {
        const deckData = decks.find(d => d.id == dId);
        const uses = compUses.filter(u => u.deckid == dId);
        const count = uses.length;
        const avgWinrate = count > 0 
            ? (uses.reduce((sum, u) => sum + parseFloat(u.winrate || 0), 0) / count).toFixed(1) 
            : 0;

        return {
            id: dId,
            name: deckData ? deckData.name : `Bộ bài #${dId}`,
            count: count,
            winrate: parseFloat(avgWinrate),
            composition: deckInfos.filter(di => di.deckid == dId)
        };
    });

    // 3. Logic Sắp xếp theo yêu cầu
    if (deckSortMode === 'winrate') {
        deckList.sort((a, b) => b.winrate - a.winrate);
    } else {
        deckList.sort((a, b) => b.count - a.count);
    }

    const totalPages = Math.ceil(deckList.length / pageSize);
    const paginatedDecks = deckList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // 4. Render Giao diện
    let html = `
        <div class="deck-analysis-container" style="margin-top:20px; border-top: 1px solid #eee; padding-top:20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="margin:0;">Các bộ bài tiêu biểu sử dụng thẻ này</h4>
                <div class="filter-mini">
                    <select id="innerDeckSort" onchange="window.changeDeckSort('${containerId}', ${cardId})" style="padding: 4px; font-size: 0.8rem;">
                        <option value="winrate" ${deckSortMode === 'winrate' ? 'selected' : ''}>Sắp theo Winrate</option>
                        <option value="usage" ${deckSortMode === 'usage' ? 'selected' : ''}>Sắp theo Sử dụng</option>
                    </select>
                </div>
            </div>
            <div class="deck-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 15px;">
    `;

    paginatedDecks.forEach(deck => {
        html += `
            <div class="card" style="border: 1px solid #eee; background: #fafafa;">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 8px;">
                    <strong style="font-size: 0.9rem;">${deck.name}</strong>
                    <span style="font-size: 0.8rem; color: #10b981; font-weight: bold;">${deck.winrate}% WR</span>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
        `;

        // Chỉ hiện tối đa x3 như yêu cầu (dữ liệu đã được MetaEngine lọc)
        deck.composition.forEach(comp => {
            const card = cardMap.get(comp.cardid);
            if (card) {
                const color = MetaEngine.getColorCode(card.color);
                html += `
                    <div title="${card.name}" style="width: 28px; height: 38px; background: ${color}; border-radius: 2px; position: relative; border: 1px solid rgba(0,0,0,0.1);">
                        <span style="position: absolute; bottom: 0; right: 1px; font-size: 9px; color: white; text-shadow: 1px 1px 1px #000;">
                            x${comp.quantity}
                        </span>
                    </div>
                `;
            }
        });

        html += `
                </div>
                <div style="margin-top: 8px; font-size: 0.7rem; color: #888;">Số lần xuất hiện: ${deck.count}</div>
            </div>
        `;
    });

    html += `</div>`;

    // 5. Pagination
    if (totalPages > 1) {
        html += `
            <div style="display: flex; justify-content: center; gap: 10px; margin-top: 15px;">
                <button class="btn-nav" ${currentPage === 1 ? 'disabled' : ''} onclick="window.updateDeckPage(-1, '${containerId}', ${cardId})">◀</button>
                <span style="font-size: 0.85rem; line-height: 28px;">${currentPage} / ${totalPages}</span>
                <button class="btn-nav" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.updateDeckPage(1, '${containerId}', ${cardId})">▶</button>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;
}

// Hàm global để xử lý sự kiện
window.changeDeckSort = (containerId, cardId) => {
    deckSortMode = document.getElementById('innerDeckSort').value;
    currentPage = 1; // Reset về trang 1
    // Gọi lại từ analysis-main để lấy rawData mới nhất
    window.renderDeckDetail(cardId); 
};

window.updateDeckPage = (offset, containerId, cardId) => {
    currentPage += offset;
    window.renderDeckDetail(cardId);
};