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
            request('/decksget') // Sử dụng đúng endpoint lấy danh sách deck
        ]);

        rawData = { 
            cards: cards || [], 
            compUses: uses || [], 
            deckInfos: infos || [],
            decks: decks || []
        };

        // Đổ dữ liệu vào Select Giải đấu
        const fComp = document.getElementById('filterComp');
        if (comps && fComp) {
            fComp.innerHTML = '<option value="all">Tất cả giải đấu</option>';
            comps.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                fComp.appendChild(opt);
            });
        }

        // Đưa các hàm cần thiết ra global scope để HTML gọi được (onchange, onclick)
        window.triggerRender = render; 
        window.triggerUsageRender = triggerUsageRender;
        window.triggerWinrateOnlyRender = triggerWinrateOnlyRender;
        window.analyzeQuantity = analyzeQuantity;

        // Chạy render lần đầu
        render(); 
    } catch (err) {
        console.error("Lỗi khởi tạo ứng dụng:", err);
    }
}
export function triggerRender() {
    render();
}
function renderTable() {
    const tableBody = document.getElementById('meta-body');
    if (!tableBody || !currentStats || !currentStats.cards) return;

    const searchTerm = document.getElementById('searchCard').value.toLowerCase();
    
    // Lọc theo từ khóa tìm kiếm
    const filteredCards = currentStats.cards.filter(c => 
        c.name.toLowerCase().includes(searchTerm)
    );

    tableBody.innerHTML = filteredCards.map(card => `
        <tr class="clickable-row" onclick="analyzeQuantity(${card.id}, '${card.name}')">
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
/**
 * Chỉ vẽ lại biểu đồ Tỷ lệ sử dụng (khi đổi view Màu sắc/Độ hiếm)
 */
export function triggerUsageRender() {
    if (!currentStats) return;
    const viewMode = document.getElementById('usageViewMode').value;
    // ID canvas chuẩn trong html là usageTypeChart
    charts.usage = renderUsageChart('usageTypeChart', currentStats, viewMode, charts.usage);
}

/**
 * Chỉ vẽ lại biểu đồ Winrate (khi đổi filter màu của Winrate)
 */
export function renderTableOnly() {
    renderTable();
}

export function render() {
    if (!rawData.cards || rawData.cards.length === 0) return;

    const filters = {
        compId: document.getElementById('filterComp').value,
        startDate: document.getElementById('filterStart').value,
        endDate: document.getElementById('filterEnd').value,
        mode: document.getElementById('calcMode').value,
        deckSearch: document.getElementById('searchDeck').value.toLowerCase() // Filter mới cho Deck
    };

    currentStats = MetaEngine.calculateStats(rawData, filters);
    
    const header = document.getElementById('usage-column-header');
    if (header) header.innerText = filters.mode === 'total' ? 'Tổng số bản copy' : 'Số lượt dùng';

    triggerUsageRender();
    triggerWinrateOnlyRender();
    
    // Lọc dữ liệu deck trước khi vẽ Ranking
    let filteredDecks = rawData;
    if (filters.deckSearch) {
        filteredDecks = {
            ...rawData,
            decks: rawData.decks.filter(d => d.name.toLowerCase().includes(filters.deckSearch))
        };
    }

    charts.deckRank = renderDeckRanking('deckRankingChart', filteredDecks, charts.deckRank);
    renderTable();
}

export function triggerWinrateOnlyRender() {
    if (!currentStats || !currentStats.cards) return;

    const colorFilter = document.getElementById('filterWinrateColor').value;
    const viewMode = document.getElementById('topCardMode').value; // winrate hoặc rank
    
    let displayData = [...currentStats.cards];

    if (colorFilter !== 'all') {
        displayData = displayData.filter(c => 
            c.color && c.color.toString().toUpperCase() === colorFilter.toUpperCase()
        );
    }

    // Sắp xếp dựa trên chế độ xem
    if (viewMode === 'winrate') {
        displayData.sort((a, b) => parseFloat(b.avgWinrate) - parseFloat(a.avgWinrate));
    } else {
        // Giả sử useCount đại diện cho độ phổ biến/xếp hạng sử dụng
        displayData.sort((a, b) => b.useCount - a.useCount);
    }

    const top10 = displayData.slice(0, 10);
    charts.winrate = renderWinrateChart('winrateBarChart', top10, charts.winrate);
}

/**
 * Hàm phân tích chi tiết khi click vào một dòng trong bảng
 */
export function analyzeQuantity(cardId, cardName) {
    const qtyStats = MetaEngine.calculateQuantityStats(rawData, cardId);
    const section = document.getElementById('quantity-analysis');
    
    if (!section) return;
    section.classList.remove('hidden');
    document.getElementById('qty-title').innerText = `Phân tích: ${cardName}`;

    // Render bảng số lượng
    document.getElementById('qty-table-body').innerHTML = qtyStats.map(q => `
        <tr>
            <td><strong>${q.quantity} bản</strong></td>
            <td>${q.count} deck</td>
            <td>${q.avgWinrate}%</td>
        </tr>
    `).join('');

    // Vẽ biểu đồ phân tích số lượng (Bar chart)
    const ctxQty = document.getElementById('qtyWinrateChart').getContext('2d');
    if (charts.qty) charts.qty.destroy();
    
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
        options: {
            scales: { y: { beginAtZero: true, max: 100 } },
            maintainAspectRatio: false
        }
    });

    // Gọi module render cấu trúc bộ bài mẫu
    renderDeckComposition('deck-comp-container', cardId, rawData);
    
    // Cuộn xuống phần phân tích
    section.scrollIntoView({ behavior: 'smooth' });
}