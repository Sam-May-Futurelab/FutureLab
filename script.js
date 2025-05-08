document.addEventListener('DOMContentLoaded', function() {
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

    // Check if header's own script is active (simple-menu.js might set a flag or be identifiable)
    // For now, we assume if simple-menu.js is included and active, it handles the menu.
    // The inline script in header.html is more direct.
    const headerInlineScriptActive = document.getElementById('header-inline-script-active'); // Assuming header.html script adds this ID to its <script> tag

    if (hamburger && navLinks && !headerInlineScriptActive && !window.SimpleMenu) { // Also check if simple-menu.js is not globally available
        // console.warn('script.js: Attaching fallback hamburger menu listeners.');
        const toggleMenu = (e) => {
            if (e) e.preventDefault(); // Prevent default action if event object exists
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
            if (mobileOverlay) mobileOverlay.classList.toggle('active');
            body.classList.toggle('menu-open');
        };

        hamburger.addEventListener('click', toggleMenu, true);
        // Adding touchend for better mobile responsiveness, ensuring it doesn't double-trigger with click
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
                    toggleMenu(); // Call without event object
                }
            });
        });

        if (mobileOverlay) {
            mobileOverlay.addEventListener('click', () => toggleMenu()); // Call without event object
        }
    } else if (!hamburger || !navLinks) {
        // console.warn("script.js: Hamburger or nav-links not found for fallback menu logic.");
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
            const answer = item.querySelector('.faq-answer');
            if (question && answer) {
                // Initialize answer height for pre-opened items
                if (item.classList.contains('active')) {
                    answer.style.height = answer.scrollHeight + 'px';
                } else {
                    answer.style.height = '0px';
                }

                question.addEventListener('click', () => {
                    const isActive = item.classList.contains('active');
                    
                    // Close all other active FAQ items
                    faqItems.forEach(otherItem => {
                        if (otherItem !== item && otherItem.classList.contains('active')) {
                            otherItem.classList.remove('active');
                            const otherAnswer = otherItem.querySelector('.faq-answer');
                            if (otherAnswer) otherAnswer.style.height = '0px';
                        }
                    });

                    // Toggle the current item
                    item.classList.toggle('active');
                    answer.style.height = item.classList.contains('active') ? answer.scrollHeight + 'px' : '0px';
                });
            }
        });
    }

    // Typewriter effect for hero heading
    const typewriterHeading = document.querySelector('.hero h1.gradient-text');
    if (typewriterHeading) {
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';
        const validPagesForTypewriter = ['index.html', '', 'ecommerce.html']; // web-design.html has data-no-animation

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
        const acceptBtn = document.getElementById('cookie-accept');
        const declineBtn = document.getElementById('cookie-decline');

        if (localStorage.getItem('cookieConsent')) {
            cookieBanner.style.display = 'none';
        } else {
            setTimeout(() => { cookieBanner.style.display = 'block'; }, 1000);
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
    const currentYear = new Date().getFullYear();
});