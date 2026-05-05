let allGuides = []; // Biến toàn cục lưu trữ dữ liệu để tìm kiếm[cite: 6]

document.addEventListener('DOMContentLoaded', () => {
    // Gọi hàm lấy dữ liệu ban đầu từ API[cite: 6]
    renderGuideData();

    // Gắn sự kiện tìm kiếm cho ô nhập liệu Counter
    const searchCounter = document.getElementById('search-counter');
    if (searchCounter) {
        searchCounter.addEventListener('input', (e) => {
            filterAndDisplay('counter', e.target.value);
        });
    }

    // Gắn sự kiện tìm kiếm cho ô nhập liệu Build
    const searchBuild = document.getElementById('search-build');
    if (searchBuild) {
        searchBuild.addEventListener('input', (e) => {
            filterAndDisplay('build', e.target.value);
        });
    }
});

/**
 * Lấy dữ liệu từ API và lưu vào biến toàn cục[cite: 3, 6]
 */
async function renderGuideData() {
    allGuides = await request('/guide') || [];[cite: 3]
    if (allGuides.length === 0) return;
    
    // Hiển thị toàn bộ dữ liệu lần đầu
    filterAndDisplay('counter', '');
    filterAndDisplay('build', '');
}

/**
 * Hàm lọc dữ liệu dựa trên loại (type) và từ khóa tìm kiếm[cite: 6]
 */
function filterAndDisplay(type, term) {
    const searchTerm = term.toLowerCase();
    const containerId = type === 'counter' ? 'counter-list' : 'fb-build-container';
    const container = document.getElementById(containerId);
    
    if (!container) return;
    container.innerHTML = '';

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
 * Tạo phần tử Build tối giản (không preview)[cite: 6]
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
 * Tạo phần tử Counter kèm slider ảnh[cite: 6]
 */
function createCounterElement(guide) {
    const imageUrls = guide.details ? Object.values(guide.details) : []; 
    const item = document.createElement('div');
    item.className = 'counter-item';
    item.innerHTML = `
        <div class="item-header" onclick="toggleExpand(this)">
            <h3>${guide.name}</h3>
            <div class="item-meta">
                <i class="fas fa-chevron-down arrow"></i>
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
 * Xử lý đóng/mở các Section lớn (Counter/Build)[cite: 6]
 */
function toggleSection(headerElement) {
    const section = headerElement.closest('.guide-section');
    if (section) {
        section.classList.toggle('expanded');
    }
}

/**
 * Xử lý đóng/mở chi tiết từng Counter[cite: 6]
 */
function toggleExpand(headerElement) {
    const parent = headerElement.closest('.counter-item');
    if (parent) {
        parent.classList.toggle('active');
    }
}

/**
 * Điều hướng Slider ảnh trong Counter[cite: 6]
 */
function moveSlide(event, btn, step) {
    event.stopPropagation();
    const slider = btn.closest('.slider');
    const images = slider.querySelectorAll('.slide-images img');
    if (images.length <= 1) return;

    let currentIndex = Array.from(images).findIndex(img => img.classList.contains('active'));
    images[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + step + images.length) % images.length;
    images[currentIndex].classList.add('active');
}

/**
 * Hàm gọi API chung[cite: 6]
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