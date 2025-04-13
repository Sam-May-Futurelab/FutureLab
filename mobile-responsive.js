/**
 * Mobile-specific optimizations
 */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize mobile optimizations
  initMobileOptimizations();
  
  // Hide comparison section on mobile devices
  function handleComparisonVisibility() {
    const comparisonSection = document.querySelector('.comparison');
    if (comparisonSection) {
      if (window.innerWidth <= 768) {
        comparisonSection.style.display = 'none';
      } else {
        comparisonSection.style.display = '';
      }
    }
  }
  
  // Call on page load
  handleComparisonVisibility();
  
  // Call on window resize
  window.addEventListener('resize', handleComparisonVisibility);
});

/**
 * Apply various mobile-specific optimizations
 */
function initMobileOptimizations() {
  // Add viewport height fix for mobile browsers (iOS Safari issue)
  fixMobileViewportHeight();
  
  // Optimize interactions for touch devices
  optimizeTouchInteractions();
  
  // Add fast-click to eliminate 300ms delay on some mobile browsers
  enableFastClick();
  
  // Handle orientation changes
  handleOrientationChanges();
  
  // Optimize image loading for mobile
  lazyLoadImagesOnMobile();
}

/**
 * Fix the common iOS Safari issue with 100vh
 */
function fixMobileViewportHeight() {
  // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
  let vh = window.innerHeight * 0.01;
  // Then we set the value in the --vh custom property to the root of the document
  document.documentElement.style.setProperty('--vh', `${vh}px`);

  // Update the height on resize
  window.addEventListener('resize', () => {
    let vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  });
}

/**
 * Optimize touch interactions for mobile devices
 */
function optimizeTouchInteractions() {
  // Get all clickable elements
  const clickableElements = document.querySelectorAll('button, .stat-card, .activity-item, .responsive-btn, .responsive-feature-item');
  
  // Add touch feedback
  clickableElements.forEach(element => {
    // Add active state class on touch start
    element.addEventListener('touchstart', function() {
      this.classList.add('touch-active');
    }, { passive: true });
    
    // Remove active state on touch end
    element.addEventListener('touchend', function() {
      this.classList.remove('touch-active');
    }, { passive: true });
    
    // Also remove on touch move to avoid stuck active states
    element.addEventListener('touchmove', function() {
      this.classList.remove('touch-active');
    }, { passive: true });
  });
}

/**
 * Enable fast-click to remove 300ms delay on some mobile browsers
 */
function enableFastClick() {
  if ('addEventListener' in document) {
    document.addEventListener('DOMContentLoaded', function() {
      // Simple fast click implementation
      const attachFastClick = function(element) {
        let startX, startY;
        
        element.addEventListener('touchstart', function(e) {
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
        }, false);
        
        element.addEventListener('touchend', function(e) {
          // Only trigger click if user hasn't moved too much (avoid click on scroll)
          if (e.changedTouches && e.changedTouches.length) {
            const endX = e.changedTouches[0].clientX;
            const endY = e.changedTouches[0].clientY;
            
            if (Math.abs(endX - startX) < 10 && Math.abs(endY - startY) < 10) {
              e.preventDefault();
              element.click();
            }
          }
        }, false);
      };
      
      // Apply to clickable elements
      const clickableElements = document.querySelectorAll('button, a');
      clickableElements.forEach(attachFastClick);
    });
  }
}

/**
 * Handle orientation changes and adjust UI accordingly
 */
function handleOrientationChanges() {
  window.addEventListener('orientationchange', function() {
    // Force redraw of elements that might have rendering issues
    setTimeout(function() {
      const elements = document.querySelectorAll('.stat-card, .activity-item, .device-mockup, .responsive-feature-item');
      elements.forEach(element => {
        // Force redraw by temporarily modifying a style property
        const display = element.style.display;
        element.style.display = 'none';
        void element.offsetHeight; // Trigger reflow
        element.style.display = display;
      });
      
      // Re-run any necessary calculations
      fixMobileViewportHeight();
    }, 300); // Wait for orientation change to complete
  });
}

/**
 * Lazy load images on mobile to improve performance
 */
function lazyLoadImagesOnMobile() {
  // Only apply to mobile devices
  if (window.innerWidth <= 768) {
    // Check if IntersectionObserver is available
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            imageObserver.unobserve(img);
          }
        });
      });
      
      // Target all images with data-src attribute
      const lazyImages = document.querySelectorAll('img[data-src]');
      lazyImages.forEach(img => {
        imageObserver.observe(img);
      });
    } else {
      // Fallback for browsers that don't support IntersectionObserver
      document.addEventListener('scroll', debounce(function() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
          if (isElementInViewport(img)) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
        });
        
        if (lazyImages.length === 0) {
          document.removeEventListener('scroll', this);
        }
      }, 200));
    }
  }
}

/**
 * Check if element is in viewport
 */
function isElementInViewport(el) {
  const rect = el.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Simple debounce function
 */
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

/**
 * Mobile Responsive Enhancements
 * Improves the mobile experience across the site
 */

document.addEventListener('DOMContentLoaded', function() {
  // Detect mobile devices
  const isMobile = window.innerWidth < 768;
  
  // Enhanced mobile menu appearance
  function enhanceMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    
    if (!navLinks || !hamburger) return;
    
    // Ensure proper centering of all menu items on mobile
    if (window.innerWidth < 768) {
      // Center align all menu items
      const navItems = navLinks.querySelectorAll('li');
      navItems.forEach(item => {
        item.style.textAlign = 'center';
        item.style.width = '100%';
        
        // Center the contact button specifically
        const button = item.querySelector('.btn');
        if (button) {
          button.style.margin = '20px auto';
          button.style.display = 'block';
          button.style.width = '70%';
          button.style.textAlign = 'center';
        }
      });
      
      // Ensure nav-links takes full width and height in mobile
      navLinks.style.width = '100%';
      navLinks.style.height = '100vh';
      navLinks.style.alignItems = 'center';
      navLinks.style.justifyContent = 'center';
    }
  }
  
  // Run initially
  enhanceMobileMenu();
  
  // Update on resize
  window.addEventListener('resize', function() {
    enhanceMobileMenu();
  });
  
  // Additional mobile optimizations
  if (isMobile) {
    // Improve tap targets for better mobile usability
    const allLinks = document.querySelectorAll('a, button');
    allLinks.forEach(link => {
      // Only apply to navigation links and small buttons
      if (!link.classList.contains('btn-lg')) {
        // Ensure minimum tap target size (44x44px)
        const computedStyle = window.getComputedStyle(link);
        const height = parseInt(computedStyle.height);
        const width = parseInt(computedStyle.width);
        
        if (height < 44 || width < 44) {
          link.style.minHeight = '44px';
          link.style.minWidth = '44px';
          link.style.display = 'inline-flex';
          link.style.alignItems = 'center';
          link.style.justifyContent = 'center';
        }
      }
    });
    
    // Optimize form fields for mobile
    const formFields = document.querySelectorAll('input, textarea, select');
    formFields.forEach(field => {
      field.style.fontSize = '16px'; // Prevent iOS zoom on focus
      field.style.padding = '12px'; // Larger touch target
    });
  }
});
