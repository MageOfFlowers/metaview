import { request } from './api.js';
import { MetaEngine } from './meta-engine.js';
import { renderWinrateChart } from './charts/winrate-chart.js';
import { renderDeckRanking } from './charts/deck-ranking.js';
import { renderDeckComposition } from './charts/deck-analysis.js';
import { renderUsageChart } from './charts/usage-charts.js';

let rawData = { cards: [], compUses: [], deckInfos: [], decks: [], competitions: [] };
let currentStats = null; 
let charts = { usage: null, winrate: null, qty: null, deckRank: null };

export async function initAnalysis() {
    try {
        const [cards, uses, infos, comps, decks] = await Promise.all([
            request('/cards'), request('/competition-use'), request('/deck-infos'),
            request('/competitions'), request('/decksget')
        ]);
        rawData = { cards, compUses: uses, deckInfos: infos, decks, competitions: comps };

        const fComp = document.getElementById('filterComp');
        if (comps && fComp) {
            fComp.innerHTML = '<option value="all">Tất cả giải đấu</option>' + 
                comps.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }

        // Gán các hàm vào window để gọi từ HTML
        Object.assign(window, {
            triggerRender: render,
            triggerUsageRender,
            triggerWinrateOnlyRender,
            renderTableOnly,
            analyzeQuantity
        });
        render(); 
    } catch (err) { console.error(err); }
}

export function render() {
    const filters = {
        compId: document.getElementById('filterComp').value,
        region: document.getElementById('filterRegion').value,
        startDate: document.getElementById('filterStart').value,
        endDate: document.getElementById('filterEnd').value,
        mode: document.getElementById('calcMode').value
    };
    currentStats = MetaEngine.calculateStats(rawData, filters);
    
    triggerUsageRender();
    triggerWinrateOnlyRender();
    charts.deckRank = renderDeckRanking('deckRankingChart', rawData, charts.deckRank, 10);
    renderTableOnly();
}

export function triggerUsageRender() {
    const mode = document.getElementById('usageViewMode').value;
    charts.usage = renderUsageChart('usageTypeChart', currentStats, mode, charts.usage);
}

export function triggerWinrateOnlyRender() {
    const mode = document.getElementById('topCardMode').value;
    const color = document.getElementById('filterWinrateColor').value;
    let data = [...currentStats.cards];
    if (color !== 'all') data = data.filter(c => c.color === color);
    
    data.sort((a, b) => (mode === 'winrate') ? (b.avgWinrate - a.avgWinrate) : (b.useCount - a.useCount));
    charts.winrate = renderWinrateChart('winrateBarChart', data.slice(0, 10), charts.winrate);
}

// js/analysis-main.js
export function renderTableOnly() {
    const body = document.getElementById('meta-body');
    if (!body || !currentStats?.cards) return;

    const searchInput = document.getElementById('searchCard');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
    const data = currentStats.cards.filter(c => c.name.toLowerCase().includes(searchTerm));

    body.innerHTML = data.map(card => `
        <tr style="cursor:pointer" 
            onclick="analyzeQuantity(${card.id}, '${card.name.replace(/'/g, "\\'")}')"
            onmousemove="handleTooltip(event, true)" 
            onmouseleave="handleTooltip(event, false)"
        >
            <td>
                <div class="card-tooltip">
                    ${card.name}
                    <img src="${card.url || 'placeholder.jpg'}" class="fixed-tooltip-img">
                </div>
            </td>
            <td>${card.color || '-'}</td>
            <td>${card.rarity || '-'}</td>
            <td>${card.useCount}</td>
            <td>${card.avgWinrate}%</td>
        </tr>
    `).join('');
}

// Hàm xử lý di chuyển và hiển thị tooltip bám theo chuột
window.handleTooltip = function(e, show) {
    const img = e.currentTarget.querySelector('.fixed-tooltip-img');
    if (!img) return;

    if (!show) {
        img.style.display = 'none';
        return;
    }

    img.style.display = 'block';
    
    // Tính toán vị trí: e.clientX/Y là tọa độ chuột so với màn hình
    let x = e.clientX + 20; // Cách chuột 20px bên phải
    let y = e.clientY - 100; // Nhấc lên 100px để không che dòng đang chọn

    // Kiểm tra nếu sát mép phải màn hình thì đẩy sang trái chuột
    if (x + 200 > window.innerWidth) {
        x = e.clientX - 220;
    }

    img.style.left = x + 'px';
    img.style.top = y + 'px';
};
export function analyzeQuantity(cardId, cardName) {
    const qtyStats = MetaEngine.calculateQuantityStats(rawData, cardId);
    const section = document.getElementById('quantity-analysis');
    if (!section) return;

    section.classList.remove('hidden');
    document.getElementById('qty-title').innerText = `Phân tích chi tiết: ${cardName}`;
    
    // Render bảng
    const tableBody = document.getElementById('qty-table-body');
    if (tableBody) {
        tableBody.innerHTML = qtyStats.map(q => `
            <tr>
                <td><strong>${q.quantity} bản</strong></td>
                <td>${q.count} bộ bài</td>
                <td>${q.avgWinrate}%</td>
            </tr>
        `).join('');
    }

    // Render biểu đồ (Đảm bảo responsive)
    const ctx = document.getElementById('qtyWinrateChart');
    if (ctx) {
        if (charts.qty) charts.qty.destroy();
        charts.qty = new Chart(ctx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: qtyStats.map(q => `${q.quantity} bản`),
                datasets: [{ label: 'Winrate (%)', data: qtyStats.map(q => q.avgWinrate), backgroundColor: '#2563eb' }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // FIX LỖI PC: Đảm bảo gọi render cấu trúc bộ bài mẫu
    if (typeof renderDeckComposition === 'function') {
        renderDeckComposition('deck-comp-container', cardId, rawData);
    }
    
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}