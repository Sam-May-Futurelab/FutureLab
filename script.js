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
    
    // 5. Dark/Light Mode Toggle
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    document.body.appendChild(themeToggle);
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            this.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('theme', 'light');
            this.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });
    
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
});
