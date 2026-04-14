import { MetaEngine } from '../meta-engine.js';

export function renderDeckComposition(containerId, cardId, rawData) {
    const container = document.getElementById(containerId);
    const { compUses, deckInfos, cards } = rawData;

    // Tìm các bộ bài có chứa lá bài này để lấy danh sách các lá bài đi kèm phổ biến nhất
    // Hoặc đơn giản là hiển thị cấu trúc của các Deck tiêu biểu chứa lá bài này
    const relevantDeckIds = [...new Set(deckInfos
        .filter(di => di.cardid == cardId)
        .map(di => di.deckid))];

    if (relevantDeckIds.length === 0) return;

    // Lấy thông tin lá bài trong những deck đó (Ví dụ lấy deck đầu tiên tìm thấy để mô phỏng)
    const sampleDeckId = relevantDeckIds[0];
    const deckComposition = deckInfos.filter(di => di.deckid === sampleDeckId);

    let html = `
        <div class="card" style="margin-top: 20px; border-left: 5px solid var(--success);">
            <h4>Cấu trúc bộ bài mẫu chứa lá bài này</h4>
            <div class="deck-list-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
    `;

    deckComposition.forEach(item => {
        const cardInfo = cards.find(c => c.id == item.cardid);
        if (cardInfo) {
            html += `
                <div style="padding: 8px; background: #fff; border: 1px solid #eee; border-radius: 6px; display: flex; justify-content: space-between;">
                    <span class="card-tooltip">
                        ${cardInfo.name}
                        <img src="${cardInfo.url || 'placeholder.jpg'}" class="tooltip-img" alt="${cardInfo.name}">
                    </span>
                    <span class="badge" style="background: var(--text-muted)">x${item.quantity}</span>
                </div>
            `;
        }
    });

    html += `</div></div>`;
    container.innerHTML = html;
}