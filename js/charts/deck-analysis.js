import { MetaEngine } from '../meta-engine.js';

// Khởi tạo biến lưu trữ trang hiện tại bên ngoài hàm để giữ trạng thái khi render lại
let currentPage = 1;
const pageSize = 8; // Số lượng card hiển thị trên mỗi trang

export function renderDeckComposition(containerId, cardId, rawData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { deckInfos, cards, decks } = rawData;
    
    const relevantDeckUse = deckInfos.find(di => di.cardid == cardId);
    if (!relevantDeckUse) {
        container.innerHTML = "";
        return;
    }

    const sampleDeckId = relevantDeckUse.deckid;
    const allCardsInDeck = deckInfos.filter(di => di.deckid === sampleDeckId);
    
    const deckData = decks.find(d => d.id == sampleDeckId);
    const deckName = deckData ? deckData.name : `Bộ bài #${sampleDeckId}`;

    // Tính toán phân trang
    const totalPages = Math.ceil(allCardsInDeck.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedItems = allCardsInDeck.slice(startIndex, startIndex + pageSize);

    let html = `
        <div class="deck-analysis-container">
            <div class="deck-header">
                <div>
                    <h4 style="color: var(--text-main); font-size: 1.1rem;">🗂 Cấu trúc: <span style="color: var(--primary);">${deckName}</span></h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Trang ${currentPage} / ${totalPages}</p>
                </div>
            </div>
            <div class="deck-list-grid">
    `;

    paginatedItems.forEach(item => {
        const cardInfo = cards.find(c => c.id == item.cardid);
        if (cardInfo) {
            html += `
                <div class="deck-item-v2" onmousemove="handleTooltip(event, true)" onmouseleave="handleTooltip(event, false)">
                    <div class="qty-badge">x${item.quantity}</div>
                    <img src="${cardInfo.url || 'placeholder.jpg'}" alt="${cardInfo.name}">
                    <div class="card-name-mini">${cardInfo.name}</div>
                </div>
            `;
        }
    });

    html += `</div>`;

    // Thêm bộ điều khiển phân trang
    if (totalPages > 1) {
        html += `
            <div class="pagination-controls" style="display: flex; gap: 10px; margin-top: 15px; justify-content: center;">
                <button class="btn-nav" ${currentPage === 1 ? 'disabled' : ''} id="prevPage">◀ Trước</button>
                <span style="align-self: center;">${currentPage} / ${totalPages}</span>
                <button class="btn-nav" ${currentPage === totalPages ? 'disabled' : ''} id="nextPage">Sau ▶</button>
            </div>
        `;
    }

    html += `</div>`;
    container.innerHTML = html;

    // Gán sự kiện cho các nút phân trang
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) {
        prevBtn.onclick = () => {
            currentPage--;
            renderDeckComposition(containerId, cardId, rawData);
        };
    }
    if (nextBtn) {
        nextBtn.onclick = () => {
            currentPage++;
            renderDeckComposition(containerId, cardId, rawData);
        };
    }
}