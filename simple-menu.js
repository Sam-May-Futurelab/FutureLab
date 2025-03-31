// Simple, reliable mobile menu toggle for both pages

document.addEventListener('DOMContentLoaded', function() {
  // Get the hamburger button and mobile menu with multiple possible selectors
  const hamburgerBtn = document.querySelector('.hamburger, .menu-toggle, .mobile-menu-button');
  const mobileMenu = document.querySelector('.mobile-nav, .nav-links, .main-nav');
  
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
          mobileMenu.style.maxHeight = '85vh'; // Set a larger max-height
          document.body.style.overflow = 'hidden'; // Prevent scrolling of body when menu is open
        } else {
          mobileMenu.style.display = '';
          mobileMenu.style.opacity = '';
          mobileMenu.style.visibility = '';
          mobileMenu.style.maxHeight = '';
          document.body.style.overflow = ''; // Restore body scrolling
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
