import { MetaEngine } from '../meta-engine.js';

// Cập nhật js/charts/deck-analysis.js
export function renderDeckComposition(containerId, cardId, rawData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { deckInfos, cards } = rawData;
    const relevantDeckIds = [...new Set(deckInfos.filter(di => di.cardid == cardId).map(di => di.deckid))];

    if (relevantDeckIds.length === 0) {
        container.innerHTML = "";
        return;
    }

    const sampleDeckId = relevantDeckIds[0];
    const deckComposition = deckInfos.filter(di => di.deckid === sampleDeckId);

    let html = `
        <div class="card" style="margin-top: 20px; border-left: 5px solid var(--success);">
            <h4 style="margin-bottom:10px;">Cấu trúc bộ bài mẫu chứa lá bài này</h4>
            <div class="deck-list-grid">
    `;

    deckComposition.forEach(item => {
        const cardInfo = cards.find(c => c.id == item.cardid);
        if (cardInfo) {
            html += `
                <div class="deck-item" onmousemove="handleTooltip(event, true)" onmouseleave="handleTooltip(event, false)">
                    <div class="card-tooltip">
                        ${cardInfo.name}
                        <img src="${cardInfo.url || 'placeholder.jpg'}" class="fixed-tooltip-img">
                    </div>
                    <span class="badge" style="background:var(--primary); color:#fff; padding:2px 6px; border-radius:4px;">x${item.quantity}</span>
                </div>
            `;
        }
    });

    html += `</div></div>`;
    container.innerHTML = html;
}