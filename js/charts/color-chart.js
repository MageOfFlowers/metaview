// js/charts/color-chart.js
import { MetaEngine } from '../meta-engine.js';

export function renderColorChart(canvasId, stats) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    const colors = ['R', 'P', 'Y', 'G'];
    
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Đỏ (R)', 'Tím (P)', 'Vàng (Y)', 'Xanh (G)'],
            datasets: [{
                data: colors.map(c => stats.colors[c].count),
                backgroundColor: colors.map(c => MetaEngine.getColorCode(c))
            }]
        },
        options: { maintainAspectRatio: false }
    });
}