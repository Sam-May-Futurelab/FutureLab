// Simple, reliable mobile menu toggle for both desktop and mobile

document.addEventListener('DOMContentLoaded', function() {
  // Get the hamburger button and mobile menu with multiple possible selectors
  const hamburgerBtn = document.querySelector('.hamburger, .menu-toggle, .mobile-menu-button');
  const mobileMenu = document.querySelector('.mobile-nav, .nav-links, .main-nav');
  
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
