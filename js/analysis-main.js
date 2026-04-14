import { request } from './api.js';
import { MetaEngine } from './meta-engine.js';
import { renderColorChart } from './charts/color-chart.js';
import { renderWinrateChart } from './charts/winrate-chart.js';
import { renderDeckComposition } from './charts/deck-analysis.js';
import { renderDeckRanking } from './charts/deck-ranking.js';

let rawData = { cards: [], compUses: [], deckInfos: [] };
let charts = { color: null, winrate: null, qty: null, deckRank: null };

export async function initAnalysis() {
    try {
        const [cards, uses, infos, comps] = await Promise.all([
            request('/cards'),
            request('/competition-use'),
            request('/deck-infos'),
            request('/competitions')
        ]);

        rawData = { cards: cards || [], compUses: uses || [], deckInfos: infos || [] };

        const fComp = document.getElementById('filterComp');
        if (comps) {
            comps.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                fComp.appendChild(opt);
            });
        }

        ['filterComp', 'filterStart', 'filterEnd', 'searchCard'].forEach(id => {
            document.getElementById(id).addEventListener('input', render);
        });

        render();
    } catch (err) {
        console.error("Lỗi khởi tạo ứng dụng:", err);
    }
}

function render() {
    const filters = {
        compId: document.getElementById('filterComp').value,
        startDate: document.getElementById('filterStart').value,
        endDate: document.getElementById('filterEnd').value,
        search: document.getElementById('searchCard').value.toLowerCase()
    };

    const stats = MetaEngine.calculateStats(rawData, filters);
    
    // Render biểu đồ thông qua các module đã tách
    charts.color = renderColorChart('colorUsageChart', stats, charts.color);
    charts.winrate = renderWinrateChart('winrateBarChart', stats.cards, charts.winrate);

    // Render bảng danh sách Meta
    const tbody = document.getElementById('meta-body');
    const filteredCards = stats.cards.filter(c => c.name.toLowerCase().includes(filters.search));
    
    tbody.innerHTML = filteredCards.map(s => `
        <tr onclick="window.analyzeQuantity(${s.id}, '${s.name}')" class="clickable-row">
            <td>
                <span class="card-tooltip">
                    <strong>${s.name} 🔍</strong>
                    <img src="${s.url || 'https://via.placeholder.com/200x280?text=No+Image'}" class="tooltip-img">
                </span>
            </td>
            <td><span class="badge" style="background:${MetaEngine.getColorCode(s.color)}">${s.color}</span></td>
            <td>${s.useCount} lượt</td>
            <td>${s.avgWinrate}%</td>
        </tr>
    `).join('');

    if(stats.cards.length > 0) {
        document.getElementById('quick-total-usage').innerText = stats.usesCount;
        document.getElementById('quick-top-card').innerText = stats.cards[0].name;
    }
}

// Hàm xử lý khi click vào một lá bài
window.analyzeQuantity = (cardId, cardName) => {
    const qtyStats = MetaEngine.calculateQuantityStats(rawData, cardId);
    const section = document.getElementById('quantity-analysis');
    section.classList.remove('hidden');
    document.getElementById('qty-title').innerText = `Phân tích chi tiết: ${cardName}`;

    // 1. Cập nhật bảng Winrate theo số lượng
    document.getElementById('qty-table-body').innerHTML = qtyStats.map(q => `
        <tr>
            <td><strong>${q.quantity} bản</strong></td>
            <td>${q.count} deck</td>
            <td>${q.avgWinrate}%</td>
        </tr>
    `).join('');

    // 2. Vẽ biểu đồ Winrate theo số lượng
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
        },
        options: { scales: { y: { beginAtZero: true, max: 100 } } }
    });

    // 3. Hiển thị danh sách tất cả bài trong Deck (Component tách riêng)
    renderDeckComposition('deck-comp-container', cardId, rawData);
charts.deckRank = renderDeckRanking('deckRankingChart', rawData, charts.deckRank);
    section.scrollIntoView({ behavior: 'smooth' });
};