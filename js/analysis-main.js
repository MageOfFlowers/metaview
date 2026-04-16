// js/analysis-main.js
import { request } from './api.js';
import { MetaEngine } from './meta-engine.js';
import { renderWinrateChart } from './charts/winrate-chart.js';
import { renderDeckRanking } from './charts/deck-ranking.js';
import { renderDeckComposition } from './charts/deck-analysis.js';
import { renderUsageChart } from './charts/usage-charts.js';
import { renderPlayerRanking } from './charts/player-ranking.js'; // Giả định file đã tách

let rawData = { cards: [], compUses: [], deckInfos: [], decks: [], competitions: [], users: [] };
let currentStats = null; 
let charts = { usage: null, winrate: null, qty: null, deckRank: null, playerRank: null };
let metaCurrentPage = 1;
const metaPageSize = 10;

export async function initAnalysis() {
    try {
        // Fetch đầy đủ dữ liệu bao gồm cả users để map tên người chơi
        const [cards, uses, infos, comps, decks, users] = await Promise.all([
            request('/cards'), 
            request('/competition-use'), 
            request('/deck-infos'),
            request('/competitions'), 
            request('/decksget'),
            request('/users')
        ]);
        
        rawData = { cards, compUses: uses, deckInfos: infos, decks, competitions: comps, users };

        const fComp = document.getElementById('filterComp');
        if (comps && fComp) {
            fComp.innerHTML = '<option value="all">Tất cả giải đấu</option>' + 
                comps.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }

        // Đăng ký các hàm vào window để gọi từ HTML
        Object.assign(window, {
            triggerRender: render,
            triggerUsageRender,
            triggerWinrateOnlyRender,
            triggerPlayerRender,
            renderTableOnly,
            analyzeQuantity
        });
        
        render(); 
    } catch (err) { 
        console.error("Lỗi khởi tạo analysis:", err); 
    }
}

export function render() {
    const filters = {
        compId: document.getElementById('filterComp').value,
        region: document.getElementById('filterRegion').value,
        startDate: document.getElementById('filterStart').value,
        endDate: document.getElementById('filterEnd').value,
        mode: document.getElementById('calcMode').value
    };

    // 1. Tính toán stats dựa trên filter
    currentStats = MetaEngine.calculateStats(rawData, filters);
    
    // 2. Render các biểu đồ cơ bản
    triggerUsageRender();
    triggerWinrateOnlyRender();
    
    // 3. Render Xếp hạng Deck - Truyền filteredUses để không bị mất data khi filter
    charts.deckRank = renderDeckRanking('deckRankingChart', rawData, currentStats.filteredUses, charts.deckRank);
    
    // 4. Render Xếp hạng Người chơi
    triggerPlayerRender();
    
    // 5. Render bảng danh sách meta
    renderTableOnly();
}

/**
 * Render Xếp hạng Người chơi với chế độ xem thay đổi
 */
export function triggerPlayerRender() {
    if (!currentStats || !currentStats.filteredUses) return;
    
    // Gọi hàm render từ file logic riêng đã tách
    charts.playerRank = renderPlayerRanking(
        'playerRankingChart', 
        currentStats.filteredUses, 
        rawData, 
        charts.playerRank
    );
}

export function triggerUsageRender() {
    if (!currentStats) return;
    const mode = document.getElementById('usageViewMode').value;
    charts.usage = renderUsageChart('usageTypeChart', currentStats, mode, charts.usage);
}

export function triggerWinrateOnlyRender() {
    if (!currentStats) return;
    const mode = document.getElementById('topCardMode').value;
    const color = document.getElementById('filterWinrateColor').value;
    let data = [...currentStats.cards];
    
    if (color !== 'all') data = data.filter(c => c.color === color);
    
    data.sort((a, b) => (mode === 'winrate') ? (b.avgWinrate - a.avgWinrate) : (b.useCount - a.useCount));
    charts.winrate = renderWinrateChart('winrateBarChart', data.slice(0, 10), charts.winrate);
}

export function renderTableOnly() {
    const body = document.getElementById('meta-body');
    const paginationContainer = document.getElementById('meta-pagination');
    if (!body || !currentStats?.cards) return;

    const searchTerm = document.getElementById('searchCard')?.value.toLowerCase() || "";
    const filteredData = currentStats.cards.filter(c => c.name.toLowerCase().includes(searchTerm));
    const totalPages = Math.ceil(filteredData.length / metaPageSize);
    
    if (metaCurrentPage > totalPages && totalPages > 0) metaCurrentPage = totalPages;

    const startIndex = (metaCurrentPage - 1) * metaPageSize;
    const paginatedData = filteredData.slice(startIndex, startIndex + metaPageSize);

    body.innerHTML = paginatedData.map(card => `
        <tr style="cursor:pointer" onclick="analyzeQuantity(${card.id}, '${card.name.replace(/'/g, "\\'")}')">
            <td>
                <div class="card-tooltip" onmousemove="handleTooltip(event, true)" onmouseleave="handleTooltip(event, false)">
                    ${card.name}
                    <img src="${card.url || 'placeholder.jpg'}" class="fixed-tooltip-img">
                </div>
            </td>
            <td><span class="badge" style="background:${MetaEngine.getColorCode(card.color)}">${card.color || '-'}</span></td>
            <td>${card.rarity || '-'}</td>
            <td>${card.useCount}</td>
            <td>${card.avgWinrate}%</td>
        </tr>
    `).join('');

    if (paginationContainer) renderPaginationControls(paginationContainer, totalPages);
}

function renderPaginationControls(container, totalPages) {
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    container.innerHTML = `
        <div class="pagination-wrapper" style="display: flex; justify-content: center; gap: 15px; margin-top: 15px;">
            <button class="btn-nav" ${metaCurrentPage === 1 ? 'disabled' : ''} id="prevMetaPage">◀ Trước</button>
            <span>Trang ${metaCurrentPage} / ${totalPages}</span>
            <button class="btn-nav" ${metaCurrentPage === totalPages ? 'disabled' : ''} id="nextMetaPage">Sau ▶</button>
        </div>
    `;

    document.getElementById('prevMetaPage')?.addEventListener('click', () => { metaCurrentPage--; renderTableOnly(); });
    document.getElementById('nextMetaPage')?.addEventListener('click', () => { metaCurrentPage++; renderTableOnly(); });
}

window.handleTooltip = function(e, show) {
    const img = e.currentTarget.querySelector('.fixed-tooltip-img');
    if (!img) return;
    img.style.display = show ? 'block' : 'none';
    if (show) {
        let x = e.clientX + 15;
        let y = e.clientY - 120;
        if (x + 180 > window.innerWidth) x = e.clientX - 190;
        if (y < 0) y = 10;
        img.style.left = x + 'px';
        img.style.top = y + 'px';
    }
};

export function analyzeQuantity(cardId, cardName) {
    const qtyStats = MetaEngine.calculateQuantityStats(rawData, cardId);
    const section = document.getElementById('quantity-analysis');
    if (!section) return;

    section.classList.remove('hidden');
    document.getElementById('qty-title').innerText = `Phân tích chi tiết: ${cardName}`;
    
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

    if (typeof renderDeckComposition === 'function') {
        renderDeckComposition('deck-comp-container', cardId, rawData);
    }
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}