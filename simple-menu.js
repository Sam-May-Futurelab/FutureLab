// Simple, reliable mobile menu toggle for both pages

document.addEventListener('DOMContentLoaded', function() {
  // Get the hamburger button and mobile menu with multiple possible selectors
  const hamburgerBtn = document.querySelector('.hamburger, .menu-toggle, .mobile-menu-button');
  const mobileMenu = document.querySelector('.mobile-nav, .nav-links, .main-nav');
  
  // Debug which page we're on to help troubleshoot
  const isShowcasePage = document.querySelector('.showcase-page') !== null;
  console.log('Page type detected:', isShowcasePage ? 'Showcase page' : 'Main page');
  
  // First fix: Hide hamburger on desktop, only show on mobile
  function updateMenuVisibility() {
    // Only show hamburger on mobile screens
    if (window.innerWidth > 768) {
      // We're on desktop - hide hamburger unless we're in a special case
      if (!document.body.classList.contains('desktop-hamburger')) {
        if (hamburgerBtn) hamburgerBtn.style.display = 'none';
      }
    } else {
      // We're on mobile - always show hamburger
      if (hamburgerBtn) hamburgerBtn.style.display = 'block';
    }
  }
  
  // Run initially and on window resize
  updateMenuVisibility();
  window.addEventListener('resize', updateMenuVisibility);
  
  // SHOWCASE PAGE SPECIFIC FIX - Add this directly after the existing showcase detection
  if (isShowcasePage) {
    console.log('Applying showcase-specific menu fixes');
    
    // Try alternative selectors specifically for showcase page structure
    const showcaseHamburger = document.querySelector('.showcase-page .hamburger, .showcase-page header button, .showcase-header .menu-toggle');
    const showcaseMenu = document.querySelector('.showcase-page .nav-links, .showcase-page nav ul, .showcase-nav');
    
    if (showcaseHamburger && showcaseMenu) {
      console.log('Found showcase menu elements - adding event listener');
      
      // Direct click handler for showcase page
      showcaseHamburger.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Showcase hamburger clicked');
        
        // Toggle classes
        this.classList.toggle('active');
        showcaseMenu.classList.toggle('active');
        
        // Force styles for mobile
        if (window.innerWidth <= 768) {
          if (showcaseMenu.classList.contains('active')) {
            showcaseMenu.style.display = 'block';
            showcaseMenu.style.position = 'fixed';
            showcaseMenu.style.top = '70px';
            showcaseMenu.style.left = '0';
            showcaseMenu.style.right = '0';
            showcaseMenu.style.maxHeight = '80vh';
            showcaseMenu.style.backgroundColor = '#fff';
            showcaseMenu.style.zIndex = '999';
            showcaseMenu.style.padding = '20px';
            showcaseMenu.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
            showcaseMenu.style.overflow = 'auto';
          } else {
            showcaseMenu.style = '';
          }
        }
      });
    } else {
      console.warn('Could not find showcase menu elements - attempting to create menu');
      
      // Last resort: Try to find elements or create them if needed
      const showcaseHeader = document.querySelector('.showcase-page header');
      if (showcaseHeader) {
        // Find existing elements or create new ones
        let menuBtn = showcaseHeader.querySelector('.hamburger') || 
                      showcaseHeader.querySelector('.menu-toggle');
                      
        if (!menuBtn) {
          console.log('Creating hamburger button for showcase');
          menuBtn = document.createElement('button');
          menuBtn.className = 'hamburger menu-toggle';
          menuBtn.innerHTML = '<span></span><span></span><span></span>';
          showcaseHeader.appendChild(menuBtn);
        }
        
        // Continue with the implementation...
        // (this is a fallback solution)
      }
    }
  }
  
  // Check if elements exist
  if (hamburgerBtn && mobileMenu) {
    console.log('Menu elements found - initializing toggle');
    
    // Simple click handler to toggle active class
    hamburgerBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('Menu button clicked');
      
      // Toggle active classes
      mobileMenu.classList.toggle('active');
      this.classList.toggle('active');
      
      // Fix: Make menu always visible on mobile when active
      if (window.innerWidth <= 768) {
        if (mobileMenu.classList.contains('active')) {
          mobileMenu.style.display = 'block';
          mobileMenu.style.opacity = '1';
          mobileMenu.style.visibility = 'visible';
        } else {
          mobileMenu.style.display = '';
          mobileMenu.style.opacity = '';
          mobileMenu.style.visibility = '';
        }
      }
      
      // Accessibility
      const expanded = this.getAttribute('aria-expanded') === 'true' || false;
      this.setAttribute('aria-expanded', !expanded);
    });
    
    // Add listener to close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (mobileMenu.classList.contains('active') && 
          !mobileMenu.contains(e.target) && 
          !hamburgerBtn.contains(e.target)) {
        mobileMenu.classList.remove('active');
        hamburgerBtn.classList.remove('active');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
      }
    });
  } else {
    console.warn('Menu elements not found:', { 
      hamburgerBtn: hamburgerBtn ? 'Found' : 'Not found', 
      mobileMenu: mobileMenu ? 'Found' : 'Not found' 
    });
  }
});
