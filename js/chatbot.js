document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('than-tich-chatbot');
    if (!container) return;

    // 1. Tự động chèn CSS cần thiết để đảm bảo hiển thị
    const style = document.createElement('style');
    style.innerHTML = `
        #chatbot-container { position: fixed; bottom: 20px; right: 20px; z-index: 999999; font-family: sans-serif; }
        #chat-circle { width: 60px; height: 60px; border-radius: 50%; background: #4e73df; color: white; border: none; cursor: pointer; font-size: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
        #chat-circle:hover { transform: scale(1.1); }
        .chat-box { display: none; width: 350px; max-width: 90vw; height: 500px; max-height: 70vh; background: white; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); flex-direction: column; overflow: hidden; border: 1px solid #ddd; }
        .chat-header { background: #4e73df; color: white; padding: 15px; display: flex; justify-content: space-between; align-items: center; font-weight: bold; }
        .chat-close { cursor: pointer; font-size: 20px; padding: 0 5px; }
        .chat-body { flex: 1; padding: 15px; overflow-y: auto; background: #f8f9fc; display: flex; flex-direction: column; gap: 10px; }
        .chat-footer { padding: 10px; border-top: 1px solid #eee; display: flex; gap: 5px; }
        .chat-footer input { flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 8px 15px; outline: none; }
        .chat-footer button { background: none; border: none; cursor: pointer; font-size: 18px; color: #4e73df; }
        .msg { padding: 8px 12px; border-radius: 15px; font-size: 14px; max-width: 80%; line-height: 1.4; }
        .msg.bot { background: white; align-self: flex-start; border: 1px solid #e3e6f0; }
        .msg.user { background: #4e73df; color: white; align-self: flex-end; }
        .data-card { background: #fff; border-left: 4px solid #1cc88a; padding: 8px; margin-top: 5px; font-size: 13px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    `;
    document.head.appendChild(style);

    // 2. Chèn cấu trúc HTML
    container.innerHTML = `
        <div id="chatbot-container">
            <button id="chat-circle">💬</button>
            <div class="chat-box" id="chat-box">
                <div class="chat-header">
                    <span>Thần Tích Assistant</span>
                    <span class="chat-close" id="chat-close">×</span>
                </div>
                <div class="chat-body" id="chat-body">
                    <div class="msg bot">Chào bạn! Tôi có thể giúp gì về dữ liệu Meta-game?</div>
                </div>
                <form class="chat-footer" id="chat-form">
                    <input type="text" id="chat-input" placeholder="Nhập tin nhắn..." autocomplete="off">
                    <button type="submit">📩</button>
                </form>
            </div>
        </div>
    `;

    const circle = document.getElementById('chat-circle');
    const box = document.getElementById('chat-box');
    const close = document.getElementById('chat-close');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const body = document.getElementById('chat-body');

    // Logic Đóng/Mở
    circle.onclick = () => { box.style.display = 'flex'; circle.style.display = 'none'; };
    close.onclick = () => { box.style.display = 'none'; circle.style.display = 'flex'; };

    // Logic Gửi Tin & Gọi API
    form.onsubmit = async (e) => {
        e.preventDefault();
        const msg = input.value.trim();
        if (!msg) return;

        appendMsg(msg, 'user');
        input.value = '';

        const loading = appendMsg("Đang truy vấn...", 'bot');

        try {
            const res = await fetch('https://metaanalyse.onrender.com/api/chat/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            });
            const data = await res.json();
            loading.remove();

            let responseHTML = `<div>${data.reply}</div>`;
            if (data.data) {
                data.data.forEach(item => {
                    if (item.username) responseHTML += `<div class="data-card">👤 <b>${item.username}</b>: Winrate ${item.winrate}%</div>`;
                    if (item.name && item.rarity) responseHTML += `<div class="data-card">🃏 <b>${item.name}</b> (${item.rarity}): ${item.winrate}%</div>`;
                    if (item.usage_count) responseHTML += `<div class="data-card">🎴 <b>${item.name}</b>: Winrate ${item.avg_winrate}%</div>`;
                });
            }
            appendMsg(responseHTML, 'bot');
        } catch (err) {
            loading.innerText = "Lỗi kết nối API.";
        }
    };

    function appendMsg(content, type) {
        const div = document.createElement('div');
        div.className = `msg ${type}`;
        div.innerHTML = content;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
        return div;
    }
});