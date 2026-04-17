// js/analysis-main.js
import { request } from './api.js';
import { MetaEngine } from './meta-engine.js';
import { renderWinrateChart } from './charts/winrate-chart.js';
import { renderDeckRanking } from './charts/deck-ranking.js';
import { renderDeckComposition } from './charts/deck-analysis.js';
import { renderUsageChart } from './charts/usage-charts.js';
import { renderPlayerRanking } from './charts/player-ranking.js';
import { tooltipData } from './tooltips-content.js';

let rawData = { cards: [], compUses: [], deckInfos: [], decks: [], competitions: [] };
let currentStats = null; 
let charts = { usage: null, winrate: null, qty: null, deckRank: null, playerRank: null };
let metaCurrentPage = 1;
const metaPageSize = 10;

function setupTooltips() {
    const buttons = document.querySelectorAll('.info-btn');
    buttons.forEach(btn => {
        const key = btn.getAttribute('data-tip');
        if (tooltipData[key]) {
            // Gán nội dung từ file js vào thuộc tính data-tooltip để CSS hiển thị
            btn.setAttribute('data-tooltip', tooltipData[key]);
        }
    });
}

export async function initAnalysis() {
    try {
        const [cards, uses, infos, comps, decks, users] = await Promise.all([
            request('/cards'), request('/competition-use'), request('/deck-infos'),
            request('/competitions'), request('/decksget'),
            request('/users')
        ]);
        rawData = { cards, compUses: uses, deckInfos: infos, decks, competitions: comps, users };
        const fComp = document.getElementById('filterComp');
        if (comps && fComp) {
            fComp.innerHTML = '<option value="all">Tất cả giải đấu</option>' + 
                comps.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }

        Object.assign(window, {
            triggerRender: render,
            triggerUsageRender,
            triggerWinrateOnlyRender,
            renderTableOnly,
            analyzeQuantity
        });
        setupTooltips();
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

    // 1. Tính toán stats
    currentStats = MetaEngine.calculateStats(rawData, filters);
    
    // 2. Render Usage & Winrate
    triggerUsageRender();
    triggerWinrateOnlyRender();

    // 3. Render Deck Ranking (Sửa ID và truyền đủ filteredUses)
    charts.deckRank = renderDeckRanking(
        'deckRankChart', 
        rawData, 
        currentStats.filteredUses, 
        charts.deckRank, 
        10
    );
    
    // 4. Render Player Ranking
    triggerPlayerRender();
    
    renderTableOnly();
}

// Thống nhất 1 hàm trigger duy nhất
window.triggerPlayerRender = () => {
    if (!currentStats || !rawData) return;
    
    charts.playerRank = renderPlayerRanking(
        'playerRankChart', // Khớp với ID trong HTML
        currentStats.filteredUses, 
        rawData, 
        charts.playerRank
    );
};
    
// Thêm vào file analysis-main.js

window.updateDeckRankingOnly = () => {
    if (!currentStats || !rawData) return;
    
    // Gọi lại hàm vẽ với dữ liệu hiện có, không tính toán lại stats tổng
    charts.deckRank = renderDeckRanking(
        'deckRankChart', 
        rawData, 
        currentStats.filteredUses, 
        charts.deckRank, 
        10
    );
};
// ... Giữ nguyên các hàm triggerUsageRender, triggerWinrateOnlyRender, renderTableOnly, handleTooltip và analyzeQuantity từ file cũ của bạn ...

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

// js/analysis-main.js

export function renderTableOnly() {
    // Kiểm tra an toàn: đổi từ currentStats.cardStats thành currentStats.cards
    if (!currentStats || !currentStats.cards) {
        console.error("Dữ liệu currentStats.cards không tồn tại. Kiểm tra lại MetaEngine.calculateStats");
        return;
    }

    const tbody = document.getElementById('meta-body');
    // Lấy chế độ sắp xếp từ dropdown ở Danh sách Meta
    const sortMode = document.getElementById('metaSortMode')?.value || 'usage';
    const searchTerm = document.getElementById('searchCard')?.value.toLowerCase() || "";

    // 1. Lọc theo tìm kiếm (Sử dụng currentStats.cards)
    let displayData = currentStats.cards.filter(c => 
        c && c.name && c.name.toLowerCase().includes(searchTerm)
    );

    // 2. Sắp xếp dựa trên lựa chọn ở danh sách Meta
    if (sortMode === 'winrate') {
        displayData.sort((a, b) => (parseFloat(b.avgWinrate) || 0) - (parseFloat(a.avgWinrate) || 0));
    } else {
        displayData.sort((a, b) => (b.useCount || 0) - (a.useCount || 0));
    }

    // 3. Phân trang
    const totalPages = Math.ceil(displayData.length / metaPageSize);
    const start = (metaCurrentPage - 1) * metaPageSize;
    const pageData = displayData.slice(start, start + metaPageSize);

    // 4. Render bảng
    tbody.innerHTML = pageData.map(c => `
        <tr onclick="window.renderDeckDetail(${c.id}, '${c.name.replace(/'/g, "\\'")}')" style="cursor:pointer;">
            <td><strong>${c.name}</strong></td>
            <td><span class="badge" style="background:${MetaEngine.getColorCode(c.color)}">${c.color}</span></td>
            <td>${c.rarity}</td>
            <td>${c.useCount}</td>
            <td>${c.avgWinrate}%</td>
        </tr>
    `).join('');
    
    // Render pagination (Giả sử bạn đã có hàm này)
    renderPagination('meta-pagination', totalPages, metaCurrentPage, (p) => {
        metaCurrentPage = p;
        renderTableOnly();
    });
}

// Hàm bổ trợ render nút chuyển trang
function renderPaginationControls(container, totalPages) {
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="pagination-wrapper" style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 15px;">
            <button class="btn-nav" ${metaCurrentPage === 1 ? 'disabled' : ''} id="prevMetaPage">◀ Trước</button>
            <span style="font-size: 0.9rem; font-weight: bold;">Trang ${metaCurrentPage} / ${totalPages}</span>
            <button class="btn-nav" ${metaCurrentPage === totalPages ? 'disabled' : ''} id="nextMetaPage">Sau ▶</button>
        </div>
    `;

    document.getElementById('prevMetaPage')?.addEventListener('click', () => {
        metaCurrentPage--;
        renderTableOnly();
    });

    document.getElementById('nextMetaPage')?.addEventListener('click', () => {
        metaCurrentPage++;
        renderTableOnly();
    });
}
// Hàm xử lý di chuyển và hiển thị tooltip bám theo chuột
// Thêm vào đầu hoặc cuối file js/analysis-main.js

window.handleTooltip = function(e, show) {
    // Tìm ảnh tooltip bên trong element đang hover
    const img = e.currentTarget.querySelector('.fixed-tooltip-img');
    if (!img) return;

    if (!show) {
        img.style.display = 'none';
        return;
    }

    img.style.display = 'block';
    
    let x = e.clientX + 15;
    let y = e.clientY - 120;

    // Chống tràn màn hình bên phải
    if (x + 180 > window.innerWidth) {
        x = e.clientX - 190;
    }
    // Chống tràn màn hình phía trên
    if (y < 0) { y = 10; }

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

// Hàm vẽ thanh phân trang (Helper)
function renderPagination(containerId, totalPages, currentPage, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = `<div class="pagination" style="display: flex; justify-content: center; gap: 5px; margin-top: 15px;">`;
    
    // Nút Trước
    html += `<button class="btn-nav" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">◀</button>`;

    // Các số trang
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="btn-nav ${i === currentPage ? 'active' : ''}" 
                     style="${i === currentPage ? 'background: var(--primary); color: white;' : ''}" 
                     data-page="${i}">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span style="line-height: 30px;">...</span>`;
        }
    }

    // Nút Sau
    html += `<button class="btn-nav" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">▶</button>`;
    html += `</div>`;

    container.innerHTML = html;

    // Gán sự kiện click
    container.querySelectorAll('button[data-page]').forEach(btn => {
        btn.onclick = () => {
            const page = parseInt(btn.getAttribute('data-page'));
            if (page >= 1 && page <= totalPages) {
                onPageChange(page);
            }
        };
    });
}