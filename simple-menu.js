/**
 * Simple Menu JS
 * 
 * This file has been cleared of hamburger menu functionality.
 * We will re-implement a proper mobile menu later.
 */

document.addEventListener('DOMContentLoaded', function() {
  // Future mobile menu functionality will be added here
  console.log('Mobile menu functionality removed as requested');
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
