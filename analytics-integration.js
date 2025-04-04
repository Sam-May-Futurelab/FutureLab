/**
 * Enhanced Google Analytics 4 Integration
 * This script adds enhanced events and custom triggers for Google Analytics tracking
 */

document.addEventListener('DOMContentLoaded', function() {
    // Make sure GA is loaded
    if (typeof gtag !== 'function') {
        console.warn('Google Analytics not found. Analytics integration skipped.');
        return;
    }

    // Track custom events
    setupCustomEventTracking();
    
    // Track outbound links
    trackOutboundLinks();
    
    // Track form submissions
    trackFormSubmissions();
    
    // Track visible sections
    trackSectionVisibility();
});

/**
 * Sets up tracking of custom user interactions
 */
function setupCustomEventTracking() {
    // Track service card clicks
    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => {
        card.addEventListener('click', function() {
            const serviceName = card.querySelector('h3')?.textContent || 'Unknown Service';
            gtag('event', 'service_click', {
                'service_name': serviceName,
                'event_category': 'engagement',
                'event_label': 'Service Interest'
            });
        });
    });
    
    // Track portfolio item clicks
    const portfolioItems = document.querySelectorAll('.portfolio-item a.btn');
    portfolioItems.forEach(item => {
        item.addEventListener('click', function(e) {
            const projectName = this.closest('.portfolio-item').querySelector('h3')?.textContent || 'Unknown Project';
            gtag('event', 'portfolio_click', {
                'project_name': projectName,
                'event_category': 'engagement',
                'event_label': 'Portfolio Interest'
            });
        });
    });
    
    // Track theme toggle clicks
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', function() {
            const newTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
            gtag('event', 'theme_change', {
                'theme': newTheme,
                'event_category': 'preferences',
                'event_label': 'Theme Preference'
            });
        });
    }
    
    // Track FAQ interactions
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        item.querySelector('.faq-question')?.addEventListener('click', function() {
            const faqTitle = this.querySelector('h3')?.textContent || 'Unknown FAQ';
            const isExpanding = !item.classList.contains('active');
            gtag('event', 'faq_interaction', {
                'faq_title': faqTitle,
                'action': isExpanding ? 'opened' : 'closed',
                'event_category': 'content_engagement'
            });
        });
    });
}

/**
 * Track clicks on external links
 */
function trackOutboundLinks() {
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        
        if (link && link.href && link.hostname !== window.location.hostname) {
            gtag('event', 'outbound_link_click', {
                'link_url': link.href,
                'link_text': link.textContent || 'No Text',
                'event_category': 'outbound_links'
            });
        }
    });
}

/**
 * Track form submissions
 */
function trackFormSubmissions() {
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        const serviceField = document.getElementById('service');
        const serviceValue = serviceField ? serviceField.value : 'Not specified';
        
        gtag('event', 'form_submission', {
            'form_id': 'contact_form',
            'service_requested': serviceValue,
            'event_category': 'lead_generation'
        });
    });
}

/**
 * Track when sections become visible on screen
 */
function trackSectionVisibility() {
    // Only track if Intersection Observer is available
    if (!('IntersectionObserver' in window)) return;
    
    const sections = document.querySelectorAll('section[id]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.id;
                
                // Don't track again if already tracked
                if (entry.target.dataset.tracked === 'true') return;
                
                gtag('event', 'section_view', {
                    'section_id': sectionId,
                    'event_category': 'content_engagement'
                });
                
                // Mark as tracked to prevent duplicate events
                entry.target.dataset.tracked = 'true';
            }
        });
    }, {
        threshold: 0.3 // Trigger when 30% of the section is visible
    });
    
    sections.forEach(section => {
        observer.observe(section);
    });
}
