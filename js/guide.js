document.addEventListener('DOMContentLoaded', () => {
    loadGuides();
});

async function renderGuideData() {
    // Gọi API thông qua hàm request dùng chung
    // Endpoint là /guide vì API_BASE đã có sẵn /api
    const guides = await request('/guide');

    if (!guides) {
        console.error("Không thể tải dữ liệu từ server.");
        return;
    }

    const counterContainer = document.querySelector('.counter-list');
    counterContainer.innerHTML = ''; // Xóa nội dung cũ

    guides.forEach(guide => {
        if (guide.type === 'counter') {
            const item = createCounterElement(guide);
            counterContainer.appendChild(item);
        }
        // Thêm logic cho 'build' nếu cần render preview Facebook
    });
}

function createCounterElement(guide) {
    // details chứa các cặp key-value như {"1": "url1", "2": "url2"}
    const imageUrls = Object.values(guide.details); 

    const item = document.createElement('div');
    item.className = 'counter-item';
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
                <button class="slide-btn prev" onclick="moveSlide(this, -1)">&#10094;</button>
                <div class="slide-images">
                    ${imageUrls.map((url, index) => `
                        <img src="${url}" class="${index === 0 ? 'active' : ''}">
                    `).join('')}
                </div>
                <button class="slide-btn next" onclick="moveSlide(this, 1)">&#10095;</button>
            </div>
        </div>
    `;
    return item;
}

// Giữ nguyên hàm moveSlide và toggleExpand từ phiên bản trước

// Hàm đóng/mở bài viết
function toggleExpand(card) {
    // Đóng các card khác nếu muốn (optional)
    // document.querySelectorAll('.counter-card').forEach(c => c !== card && c.classList.remove('expanded'));
    
    card.classList.toggle('expanded');
}

// Hàm điều hướng slide ảnh
function moveSlide(event, btn, step) {
    event.stopPropagation(); // Ngăn sự kiện click làm đóng card
    
    const container = btn.closest('.slider-container');
    const images = container.querySelectorAll('.slides img');
    let currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
    
    // Xóa class active hiện tại
    images[currentIndex].classList.remove('active');
    
    // Tính toán index mới
    currentIndex += step;
    if (currentIndex >= images.length) currentIndex = 0;
    if (currentIndex < 0) currentIndex = images.length - 1;
    
    // Thêm class active cho ảnh mới
    images[currentIndex].classList.add('active');
}