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

    // Lấy danh sách bộ bài chứa cardId này (Sắp xếp theo winrate mẫu)
    const decksWithCard = deckInfos.filter(di => di.cardid == cardId);
    const uniqueDeckIds = [...new Set(decksWithCard.map(d => d.deckid))];
    
    let html = `<h4 style="margin-top:20px;">Các bộ bài tiêu biểu sử dụng thẻ này:</h4>
                <div style="display: grid; grid-template-columns: 1fr; gap: 20px; margin-top:10px;">`;

    uniqueDeckIds.slice(0, 3).forEach(dId => {
        const deckData = decks.find(d => d.id == dId);
        const composition = deckInfos.filter(di => di.deckid == dId);
        
        html += `
            <div class="card" style="background: #f8fafc; border: 1px solid #e2e8f0;">
                <div style="margin-bottom: 10px;"><strong>🏆 ${deckData ? deckData.name : 'Deck #' + dId}</strong></div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        `;

        composition.forEach(comp => {
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
                        border: 2px solid rgba(0,0,0,0.1);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        padding: 2px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    ">
                        <span style="font-size: 8px; color: white; font-weight: bold; line-height: 1; text-shadow: 1px 1px 2px #000;">
                            ${card.name.substring(0, 10)}...
                        </span>
                        <span style="
                            position: absolute; 
                            top: -5px; 
                            right: -5px; 
                            background: #ef4444; 
                            color: white; 
                            font-size: 10px; 
                            padding: 2px 5px; 
                            border-radius: 10px;
                            border: 1px solid white;
                        ">
                            ${comp.quantity}
                        </span>
                    </div>
                `;
            }
        });

        html += `</div></div>`;
    });

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