document.addEventListener('DOMContentLoaded', function() {
    // Testimonial Slider Functionality
    const slider = document.querySelector('.testimonial-slider');
    const slides = document.querySelectorAll('.testimonial-slide');
    const prevBtn = document.querySelector('.testimonial-nav .prev');
    const nextBtn = document.querySelector('.testimonial-nav .next');
    
    let currentIndex = 0;
    const slideCount = slides.length;
    
    function updateSlider() {
        slides.forEach((slide, index) => {
            if (index === currentIndex) {
                slide.style.opacity = '1';
                slide.style.transform = 'translateX(0)';
                slide.style.zIndex = '2';
            } else {
                slide.style.opacity = '0';
                slide.style.transform = index < currentIndex ? 'translateX(-50px)' : 'translateX(50px)';
                slide.style.zIndex = '1';
            }
        });
    }
    
    // Initialize slider
    updateSlider();
    
    // Event listeners for navigation
    prevBtn.addEventListener('click', function() {
        currentIndex = (currentIndex - 1 + slideCount) % slideCount;
        updateSlider();
    });
    
    nextBtn.addEventListener('click', function() {
        currentIndex = (currentIndex + 1) % slideCount;
        updateSlider();
    });
    
    // Auto-advance every 5 seconds
    setInterval(function() {
        currentIndex = (currentIndex + 1) % slideCount;
        updateSlider();
    }, 5000);
});
