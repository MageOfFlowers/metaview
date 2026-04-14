import { request } from './api.js';
import { MetaEngine } from './meta-engine.js';
import { renderWinrateChart } from './charts/winrate-chart.js';
import { renderDeckRanking } from './charts/deck-ranking.js';
import { renderDeckComposition } from './charts/deck-analysis.js';

let rawData = { cards: [], compUses: [], deckInfos: [], decks: [] };
let currentStats = null; 
let charts = { usage: null, winrate: null, qty: null, deckRank: null };

export async function initAnalysis() {
    try {
        const [cards, uses, infos, comps, decks] = await Promise.all([
            request('/cards'),
            request('/competition-use'),
            request('/deck-infos'),
            request('/competitions'),
            request('/decksget') // Lưu ý: API của bạn là /decksget để lấy list
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

        // Đưa hàm ra global ĐÚNG CÁCH
        window.triggerRender = render; 
        window.analyzeQuantity = analyzeQuantity;

        render(); // Chạy lần đầu
    } catch (err) {
        console.error("Lỗi khởi tạo:", err);
    }
}

export function triggerRender() {
    const filters = {
        compId: document.getElementById('filterComp').value,
        startDate: document.getElementById('filterStart').value,
        endDate: document.getElementById('filterEnd').value,
        mode: document.getElementById('calcMode').value
    };

    // 1. Tính toán lại dữ liệu dựa trên filter tổng
    currentStats = MetaEngine.calculateStats(rawData, filters);

    // 2. Cập nhật giao diện tiêu đề bảng
    document.getElementById('usage-column-header').innerText = 
        filters.mode === 'total' ? 'Tổng số bản copy' : 'Số Deck sử dụng';

    // 3. Render các thành phần (Sử dụng dữ liệu trong currentStats)
    triggerUsageRender();       // Vẽ biểu đồ tròn
    triggerWinrateOnlyRender(); // Vẽ biểu đồ Winrate (Lần đầu là "Tất cả")
    charts.deckRank = renderDeckRanking('deckRankingChart', rawData, charts.deckRank);
    renderTable();              // Vẽ bảng danh sách
}

export function triggerUsageRender() {
    const viewMode = document.getElementById('usageViewMode').value;
    const ctx = document.getElementById('usageTypeChart').getContext('2d');
    if (charts.usage) charts.usage.destroy();

    let labels, data, colors;
    if (viewMode === 'color') {
        labels = Object.keys(currentStats.colors);
        data = Object.values(currentStats.colors);
        colors = labels.map(l => MetaEngine.getColorCode(l));
    } else {
        labels = Object.keys(currentStats.rarities).sort((a,b) => (MetaEngine.RARITY_ORDER[a]||99) - (MetaEngine.RARITY_ORDER[b]||99));
        data = labels.map(l => currentStats.rarities[l]);
        colors = labels.map(l => MetaEngine.getRarityColor(l));
    }

    charts.usage = new Chart(ctx, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: colors }] },
        options: { maintainAspectRatio: false }
    });
}

