// Portfolio 3D Carousel and Swipe Interactions
class PortfolioCarousel {    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 12;
        this.isTransitioning = false;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.minSwipeDistance = 50;
          this.initializeElements();
        this.bindEvents();
        this.updateCarousel();
        // Autoplay removed for better user experience
        // this.startAutoplay();
    }
      initializeElements() {
        this.carouselTrack = document.getElementById('carouselTrack');
        this.slides = document.querySelectorAll('.carousel-slide');
        this.navDots = document.querySelectorAll('.nav-dot');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
    }    bindEvents() {
        // Button navigation
        this.prevBtn?.addEventListener('click', () => this.previousSlide());
        this.nextBtn?.addEventListener('click', () => this.nextSlide());
        
        // Dot navigation
        this.navDots.forEach((dot, index) => {
            dot.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Touch events for mobile swiping
        this.carouselTrack?.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        this.carouselTrack?.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
        
        // Mouse events for desktop dragging
        this.carouselTrack?.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
          // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Autoplay hover events removed since autoplay is disabled
        // this.carouselTrack?.addEventListener('mouseenter', () => this.pauseAutoplay());
        // this.carouselTrack?.addEventListener('mouseleave', () => this.resumeAutoplay());
        
        // View project buttons
        document.querySelectorAll('.view-project-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleViewProject(e));
        });
        
        // Project card interactions for touch devices
        this.setupProjectCardInteractions();
        
        // Intersection Observer for animations
        this.setupIntersectionObserver();
    }
    
    setupProjectCardInteractions() {
        const projectCards = document.querySelectorAll('.project-card');
        
        projectCards.forEach(card => {
            // Touch events for mobile
            card.addEventListener('touchstart', (e) => {
                if (e.target.closest('.view-project-btn')) return;
                e.preventDefault();
                this.handleCardTouch(card);
            }, { passive: false });
            
            // Click events for desktop (fallback)
            card.addEventListener('click', (e) => {
                if (e.target.closest('.view-project-btn')) return;
                this.handleCardClick(card);
            });
            
            // Mouse leave to reset state
            card.addEventListener('mouseleave', () => {
                card.classList.remove('active');
            });
        });
    }
    
    handleCardTouch(card) {
        // Remove active class from all cards
        document.querySelectorAll('.project-card').forEach(c => {
            c.classList.remove('touched', 'active');
        });
        
        // Add touched state to current card
        card.classList.add('touched', 'active');
        
        // Auto-remove touched state after 5 seconds
        setTimeout(() => {
            card.classList.remove('touched');
        }, 5000);
    }
    
    handleCardClick(card) {
        // Toggle active state for desktop hover simulation
        const isActive = card.classList.contains('active');
        
        // Remove active from all cards
        document.querySelectorAll('.project-card').forEach(c => {
            c.classList.remove('active');
        });
        
        // Add active to current card if it wasn't already active
        if (!isActive) {
            card.classList.add('active');
        }
    }
    
    handleTouchStart(e) {
        this.touchStartX = e.changedTouches[0].screenX;
        this.pauseAutoplay();
    }
    
    handleTouchEnd(e) {
        this.touchEndX = e.changedTouches[0].screenX;
        this.handleSwipe();
        this.resumeAutoplay();
    }
    
    handleMouseDown(e) {
        this.isDragging = true;
        this.touchStartX = e.clientX;
        this.carouselTrack.style.cursor = 'grabbing';
        this.pauseAutoplay();
        e.preventDefault();
    }
    
    handleMouseMove(e) {
        if (!this.isDragging) return;
        
        const deltaX = e.clientX - this.touchStartX;
        const threshold = 50;
        
        if (Math.abs(deltaX) > threshold) {
            if (deltaX > 0) {
                this.carouselTrack.style.transform = `translateX(${deltaX * 0.1}px)`;
            } else {
                this.carouselTrack.style.transform = `translateX(${deltaX * 0.1}px)`;
            }
        }
    }
    
    handleMouseUp(e) {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.touchEndX = e.clientX;
        this.carouselTrack.style.cursor = 'grab';
        this.carouselTrack.style.transform = '';
        this.handleSwipe();
        this.resumeAutoplay();
    }
    
    handleSwipe() {
        const swipeDistance = this.touchStartX - this.touchEndX;
        
        if (Math.abs(swipeDistance) > this.minSwipeDistance) {
            if (swipeDistance > 0) {
                // Swipe left - next slide
                this.nextSlide();
            } else {
                // Swipe right - previous slide
                this.previousSlide();
            }
        }
    }
    
    handleKeydown(e) {
        if (this.isTransitioning) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.previousSlide();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.nextSlide();
                break;
            case ' ':
                e.preventDefault();
                this.toggleAutoplay();
                break;
        }
    }
      nextSlide() {
        // Allow rapid navigation by reducing transition blocking
        if (this.isTransitioning) {
            // Clear existing timeout and allow immediate update
            if (this.transitionTimeout) {
                clearTimeout(this.transitionTimeout);
                this.isTransitioning = false;
            }
        }
        
        this.currentSlide = (this.currentSlide + 1) % this.totalSlides;
        this.updateCarousel();
    }
    
    previousSlide() {
        // Allow rapid navigation by reducing transition blocking
        if (this.isTransitioning) {
            // Clear existing timeout and allow immediate update
            if (this.transitionTimeout) {
                clearTimeout(this.transitionTimeout);
                this.isTransitioning = false;
            }
        }
        
        this.currentSlide = (this.currentSlide - 1 + this.totalSlides) % this.totalSlides;
        this.updateCarousel();
    }
      goToSlide(index) {
        // Allow rapid navigation by reducing transition blocking
        if (index === this.currentSlide) return;
        
        if (this.isTransitioning) {
            // Clear existing timeout and allow immediate update
            if (this.transitionTimeout) {
                clearTimeout(this.transitionTimeout);
                this.isTransitioning = false;
            }
        }
        
        this.currentSlide = index;
        this.updateCarousel();
    }
      updateCarousel() {
        // Clear any existing transition timeout
        if (this.transitionTimeout) {
            clearTimeout(this.transitionTimeout);
        }
        
        // Force immediate update without transition blocking
        this.isTransitioning = true;
        
        // Update slide positions and classes
        this.slides.forEach((slide, index) => {
            slide.classList.remove('active', 'next', 'prev');
            
            if (index === this.currentSlide) {
                slide.classList.add('active');
            } else if (index === (this.currentSlide + 1) % this.totalSlides) {
                slide.classList.add('next');
            } else if (index === (this.currentSlide - 1 + this.totalSlides) % this.totalSlides) {
                slide.classList.add('prev');
            }
        });
        
        // Update navigation dots
        this.navDots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentSlide);
        });
          // Transform the carousel track
        const translateX = -this.currentSlide * (100 / this.totalSlides); // 8.333% per slide for 12 slides
        this.carouselTrack.style.transform = `translateX(${translateX}%)`;
        
        // Add 3D transformation effects
        this.apply3DEffects();
        
        // Reset transition flag after animation completes with timeout reference
        this.transitionTimeout = setTimeout(() => {
            this.isTransitioning = false;
        }, 800);
    }
    
    apply3DEffects() {
        this.slides.forEach((slide, index) => {
            const offset = index - this.currentSlide;
            const absOffset = Math.abs(offset);
            
            // Calculate 3D transformations
            let rotateY = 0;
            let translateZ = 0;
            let scale = 1;
            let opacity = 1;
            let blur = 0;
            
            if (offset === 0) {
                // Active slide
                rotateY = 0;
                translateZ = 0;
                scale = 1;
                opacity = 1;
                blur = 0;
            } else if (offset === 1) {
                // Next slide
                rotateY = -25;
                translateZ = -150;
                scale = 0.9;
                opacity = 0.8;
                blur = 1;
            } else if (offset === -1) {
                // Previous slide
                rotateY = 25;
                translateZ = -150;
                scale = 0.9;
                opacity = 0.8;
                blur = 1;
            } else {
                // Other slides
                rotateY = offset > 0 ? -45 : 45;
                translateZ = -300;
                scale = 0.7;
                opacity = 0.4;
                blur = 3;
            }
            
            // Apply transformations
            const card = slide.querySelector('.project-card');
            if (card) {
                card.style.transform = `
                    rotateY(${rotateY}deg) 
                    translateZ(${translateZ}px) 
                    scale(${scale})
                `;
                slide.style.opacity = opacity;
                slide.style.filter = `blur(${blur}px)`;
            }
        });
    }
    
    startAutoplay() {
        this.autoplayInterval = setInterval(() => {
            if (!this.isAutoplayPaused) {
                this.nextSlide();
            }
        }, 5000);
    }
    
    pauseAutoplay() {
        this.isAutoplayPaused = true;
    }
    
    resumeAutoplay() {
        this.isAutoplayPaused = false;
    }
      toggleAutoplay() {
        if (this.autoplayInterval) {
            clearInterval(this.autoplayInterval);
            this.autoplayInterval = null;
        } else {
            this.startAutoplay();
        }
    }
    
    handleViewProject(e) {
        const button = e.target;
        const slide = button.closest('.carousel-slide');
        const projectName = slide?.dataset.project;
        
        // Add ripple effect
        this.createRippleEffect(button, e);
        
        // Simulate project view (you can replace with actual navigation)
        setTimeout(() => {
            alert(`Opening ${projectName} project... (This would navigate to the actual project)`);
        }, 300);
    }
    
    createRippleEffect(button, e) {
        const ripple = document.createElement('span');
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }
    
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'fadeInUp 0.6s ease-out forwards';
                }
            });
        }, observerOptions);
        
        // Observe stat cards and other elements
        document.querySelectorAll('.stat-card, .cta-content').forEach(el => {
            observer.observe(el);
        });
    }
}

