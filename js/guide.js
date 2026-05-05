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