import { MetaEngine } from '../meta-engine.js';

export function renderUsageChart(canvasId, stats, mode, currentChart) {
    if (currentChart) currentChart.destroy();
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    let labels, data, colors;

    if (mode === 'color') {
        labels = Object.keys(stats.colors);
        data = Object.values(stats.colors);
        colors = labels.map(k => MetaEngine.getColorCode(k));
    } else {
        // Sắp xếp Rarity: SCR > EX > 5S > UR > SR > R > U > C
        labels = Object.keys(stats.rarities).sort((a, b) => 
            (MetaEngine.RARITY_ORDER[a] || 99) - (MetaEngine.RARITY_ORDER[b] || 99)
        );
        data = labels.map(k => stats.rarities[k]);
        colors = labels.map(k => MetaEngine.getRarityColor(k));
    }

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: colors }]
        },
        options: { 
            maintainAspectRatio: false, 
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12 } } } 
        }
    });
}