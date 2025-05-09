function initializePageScripts() {
    // Theme Toggle Functionality:
    // This is now primarily handled by headerInclude.js calling window.initializeThemeToggle.
    // No direct event listener for #theme-toggle should be added here at the top level
    // to avoid errors if the header isn't loaded yet.

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const hrefAttribute = this.getAttribute('href');
            // Ensure the target element exists and is not just "#"
            if (hrefAttribute && hrefAttribute.length > 1 && document.querySelector(hrefAttribute)) {
                e.preventDefault();
                document.querySelector(hrefAttribute).scrollIntoView({
                    behavior: 'smooth'
                });
            } else if (hrefAttribute === '#') {
                e.preventDefault(); // Prevent jumping to top for empty hash
            }
        });
    });

    // Intersection Observer for animations
    const animatedElements = document.querySelectorAll('.animate-in, .section-transition');
    if (animatedElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        animatedElements.forEach(el => observer.observe(el));
    }

    // Hamburger Menu Functionality (Fallback if not handled by header.html's inline script)
    const hamburger = document.querySelector('.hamburger'); 
    const navLinks = document.querySelector('.nav-links'); 
    const mobileOverlay = document.querySelector('.mobile-menu-overlay'); 
    const body = document.body;

    const headerInlineScriptActive = document.getElementById('header-inline-script-active'); 

    if (hamburger && navLinks && !headerInlineScriptActive && !window.SimpleMenu) {
        const toggleMenu = (e) => {
            if (e) e.preventDefault();
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            if (mobileOverlay) mobileOverlay.classList.toggle('active');
            body.classList.toggle('menu-open');
        };

        hamburger.addEventListener('click', toggleMenu, true);
        let touchmoved;
        hamburger.addEventListener('touchstart', (e) => {
            touchmoved = false;
        }, { passive: true });
        hamburger.addEventListener('touchmove', (e) => {
            touchmoved = true;
        }, { passive: true });
        hamburger.addEventListener('touchend', function(e) {
            if (touchmoved) return;
            e.preventDefault();
            toggleMenu(e);
        }, { capture: true, passive: false });


        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (hamburger.classList.contains('active')) {
                    toggleMenu();
                }
            });
        });

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => toggleMenu());
        }
    }

    // Testimonial Slider
    const testimonialSlider = document.querySelector('.testimonial-slider');
    if (testimonialSlider) {
        const slides = testimonialSlider.querySelectorAll('.testimonial-slide');
        const prevButton = testimonialSlider.querySelector('.prev');
        const nextButton = testimonialSlider.querySelector('.next');
        let currentIndex = 0;

        function showSlide(index) {
            slides.forEach((slide, i) => {
                slide.style.display = i === index ? 'block' : 'none';
                slide.classList.toggle('active', i === index);
            });
        }

        if (slides.length > 0) {
            showSlide(currentIndex);

            if (prevButton) {
                prevButton.addEventListener('click', () => {
                    currentIndex = (currentIndex - 1 + slides.length) % slides.length;
                    showSlide(currentIndex);
                });
            }
            if (nextButton) {
                nextButton.addEventListener('click', () => {
                    currentIndex = (currentIndex + 1) % slides.length;
                    showSlide(currentIndex);
                });
            }
        }
    }

    // FAQ Toggle Functionality
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');

            if (question) {
                question.addEventListener('click', () => {
                    // Close all other active FAQ items
                    faqItems.forEach(otherItem => {
                        if (otherItem !== item && otherItem.classList.contains('active')) {
                            otherItem.classList.remove('active');
                        }
                    });

                    // Toggle the current item's active class
                    item.classList.toggle('active');
                });
            }
        });
    }

    // Comparison Section Toggle Functionality
    const toggleButton = document.querySelector('.comparison-toggle-btn');
    const content = document.getElementById('comparison-content');

    if (toggleButton && content) {
        toggleButton.addEventListener('click', () => {
            const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true' || false;
            toggleButton.setAttribute('aria-expanded', !isExpanded);
            // content.style.display = isExpanded ? 'none' : 'block'; // Basic toggle
            
            if (!isExpanded) {
                content.style.display = 'block'; 
                setTimeout(() => {
                    content.classList.add('open');
                    toggleButton.innerHTML = 'Hide Details <i class="fas fa-chevron-up"></i>';
                }, 10); 
            } else {
                content.classList.remove('open');
                toggleButton.innerHTML = 'Show Details <i class="fas fa-chevron-down"></i>';
                // Optional: set display to none after transition for accessibility/layout
                // This requires the .comparison-collapsible-content.open to have a transition duration.
                // Example: if transition is 0.3s, wait a bit longer.
                // setTimeout(() => {
                //    if (!content.classList.contains('open')) {
                //        content.style.display = 'none';
                //    }
                // }, 300); 
            }
        });
        // Ensure initial state matches button text if content is hidden by default via CSS
        if (!content.classList.contains('open') && content.style.display !== 'block') {
             toggleButton.innerHTML = 'Show Details <i class="fas fa-chevron-down"></i>';
             toggleButton.setAttribute('aria-expanded', 'false');
        } else if (content.classList.contains('open')) {
            toggleButton.innerHTML = 'Hide Details <i class="fas fa-chevron-up"></i>';
            toggleButton.setAttribute('aria-expanded', 'true');
        }
    }

    // Typewriter effect for hero heading
    const typewriterHeading = document.querySelector('.hero h1.gradient-text');
    if (typewriterHeading) {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const validPagesForTypewriter = ['index.html', '', 'ecommerce.html'];

        const originalText = typewriterHeading.getAttribute('data-original-text') || typewriterHeading.textContent;
        typewriterHeading.setAttribute('data-original-text', originalText);

        if (validPagesForTypewriter.includes(currentPath) &&
            !typewriterHeading.hasAttribute('data-typewriter-applied') &&
            !typewriterHeading.hasAttribute('data-no-animation')) {
            
            typewriterHeading.textContent = '';
            typewriterHeading.style.opacity = 1;
            typewriterHeading.style.visibility = 'visible';
            typewriterHeading.style.display = 'block';
            
            let i = 0;
            const speed = 50;
            const initialMinHeight = Math.max(50, typewriterHeading.offsetHeight || parseFloat(getComputedStyle(typewriterHeading).fontSize) * 1.5) + 'px';
            typewriterHeading.style.minHeight = initialMinHeight;

            function typeWriter() {
                if (i < originalText.length) {
                    typewriterHeading.textContent += originalText.charAt(i);
                    i++;
                    setTimeout(typeWriter, speed);
                } else {
                    typewriterHeading.setAttribute('data-typewriter-applied', 'true');
                    typewriterHeading.style.minHeight = 'auto';
                }
            }
            typeWriter();
        } else {
            typewriterHeading.textContent = originalText;
            typewriterHeading.style.opacity = 1;
            typewriterHeading.style.visibility = 'visible';
            typewriterHeading.style.display = 'block';
            typewriterHeading.style.minHeight = 'auto';
        }
    }

    // Cookie Consent Banner
    const cookieBanner = document.getElementById('cookie-banner');
    if (cookieBanner) {
        const acceptBtn = document.getElementById('accept-cookies'); // Changed from 'cookie-accept'
        const declineBtn = document.getElementById('decline-cookies'); // Changed from 'cookie-decline'

        if (localStorage.getItem('cookieConsent')) {
            cookieBanner.style.display = 'none';
        } else {
            // Ensure banner is visible if no consent is stored.
            // The check for cookieConsent === null in faq.html inline script was more specific.
            // This simpler logic should also work.
            cookieBanner.style.display = 'block'; 
            // setTimeout(() => { cookieBanner.style.display = 'block'; }, 1000); // Delay removed for faster appearance
        }

        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                localStorage.setItem('cookieConsent', 'accepted');
                cookieBanner.style.display = 'none';
                if (window.initializeAnalytics) window.initializeAnalytics();
            });
        }
        if (declineBtn) {
            declineBtn.addEventListener('click', () => {
                localStorage.setItem('cookieConsent', 'declined');
                cookieBanner.style.display = 'none';
            });
        }
    }

    // Dynamic year for footer
    // const currentYear = new Date().getFullYear(); // This was not used, can be removed or implemented
    // Example: document.getElementById('current-year').textContent = currentYear;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePageScripts);
} else {
    initializePageScripts();
}