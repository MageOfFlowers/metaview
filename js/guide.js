let allGuides = [];

document.addEventListener('DOMContentLoaded', () => {
    renderGuideData();
    
    const searchCounter = document.getElementById('search-counter');
    if (searchCounter) {
        searchCounter.addEventListener('input', (e) => filterAndDisplay('counter', e.target.value));
    }

    const searchBuild = document.getElementById('search-build');
    if (searchBuild) {
        searchBuild.addEventListener('input', (e) => filterAndDisplay('build', e.target.value));
    }
});

async function renderGuideData() {
    allGuides = await request('/guide') || [];
    filterAndDisplay('counter', '');
    filterAndDisplay('build', '');
}

function filterAndDisplay(type, term) {
    const containerId = type === 'counter' ? 'counter-list' : 'fb-build-container';
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    const searchTerm = term.toLowerCase();

    const filtered = allGuides.filter(g => {
        const gType = (g.type || '').toLowerCase();
        const gName = (g.name || '').toLowerCase();
        return gType === type && gName.includes(searchTerm);
    });

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
            const link = guide.details?.link || '#';
            div.innerHTML = `
                <a href="${link}" target="_blank" class="build-link-box">
                    <i class="fab fa-facebook"></i> <span>${guide.name}</span>
                </a>`;
        }
        container.appendChild(div);
    });
}

function toggleSection(el) {
    el.closest('.guide-section').classList.toggle('expanded');
}

function toggleExpand(el) {
    el.closest('.counter-item').classList.toggle('active');
}

function moveSlide(event, btn, step) {
    event.stopPropagation();
    const images = btn.closest('.slider').querySelectorAll('.slide-images img');
    if (images.length <= 1) return;
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