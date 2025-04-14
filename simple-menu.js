/**
 * Simple Menu Toggle Script
 * Just handles the hamburger menu toggle for mobile - nothing else
 */
document.addEventListener('DOMContentLoaded', function() {
  // Get required elements
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  // Toggle menu when hamburger is clicked
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });
    
    // Close menu when clicking anywhere else
    document.addEventListener('click', function(event) {
      if (!event.target.closest('.hamburger') && 
          !event.target.closest('.nav-links') && 
          navLinks.classList.contains('active')) {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.classList.remove('menu-open');
      }
    });
    
    // Close menu when menu item is clicked
    const menuItems = navLinks.querySelectorAll('a');
    menuItems.forEach(item => {
      item.addEventListener('click', function() {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    });
  }
});
