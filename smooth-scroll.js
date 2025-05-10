/**
 * Simple smooth scrolling functionality 
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize basic smooth scrolling between sections
    initSmoothScrolling();
});

/**
 * Basic smooth scrolling with header offset
 */
function initSmoothScrolling() {
    // Get all links that should trigger smooth scrolling
    const scrollLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
    
    // Apply smooth scrolling to each link
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // If the click is inside the iframe, do nothing and let the iframe handle it
            if (e.target.closest('#page-preview')) {
                return;
            }
            e.preventDefault();
            
            // Get the target element
            const targetId = this.getAttribute('href');
            const target = document.querySelector(targetId);
            
            if (target) {
                // Close mobile menu if it's open
                const mobileMenu = document.querySelector('.nav-links.active');
                if (mobileMenu) {
                    mobileMenu.classList.remove('active');
                    document.querySelector('.hamburger').classList.remove('active');
                }
                
                // Calculate scroll position (with offset for header)
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = targetPosition - headerHeight - 20; // Extra 20px for padding
                
                // Simple smooth scrolling
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                
                // Update URL hash
                setTimeout(() => {
                    window.location.hash = targetId;
                }, 800);
            }
        });
    });
    
    // Add smooth scroll to navigation buttons
    const nextSectionButtons = document.querySelectorAll('.next-section-btn, .scroll-indicator');
    
    nextSectionButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Find the parent section
            const currentSection = this.closest('section');
            if (!currentSection) return;
            
            // Find the next section
            let nextSection = currentSection.nextElementSibling;
            
            // Skip non-section elements
            while (nextSection && !nextSection.matches('section')) {
                nextSection = nextSection.nextElementSibling;
            }
            
            // Scroll to the next section if it exists
            if (nextSection) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = nextSection.getBoundingClientRect().top + window.pageYOffset;
                const offsetPosition = targetPosition - headerHeight;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}
