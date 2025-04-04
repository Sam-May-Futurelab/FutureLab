/**
 * Simple Mobile Menu
 * Handles mobile navigation toggle and ensures proper display of the contact button
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  if (!hamburger || !navLinks) {
    console.warn('Mobile menu elements not found - menu initialization skipped.');
    return;
  }
  
  // Fix contact button styling to prevent cut-off
  const contactBtn = navLinks.querySelector('.btn.btn-outline');
  if (contactBtn) {
    contactBtn.style.marginBottom = '15px';
    contactBtn.style.display = 'inline-block';
    contactBtn.style.padding = '8px 15px';
  }
  
  // Toggle mobile menu with proper event handling
  hamburger.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Toggle active classes
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    
    // Add body class to prevent background scrolling when menu is open
    if (navLinks.classList.contains('active')) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  });
  
  // Close menu when clicking a link
  const links = navLinks.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', function() {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.classList.remove('menu-open');
    });
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (navLinks.classList.contains('active') && 
        !navLinks.contains(e.target) && 
        !hamburger.contains(e.target)) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.classList.remove('menu-open');
    }
  });
  
  // Close menu with escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && navLinks.classList.contains('active')) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
      document.body.classList.remove('menu-open');
    }
  });
  
  // Add CSS to fix contact button on mobile
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      .nav-links {
        padding-bottom: 20px !important;
      }
      
      .nav-links .btn.btn-outline {
        margin-bottom: 15px !important;
        padding: 8px 15px !important;
        display: inline-block !important;
        width: auto !important;
      }
      
      .hamburger {
        z-index: 9999;
      }
      
      body.menu-open {
        overflow: hidden;
      }
    }
  `;
  document.head.appendChild(style);
});
