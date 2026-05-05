/**
 * BIẾN TOÀN CỤC LƯU TRỮ DỮ LIỆU
 */
let allGuides = []; // Lưu trữ dữ liệu gốc từ API để phục vụ việc lọc (filter)[cite: 6]

document.addEventListener('DOMContentLoaded', () => {
    // 1. Tải dữ liệu ban đầu khi trang vừa load[cite: 6]
    renderGuideData();

    // 2. Lắng nghe sự kiện gõ phím tại ô Search của Counter
    const searchCounter = document.getElementById('search-counter');
    if (searchCounter) {
        searchCounter.addEventListener('input', (e) => {
            filterAndDisplay('counter', e.target.value);
        });
    }

    // 3. Lắng nghe sự kiện gõ phím tại ô Search của Build[cite: 7]
    const searchBuild = document.getElementById('search-build');
    if (searchBuild) {
        searchBuild.addEventListener('input', (e) => {
            filterAndDisplay('build', e.target.value);
        });
    }
});

/**
 * HÀM CHÍNH: LẤY DỮ LIỆU VÀ HIỂN THỊ
 */
async function renderGuideData() {
    allGuides = await request('/guide') || [];[cite: 3]
    if (allGuides.length === 0) return;
    
    // Hiển thị dữ liệu mặc định cho cả 2 phần[cite: 6]
    filterAndDisplay('counter', '');
    filterAndDisplay('build', '');
}

/**
 * HÀM LỌC (FILTER) VÀ RENDER LẠI DANH SÁCH
 * Giúp tìm kiếm theo tên mà không làm mất cấu trúc các nút điều hướng[cite: 6, 7]
 */
function filterAndDisplay(type, term) {
    const searchTerm = term.toLowerCase();
    const containerId = type === 'counter' ? 'counter-list' : 'fb-build-container';
    const container = document.getElementById(containerId);
    
    if (!container) return;
    container.innerHTML = ''; // Làm sạch danh sách trước khi vẽ lại[cite: 6]

    const filtered = allGuides.filter(guide => {
        const guideType = guide.type ? guide.type.toLowerCase() : '';
        const guideName = guide.name ? guide.name.toLowerCase() : '';
        return guideType === type && guideName.includes(searchTerm);
    });

    filtered.forEach(guide => {
        const element = type === 'counter' 
            ? createCounterElement(guide) 
            : createBuildElement(guide);
        container.appendChild(element);
    });
}

/**
 * TẠO PHẦN TỬ BUILD DECK (Tối giản, không preview)[cite: 6]
 */
function createBuildElement(guide) {
    const fbLink = guide.details ? guide.details.link : '#';
    const wrapper = document.createElement('div');
    wrapper.className = 'build-item-mini';
    wrapper.innerHTML = `
        <a href="${fbLink}" target="_blank" class="build-link">
            <i class="fab fa-facebook"></i>
            <span class="build-name">${guide.name}</span>
            <i class="fas fa-external-link-alt mini-icon"></i>
        </a>
    `;
    return wrapper;
}

/**
 * TẠO PHẦN TỬ COUNTER (Kèm slider ảnh và nút mũi tên)[cite: 6]
 */
function createCounterElement(guide) {
    const imageUrls = guide.details ? Object.values(guide.details) : []; 
    const item = document.createElement('div');
    item.className = 'counter-item';
    item.innerHTML = `
        <div class="item-header" onclick="toggleExpand(this)">
            <h3>${guide.name}</h3>
            <div class="item-meta">
                <i class="fas fa-chevron-down arrow"></i> <!-- Mũi tên mở rộng item -->
            </div>
        </div>
        <div class="expand-content">
            <div class="slider">
                ${imageUrls.length > 1 ? `<button class="slide-btn prev" onclick="moveSlide(event, this, -1)">&#10094;</button>` : ''}
                <div class="slide-images">
                    ${imageUrls.map((url, index) => `
                        <img src="${url}" class="${index === 0 ? 'active' : ''}" alt="Guide Image">
                    `).join('')}
                </div>
                ${imageUrls.length > 1 ? `<button class="slide-btn next" onclick="moveSlide(event, this, 1)">&#10095;</button>` : ''}
            </div>
        </div>
    `;
    return item;
}

/**
 * ĐIỀU KHIỂN ĐÓNG/MỞ SECTION LỚN[cite: 6]
 */
function toggleSection(headerElement) {
    const section = headerElement.closest('.guide-section');
    if (section) {
        section.classList.toggle('expanded'); // Toggle class để hiện nội dung và xoay mũi tên
    }
}

/**
 * ĐIỀU KHIỂN ĐÓNG/MỞ CHI TIẾT COUNTER (Nút mũi tên nhỏ từng dòng)
 */
function toggleExpand(headerElement) {
    const parent = headerElement.closest('.counter-item');
    if (parent) {
        parent.classList.toggle('active'); // Thêm/xóa class active để hiện slider
    }
}
/**
 * XỬ LÝ SLIDER ẢNH (Nút tiến/lùi)[cite: 6]
 */
function moveSlide(event, btn, step) {
    event.stopPropagation(); // Không làm đóng card khi bấm nút slide
    const slider = btn.closest('.slider');
    const images = slider.querySelectorAll('.slide-images img');
    if (images.length <= 1) return;

    let currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
    images[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + step + images.length) % images.length;
    images[currentIndex].classList.add('active');
}

/**
 * HÀM GỌI API CHUNG[cite: 6]
 */
async function request(endpoint, method = 'GET', body = null) {
    try {
        const API_BASE = "https://metaanalyse.onrender.com/api";
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body && method !== 'GET') {
            options.body = JSON.stringify(body);
        }
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        return null;
    }
}