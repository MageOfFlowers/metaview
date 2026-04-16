// js/analysis-main.js
import { request } from './api.js';
import { MetaEngine } from './meta-engine.js';
import { renderWinrateChart } from './charts/winrate-chart.js';
import { renderDeckRanking } from './charts/deck-ranking.js';
import { renderDeckComposition } from './charts/deck-analysis.js';
import { renderUsageChart } from './charts/usage-charts.js';

let rawData = { cards: [], compUses: [], deckInfos: [], decks: [], competitions: [] };
let currentStats = null; 
let charts = { usage: null, winrate: null, qty: null, deckRank: null, playerRank: null };
let metaCurrentPage = 1;
const metaPageSize = 10;

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
    
    metaCurrentPage = 1;
    const playerStats = MetaEngine.calculatePlayerStats(currentStats.filteredUses);
    
    triggerUsageRender();
    triggerWinrateOnlyRender();
    charts.deckRank = renderDeckRanking('deckRankingChart', rawData, charts.deckRank, 10);
    triggerPlayerRender(playerStats); // Gọi hàm render biểu đồ và bảng người chơi
    renderTableOnly();
}

function triggerPlayerRender(playerStats) {
    const ctx = document.getElementById('playerRankingChart');
    if (!ctx) return;

    // Chỉ lấy Top 10 người chơi có Winrate cao nhất
    const topPlayers = playerStats.sort((a, b) => b.avgWinrate - a.avgWinrate).slice(0, 10);

    if (charts.playerRank) charts.playerRank.destroy();

    // Tạo biểu đồ kết hợp (bar và line)
    charts.playerRank = new Chart(ctx.getContext('2d'), {
        type: 'bar', // Mặc định là bar chart
        data: {
            labels: topPlayers.map(p => p.name), // Trục X là tên người chơi
            datasets: [
                { 
                    label: 'Winrate (%)', 
                    data: topPlayers.map(p => p.avgWinrate), 
                    backgroundColor: '#10b981', // Màu cột Winrate
                    yAxisID: 'y' // Trục Y bên trái cho Winrate
                },
                { 
                    label: 'Số Deck', 
                    data: topPlayers.map(p => p.deckCount), 
                    type: 'line', // Chuyển thành line chart cho số lượng Deck
                    borderColor: '#f59e0b', // Màu đường số Deck
                    yAxisID: 'y1' // Trục Y bên phải cho số lượng Deck
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { // Trục Y bên trái cho Winrate
                    beginAtZero: true,
                    position: 'left',
                    ticks: { callback: value => value + '%' } // Hiển thị đơn vị %
                },
                y1: { // Trục Y bên phải cho số lượng Deck
                    beginAtZero: true,
                    position: 'right',
                    grid: { drawOnChartArea: false }, // Không vẽ đường lưới của trục Y bên phải trên khu vực biểu đồ
                    ticks: { callback: value => value } // Hiển thị số nguyên
                },
                x: { // Trục X
                    ticks: {
                        autoSkip: true, // Tự động ẩn bớt nhãn nếu quá nhiều
                        maxRotation: 45, // Góc xoay tối đa là 45 độ
                        minRotation: 45 // Góc xoay tối thiểu là 45 độ
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top', // Vị trí chú giải
                    labels: {
                        usePointStyle: true // Sử dụng điểm thay vì ô vuông cho chú giải
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + (context.datasetIndex === 0 ? '%' : '');
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    // Render dữ liệu cho bảng "Hall of Fame"
    const honorBody = document.getElementById('player-honor-body');
    if (honorBody) {
        if (playerStats.length === 0) {
            honorBody.innerHTML = '<tr><td colspan="3">Không có dữ liệu người chơi</td></tr>';
        } else {
            // Sắp xếp người chơi theo hạng cao nhất
            const bestRankPlayers = playerStats.filter(p => p.bestRank !== '-').sort((a, b) => a.bestRank - b.bestRank).slice(0, 10);
            
            honorBody.innerHTML = bestRankPlayers.map(p => `
                <tr>
                    <td><strong>${p.name}</strong></td>
                    <td>Hạng ${p.bestRank}</td>
                    <td>${p.totalGames} giải</td>
                </tr>
            `).join('');
        }
    }
}

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
export function renderTableOnly() {
    const body = document.getElementById('meta-body');
    const paginationContainer = document.getElementById('meta-pagination'); // Cần thêm thẻ này trong HTML
    if (!body || !currentStats?.cards) return;

    const searchTerm = document.getElementById('searchCard')?.value.toLowerCase() || "";
    
    // 1. Lọc dữ liệu theo tìm kiếm
    const filteredData = currentStats.cards.filter(c => c.name.toLowerCase().includes(searchTerm));

    // 2. Tính toán phân trang
    const totalPages = Math.ceil(filteredData.length / metaPageSize);
    
    // Đảm bảo trang hiện tại không vượt quá tổng số trang sau khi lọc
    if (metaCurrentPage > totalPages && totalPages > 0) metaCurrentPage = totalPages;
    if (metaCurrentPage < 1) metaCurrentPage = 1;

    const startIndex = (metaCurrentPage - 1) * metaPageSize;
    const paginatedData = filteredData.slice(startIndex, startIndex + metaPageSize);

    // 3. Render nội dung bảng
    body.innerHTML = paginatedData.map(card => `
        <tr style="cursor:pointer" 
            onclick="analyzeQuantity(${card.id}, '${card.name.replace(/'/g, "\\'")}')"
            onmousemove="handleTooltip(event, true)" 
            onmouseleave="handleTooltip(event, false)">
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

    // 4. Render bộ điều khiển phân trang
    if (paginationContainer) {
        renderPaginationControls(paginationContainer, totalPages);
    }
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