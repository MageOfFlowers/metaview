import { MetaEngine } from '../meta-engine.js';

export function renderRarityChart(canvasId, stats, currentChart = null) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (currentChart) currentChart.destroy();

    const rarityKeys = Object.keys(stats.rarities);

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: rarityKeys,
            datasets: [{
                data: rarityKeys.map(k => stats.rarities[k]),
                backgroundColor: rarityKeys.map(k => MetaEngine.getRarityColor(k))
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } }
        }
    });
}