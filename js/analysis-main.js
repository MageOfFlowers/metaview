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

/**
 * Hàm render tổng: Chạy khi đổi Giải đấu, Ngày tháng hoặc Chế độ tính
 */
export function render() {
    if (!rawData.cards || rawData.cards.length === 0) return;

    const filters = {
        compId: document.getElementById('filterComp').value,
        startDate: document.getElementById('filterStart').value,
        endDate: document.getElementById('filterEnd').value,
        mode: document.getElementById('calcMode').value
    };

    // 1. Tính toán lại dữ liệu thống kê dựa trên filter chính
    currentStats = MetaEngine.calculateStats(rawData, filters);
    
    if (!currentStats) return;

    // 2. Cập nhật giao diện tiêu đề bảng
    const header = document.getElementById('usage-column-header');
    if (header) {
        header.innerText = filters.mode === 'total' ? 'Tổng số bản copy' : 'Số lượt dùng';
    }

    // 3. Vẽ các biểu đồ
    triggerUsageRender();       // Biểu đồ tròn (Tỷ lệ sử dụng)
    triggerWinrateOnlyRender(); // Biểu đồ cột (Top 10 Winrate)
    
    // Biểu đồ Ranking (Xếp hạng Deck)
    charts.deckRank = renderDeckRanking('deckRankingChart', rawData, charts.deckRank);

    // 4. Vẽ bảng danh sách thẻ bài
    renderTable();
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
export function triggerWinrateOnlyRender() {
    if (!currentStats || !currentStats.cards) return;

    const colorFilter = document.getElementById('filterWinrateColor').value;
    
    // Lọc dữ liệu từ kết quả đã tính toán sẵn
    let displayData = [...currentStats.cards];

    if (colorFilter !== 'all') {
        displayData = displayData.filter(c => 
            c.color && c.color.toString().toUpperCase() === colorFilter.toUpperCase()
        );
    }

    // Luôn lấy Top 10 Winrate cao nhất của tập đã lọc
    displayData.sort((a, b) => parseFloat(b.avgWinrate) - parseFloat(a.avgWinrate));
    const top10 = displayData.slice(0, 10);

    // Vẽ biểu đồ
    charts.winrate = renderWinrateChart('winrateBarChart', top10, charts.winrate);
}

/**
 * Vẽ bảng danh sách meta thẻ bài
 */
function renderTable() {
    const tbody = document.getElementById('meta-body');
    const searchInput = document.getElementById('searchCard');
    const searchValue = searchInput ? searchInput.value.toLowerCase() : "";

    if (!tbody || !currentStats) return;

    // Lọc theo từ khóa tìm kiếm
    const filtered = currentStats.cards.filter(c => 
        c.name && c.name.toLowerCase().includes(searchValue)
    );

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Không có dữ liệu phù hợp</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(s => `
        <tr onclick="window.analyzeQuantity(${s.id}, '${s.name.replace(/'/g, "\\'")}')" class="clickable-row">
            <td>
                <span class="card-tooltip">
                    <strong>${s.name} 🔍</strong>
                    <img src="${s.url || 'https://via.placeholder.com/200x280'}" class="tooltip-img">
                </span>
            </td>
            <td><span class="badge" style="background:${MetaEngine.getColorCode(s.color)}">${s.color || ''}</span></td>
            <td><span class="badge" style="background:${MetaEngine.getRarityColor(s.rarity)}">${s.rarity || ''}</span></td>
            <td>${s.useCount}</td>
            <td>${s.avgWinrate}%</td>
        </tr>
    `).join('');
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