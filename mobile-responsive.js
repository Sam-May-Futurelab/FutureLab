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

document.addEventListener('DOMContentLoaded', function() {
  // Detect mobile devices
  const isMobile = window.innerWidth < 768;
  
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

document.addEventListener('DOMContentLoaded', function() {
    // Mobile menu functionality removed
    console.log('Mobile menu functionality removed as requested');
});

// Immediate self-executing function to protect hero heading content
(function() {
    // Run this code as soon as possible
    function protectHeroHeading() {
        // Target hero heading with data-no-animation
        const heroHeading = document.querySelector('h1[data-no-animation], .hero h1[data-no-animation], .animate-in.gradient-text');
        
        if (heroHeading) {
            console.log("Protected heading found:", heroHeading.innerText);
            
            // Store the original content
            const originalText = heroHeading.innerText;
            const originalHTML = heroHeading.innerHTML;
            
            // Force visibility with inline styles having highest specificity
            heroHeading.setAttribute('style', 
                'display: block !important; ' +
                'visibility: visible !important; ' + 
                'opacity: 1 !important; ' +
                'min-height: auto !important;'
            );
            
            // Set a flag on the element that it's protected
            heroHeading.setAttribute('data-protected', 'true');
            
            // Periodically check that content hasn't been cleared
            const checkInterval = setInterval(function() {
                if (heroHeading.innerText === '' || !heroHeading.innerText) {
                    console.log("Hero heading was cleared, restoring content");
                    heroHeading.innerHTML = originalHTML;
                    
                    // Re-apply protection styles
                    heroHeading.setAttribute('style', 
                        'display: block !important; ' +
                        'visibility: visible !important; ' + 
                        'opacity: 1 !important; ' +
                        'min-height: auto !important;'
                    );
                }
            }, 100); // Check every 100ms
            
            // Stop checking after 5 seconds
            setTimeout(function() {
                clearInterval(checkInterval);
                console.log("Hero heading protection complete");
            }, 5000);
            
            // Override any attempt to modify the heading in the future
            const originalSetAttribute = heroHeading.setAttribute;
            heroHeading.setAttribute = function(name, value) {
                if ((name === 'style' && value.includes('display: none')) || 
                    (name === 'style' && value.includes('visibility: hidden')) ||
                    name === 'data-no-animation' || 
                    name === 'data-typewriter-applied') {
                    console.log("Blocked attempt to modify hero heading:", name, value);
                    return;
                }
                return originalSetAttribute.call(this, name, value);
            };
        } else {
            console.log("No hero heading with data-no-animation found");
        }
    }
    
    // Try executing immediately
    protectHeroHeading();
    
    // Also run when DOM is interactive
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', protectHeroHeading);
    }
    
    // Run one more time after a short delay to catch any late modifications
    setTimeout(protectHeroHeading, 100);
    setTimeout(protectHeroHeading, 500);
    setTimeout(protectHeroHeading, 1000);
})();

// Add direct override for typewriter effect
document.addEventListener('DOMContentLoaded', function() {
    // Find all typewriter functions and disable them for hero headings with data-no-animation
    setTimeout(function() {
        // Find typewriter function references
        const globalFunctions = [
            'typeWriter', 
            'typewriterEffect', 
            'animateTypewriter', 
            'heroTypewriter'
        ];
        
        // Try to disable them
        globalFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                const originalFunc = window[funcName];
                window[funcName] = function(...args) {
                    const targetHeading = document.querySelector('h1[data-no-animation], .hero h1[data-no-animation]');
                    if (targetHeading) {
                        console.log(`Blocked ${funcName} execution on protected element`);
                        return;
                    }
                    return originalFunc.apply(this, args);
                };
                console.log(`Overrode ${funcName} function`);
            }
        });
        
        // Extra protection: add CSS that ensures the heading is visible
        const style = document.createElement('style');
        style.textContent = `
            h1[data-no-animation], 
            .hero h1[data-no-animation],
            .hero h1.gradient-text[data-no-animation] {
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
                min-height: auto !important;
                position: relative !important;
                left: auto !important;
                top: auto !important;
                pointer-events: auto !important;
            }
        `;
        document.head.appendChild(style);
    }, 200);
});
