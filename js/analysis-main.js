import { request } from './api.js';
import { MetaEngine } from './meta-engine.js';
import { renderWinrateChart } from './charts/winrate-chart.js';
import { renderDeckRanking } from './charts/deck-ranking.js';
import { renderDeckComposition } from './charts/deck-analysis.js';
import { renderUsageChart } from './charts/usage-charts.js';
import { renderPlayerRanking } from './charts/player-ranking.js';

let rawData = { cards: [], compUses: [], deckInfos: [], decks: [], competitions: [], users: [] };
let currentStats = null; 
let charts = { usage: null, winrate: null, qty: null, deckRank: null, playerRank: null };
let metaCurrentPage = 1;
const metaPageSize = 10;

export async function initAnalysis() {
    try {
        const [cards, uses, infos, comps, decks, users] = await Promise.all([
            request('/cards'), request('/competition-use'), request('/deck-infos'),
            request('/competitions'), request('/decksget'), request('/users')
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
            triggerPlayerRender: () => {
                charts.playerRank = renderPlayerRanking('playerRankingChart', currentStats.filteredUses, rawData, charts.playerRank);
            },
            renderTableOnly,
            analyzeQuantity
        });
        
        render(); 
    } catch (err) { console.error("Error:", err); }
}

export function render() {
    const filters = {
        compId: document.getElementById('filterComp').value,
        startDate: document.getElementById('filterStart').value,
        mode: document.getElementById('calcMode').value
    };

    currentStats = MetaEngine.calculateStats(rawData, filters);
    
    triggerUsageRender();
    triggerWinrateOnlyRender();
    
    // FIX: Truyền currentStats.filteredUses
    charts.deckRank = renderDeckRanking('deckRankingChart', rawData, currentStats.filteredUses, charts.deckRank);
    window.triggerPlayerRender();
    
    renderTableOnly();
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
    if (!body || !currentStats) return;
    const searchTerm = document.getElementById('searchCard').value.toLowerCase();
    const filtered = currentStats.cards.filter(c => c.name.toLowerCase().includes(searchTerm));
    
    body.innerHTML = filtered.slice((metaCurrentPage-1)*metaPageSize, metaCurrentPage*metaPageSize).map(card => `
        <tr onclick="analyzeQuantity(${card.id}, '${card.name.replace(/'/g, "\\'")}')">
            <td>${card.name}</td>
            <td><span class="badge" style="background:${MetaEngine.getColorCode(card.color)}">${card.color}</span></td>
            <td>${card.rarity}</td>
            <td>${card.useCount}</td>
            <td>${card.avgWinrate}%</td>
        </tr>
    `).join('');
}

export function analyzeQuantity(cardId, cardName) {
    const qtyStats = MetaEngine.calculateQuantityStats(rawData, cardId);
    const section = document.getElementById('quantity-analysis');
    section.classList.remove('hidden');
    document.getElementById('qty-title').innerText = `Chi tiết: ${cardName}`;
    
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
}