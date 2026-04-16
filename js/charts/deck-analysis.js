import { MetaEngine } from '../meta-engine.js';

let currentPage = 1;
const pageSize = 6;

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
    
    // Lấy tiêu chí sắp xếp từ dropdown của bảng Meta (metaSortMode)
    const sortMode = document.getElementById('metaSortMode')?.value || 'usage';

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

    // 3. Sắp xếp dựa theo tiêu chí của bảng Meta
    if (sortMode === 'winrate') {
        deckList.sort((a, b) => b.winrate - a.winrate);
    } else {
        deckList.sort((a, b) => b.count - a.count);
    }

    const totalPages = Math.ceil(deckList.length / pageSize);
    const paginatedDecks = deckList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // 4. Render Giao diện
    let html = `
        <div class="deck-analysis-container" style="margin-top:20px; border-top: 2px solid #eee; padding-top:20px;">
            <h4 style="margin-bottom: 15px; color: var(--primary);">🗂️ Các bộ bài tiêu biểu sử dụng thẻ này</h4>
            <div class="deck-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px;">
    `;

    paginatedDecks.forEach(deck => {
        html += `
            <div class="card" style="border: 1px solid #e2e8f0; background: #f8fafc; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">
                    <strong style="font-size: 1rem; color: #1e293b;">${deck.name}</strong>
                    <div style="text-align: right;">
                        <div style="font-size: 0.85rem; color: #10b981; font-weight: bold;">${deck.winrate}% WR</div>
                        <div style="font-size: 0.7rem; color: #64748b;">${deck.count} lượt dùng</div>
                    </div>
                </div>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
        `;

        deck.composition.forEach(comp => {
            const card = cardMap.get(comp.cardid);
            if (card) {
                const color = MetaEngine.getColorCode(card.color);
                html += `
                    <div title="${card.name}" style="
                        width: 45px; 
                        height: 65px; 
                        background: ${color}; 
                        border-radius: 4px; 
                        position: relative; 
                        border: 1px solid rgba(0,0,0,0.15);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    ">
                        <span style="font-size: 9px; color: white; font-weight: bold; text-align: center; line-height: 1; padding: 2px; text-shadow: 1px 1px 2px #000;">
                            ${card.name.length > 12 ? card.name.substring(0, 10) + '..' : card.name}
                        </span>
                        <span style="
                            position: absolute; 
                            top: -6px; 
                            right: -6px; 
                            background: #ef4444; 
                            color: white; 
                            font-size: 10px; 
                            width: 18px;
                            height: 18px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border-radius: 50%;
                            border: 1.5px solid white;
                            font-weight: bold;
                            z-index: 1;
                        ">
                            ${comp.quantity}
                        </span>
                    </div>
                `;
            }
        });

        html += `
                </div>
            </div>
        `;
    });

    html += `</div>`;

    // 5. Pagination
    if (totalPages > 1) {
        html += `
            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 25px;">
                <button class="btn-nav" ${currentPage === 1 ? 'disabled' : ''} 
                    onclick="window.updateDeckPage(-1, '${containerId}', ${cardId})" 
                    style="padding: 5px 15px;">◀</button>
                <span style="font-weight: bold; line-height: 32px; color: #475569;">${currentPage} / ${totalPages}</span>
                <button class="btn-nav" ${currentPage === totalPages ? 'disabled' : ''} 
                    onclick="window.updateDeckPage(1, '${containerId}', ${cardId})" 
                    style="padding: 5px 15px;">▶</button>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;
}

// Hàm global để xử lý chuyển trang
window.updateDeckPage = (offset, containerId, cardId) => {
    currentPage += offset;
    // Gọi lại hàm render từ file chính để đảm bảo có rawData
    if (window.renderDeckDetail) {
        window.renderDeckDetail(cardId);
    }
};

// Reset trang khi chọn thẻ bài mới
export function resetDeckAnalysisPage() {
    currentPage = 1;
}