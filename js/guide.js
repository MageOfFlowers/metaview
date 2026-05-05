document.addEventListener('DOMContentLoaded', () => {
    // Gọi đúng hàm render dữ liệu khi trang tải xong
    renderGuideData();
});

/**
 * Lấy dữ liệu từ API và render ra giao diện
 */

async function request(endpoint, method = 'GET', body = null) {
    try {
        const API_BASE = "https://metaanalyse.onrender.com/api";
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        // Chỉ thêm body nếu phương thức không phải GET và có dữ liệu body thực sự
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        
        if (!response.ok) {
            console.error(`Server trả về lỗi: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error("Lỗi kết nối mạng hoặc Server:", error);
        return null;
    }
}
async function renderGuideData() {
    // API_BASE trong hàm request đã có sẵn "/api", nên endpoint chỉ cần "/guide"
    const guides = await request('/guide');

    if (!guides) {
        const container = document.getElementById('counter-list');
        if (container) {
            container.innerHTML = '<div class="error">Không thể kết nối với máy chủ. Vui lòng thử lại sau.</div>';
        }
        return;
    }

    const counterContainer = document.getElementById('counter-list');
    if (!counterContainer) return;
    
    counterContainer.innerHTML = ''; // Xóa thông báo loading

    guides.forEach(guide => {
        // Lọc các guide có type là 'counter'
        if (guide.type === 'Counter') {
            const item = createCounterElement(guide);
            counterContainer.appendChild(item);
        }
        // Bạn có thể thêm xử lý cho guide.type === 'build' ở đây nếu cần
    });
}

/**
 * Tạo HTML cho từng mục Counter
 */
function createCounterElement(guide) {
    // Chuyển đổi Object details {"1": "url1", "2": "url2"} thành mảng [url1, url2]
    const imageUrls = guide.details ? Object.values(guide.details) : []; 

    const item = document.createElement('div');
    item.className = 'counter-item'; // Class này phải khớp với CSS của bạn
    item.innerHTML = `
        <div class="item-header" onclick="toggleExpand(this)">
            <h3>${guide.name}</h3>
            <div class="item-meta">
                <span class="badge">${imageUrls.length} Thẻ bài</span>
                <i class="fas fa-chevron-down arrow"></i>
            </div>
        </div>
        <div class="expand-content">
            <div class="slider">
                ${imageUrls.length > 1 ? `<button class="slide-btn prev" onclick="moveSlide(event, this, -1)">&#10094;</button>` : ''}
                <div class="slide-images">
                    ${imageUrls.map((url, index) => `
                        <img src="${url}" class="${index === 0 ? 'active' : ''}" alt="Card ${index + 1}">
                    `).join('')}
                </div>
                ${imageUrls.length > 1 ? `<button class="slide-btn next" onclick="moveSlide(event, this, 1)">&#10095;</button>` : ''}
            </div>
        </div>
    `;
    return item;
}

/**
 * Hàm đóng/mở nội dung bài viết
 */
function toggleExpand(headerElement) {
    // Tìm phần tử cha gần nhất có class .counter-item để toggle class .active
    const parent = headerElement.closest('.counter-item');
    if (parent) {
        parent.classList.toggle('active');
    }
}

function moveSlide(event, btn, step) {
    event.stopPropagation(); // Ngăn sự kiện click lan ra ngoài làm đóng card
    
    const slider = btn.closest('.slider');
    const images = slider.querySelectorAll('.slide-images img');
    
    if (images.length <= 1) return;

    let currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
    
    // Xóa class active cũ và cập nhật index mới xoay vòng
    images[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + step + images.length) % images.length;
    images[currentIndex].classList.add('active');
}