export function triggerWinrateOnlyRender() {
    // Nếu chưa có dữ liệu tổng thì không làm gì cả
    if (!currentStats || !currentStats.cards) return;

    const colorFilter = document.getElementById('filterWinrateColor').value;
    
    // Tạo bản sao dữ liệu từ currentStats (đã được lọc theo ngày/giải trước đó)
    let displayData = [...currentStats.cards];

    // Lọc theo màu nếu người dùng chọn R, G, P, hoặc Y
    if (colorFilter !== 'all') {
        displayData = displayData.filter(c => {
            if (!c.color) return false;
            return c.color.toString().toUpperCase() === colorFilter.toUpperCase();
        });
    }

    displayData.sort((a, b) => parseFloat(b.avgWinrate) - parseFloat(a.avgWinrate));
    const top10Data = displayData.slice(0, 10);

    // 5. Vẽ lại biểu đồ Winrate
    // charts.winrate là biến lưu trữ instance Chart.js để destroy() trước khi vẽ mới
    charts.winrate = renderWinrateChart('winrateBarChart', top10Data, charts.winrate);
}
function renderTable(search) {
    const tbody = document.getElementById('meta-body');
    const filtered = currentStats.cards.filter(c => c.name.toLowerCase().includes(search));
    tbody.innerHTML = filtered.map(s => `
        <tr onclick="window.analyzeQuantity(${s.id}, '${s.name}')" class="clickable-row">
            <td><span class="card-tooltip"><strong>${s.name} 🔍</strong><img src="${s.url || ''}" class="tooltip-img"></span></td>
            <td><span class="badge" style="background:${MetaEngine.getColorCode(s.color)}">${s.color}</span></td>
            <td><span class="badge" style="background:${MetaEngine.getRarityColor(s.rarity)}">${s.rarity}</span></td>
            <td>${s.useCount}</td>
            <td>${s.avgWinrate}%</td>
        </tr>
    `).join('');
}

function analyzeQuantity(cardId, cardName) {
    const qtyStats = MetaEngine.calculateQuantityStats(rawData, cardId);
    document.getElementById('quantity-analysis').classList.remove('hidden');
    document.getElementById('qty-title').innerText = `Phân tích: ${cardName}`;
    document.getElementById('qty-table-body').innerHTML = qtyStats.map(q => `<tr><td><strong>${q.quantity} bản</strong></td><td>${q.count} deck</td><td>${q.avgWinrate}%</td></tr>`).join('');

    const ctx = document.getElementById('qtyWinrateChart').getContext('2d');
    if(charts.qty) charts.qty.destroy();
    charts.qty = new Chart(ctx, {
        type: 'bar',
        data: { labels: qtyStats.map(q => `${q.quantity} bản`), datasets: [{ label: 'Winrate trung bình', data: qtyStats.map(q => q.avgWinrate), backgroundColor: '#2563eb' }] }
    });
    renderDeckComposition('deck-comp-container', cardId, rawData);
}

function render() {
    // Kiểm tra nếu dữ liệu thô chưa có thì thoát
    if (!rawData.cards || rawData.cards.length === 0) return;

    const filters = {
        compId: document.getElementById('filterComp').value,
        mode: document.getElementById('calcMode').value,
        winrateColor: document.getElementById('filterWinrateColor').value,
        search: document.getElementById('searchCard').value.toLowerCase()
    };

    // Tính toán stats từ MetaEngine
    const stats = MetaEngine.calculateStats(rawData, filters);
    
    if (!stats) return;

    // 1. Cập nhật tiêu đề cột
    const header = document.getElementById('usage-column-header');
    if (header) {
        header.innerText = filters.mode === 'total' ? 'Tổng số bản copy' : 'Số Deck sử dụng';
    }

    // 2. Vẽ các biểu đồ (giữ nguyên logic của bạn)
    charts.color = renderRarityChart('rarityUsageChart', stats, charts.color);
    
    let winrateCards = [...stats.cards];
    if (filters.winrateColor !== 'all') {
        winrateCards = winrateCards.filter(c => c.color === filters.winrateColor);
    }
    charts.winrate = renderWinrateChart('winrateBarChart', winrateCards, charts.winrate);
    charts.deckRank = renderDeckRanking('deckRankingChart', rawData, charts.deckRank);

    // 3. FIX LỖI HIỂN THỊ BẢNG:
    const tbody = document.getElementById('meta-body');
    if (!tbody) return;

    // Lọc theo từ khóa tìm kiếm
    const filteredCards = stats.cards.filter(c => 
        c.name && c.name.toLowerCase().includes(filters.search)
    );

    if (filteredCards.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Không tìm thấy dữ liệu phù hợp</td></tr>';
        return;
    }

    tbody.innerHTML = filteredCards.map(s => `
        <tr onclick="window.analyzeQuantity(${s.id}, '${s.name}')" class="clickable-row">
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