// Smooth scrolling for navigation links
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Performance optimizations
function optimizePerformance() {
    // Lazy load images that are not immediately visible
    const images = document.querySelectorAll('img[loading="lazy"]');
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.src; // Trigger loading
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
    
    // Preload next slide images
    setTimeout(() => {
        const nextSlideIndex = (carousel.currentSlide + 1) % carousel.totalSlides;
        const nextSlide = carousel.slides[nextSlideIndex];
        const nextImage = nextSlide?.querySelector('.mockup-image');
        if (nextImage && !nextImage.complete) {
            const preloadImg = new Image();
            preloadImg.src = nextImage.src;
        }
    }, 1000);
}

// Add CSS for ripple animation
function addRippleStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(2);
                opacity: 0;
            }
        }
        
        .view-project-btn {
            position: relative;
            overflow: hidden;
        }
    `;
    document.head.appendChild(style);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize carousel
    window.carousel = new PortfolioCarousel();
    
    // Initialize other features
    initSmoothScrolling();
    optimizePerformance();
    addRippleStyles();
    
    // Add loading animation end
    document.body.classList.add('loaded');
    
    // Console message for developers
    console.log('🚀 Portfolio 3D Carousel initialized successfully!');
    console.log('Navigation: Arrow keys, swipe, or click controls');
    console.log('Autoplay: 5s intervals (pauses on hover/interaction)');
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.carousel) {
        setTimeout(() => {
            window.carousel.updateCarousel();
        }, 100);
    }
});

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioCarousel;
}
