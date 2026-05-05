document.addEventListener('DOMContentLoaded', function() {
    const chatbotContainer = document.getElementById('than-tich-chatbot');
    
    // Nếu trang web có thẻ này thì mới khởi tạo chatbot
    if (chatbotContainer) {
        renderChatbot(chatbotContainer);
        initChatbotLogic();
    }
});

// Hàm tạo cấu trúc HTML
function renderChatbot(container) {
    const html = `
        <div id="chatbot-widget">
            <button id="chat-circle" class="btn">
                <span class="chat-icon">💬</span>
            </button>
            <div class="chat-box">
                <div class="chat-box-header">
                    Thần Tích Assistant
                    <span class="chat-box-toggle">×</span>
                </div>
                <div class="chat-box-body">
                    <div class="chat-logs">
                        <div class="chat-msg bot">
                            <div class="cm-msg-text">Chào mừng bạn! Tôi có thể giúp gì cho Meta-game hôm nay?</div>
                        </div>
                    </div>
                </div>
                <div class="chat-input">
                    <form id="chat-form">
                        <input type="text" id="chat-input-field" placeholder="Gửi tin nhắn..."/>
                        <button type="submit" class="chat-submit">📩</button>
                    </form>
                </div>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

// Hàm xử lý logic đóng/mở và gửi tin
function initChatbotLogic() {
    const chatForm = document.getElementById('chat-form');
    const chatInputField = document.getElementById('chat-input-field');
    const chatLogs = document.querySelector('.chat-logs');

    chatForm.onsubmit = async (e) => {
        e.preventDefault();
        const msg = chatInputField.value.trim();
        if (!msg) return;

        // 1. Hiển thị tin nhắn của User
        appendMessage(msg, 'user', chatLogs);
        chatInputField.value = '';

        // 2. Hiển thị trạng thái đang xử lý
        const loadingId = "loading-" + Date.now();
        appendMessage("Đang truy vấn dữ liệu...", 'bot', chatLogs, loadingId);

        try {
            // 3. Gọi API
            const response = await fetch('https://metaanalyse.onrender.com/api/chat/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: msg })
            });

            const result = await response.json();
            
            // Xóa dòng loading
            document.getElementById(loadingId)?.remove();

            // 4. Hiển thị câu trả lời text
            let botResponseHTML = `<div>${result.reply}</div>`;

            // 5. Xử lý mảng data trả về (User, Card, Deck)
            if (result.data && result.data.length > 0) {
                result.data.forEach(item => {
                    botResponseHTML += renderDataCard(item);
                });
            }

            appendMessage(botResponseHTML, 'bot', chatLogs);

        } catch (error) {
            document.getElementById(loadingId)?.remove();
            appendMessage("Rất tiếc, đã có lỗi kết nối với hệ thống Thần Tích.", 'bot', chatLogs);
            console.error("API Error:", error);
        }
    };
}

// Hàm phân loại và hiển thị Card dữ liệu
function renderDataCard(item) {
    // Kiểm tra xem là loại dữ liệu nào dựa vào các field đặc trưng
    if (item.username) { // Loại User
        return `
            <div class="data-card">
                <strong>👤 Người chơi:</strong> ${item.username}<br>
                Tỷ lệ thắng: <span class="winrate-high">${item.winrate}%</span><br>
                Rank TB: ${parseFloat(item.avg_rank).toFixed(2)} | Trận: ${item.match_count}
            </div>`;
    } 
    else if (item.rarity) { // Loại Card
        return `
            <div class="data-card">
                <strong>🃏 Thẻ bài:</strong> ${item.name} (<span class="rarity-${item.rarity}">${item.rarity}</span>)<br>
                Màu: ${item.color} | Winrate: ${item.winrate}%<br>
                Số lần dùng: ${item.use_count}
            </div>`;
    }
    else if (item.usage_count) { // Loại Deck
        return `
            <div class="data-card">
                <strong>🎴 Bộ bài:</strong> ${item.name}<br>
                Winrate TB: <span class="winrate-high">${item.avg_winrate}%</span><br>
                Rank TB: ${parseFloat(item.avg_rank).toFixed(2)}
            </div>`;
    }
    return '';
}

function appendMessage(content, type, container, id = null) {
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;
    if(id) div.id = id;
    div.innerHTML = `<div class="cm-msg-text">${content}</div>`;
    container.appendChild(div);
    
    const body = document.querySelector('.chat-box-body');
    body.scrollTop = body.scrollHeight;
}