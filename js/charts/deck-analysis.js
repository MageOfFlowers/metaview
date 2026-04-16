import { MetaEngine } from '../meta-engine.js';

let currentPage = 1;
const pageSize = 6; // Giảm xuống 6 để hiển thị card to và rõ hơn

export function renderDeckComposition(containerId, cardId, rawData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { deckInfos, cards, decks, compUses } = rawData;
    
    // 1. Tìm tất cả các bộ bài có chứa cardId này
    const decksWithCard = deckInfos.filter(di => di.cardid == cardId);
    
    if (decksWithCard.length === 0) {
        container.innerHTML = "<p style='text-align:center; padding:20px;'>Không tìm thấy dữ liệu bộ bài cho thẻ này.</p>";
        return;
    }

    // 2. Lấy danh sách Deck IDs duy nhất và tính toán chỉ số cho từng Deck
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
            winrate: avgWinrate,
            // Lấy toàn bộ card trong deck này để hiển thị cấu trúc
            composition: deckInfos.filter(di => di.deckid == dId)
        };
    });

    // 3. Sắp xếp danh sách bộ bài (Ưu tiên Winrate cao hoặc Độ phổ biến)
    // Ở đây tôi mặc định sắp xếp theo Winrate giảm dần
    deckList.sort((a, b) => b.winrate - a.winrate);

    // 4. Phân trang
    const totalPages = Math.ceil(deckList.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedDecks = deckList.slice(startIndex, startIndex + pageSize);

    // 5. Render HTML
    let html = `
        <div class="deck-analysis-container">
            <h4 style="margin-bottom:15px; border-left: 4px solid var(--primary); padding-left:10px;">
                Các bộ bài tiêu biểu sử dụng thẻ này
            </h4>
            <div class="deck-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px;">
    `;

    paginatedDecks.forEach(deck => {
        html += `
            <div class="card deck-sample-card" style="border: 1px solid #eee; transition: 0.3s;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <strong style="color: var(--primary);">${deck.name}</strong>
                    <span class="badge" style="background: #e0f2fe; color: #0369a1; font-size: 0.7rem;">WR: ${deck.winrate}%</span>
                </div>
                <div class="deck-mini-comp" style="display: flex; flex-wrap: wrap; gap: 5px;">
        `;

        // Hiển thị tối đa 12 card đại diện trong mỗi deck sample
        deck.composition.slice(0, 12).forEach(comp => {
            const cardInfo = cards.find(c => c.id == comp.cardid);
            if (cardInfo) {
                const color = MetaEngine.getColorCode(cardInfo.color);
                html += `
                    <div class="mini-card-icon" title="${cardInfo.name} x${comp.quantity}" 
                         style="width: 25px; height: 35px; background: ${color}; border-radius: 3px; 
                                position: relative; border: 1px solid rgba(0,0,0,0.1);">
                        <span style="position: absolute; bottom: 0; right: 1px; font-size: 9px; color: white; font-weight: bold; text-shadow: 1px 1px 2px #000;">
                            ${comp.quantity}
                        </span>
                    </div>
                `;
            }
        });

        html += `
                </div>
                <div style="margin-top: 10px; font-size: 0.75rem; color: #666;">
                    Số lần xuất hiện trong Meta: ${deck.count}
                </div>
            </div>
        `;
    });

    html += `</div>`;

    // 6. Pagination Controls
    if (totalPages > 1) {
        html += `
            <div class="pagination" style="display: flex; justify-content: center; gap: 10px; margin-top: 20px;">
                <button class="btn-nav" ${currentPage === 1 ? 'disabled' : ''} onclick="changeDeckPage(-1, '${containerId}', ${cardId})">◀</button>
                <span style="line-height: 32px;">${currentPage} / ${totalPages}</span>
                <button class="btn-nav" ${currentPage === totalPages ? 'disabled' : ''} onclick="changeDeckPage(1, '${containerId}', ${cardId})">▶</button>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;
}

// Hàm hỗ trợ đổi trang
window.changeDeckPage = (offset, containerId, cardId) => {
    currentPage += offset;
    // Cần truy cập lại dữ liệu rawData. Ở đây giả định rawData đã được lưu toàn cục hoặc truyền lại.
    // Cách tốt nhất là gọi lại hàm từ analysis-main
    window.renderDeckDetail(cardId); 
};