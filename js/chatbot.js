document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('than-tich-chatbot');
    if (!container) return;

    // 1. Tự động chèn CSS
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
        .msg { padding: 8px 12px; border-radius: 15px; font-size: 14px; max-width: 80%; line-height: 1.4; word-wrap: break-word; }
        .msg.bot { background: white; align-self: flex-start; border: 1px solid #e3e6f0; }
        .msg.user { background: #4e73df; color: white; align-self: flex-end; }
        .data-card { background: #fff; border-left: 4px solid #1cc88a; padding: 10px; margin-top: 5px; font-size: 13px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); border-radius: 4px; }
        .guide-img { width: 100%; border-radius: 5px; margin-top: 5px; cursor: pointer; border: 1px solid #eee; transition: 0.3s; }
        .guide-img:hover { opacity: 0.8; }
        .link-card a { color: #4e73df; text-decoration: none; font-weight: bold; font-size: 13px; }
        .app-btn { display: block; padding: 8px; margin-top: 8px; background: #eef2ff; border: 1px solid #4e73df; border-radius: 6px; text-align: center; color: #4e73df !important; text-decoration: none; transition: 0.2s; }
        .app-btn:hover { background: #4e73df; color: white !important; }
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
                    <div class="msg bot">Chào Duy! Tôi có thể giúp gì về dữ liệu Meta-game?</div>
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

    circle.onclick = () => { box.style.display = 'flex'; circle.style.display = 'none'; };
    close.onclick = () => { box.style.display = 'none'; circle.style.display = 'flex'; };

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
            
            const result = await res.json();
            loading.remove();

            let responseHTML = `<div>${result.reply}</div>`;
            
            if (result.data && result.data.length > 0) {
                result.data.forEach(item => {
                    responseHTML += renderAdvancedContent(item, result.action);
                });
            }

            appendMsg(responseHTML, 'bot');
        } catch (err) {
            loading.innerText = "Lỗi kết nối API.";
            console.error(err);
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

    function renderAdvancedContent(item, action) {
        // 1. Xử lý trường hợp Tải App (Nhiều link tách bởi ||)
        const rawLinks = item.link || item.staticData || "";
        if (action === 'APP' || rawLinks.includes('||')) {
            const links = rawLinks.split('||');
            let linksHTML = `<div class="data-card"><b>📥 Link tải ứng dụng:</b>`;
            links.forEach((url, index) => {
                let label = "Tải cho Windows"; 
                if (url.toLowerCase().includes('apk') || index === 1) label = "Tải cho Android";
                linksHTML += `<a href="${url.trim()}" target="_blank" class="app-btn">${label}</a>`;
            });
            return linksHTML + `</div>`;
        }

        // 2. Xử lý dữ liệu GUIDE (Counter/Build từ JSON)
        if (item.details) {
            try {
                const detailsValue = typeof item.details.value === 'string' 
                    ? JSON.parse(item.details.value) 
                    : item.details.value;

                // Ảnh khắc chế
                if (action === 'HOW_TO_COUNTER' || item.details.type === 'json') {
                    let imgs = `<div class="data-card">🎯 <b>${item.name}</b><br>`;
                    Object.values(detailsValue).forEach(url => {
                        if (typeof url === 'string' && url.startsWith('http')) {
                            imgs += `<img src="${url}" class="guide-img" onclick="window.open('${url}', '_blank')">`;
                        }
                    });
                    return imgs + `</div>`;
                }
                
                // Link Build Facebook
                if (action === 'HOW_TO_BUILD' || detailsValue.link) {
                    const link = detailsValue.link || "#";
                    return `
                        <div class="data-card link-card">
                            📘 <b>Hướng dẫn Build: ${item.name}</b><br>
                            <a href="${link}" target="_blank" rel="noopener noreferrer">🔗 Xem bài viết trên Facebook</a>
                        </div>`;
                }
            } catch (e) {
                console.error("Lỗi parse JSON:", e);
            }
        }

        // 3. Link tĩnh đơn giản
        if (item.link && !item.link.includes('||')) {
            return `
                <div class="data-card link-card">
                    <a href="${item.link}" target="_blank" rel="noopener noreferrer">🔗 Truy cập liên kết tại đây</a>
                </div>`;
        }

        // 4. Thống kê User/Card
        if (item.username) {
            return `<div class="data-card">👤 <b>${item.username}</b><br>Winrate: ${item.winrate}% | Trận: ${item.match_count}</div>`;
        } 
        
        if (item.name && (item.rarity || item.winrate)) {
            return `<div class="data-card">🃏 <b>${item.name}</b> ${item.rarity ? '('+item.rarity+')' : ''}<br>Winrate: ${item.winrate}% | Sử dụng: ${item.use_count || item.quantity || 0}</div>`;
        }

        return '';
    }
});