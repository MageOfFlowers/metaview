let allGuides = [];

document.addEventListener('DOMContentLoaded', () => {
    renderGuideData();
    
    // Gán sự kiện Search
    document.getElementById('search-counter')?.addEventListener('input', (e) => filterAndDisplay('counter', e.target.value));
    document.getElementById('search-build')?.addEventListener('input', (e) => filterAndDisplay('build', e.target.value));
});

async function renderGuideData() {
    allGuides = await request('/guide') || [];[cite: 3]
    filterAndDisplay('counter', '');
    filterAndDisplay('build', '');
}

function filterAndDisplay(type, term) {
    const container = document.getElementById(type === 'counter' ? 'counter-list' : 'fb-build-container');
    if (!container) return;
    container.innerHTML = '';

    const filtered = allGuides.filter(g => (g.type || '').toLowerCase() === type && (g.name || '').toLowerCase().includes(term.toLowerCase()));

    filtered.forEach(guide => {
        const div = document.createElement('div');
        if(type === 'counter') {
            div.className = 'counter-item';
            div.innerHTML = `
                <div class="item-header" onclick="toggleExpand(this)">
                    <h3>${guide.name}</h3>
                    <i class="fas fa-chevron-down arrow"></i>
                </div>
                <div class="expand-content">
                    <div class="slider">
                        <button class="slide-btn" onclick="moveSlide(event, this, -1)">❮</button>
                        <div class="slide-images">${Object.values(guide.details || {}).map((url, i) => `<img src="${url}" class="${i===0?'active':''}">`).join('')}</div>
                        <button class="slide-btn" onclick="moveSlide(event, this, 1)">❯</button>
                    </div>
                </div>`;
        } else {
            div.className = 'build-item-mini';
            div.innerHTML = `<a href="${guide.details?.link || '#'}" target="_blank" style="display:block; padding:15px; text-decoration:none; color:#333; border-bottom:1px solid #eee;">
                <i class="fab fa-facebook"></i> ${guide.name}</a>`;
        }
        container.appendChild(div);
    });
}

// Hàm toggle Section lớn[cite: 6]
function toggleSection(el) {
    el.closest('.guide-section').classList.toggle('expanded');
}

// Hàm toggle Item Counter nhỏ[cite: 6]
function toggleExpand(el) {
    el.closest('.counter-item').classList.toggle('active');
}

// Hàm Slider ảnh[cite: 6]
function moveSlide(event, btn, step) {
    event.stopPropagation(); // Không cho đóng card khi bấm nút slide
    const images = btn.closest('.slider').querySelectorAll('.slide-images img');
    let idx = Array.from(images).findIndex(img => img.classList.contains('active'));
    images[idx].classList.remove('active');
    images[(idx + step + images.length) % images.length].classList.add('active');
}

async function request(endpoint) {
    try {
        const res = await fetch(`https://metaanalyse.onrender.com/api${endpoint}`);
        return res.ok ? await res.json() : null;
    } catch (e) { return null; }
}