import { request } from './api.js';
import { MetaEngine } from './meta-engine.js';
import { renderWinrateChart } from './charts/winrate-chart.js';
import { renderDeckRanking } from './charts/deck-ranking.js';
import { renderUsageChart } from './charts/usage-charts.js';
import { renderPlayerRanking } from './charts/player-ranking.js';

let rawData = { cards: [], compUses: [], deckInfos: [], decks: [], competitions: [], users: [] };
let currentStats = null; 
let charts = { usage: null, winrate: null, deckRank: null, playerRank: null };
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

        window.triggerRender = render;
        window.triggerUsageRender = triggerUsageRender;
        window.triggerWinrateOnlyRender = triggerWinrateOnlyRender;
        window.triggerPlayerRender = () => {
            if(currentStats) charts.playerRank = renderPlayerRanking('playerRankingChart', currentStats.filteredUses, rawData, charts.playerRank);
        };
        window.renderTableOnly = renderTableOnly;

        render(); 
    } catch (err) { console.error("Lỗi khởi tạo analysis:", err); }
}

export function render() {
    // Kiểm tra an toàn để tránh lỗi "reading 'value'"
    const getVal = (id) => document.getElementById(id)?.value || 'all';

    const filters = {
        compId: getVal('filterComp'),
        region: getVal('filterRegion'),
        startDate: document.getElementById('filterStart')?.value || '',
        endDate: document.getElementById('filterEnd')?.value || '',
        mode: getVal('calcMode')
    };

    currentStats = MetaEngine.calculateStats(rawData, filters);
    
    triggerUsageRender();
    triggerWinrateOnlyRender();
    charts.deckRank = renderDeckRanking('deckRankingChart', rawData, currentStats.filteredUses, charts.deckRank);
    window.triggerPlayerRender();
    renderTableOnly();
}

function triggerUsageRender() {
    const mode = document.getElementById('usageViewMode')?.value || 'color';
    charts.usage = renderUsageChart('usageTypeChart', currentStats, mode, charts.usage);
}

function triggerWinrateOnlyRender() {
    const mode = document.getElementById('topCardMode')?.value || 'useCount';
    const color = document.getElementById('filterWinrateColor')?.value || 'all';
    let data = [...currentStats.cards];
    if (color !== 'all') data = data.filter(c => c.color === color);
    data.sort((a, b) => mode === 'winrate' ? b.avgWinrate - a.avgWinrate : b.useCount - a.useCount);
    charts.winrate = renderWinrateChart('winrateBarChart', data.slice(0, 10), charts.winrate);
}

function renderTableOnly() {
    const body = document.getElementById('meta-body');
    if (!body || !currentStats) return;
    const searchTerm = document.getElementById('searchCard')?.value.toLowerCase() || "";
    const filtered = currentStats.cards.filter(c => c.name.toLowerCase().includes(searchTerm));
    
    body.innerHTML = filtered.slice((metaCurrentPage-1)*metaPageSize, metaCurrentPage*metaPageSize).map(card => `
        <tr>
            <td>${card.name}</td>
            <td><span class="badge" style="background:${MetaEngine.getColorCode(card.color)}">${card.color}</span></td>
            <td>${card.rarity}</td>
            <td>${card.useCount}</td>
            <td>${card.avgWinrate}%</td>
        </tr>
    `).join('');
}