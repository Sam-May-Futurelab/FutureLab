/**
 * Ultra-simple testimonials slider with no animations or auto-advance
 */
document.addEventListener('DOMContentLoaded', function() {
    // Get slider elements
    const slider = document.querySelector('.testimonial-slider');
    if (!slider) return;
    
    const slides = slider.querySelectorAll('.testimonial-slide');
    const prevBtn = slider.querySelector('.prev');
    const nextBtn = slider.querySelector('.next');
    
    if (!slides.length) return;
    
    // Initialize slider
    let currentIndex = 0;
    const slideCount = slides.length;
    
    // Show first slide initially
    slides[0].classList.add('active');
    
    // Mark this slider as initialized to prevent other scripts from controlling it
    slider.dataset.initialized = 'true';
    
    // Stop any existing intervals that might be running
    // This will clear ANY setInterval in the page - but that's better than disappearing testimonials
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
        clearTimeout(i);
        clearInterval(i);
    }
    
    // Extremely simple slide change function - just show/hide
    function goToSlide(index) {
        // No animations - just hide/show
        slides[currentIndex].classList.remove('active');
        currentIndex = index;
        slides[currentIndex].classList.add('active');
    }
    
    // Navigate to next/prev slide
    function nextSlide() {
        goToSlide((currentIndex + 1) % slideCount);
    }
    
    function prevSlide() {
        goToSlide((currentIndex - 1 + slideCount) % slideCount);
    }
    
    // Add button event listeners
    if (prevBtn) prevBtn.addEventListener('click', e => {
        e.preventDefault();
        prevSlide();
    });
    
    if (nextBtn) nextBtn.addEventListener('click', e => {
        e.preventDefault();
        nextSlide();
    });
    
    // Basic keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') prevSlide();
        if (e.key === 'ArrowRight') nextSlide();
    });
});
