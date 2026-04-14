import { MetaEngine } from '../meta-engine.js';

export function renderDeckRanking(canvasId, rawData, currentChart = null) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (currentChart) currentChart.destroy();

    const { compUses, deckInfos, cards } = rawData;

    // 1. Tính toán Winrate cho từng Deck
    const deckStats = {};
    compUses.forEach(use => {
        if (!deckStats[use.deckid]) {
            deckStats[use.deckid] = { id: use.deckid, totalWin: 0, count: 0 };
        }
        deckStats[use.deckid].totalWin += use.winrate;
        deckStats[use.deckid].count++;
    });

    // 2. Lấy Top 5 Deck mạnh nhất
    const topDecks = Object.values(deckStats)
        .map(d => ({
            ...d,
            avgWin: (d.totalWin / d.count).toFixed(1),
            // Lấy danh sách card trong deck này
            composition: deckInfos.filter(di => di.deckid === d.id)
        }))
        .sort((a, b) => b.avgWin - a.avgWin)
        .slice(0, 5);

    // 3. Chuẩn bị dữ liệu cho Stacked Bar Chart
    // Chúng ta sẽ tạo datasets dựa trên các cardID xuất hiện trong Top Decks
    const allCardIds = [...new Set(topDecks.flatMap(d => d.composition.map(c => c.cardid)))];
    
    const datasets = allCardIds.map(cid => {
        const cardInfo = cards.find(c => c.id == cid);
        return {
            label: cardInfo ? cardInfo.name : `Card ${cid}`,
            data: topDecks.map(d => {
                const item = d.composition.find(c => c.cardid == cid);
                return item ? item.quantity : 0;
            }),
            backgroundColor: MetaEngine.getColorCode(cardInfo ? cardInfo.color : 'G'),
            cardUrl: cardInfo ? cardInfo.url : '' // Lưu URL để dùng cho Tooltip
        };
    });

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: topDecks.map(d => `Deck #${d.id} (${d.avgWin}%)`),
            datasets: datasets
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { stacked: true, title: { display: true, text: 'Tổng số lượng Card' } },
                y: { stacked: true }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        // Hiển thị ảnh trong tooltip khi rê chuột vào thanh biểu đồ
                        label: function(context) {
                            return ` ${context.dataset.label}: ${context.raw} bản`;
                        }
                    }
                },
                legend: { display: false } // Tắt chú giải vì quá nhiều card sẽ làm rối
            }
        }
    });
}