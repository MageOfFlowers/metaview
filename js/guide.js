document.addEventListener('DOMContentLoaded', () => {
    loadGuides();
});

async function loadGuides() {
    try {
        const response = await fetch('/api/guide');
        const guides = await response.json();
        
        const counterContainer = document.querySelector('.counter-list');
        const buildContainer = document.querySelector('.fb-wrapper');

        // Xóa nội dung cũ
        counterContainer.innerHTML = '';

        guides.forEach(guide => {
            if (guide.type === 'counter') {
                counterContainer.appendChild(createCounterItem(guide));
            } else if (guide.type === 'build') {
                // Xử lý render Facebook preview nếu có fb_url trong details
                const fbUrl = guide.details.fb_url; 
                if(fbUrl) renderFacebookPost(fbUrl);
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu guide:', error);
    }
}

function createCounterItem(guide) {
    // Chuyển đổi Object details thành mảng các URL ảnh
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