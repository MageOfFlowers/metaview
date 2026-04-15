import { MetaEngine } from '../meta-engine.js';

// Cập nhật js/charts/deck-analysis.js
export function renderDeckComposition(containerId, cardId, rawData) {
    const container = document.getElementById(containerId);
    if (!container) return; // Bảo vệ nếu không tìm thấy container

    const { deckInfos, cards } = rawData;

    const relevantDeckIds = [...new Set(deckInfos
        .filter(di => di.cardid == cardId)
        .map(di => di.deckid))];

    if (relevantDeckIds.length === 0) {
        container.innerHTML = ""; // Xóa nội dung cũ nếu không có dữ liệu
        return;
    }

    const sampleDeckId = relevantDeckIds[0];
    const deckComposition = deckInfos.filter(di => di.deckid === sampleDeckId);

    let html = `
        <div class="card" style="margin-top: 20px; border-left: 5px solid var(--success); background: #fdfdfd;">
            <h4 style="margin-bottom:10px;">Cấu trúc bộ bài mẫu chứa lá bài này</h4>
            <div class="deck-list-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
    `;

    deckComposition.forEach(item => {
        const cardInfo = cards.find(c => c.id == item.cardid);
        if (cardInfo) {
            html += `
                <div style="padding: 10px; background: #fff; border: 1px solid var(--border); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                    <div class="card-tooltip">
                        ${cardInfo.name}
                        <div class="tooltip-wrapper">
                            <img src="${cardInfo.url || 'placeholder.jpg'}" class="tooltip-img">
                        </div>
                    </div>
                    <span class="badge" style="background: var(--primary); color: white; padding: 2px 8px; border-radius: 12px;">x${item.quantity}</span>
                </div>
            `;
        }
    });

    html += `</div></div>`;
    container.innerHTML = html;
}