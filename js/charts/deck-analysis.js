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

    // Sắp xếp theo số lượng hoặc id để đẹp hơn
    deckComposition.sort((a, b) => b.quantity - a.quantity);

    let html = `
        <div class="card" style="margin-top: 25px; border-top: 4px solid var(--success);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="color: var(--text-main);">🗂 Cấu trúc bộ bài tiêu biểu</h4>
                <span style="font-size: 0.8rem; color: var(--text-muted);">Mẫu bộ bài ID: #${sampleDeckId}</span>
            </div>
            <div class="deck-list-grid">
    `;

    deckComposition.forEach(item => {
        const cardInfo = cards.find(c => c.id == item.cardid);
        if (cardInfo) {
            html += `
                <div class="deck-item-v2" 
                     onmousemove="handleTooltip(event, true)" 
                     onmouseleave="handleTooltip(event, false)">
                    
                    <div class="qty-badge">${item.quantity}</div>
                    
                    <img src="${cardInfo.url || 'placeholder.jpg'}" alt="${cardInfo.name}">
                    
                    <div class="card-name-mini">${cardInfo.name}</div>

                    <img src="${cardInfo.url || 'placeholder.jpg'}" class="fixed-tooltip-img">
                </div>
            `;
        }
    });

    html += `</div></div>`;
    container.innerHTML = html;
}