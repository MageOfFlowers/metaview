import { MetaEngine } from '../meta-engine.js';

// Cập nhật js/charts/deck-analysis.js
export function renderDeckComposition(containerId, cardId, rawData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { deckInfos, cards, decks } = rawData;
    
    // Tìm deck tiêu biểu chứa lá bài này
    const relevantDeckUse = deckInfos.find(di => di.cardid == cardId);
    if (!relevantDeckUse) {
        container.innerHTML = "";
        return;
    }

    const sampleDeckId = relevantDeckUse.deckid;
    const deckComposition = deckInfos.filter(di => di.deckid === sampleDeckId);
    
    // LẤY TÊN BỘ BÀI TỪ DỮ LIỆU DECKS
    const deckData = decks.find(d => d.id == sampleDeckId);
    const deckName = deckData ? deckData.name : `Bộ bài #${sampleDeckId}`;

    let html = `
        <div class="deck-analysis-container">
            <div class="deck-header">
                <div>
                    <h4 style="color: var(--text-main); font-size: 1.1rem;">🗂 Cấu trúc: <span style="color: var(--primary);">${deckName}</span></h4>
                    <p style="font-size: 0.8rem; color: var(--text-muted);">Đây là bộ bài phổ biến nhất sử dụng thẻ này</p>
                </div>
                <span class="badge" style="background: var(--success);">Top Deck</span>
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
                    <div class="qty-badge">x${item.quantity}</div>
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