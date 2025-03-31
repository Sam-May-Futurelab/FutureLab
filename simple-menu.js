// Simple, reliable mobile menu toggle

document.addEventListener('DOMContentLoaded', function() {
  // Get the hamburger button and mobile menu
  const hamburgerBtn = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-nav');
  
  // Only proceed if we found both elements
  if (hamburgerBtn && mobileMenu) {
    // Simple click handler to toggle active class
    hamburgerBtn.addEventListener('click', function() {
      mobileMenu.classList.toggle('active');
      this.classList.toggle('active');
    });
  }
});
