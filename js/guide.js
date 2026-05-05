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
    const guides = await request('/guide'); //[cite: 3]
    const counterContainer = document.getElementById('counter-list');
    const buildContainer = document.getElementById('fb-build-container');
    
    if (!guides) return;

    if (counterContainer) counterContainer.innerHTML = '';
    if (buildContainer) buildContainer.innerHTML = '';

    guides.forEach(guide => {
        const type = guide.type ? guide.type.toLowerCase() : ''; //[cite: 3]
        if (type === 'counter') {
            counterContainer.appendChild(createCounterElement(guide));
        } else if (type === 'build') {
            buildContainer.appendChild(createBuildElement(guide));
        }
    });
}

/**
 * Tạo khung hiển thị cho Build Deck (Facebook Post)
 */
function createBuildElement(guide) {
    const fbLink = guide.details ? guide.details.link : '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'build-item';
    wrapper.innerHTML = `
        <div class="build-header">
            <h4>${guide.name}</h4>
            <!-- Thêm nút mở link trực tiếp -->
            <a href="${fbLink}" target="_blank" class="open-link-btn">
                <i class="fas fa-external-link-alt"></i> Xem trên Facebook
            </a>
        </div>
        <div class="fb-post-content">
            <!-- Khung nhúng Facebook SDK[cite: 6] -->
            <div class="fb-post" 
                data-href="${fbLink}" 
                data-show-text="true" 
                data-width="auto">
            </div>
        </div>
    `;
    return wrapper;
}

/**
 * Hàm đóng/mở Section lớn[cite: 6]
 */
function toggleSection(headerElement) {
    const section = headerElement.closest('.guide-section');
    if (!section) return;

    section.classList.toggle('expanded');
    
    // Khi Section mở, yêu cầu Facebook SDK quét và hiển thị nội dung
    if (section.classList.contains('expanded')) {
        if (window.FB) {
            window.FB.XFBML.parse(section);
        } else {
            console.warn("Facebook SDK chưa được nạp xong.");
        }
    }
}function createBuildElement(guide) {
    const fbLink = guide.details ? guide.details.link : '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'build-item';
    wrapper.innerHTML = `
        <div class="build-header">
            <h4>${guide.name}</h4>
            <!-- Thêm nút mở link trực tiếp -->
            <a href="${fbLink}" target="_blank" class="open-link-btn">
                <i class="fas fa-external-link-alt"></i> Xem trên Facebook
            </a>
        </div>
        <div class="fb-post-content">
            <!-- Khung nhúng Facebook SDK[cite: 6] -->
            <div class="fb-post" 
                data-href="${fbLink}" 
                data-show-text="true" 
                data-width="auto">
            </div>
        </div>
    `;
    return wrapper;
}

/**
 * Hàm đóng/mở Section lớn[cite: 6]
 */
function toggleSection(headerElement) {
    const section = headerElement.closest('.guide-section');
    if (!section) return;

    section.classList.toggle('expanded');
    
    // Khi Section mở, yêu cầu Facebook SDK quét và hiển thị nội dung
    if (section.classList.contains('expanded')) {
        if (window.FB) {
            window.FB.XFBML.parse(section);
        } else {
            console.warn("Facebook SDK chưa được nạp xong.");
        }
    }
}
function createCounterElement(guide) {
    const imageUrls = guide.details ? Object.values(guide.details) : []; 

    const item = document.createElement('div');
    item.className = 'counter-item';
    item.innerHTML = `
        <div class="item-header" onclick="toggleExpand(this)">
            <h3>${guide.name}</h3>
            <div class="item-meta">
                <!-- Đã loại bỏ text badge ở đây -->
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