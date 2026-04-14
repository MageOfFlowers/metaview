import { request } from './api.js';
import { MetaEngine } from './meta-engine.js';
import { renderRarityChart } from './charts/color-chart.js';
import { renderWinrateChart } from './charts/winrate-chart.js';
import { renderDeckRanking } from './charts/deck-ranking.js';
import { renderDeckComposition } from './charts/deck-analysis.js';

let rawData = { cards: [], compUses: [], deckInfos: [], decks: [] };
let charts = { color: null, winrate: null, qty: null, deckRank: null };

export async function initAnalysis() {
    try {
        const [cards, uses, infos, comps, decks] = await Promise.all([
            request('/cards'),
            request('/competition-use'),
            request('/deck-infos'),
            request('/competitions'),
            request('/decks')
        ]);

        rawData = { 
            cards: cards || [], 
            compUses: uses || [], 
            deckInfos: infos || [],
            decks: decks || []
        };

        const fComp = document.getElementById('filterComp');
        if (comps) {
            comps.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                fComp.appendChild(opt);
            });
        }

        // Đưa các hàm này ra global để HTML gọi được
        window.triggerRender = render; 
        window.analyzeQuantity = analyzeQuantity;

        // Lắng nghe các sự kiện thay đổi filter cơ bản
        ['filterComp', 'searchCard'].forEach(id => {
            document.getElementById(id).addEventListener('input', render);
        });

        render();
    } catch (err) {
        console.error("Lỗi khởi tạo:", err);
    }
}

// Hàm render chính
function render() {
    const filters = {
        compId: document.getElementById('filterComp').value,
        mode: document.getElementById('calcMode').value,
        winrateColor: document.getElementById('filterWinrateColor').value,
        search: document.getElementById('searchCard').value.toLowerCase()
    };

    const stats = MetaEngine.calculateStats(rawData, filters);
    
    // Cập nhật text tiêu đề cột dựa trên chế độ
    document.getElementById('usage-column-header').innerText = 
        filters.mode === 'total' ? 'Tổng số bản copy' : 'Số Deck sử dụng';

    // 1. Biểu đồ Rarity
    charts.color = renderRarityChart('rarityUsageChart', stats, charts.color);

    // 2. Biểu đồ Winrate với Filter màu
    let winrateCards = stats.cards;
    if (filters.winrateColor !== 'all') {
        winrateCards = winrateCards.filter(c => c.color === filters.winrateColor);
    }
    charts.winrate = renderWinrateChart('winrateBarChart', winrateCards, charts.winrate);

    // 3. Biểu đồ Deck Ranking
    charts.deckRank = renderDeckRanking('deckRankingChart', rawData, charts.deckRank);

    // 4. Bảng danh sách
    const tbody = document.getElementById('meta-body');
    const filteredCards = stats.cards.filter(c => c.name.toLowerCase().includes(filters.search));
    
    tbody.innerHTML = filteredCards.map(s => `
        <tr onclick="window.analyzeQuantity(${s.id}, '${s.name}')" class="clickable-row">
            <td>
                <span class="card-tooltip">
                    <strong>${s.name} 🔍</strong>
                    <img src="${s.url || 'https://via.placeholder.com/200x280'}" class="tooltip-img">
                </span>
            </td>
            <td><span class="badge" style="background:${MetaEngine.getColorCode(s.color)}">${s.color}</span></td>
            <td><span class="badge" style="background:${MetaEngine.getRarityColor(s.rarity)}">${s.rarity}</span></td>
            <td>${s.useCount}</td>
            <td>${s.avgWinrate}%</td>
        </tr>
    `).join('');
}

// Hàm phân tích chi tiết khi click dòng
function analyzeQuantity(cardId, cardName) {
    const qtyStats = MetaEngine.calculateQuantityStats(rawData, cardId);
    const section = document.getElementById('quantity-analysis');
    section.classList.remove('hidden');
    document.getElementById('qty-title').innerText = `Phân tích: ${cardName}`;

    // Render bảng Qty
    document.getElementById('qty-table-body').innerHTML = qtyStats.map(q => `
        <tr>
            <td><strong>${q.quantity} bản</strong></td>
            <td>${q.count} deck</td>
            <td>${q.avgWinrate}%</td>
        </tr>
    `).join('');

    // Vẽ biểu đồ Qty
    const ctxQty = document.getElementById('qtyWinrateChart').getContext('2d');
    if(charts.qty) charts.qty.destroy();
    charts.qty = new Chart(ctxQty, {
        type: 'bar',
        data: {
            labels: qtyStats.map(q => `${q.quantity} bản`),
            datasets: [{
                label: 'Winrate trung bình',
                data: qtyStats.map(q => q.avgWinrate),
                backgroundColor: '#2563eb'
            }]
        }
    });

    renderDeckComposition('deck-comp-container', cardId, rawData);
    section.scrollIntoView({ behavior: 'smooth' });
}

// Export hàm render để bên ngoài có thể dùng nếu cần qua import
export { render as triggerRender };