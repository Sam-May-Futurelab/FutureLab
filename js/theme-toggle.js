/**
 * Theme Toggle Functionality
 * 
 * This script handles dark/light theme toggling and maintains user preferences
 * Works with both static headers and dynamically injected headers via headerInclude.js
 */

// Apply saved theme immediately to prevent flash of wrong theme
(function() {
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Default to dark if no preference
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        
        // Update theme-color meta tag for dark mode
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#0f172a');
        }
    }
})();

// Main initialization function for theme toggle
function initializeThemeToggle() {
    console.log('Initializing theme toggle...');
    
    // Prevent multiple initializations
    if (window.themeToggleInitialized) {
        console.log('Theme toggle already initialized, skipping...');
        return;
    }
    
    // Function to find the theme toggle button
    function findThemeToggleButton() {
        return document.querySelector('.theme-toggle') || 
               document.getElementById('theme-toggle');
    }
      // Function to handle theme toggling
    function setupThemeToggle(themeToggle) {
        if (!themeToggle) {
            console.log('Theme toggle button not found');
            return;
        }
        
        // Check if already set up
        if (themeToggle.hasAttribute('data-initialized')) {
            console.log('Theme toggle button already initialized');
            return;
        }
        
        console.log('Theme toggle button found, setting up listener');
        themeToggle.setAttribute('data-initialized', 'true');
        
        // Add click event listener to toggle theme
        themeToggle.addEventListener('click', function() {
            console.log('Theme toggle clicked'); // Existing log
            
            console.log('Body classList BEFORE toggle:', Array.from(document.body.classList).join(' '));
            document.body.classList.toggle('dark-theme');
            console.log('Body classList AFTER toggle:', Array.from(document.body.classList).join(' '));
            
            const isDark = document.body.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            console.log(`localStorage theme set to: ${isDark ? 'dark' : 'light'}.`);
            
            updateThemeIcon(isDark, themeToggle);
            console.log(`Icon updated. Button should now show: ${isDark ? 'sun (for dark theme)' : 'moon (for light theme)'}.`);
            
            const themeColorMeta = document.querySelector('meta[name="theme-color"]');
            if (themeColorMeta) {
                themeColorMeta.setAttribute('content', isDark ? '#0f172a' : '#4361ee');
            }
            
            // Add animation class
            themeToggle.classList.add('toggle-animation');
            setTimeout(() => themeToggle.classList.remove('toggle-animation'), 600);
        });
          // Set initial icon state
        const isDarkTheme = document.body.classList.contains('dark-theme');
        updateThemeIcon(isDarkTheme, themeToggle);
        
        // Mark as initialized
        window.themeToggleInitialized = true;
    }
    
    // Function to update the icon based on theme
    function updateThemeIcon(isDark, toggleButton) {
        const iconElement = toggleButton.querySelector('i');
        if (!iconElement) return;
        
        iconElement.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
      // Initial setup when DOM is ready
    function initialize() {
        const themeToggle = findThemeToggleButton();
        if (themeToggle) {
            setupThemeToggle(themeToggle);
        } else {
            // Button not found yet, try again after a short delay (may be added by headerInclude.js)
            setTimeout(() => {
                const retryToggle = findThemeToggleButton();
                if (retryToggle) {
                    setupThemeToggle(retryToggle);
                } else {
                    console.log('Theme toggle button not found after retry');
                }
            }, 500);
        }
    }
    
    // Set up mutation observer to detect when the button is added to the DOM
    function setupMutationObserver() {
        // Skip if already initialized
        if (window.themeToggleInitialized) {
            return;
        }
        
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    const themeToggle = findThemeToggleButton();
                    if (themeToggle && !themeToggle.hasAttribute('data-initialized')) {
                        setupThemeToggle(themeToggle);
                        observer.disconnect();
                    }
                }
            });
        });
        
        observer.observe(document.body, { 
            childList: true,
            subtree: true 
        });
        
        // Disconnect after 5 seconds to avoid ongoing performance impact
        setTimeout(() => observer.disconnect(), 5000);
    }    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initialize();
            setupMutationObserver();
        });
    } else {
        initialize();
        setupMutationObserver();
    }
}

// Don't auto-initialize here since it might run before the header is loaded
// Auto-initialize will be handled by includeElements.js or page-specific initialization

// Export the function to allow manual re-initialization if needed
window.initializeThemeToggle = initializeThemeToggle;
