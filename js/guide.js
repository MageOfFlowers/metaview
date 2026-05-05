let allGuides = [];

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Tải dữ liệu từ API ngay lập tức
    await renderGuideData();

    // 2. Gán sự kiện tìm kiếm
    document.getElementById('search-counter')?.addEventListener('input', (e) => {
        filterAndDisplay('counter', e.target.value);
    });

    document.getElementById('search-build')?.addEventListener('input', (e) => {
        filterAndDisplay('build', e.target.value);
    });
});

async function renderGuideData() {
    allGuides = await request('/guide') || [];[cite: 3]
    
    // Hiển thị dữ liệu mặc định (chuỗi rỗng sẽ hiện tất cả)
    // Quan trọng: Dùng 'counter' và 'build' làm từ khóa phân loại
    filterAndDisplay('counter', ''); 
    filterAndDisplay('build', '');
}

function filterAndDisplay(type, term) {
    const containerId = type === 'counter' ? 'counter-list' : 'fb-build-container';
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    const searchTerm = term.toLowerCase().trim();

    // LỌC DỮ LIỆU: Chuyển cả type trong data và type truyền vào về chữ thường để so khớp
    const filtered = allGuides.filter(g => {
        const targetType = type.toLowerCase(); // 'counter' hoặc 'build'
        const currentType = (g.type || '').toLowerCase(); // 'Counter' -> 'counter'
        const currentName = (g.name || '').toLowerCase();
        
        return currentType === targetType && currentName.includes(searchTerm);
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p style="padding:20px; color:#999;">Không có dữ liệu phù hợp...</p>`;
        return;
    }

    filtered.forEach(guide => {
        const div = document.createElement('div');
        if (type === 'counter') {
            div.className = 'counter-item';
            div.innerHTML = `
                <div class="item-header" onclick="toggleExpand(this)">
                    <h3>${guide.name}</h3>
                    <i class="fas fa-chevron-down arrow"></i>
                </div>
                <div class="expand-content">
                    <div class="slider">
                        <button class="slide-btn" onclick="moveSlide(event, this, -1)">❮</button>
                        <div class="slide-images">
                            ${Object.values(guide.details || {}).map((url, i) => 
                                `<img src="${url}" class="${i === 0 ? 'active' : ''}">`
                            ).join('')}
                        </div>
                        <button class="slide-btn" onclick="moveSlide(event, this, 1)">❯</button>
                    </div>
                </div>`;
        } else {
            div.className = 'build-item-mini';
            div.innerHTML = `
                <a href="${guide.details?.link || '#'}" target="_blank" class="build-link-box">
                    <i class="fab fa-facebook"></i> <span>${guide.name}</span>
                </a>`;
        }
        container.appendChild(div);
    });
}

// Các hàm bổ trợ giữ nguyên logic từ guide_5.js[cite: 4]
function toggleSection(el) {
    el.closest('.guide-section').classList.toggle('expanded');[cite: 6]
}

function toggleExpand(el) {
    el.closest('.counter-item').classList.toggle('active');[cite: 6]
}

function moveSlide(event, btn, step) {
    event.stopPropagation();[cite: 6]
    const images = btn.closest('.slider').querySelectorAll('.slide-images img');
    if (images.length <= 1) return;
    let idx = Array.from(images).findIndex(img => img.classList.contains('active'));
    images[idx].classList.remove('active');
    images[(idx + step + images.length) % images.length].classList.add('active');
}

async function request(endpoint) {
    try {
        const res = await fetch(`https://metaanalyse.onrender.com/api${endpoint}`);[cite: 3]
        return res.ok ? await res.json() : null;
    } catch (e) { return null; }
}