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

export function renderTableOnly() {
    const body = document.getElementById('meta-body');
    const search = document.getElementById('searchCard').value.toLowerCase();
    const data = currentStats.cards.filter(c => c.name.toLowerCase().includes(search));

    body.innerHTML = data.map(card => `
        <tr style="cursor:pointer" onclick="analyzeQuantity(${card.id}, '${card.name.replace(/'/g, "\\'")}')">
            <td><span class="card-tooltip">${card.name}<img src="${card.url || 'placeholder.jpg'}" class="tooltip-img"></span></td>
            <td>${card.color || '-'}</td><td>${card.rarity || '-'}</td>
            <td>${card.useCount}</td><td>${card.avgWinrate}%</td>
        </tr>
    `).join('');
}

export function analyzeQuantity(cardId, cardName) {
    const qtyStats = MetaEngine.calculateQuantityStats(rawData, cardId);
    const section = document.getElementById('quantity-analysis');
    section.classList.remove('hidden');
    document.getElementById('qty-title').innerText = `Phân tích: ${cardName}`;
    document.getElementById('qty-table-body').innerHTML = qtyStats.map(q => `
        <tr><td><strong>${q.quantity} bản</strong></td><td>${q.count} deck</td><td>${q.avgWinrate}%</td></tr>
    `).join('');

    const ctx = document.getElementById('qtyWinrateChart').getContext('2d');
    if (charts.qty) charts.qty.destroy();
    charts.qty = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: qtyStats.map(q => `${q.quantity} bản`),
            datasets: [{ label: 'Winrate (%)', data: qtyStats.map(q => q.avgWinrate), backgroundColor: '#2563eb' }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
    renderDeckComposition('deck-comp-container', cardId, rawData);
    section.scrollIntoView({ behavior: 'smooth' });
}