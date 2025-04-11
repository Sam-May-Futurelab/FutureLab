/**
 * Simple Mobile Menu
 * Handles mobile navigation toggle and ensures proper display of the contact button
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const mobileOverlay = document.querySelector('.mobile-menu-overlay');
  
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
  
  // Toggle mobile menu with enhanced touch event handling
  function toggleMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Menu toggle clicked'); // Debug log
    
    // Toggle active classes
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
    
    // Toggle the overlay if it exists
    if (mobileOverlay) {
      mobileOverlay.classList.toggle('active');
    }
    
    // Add body class to prevent background scrolling when menu is open
    if (navLinks.classList.contains('active')) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
  }
  
  // Add multiple event types for better mobile responsiveness
  hamburger.addEventListener('click', toggleMenu);
  hamburger.addEventListener('touchend', function(e) {
    e.preventDefault(); // Prevent ghost clicks
    toggleMenu(e);
  });
  
  // Close menu when clicking a link
  const links = navLinks.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', function() {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
      if (mobileOverlay) mobileOverlay.classList.remove('active');
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
      if (mobileOverlay) mobileOverlay.classList.remove('active');
      document.body.classList.remove('menu-open');
    }
  });
  
  // Close menu with escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && navLinks.classList.contains('active')) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
      if (mobileOverlay) mobileOverlay.classList.remove('active');
      document.body.classList.remove('menu-open');
    }
  });
  
  // Add CSS to fix contact button on mobile and ensure hamburger is visible and clickable
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
        cursor: pointer;
        display: flex !important;
        flex-direction: column;
        justify-content: space-between;
        width: 30px;
        height: 24px;
        position: relative;
        pointer-events: auto;
      }
      
      .hamburger span {
        pointer-events: none;
      }
      
      body.menu-open {
        overflow: hidden;
      }
      
      .mobile-menu-overlay.active {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.5);
        z-index: 998;
      }
    }
  `;
  document.head.appendChild(style);
});

/**
 * Simple Menu - consistent navigation layout across all pages
 * This script ensures navigation menu items stay in the same position
 * regardless of which page is currently active.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Define all possible navigation items for consistent layout
    const allNavItems = [
        { href: "index", text: "Home" },
        { href: "index#services", text: "Services" },
        { href: "index#portfolio", text: "Work" },
        { href: "web-design", text: "Web Design" },
        { href: "showcase", text: "Showcase" },
        { href: "index#contact", text: "Contact", class: "btn btn-outline" }
    ];
    
    // Standard navigation items that should appear on all pages
    const standardItems = ["Home", "Services", "Work", "Web Design", "Showcase", "Contact"];
    
    // Get the current navigation menu
    const navLinks = document.querySelector('.nav-links');
    
    if (navLinks) {
        // Save the current active link for later
        const currentPath = window.location.pathname.split('/').pop().replace('.html', '');
        let activeLink = '';
        
        // Find which link is currently active
        const currentLinks = Array.from(navLinks.querySelectorAll('a'));
        currentLinks.forEach(link => {
            const href = link.getAttribute('href').split('#')[0].replace('.html', '');
            if ((href === currentPath) || 
                (currentPath === '' && href === 'index') ||
                (link.classList.contains('active'))) {
                activeLink = link.textContent.trim();
            }
        });

        // Clear current navigation
        navLinks.innerHTML = '';
        
        // Rebuild the navigation with consistent items
        standardItems.forEach(itemText => {
            const matchingItem = allNavItems.find(item => item.text === itemText);
            
            if (matchingItem) {
                const li = document.createElement('li');
                const a = document.createElement('a');
                
                a.href = matchingItem.href;
                a.textContent = matchingItem.text;
                
                // Apply any special classes (like button styling)
                if (matchingItem.class) {
                    a.className = matchingItem.class;
                }
                
                // Mark the current page as active
                if (matchingItem.text === activeLink) {
                    a.classList.add('active');
                }
                
                li.appendChild(a);
                navLinks.appendChild(li);
            }
        });
    }
});

/**
 * Navigation Menu Consistency Script
 * This script ensures navigation menu items maintain consistent width and alignment
 * across different pages, preventing the menu from "jumping around"
 */

document.addEventListener('DOMContentLoaded', function() {
    // Function to initialize consistent navigation
    function initConsistentNav() {
        // Get the navigation links container
        const navLinks = document.querySelector('.nav-links');
        if (!navLinks) return;

        // Get all navigation items
        const navItems = navLinks.querySelectorAll('li');
        if (!navItems.length) return;

        // Set consistent minimum widths for nav items based on their content
        navItems.forEach(item => {
            const link = item.querySelector('a');
            if (!link) return;
            
            const linkText = link.textContent.trim();
            
            // Set different minimum widths based on content length
            if (linkText === "Home") {
                item.style.minWidth = '70px';
            } else if (linkText === "Services") {
                item.style.minWidth = '90px';
            } else if (linkText === "Work") {
                item.style.minWidth = '70px';
            } else if (linkText === "Web Design") {
                item.style.minWidth = '110px';
            } else if (linkText === "Showcase") {
                item.style.minWidth = '90px';
            } else if (linkText === "Contact") {
                item.style.minWidth = '100px';
            } else {
                item.style.minWidth = '80px';
            }
            
            // Add text-align center to each item
            item.style.textAlign = 'center';
            
            // Make sure the links themselves are properly centered
            if (link) {
                link.style.display = 'inline-block';
                link.style.width = '100%';
                link.style.textAlign = 'center';
            }
        });
        
        // Add special handling for the Contact button
        const contactButton = navLinks.querySelector('li a.btn');
        if (contactButton) {
            const contactItem = contactButton.closest('li');
            if (contactItem) {
                contactItem.style.minWidth = '100px'; // Give more space for the button
            }
        }
        
        // Add flex spacers between items to ensure consistent spacing
        navLinks.style.display = 'flex';
        navLinks.style.justifyContent = 'space-around'; // Better spacing distribution
        
        // Set consistent padding for all menu items
        navItems.forEach(item => {
            item.style.padding = '0 12px'; // Slightly more padding
            item.style.margin = '0 2px';  // Add small margin between items
        });
    }

    // Initialize the consistent navigation
    initConsistentNav();
    
    // If window is resized, re-initialize (especially important for mobile/desktop transitions)
    window.addEventListener('resize', function() {
        // Only re-run on desktop sizes (above mobile breakpoint)
        if (window.innerWidth > 768) {
            initConsistentNav();
        }
    });
});
