import { request } from './api.js';
import { MetaEngine } from './meta-engine.js';
import { renderWinrateChart } from './charts/winrate-chart.js';
import { renderDeckRanking } from './charts/deck-ranking.js';
import { renderDeckComposition } from './charts/deck-analysis.js';
import { renderUsageChart } from './charts/usage-charts.js';

let rawData = { cards: [], compUses: [], deckInfos: [], decks: [] };
let currentStats = null; 
let charts = { usage: null, winrate: null, qty: null, deckRank: null };

/**
 * Khởi tạo dữ liệu khi vào trang
 */
export async function initAnalysis() {
    try {
        const [cards, uses, infos, comps, decks] = await Promise.all([
            request('/cards'),
            request('/competition-use'),
            request('/deck-infos'),
            request('/competitions'),
            request('/decksget')
        ]);

        rawData = { 
            cards: cards || [], 
            compUses: uses || [], 
            deckInfos: infos || [],
            decks: decks || [],
            competitions: comps || [],
        };

        const fComp = document.getElementById('filterComp');
        if (comps && fComp) {
            fComp.innerHTML = '<option value="all">Tất cả giải đấu</option>' + 
                comps.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }

        // Đưa các hàm ra global scope để HTML (onclick, onchange) có thể thấy
        Object.assign(window, {
            triggerRender: render, // Gán render thành triggerRender cho HTML
            triggerUsageRender,
            triggerWinrateOnlyRender,
            renderTableOnly,
            analyzeQuantity
        });

        render(); 
    } catch (err) {
        console.error("Lỗi khởi tạo ứng dụng:", err);
    }
}

// Export các hàm để file HTML có thể import nếu cần
export function triggerRender() { render(); }

export function triggerUsageRender() {
    if (!currentStats) return;
    const viewMode = document.getElementById('usageViewMode').value;
    charts.usage = renderUsageChart('usageTypeChart', currentStats, viewMode, charts.usage);
}

export function renderTableOnly() {
    const tableBody = document.getElementById('meta-body');
    if (!tableBody || !currentStats?.cards) return;
    const searchTerm = document.getElementById('searchCard').value.toLowerCase();
    const filteredCards = currentStats.cards.filter(c => c.name.toLowerCase().includes(searchTerm));

    tableBody.innerHTML = filteredCards.map(card => `
        <tr class="clickable-row" onclick="analyzeQuantity(${card.id}, '${card.name.replace(/'/g, "\\'")}')">
            <td>
                <span class="card-tooltip">
                    ${card.name}
                    <img src="${card.url || 'placeholder.jpg'}" class="tooltip-img">
                </span>
            </td>
            <td>${card.color || '-'}</td>
            <td>${card.rarity || '-'}</td>
            <td>${card.useCount}</td>
            <td>${card.avgWinrate}%</td>
        </tr>
    `).join('');
}

export function render() {
    if (!rawData.cards?.length) return;
    const filters = {
        compId: document.getElementById('filterComp').value,
        region: document.getElementById('filterRegion') ? document.getElementById('filterRegion').value : 'all', // Lấy Region
        startDate: document.getElementById('filterStart').value,
        endDate: document.getElementById('filterEnd').value,
        mode: document.getElementById('calcMode').value,
        deckSearch: document.getElementById('searchDeck').value.toLowerCase()
    };

    currentStats = MetaEngine.calculateStats(rawData, filters);
    const header = document.getElementById('usage-column-header');
    if (header) header.innerText = filters.mode === 'total' ? 'Tổng số bản copy' : 'Số lượt dùng';

    triggerUsageRender();
    triggerWinrateOnlyRender();
    renderTableOnly();
    
    const filteredDecksList = filters.deckSearch 
        ? rawData.decks.filter(d => d.name.toLowerCase().includes(filters.deckSearch))
        : rawData.decks;

    charts.deckRank = renderDeckRanking('deckRankingChart', { ...rawData, decks: filteredDecksList }, charts.deckRank, 10);
}

// Tìm và thay thế hàm này trong js/analysis-main.js
export function triggerWinrateOnlyRender() {
    if (!currentStats || !currentStats.cards) return;

    const colorFilter = document.getElementById('filterWinrateColor').value;
    const viewMode = document.getElementById('topCardMode').value; 
    
    // 1. Lọc theo màu
    let displayData = [...currentStats.cards];
    if (colorFilter !== 'all') {
        displayData = displayData.filter(c => 
            c.color && c.color.toString().toUpperCase() === colorFilter.toUpperCase()
        );
    }

    // 2. Sắp xếp giảm dần dựa trên chế độ đang chọn
    displayData.sort((a, b) => {
        if (viewMode === 'winrate') {
            return parseFloat(b.avgWinrate) - parseFloat(a.avgWinrate);
        } else {
            return b.useCount - a.useCount;
        }
    });

    // 3. Lấy Top 10 và vẽ biểu đồ
    const top10 = displayData.slice(0, 10);
    charts.winrate = renderWinrateChart('winrateBarChart', top10, charts.winrate);
}
export function analyzeQuantity(cardId, cardName) {
    const qtyStats = MetaEngine.calculateQuantityStats(rawData, cardId);
    const section = document.getElementById('quantity-analysis');
    if (!section) return;
    section.classList.remove('hidden');
    document.getElementById('qty-title').innerText = `Phân tích: ${cardName}`;
    document.getElementById('qty-table-body').innerHTML = qtyStats.map(q => `
        <tr><td><strong>${q.quantity} bản</strong></td><td>${q.count} deck</td><td>${q.avgWinrate}%</td></tr>
    `).join('');

    const ctxQty = document.getElementById('qtyWinrateChart').getContext('2d');
    if (charts.qty) charts.qty.destroy();
    charts.qty = new Chart(ctxQty, {
        type: 'bar',
        data: {
            labels: qtyStats.map(q => `${q.quantity} bản`),
            datasets: [{ label: 'Winrate TB (%)', data: qtyStats.map(q => q.avgWinrate), backgroundColor: '#2563eb' }]
        },
        options: { scales: { y: { beginAtZero: true, max: 100 } }, maintainAspectRatio: false }
    });
    renderDeckComposition('deck-comp-container', cardId, rawData);
    section.scrollIntoView({ behavior: 'smooth' });
}