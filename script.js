document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    hamburger.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
    
    // Improved mobile menu functionality
    const menuToggle = document.querySelector('.hamburger, .menu-toggle, .mobile-menu-button');
    const mobileNav = document.querySelector('.nav-links, .main-nav, .mobile-nav');
    
    if (menuToggle && mobileNav) {
        // Toggle mobile menu
        menuToggle.addEventListener('click', function(e) {
            e.preventDefault();
            this.classList.toggle('active');
            mobileNav.classList.toggle('active');
            
            // Fix menu height after toggle to ensure scrolling works
            if (mobileNav.classList.contains('active')) {
                // Set a slight timeout to ensure animation completes
                setTimeout(() => {
                    const viewportHeight = window.innerHeight;
                    mobileNav.style.maxHeight = (viewportHeight * 0.8) + 'px';
                    
                    // Ensure body doesn't scroll when menu is open
                    document.body.style.overflow = 'hidden';
                }, 100);
            } else {
                document.body.style.overflow = '';
            }
        });
        
        // Handle submenus in mobile navigation
        const dropdownToggle = mobileNav.querySelectorAll('.has-dropdown > a');
        dropdownToggle.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    this.nextElementSibling.classList.toggle('show');
                }
            });
        });
        
        // Close menu when clicking anywhere outside
        document.addEventListener('click', function(e) {
            if (mobileNav.classList.contains('active') && 
                !mobileNav.contains(e.target) && 
                !menuToggle.contains(e.target)) {
                menuToggle.classList.remove('active');
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
    
    // Fix viewport height on mobile
    const fixViewportHeight = () => {
        // Mobile viewport height fix (especially for iOS Safari)
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    // Run initially and on resize
    fixViewportHeight();
    window.addEventListener('resize', fixViewportHeight);
    
    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Close mobile menu if open
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
            }
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                
                window.scrollTo({
                    top: targetPosition - headerHeight,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Header Background Change on Scroll
    const header = document.querySelector('header');
    
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
    
    // Form Submission
    const contactForm = document.querySelector('.contact-form');

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const company = document.getElementById('company').value;
            const service = document.getElementById('service').value;
            const message = document.getElementById('message').value;
            
            // Form validation
            if (!name || !email || !message) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Simple email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('Please enter a valid email address');
                return;
            }
            
            // Normally you would send the form data to a server here
            // For now, we'll just show a success message
            alert('Thanks for your message! I\'ll get back to you soon.');
            contactForm.reset();
        });
    }
    
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    image.src = image.dataset.src;
                    image.removeAttribute('data-src');
                    imageObserver.unobserve(image);
                }
            });
        });
        
        images.forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Fallback for browsers that don't support IntersectionObserver
        images.forEach(img => {
            img.src = img.dataset.src;
        });
    }
    
    // Reveal animations on scroll
    const animateElements = document.querySelectorAll('.service-card, .portfolio-item, .price-card');
    
    if ('IntersectionObserver' in window) {
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, {
            threshold: 0.1
        });
        
        animateElements.forEach(element => {
            animationObserver.observe(element);
        });
    }
    
    // Parallax effect for hero section
    const heroSection = document.querySelector('.hero');
    
    window.addEventListener('scroll', function() {
        const scrollPosition = window.pageYOffset;
        if (scrollPosition < 800) {
            const parallaxValue = scrollPosition * 0.15;
            heroSection.style.backgroundPosition = `center -${parallaxValue}px`;
        }
    });
    
    // Floating tech labels random movement
    const floatingTech = document.querySelectorAll('.floating-tech');
    
    floatingTech.forEach(tech => {
        const randomDelay = Math.random() * 2;
        const randomDuration = 6 + Math.random() * 4;
        
        tech.style.animationDelay = `${randomDelay}s`;
        tech.style.animationDuration = `${randomDuration}s`;
    });

    // NEW ANIMATIONS AND IMPROVEMENTS

    // 1. Animated Typing Effect for Hero Heading
    if (document.querySelector('.hero h1')) {
        const heroHeading = document.querySelector('.hero h1');
        const originalText = heroHeading.innerHTML;
        
        // Only run on desktop devices
        if (window.innerWidth > 992) {
            heroHeading.innerHTML = '';
            let charIndex = 0;
            
            function typeWriter() {
                if (charIndex < originalText.length) {
                    heroHeading.innerHTML += originalText.charAt(charIndex);
                    charIndex++;
                    setTimeout(typeWriter, 50);
                }
            }
            
            setTimeout(typeWriter, 500);
        }
    }
    
    // 2. Scroll Progress Indicator
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    document.body.appendChild(progressBar);
    
    window.addEventListener('scroll', function() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        progressBar.style.width = scrolled + '%';
    });
    
    // 3. Number Counter Animation
    const statsSection = document.createElement('section');
    statsSection.className = 'stats';
    statsSection.innerHTML = `
        <div class="container">
            <div class="stats-grid">
                <div class="stat-item" data-count="200">
                    <h3 class="counter">0</h3>
                    <p>Projects Completed</p>
                </div>
                <div class="stat-item" data-count="98">
                    <h3 class="counter">0</h3>
                    <p>Happy Clients</p>
                </div>
                <div class="stat-item" data-count="5">
                    <h3 class="counter">0</h3>
                    <p>Years Experience</p>
                </div>
                <div class="stat-item" data-count="24">
                    <h3 class="counter">0</h3>
                    <p>Awards Received</p>
                </div>
            </div>
        </div>
    `;
    
    // Insert the stats section before the contact section
    const contactSection = document.getElementById('contact');
    document.querySelector('main').insertBefore(statsSection, contactSection);
    
    // Animate the counters when in view
    const counters = document.querySelectorAll('.counter');
    
    function startCounters() {
        counters.forEach(counter => {
            const target = +counter.parentElement.dataset.count;
            const count = +counter.innerText;
            const increment = target / 100;
            
            if (count < target) {
                counter.innerText = Math.ceil(count + increment);
                setTimeout(startCounters, 20);
            } else {
                counter.innerText = target;
            }
        });
    }
    
    // Start counters when they come into view
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
                entry.target.classList.add('counted');
                startCounters();
            }
        });
    }, { threshold: 0.5 });
    
    statsObserver.observe(statsSection);
    
    // 4. Interactive service cards with 3D tilt effect
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
        card.addEventListener('mousemove', function(e) {
            const cardRect = this.getBoundingClientRect();
            const x = e.clientX - cardRect.left;
            const y = e.clientY - cardRect.top;
            
            const centerX = cardRect.width / 2;
            const centerY = cardRect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });

    // Add touch support for service card tilt effect
    serviceCards.forEach(card => {
        // Add touch support (limited tilt for better mobile experience)
        card.addEventListener('touchmove', function(e) {
            if (window.innerWidth <= 992) return; // Disable on small screens
            
            e.preventDefault();
            const touch = e.touches[0];
            const cardRect = this.getBoundingClientRect();
            const x = touch.clientX - cardRect.left;
            const y = touch.clientY - cardRect.top;
            
            const centerX = cardRect.width / 2;
            const centerY = cardRect.height / 2;
            
            // Reduce tilt amount for touch devices
            const rotateX = (y - centerY) / 30;
            const rotateY = (centerX - x) / 30;
            
            this.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(5px)`;
        });
        
        card.addEventListener('touchend', function() {
            this.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
        });
    });
    
    // 5. Theme toggle implementation (simplified elegant version)
    const themeToggle = document.getElementById('theme-toggle');

    if (themeToggle) {
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme');
        
        // Default to dark mode if no preference exists
        if (savedTheme === 'light') {
            document.body.classList.remove('dark-theme');
        } else {
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        }
        
        // Update icon based on current theme
        function updateThemeIcon() {
            if (document.body.classList.contains('dark-theme')) {
                themeToggle.innerHTML = '<i class="fas fa-lightbulb"></i><div class="toggle-glow"></div>';
                document.querySelector('meta[name="theme-color"]').setAttribute('content', '#0f172a');
            } else {
                themeToggle.innerHTML = '<i class="far fa-lightbulb"></i><div class="toggle-glow"></div>';
                document.querySelector('meta[name="theme-color"]').setAttribute('content', '#4361ee');
            }
        }
        
        // Set initial icon
        updateThemeIcon();
        
        // Toggle theme on click with enhanced animation
        themeToggle.addEventListener('click', function() {
            // Add a quick pulse animation on click
            this.style.transform = 'scale(1.2) rotate(15deg)';
            setTimeout(() => {
                this.style.transform = '';
            }, 300);
            
            document.body.classList.toggle('dark-theme');
            
            if (document.body.classList.contains('dark-theme')) {
                localStorage.setItem('theme', 'dark');
            } else {
                localStorage.setItem('theme', 'light');
            }
            
            updateThemeIcon();
            updateOrbColors();
        });
        
        // Add subtle hover glow effect
        themeToggle.addEventListener('mouseenter', function() {
            const glow = this.querySelector('.toggle-glow');
            if (glow) glow.style.opacity = '1';
        });
        
        themeToggle.addEventListener('mouseleave', function() {
            const glow = this.querySelector('.toggle-glow');
            if (glow) glow.style.opacity = '0';
        });
    }
    
    // Update orb colors based on theme with improved colors
    function updateOrbColors() {
        const orbCore = document.querySelector('.orb-core');
        const glow = document.querySelector('.glow');
        const rays = document.querySelectorAll('.ray');
        const techSymbols = document.querySelectorAll('.tech-symbol');
        const particles = document.querySelectorAll('.particle');
        
        if (orbCore) {
            const isDarkMode = document.body.classList.contains('dark-theme');
            orbCore.style.transition = 'background 1s ease, box-shadow 1s ease';
            
            if (isDarkMode) {
                // Dark mode colors - cooler blue/purple with better visibility
                orbCore.style.background = 'radial-gradient(circle at 30% 30%, rgba(124, 58, 237, 0.95), rgba(79, 70, 229, 0.85) 60%, rgba(99, 102, 241, 0.75) 100%)';
                orbCore.style.boxShadow = '0 0 60px rgba(124, 58, 237, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.3)';
                
                if (glow) {
                    glow.style.background = 'radial-gradient(circle at center, rgba(124, 58, 237, 0.4) 0%, rgba(79, 70, 229, 0.2) 30%, transparent 70%)';
                }
                
                rays.forEach(ray => {
                    ray.style.background = 'linear-gradient(to top, rgba(124, 58, 237, 0.8), rgba(124, 58, 237, 0))';
                });
                
                // Also update tech symbols and particles for better visibility
                techSymbols.forEach(symbol => {
                    symbol.style.color = '#818cf8';
                    symbol.style.textShadow = '0 0 10px rgba(124, 58, 237, 0.8)';
                });
                
                particles.forEach(particle => {
                    particle.style.background = '#818cf8';
                    particle.style.boxShadow = '0 0 20px rgba(124, 58, 237, 0.8), 0 0 40px rgba(124, 58, 237, 0.4)';
                });
            } else {
                // Light mode colors - original blue
                orbCore.style.background = 'radial-gradient(circle at 30% 30%, rgba(76, 201, 240, 0.95), rgba(67, 97, 238, 0.85) 60%, rgba(58, 134, 255, 0.75) 100%)';
                orbCore.style.boxShadow = '0 0 60px rgba(76, 201, 240, 0.6), inset 0 0 30px rgba(255, 255, 255, 0.3)';
                
                if (glow) {
                    glow.style.background = 'radial-gradient(circle at center, rgba(76, 201, 240, 0.4) 0%, rgba(67, 97, 238, 0.2) 30%, transparent 70%)';
                }
                
                rays.forEach(ray => {
                    ray.style.background = 'linear-gradient(to top, rgba(76, 201, 240, 0.8), rgba(76, 201, 240, 0))';
                });
                
                // Reset tech symbols and particles
                techSymbols.forEach(symbol => {
                    symbol.style.color = '';
                    symbol.style.textShadow = '';
                });
                
                particles.forEach(particle => {
                    particle.style.background = '';
                    particle.style.boxShadow = '';
                });
            }
        }
    }
    
    // 6. Cursor follower effect (desktop only)
    if (window.innerWidth > 992) {
        const cursor = document.createElement('div');
        cursor.className = 'cursor-follower';
        document.body.appendChild(cursor);
        
        document.addEventListener('mousemove', function(e) {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
        
        // Add active class when hovering over interactive elements
        document.querySelectorAll('a, button, .service-card, .portfolio-item').forEach(item => {
            item.addEventListener('mouseenter', () => cursor.classList.add('active'));
            item.addEventListener('mouseleave', () => cursor.classList.remove('active'));
        });
    }

    // Check if testimonials JS is loaded correctly
    if (typeof updateTestimonialSlider !== 'function') {
        console.log('Loading testimonials fallback...');
        // Testimonial Slider Functionality
        const slider = document.querySelector('.testimonial-slider');
        if (slider) {
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
            if(prevBtn && nextBtn) {
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
            }
        }
    }

    // Initialize Lottie Animation
    const lottieContainer = document.getElementById('lottie-animation');
    if (lottieContainer) {
        // Choose one of these animations based on your preference
        const animationPath = 'https://lottie.host/embed/d0640935-5e6b-45af-aef7-2c93dfad96f0/MzDhMt63pm.json'; // Web/App Development Animation
        // Alternative animations:
        // 'https://lottie.host/embed/79b154c2-6b9d-42bf-a3ce-d0f4385a640b/itQigGvwW1.json' // Code Animation
        // 'https://lottie.host/embed/60335dd2-3d63-400f-a610-b66c2a7c6f63/F58VeZr0aY.json' // Design & Development
        
        const animation = lottie.loadAnimation({
            container: lottieContainer,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: animationPath
        });
        
        animation.addEventListener('DOMLoaded', function() {
            // Add class to indicate animation is loaded
            document.body.classList.add('lottie-loaded');
            
            // Optional: Add subtle interactivity to the animation
            lottieContainer.addEventListener('mouseenter', function() {
                animation.setSpeed(1.5); // Speed up on hover
            });
            lottieContainer.addEventListener('mouseleave', function() {
                animation.setSpeed(1); // Return to normal speed
            });
        });
    }

    // Enhanced Interactive 3D Orb Animation
    const orbContainer = document.querySelector('.orb-container');
    const orb = document.querySelector('.orb');

    if (orbContainer && orb) {
        // Make the orb rotate on mouse movement with enhanced effects
        orbContainer.addEventListener('mousemove', function(e) {
            const containerRect = orbContainer.getBoundingClientRect();
            const centerX = containerRect.width / 2;
            const centerY = containerRect.height / 2;
            const mouseX = e.clientX - containerRect.left;
            const mouseY = e.clientY - containerRect.top;
            
            // Calculate rotation based on mouse position with smoother motion
            const rotateY = (mouseX - centerX) / 10;
            const rotateX = (centerY - mouseY) / 10;
            
            // Apply smooth transition for mouse interaction
            orb.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';
            orb.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            
            // Change intensity of glow based on mouse position
            const distanceFromCenter = Math.sqrt(
                Math.pow(mouseX - centerX, 2) + 
                Math.pow(mouseY - centerY, 2)
            );
            
            const glowElement = document.querySelector('.glow');
            if (glowElement) {
                const maxDistance = Math.sqrt(Math.pow(centerX, 2) + Math.pow(centerY, 2));
                const normalizedDistance = 1 - (distanceFromCenter / maxDistance);
                glowElement.style.opacity = 0.3 + (normalizedDistance * 0.4);
            }
        });
        
        // Reset rotation when mouse leaves with smooth transition back to animation
        orbContainer.addEventListener('mouseleave', function() {
            orb.style.transform = 'rotateX(10deg) rotateY(0deg)';
            orb.style.transition = 'transform 1s cubic-bezier(0.2, 0.8, 0.2, 1)';
            
            const glowElement = document.querySelector('.glow');
            if (glowElement) {
                glowElement.style.opacity = '';
            }
        });
        
        // Add touch interaction for mobile
        orbContainer.addEventListener('touchmove', function(e) {
            if (e.touches.length > 0) {
                e.preventDefault(); // Prevent scrolling while interacting
                const touch = e.touches[0];
                const containerRect = orbContainer.getBoundingClientRect();
                const centerX = containerRect.width / 2;
                const centerY = containerRect.height / 2;
                const touchX = touch.clientX - containerRect.left;
                const touchY = touch.clientY - containerRect.top;
                
                // Calculate rotation with reduced intensity for mobile
                const rotateY = (touchX - centerX) / 15;
                const rotateX = (centerY - touchY) / 15;
                
                orb.style.transition = 'transform 0.1s ease-out';
                orb.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                
                // Create occasional particle effect on touch as well
                if (Math.random() > 0.8) {
                    createParticleTrail(touchX, touchY, containerRect);
                }
            }
        });
        
        // Reset on touch end
        orbContainer.addEventListener('touchend', function() {
            orb.style.transform = 'rotateX(10deg) rotateY(0deg)';
            orb.style.transition = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
        });
        
        // Device orientation for mobile devices - subtle tilt based on device orientation
        if (window.DeviceOrientationEvent && window.innerWidth <= 992) {
            // Only apply if not currently being touched
            window.addEventListener('deviceorientation', function(e) {
                if (!orbContainer.classList.contains('touching')) {
                    // Use beta (x-axis) and gamma (y-axis) values for tilt
                    const tiltY = Math.min(Math.max(e.beta, -15), 15) / 2;
                    const tiltX = Math.min(Math.max(e.gamma, -15), 15) / 2;
                    
                    orb.style.transition = 'transform 0.4s ease-out';
                    orb.style.transform = `rotateX(${tiltY}deg) rotateY(${tiltX}deg)`;
                }
            });
            
            // Add touching class to prevent orientation conflicts
            orbContainer.addEventListener('touchstart', () => {
                orbContainer.classList.add('touching');
            });
            orbContainer.addEventListener('touchend', () => {
                orbContainer.classList.remove('touching');
            });
        }
        
        // Add keyframe animation for particle fade-out
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fade-out-particle {
                0% { transform: scale(1); opacity: 0.8; }
                100% { transform: scale(0); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        
        // Function to create particle trail on interaction
        function createParticleTrail(x, y, containerRect) {
            const particle = document.createElement('div');
            particle.className = 'interaction-particle';
            particle.style.cssText = `
                position: absolute;
                width: 5px;
                height: 5px;
                background: var(--primary-color);
                border-radius: 50%;
                opacity: 0.8;
                filter: blur(1px);
                pointer-events: none;
                z-index: 10;
                left: ${x}px;
                top: ${y}px;
                box-shadow: 0 0 10px var(--primary-color);
                animation: fade-out-particle 1s forwards ease-out;
            `;
            
            orbContainer.appendChild(particle);
            
            // Remove particle after animation completes
            setTimeout(() => {
                if (orbContainer.contains(particle)) {
                    orbContainer.removeChild(particle);
                }
            }, 1000);
        }
        
        // Create tech symbols and distribute them in 3D space
        const techSymbols = document.querySelector('.tech-symbols');
        if (techSymbols) {
            const symbols = techSymbols.querySelectorAll('.tech-symbol');
            symbols.forEach((symbol, index) => {
                // Create 3D positioning for the tech symbols
                const angleY = (index / symbols.length) * 360;
                const radius = 150 + (Math.random() * 30);
                const x = radius * Math.sin(angleY * Math.PI / 180);
                const z = radius * Math.cos(angleY * Math.PI / 180);
                const y = -50 + Math.random() * 100;
                
                symbol.style.transform = `translate3d(${x}px, ${y}px, ${z}px)`;
            });
        }
    }
});

// EMERGENCY FIX: Reliable mobile menu toggle and scrolling
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerBtn = document.querySelector('.hamburger, .menu-toggle, .mobile-menu-button');
    const mobileNav = document.querySelector('.nav-links, .mobile-nav, .main-nav');
    
    // Only execute if these elements exist
    if (hamburgerBtn && mobileNav) {
        // Force menu styles on window resize
        function setupMobileMenuStyles() {
            if (window.innerWidth <= 768) {
                // Make sure base styles are correct
                Object.assign(mobileNav.style, {
                    position: 'fixed',
                    top: '70px', // Adjust based on your header height
                    left: '0',
                    right: '0',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    zIndex: '1000'
                });
            } else {
                // Reset styles on desktop
                Object.assign(mobileNav.style, {
                    position: '',
                    top: '',
                    left: '',
                    right: '',
                    maxHeight: '',
                    overflowY: '',
                    WebkitOverflowScrolling: '',
                    zIndex: ''
                });
            }
        }
        
        // Call on load
        setupMobileMenuStyles();
        
        // Call on resize
        window.addEventListener('resize', setupMobileMenuStyles);
        
        hamburgerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Toggle menu
            this.classList.toggle('active');
            mobileNav.classList.toggle('active');
            
            // When activated, ensure menu is visible and scrollable
            if (mobileNav.classList.contains('active') && window.innerWidth <= 768) {
                // Force styles directly
                Object.assign(mobileNav.style, {
                    display: 'block',
                    maxHeight: '80vh',
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch'
                });
                
                // Prevent body scroll when menu is open
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        });
    }
});

// CRITICAL FIX: Force proper image sizes on mobile
document.addEventListener('DOMContentLoaded', function() {
    function fixMockupImages() {
        const mockupImages = document.querySelectorAll('img[src*="cardwizz-mockup.png"], img[src*="pokespud-mockup.png"]');
        
        mockupImages.forEach(img => {
            // Force proper size and fit
            Object.assign(img.style, {
                maxWidth: '100%',
                height: 'auto',
                maxHeight: window.innerWidth <= 768 ? '300px' : 'none',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto'
            });
            
            // Also fix parent containers
            let parent = img.parentElement;
            for (let i = 0; i < 3; i++) { // Go up 3 levels of parents to fix containers
                if (parent) {
                    Object.assign(parent.style, {
                        overflow: 'visible',
                        height: 'auto',
                        maxHeight: 'none'
                    });
                    parent = parent.parentElement;
                }
            }
        });
    }
    
    // Run on load
    fixMockupImages();
    
    // Run on resize
    window.addEventListener('resize', fixMockupImages);
    
    // Run after a delay to ensure it works after any dynamic content loads
    setTimeout(fixMockupImages, 1000);
});

// Fix 3D animation performance on mobile devices
document.addEventListener('DOMContentLoaded', function() {
    // Detect mobile devices for animation optimization
    const isMobile = window.innerWidth < 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // Find 3D animation elements
        const animationElements = document.querySelectorAll('.hero-3d-container, .animated-3d-element, .hero-animation-container');
        
        animationElements.forEach(element => {
            // Simplify animations for mobile
            const animations = element.getAnimations ? element.getAnimations() : [];
            animations.forEach(animation => {
                // Reduce animation complexity
                animation.playbackRate = 0.75; // Slow down for better performance
            });
            
            // Add mobile-optimized class
            element.classList.add('mobile-optimized');
        });
        
        // Reduce frame rate of complex animations on low-end devices
        if (navigator.deviceMemory && navigator.deviceMemory < 4) {
            // For devices with less memory, further optimize
            document.body.classList.add('reduce-motion');
        }
    }
});

// Add enhanced smooth scroll handling with performance optimizations
document.addEventListener('DOMContentLoaded', function() {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    hamburger.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
    
    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Close mobile menu if open
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
            }
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return; // Skip empty links
            
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                const headerHeight = document.querySelector('header').offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                
                // Use native smooth scroll with fallback
                if ('scrollBehavior' in document.documentElement.style) {
                    // Modern browsers with native smooth scrolling
                    window.scrollTo({
                        top: targetPosition - headerHeight,
                        behavior: 'smooth'
                    });
                } else {
                    // Fallback for browsers without native smooth scrolling
                    smoothScrollTo(targetPosition - headerHeight, 800);
                }
            }
        });
    });
    
    // Smooth scrolling fallback function for older browsers
    function smoothScrollTo(targetPosition, duration) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;
        
        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            
            // Easing function for smoother acceleration/deceleration
            const ease = easeInOutQuad(progress);
            
            window.scrollTo(0, startPosition + distance * ease);
            
            if (timeElapsed < duration) {
                requestAnimationFrame(animation);
            }
        }
        
        // Easing function
        function easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }
        
        requestAnimationFrame(animation);
    }
});