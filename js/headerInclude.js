document.addEventListener('DOMContentLoaded', function() {
    // Fetch the header.html content
    fetch('header.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch header: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            // Extract just the header content from the full HTML document
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const headerElement = doc.querySelector('header');
            const headerStyles = doc.querySelector('style');
            
            // Insert the styles in the head section
            if (headerStyles) {
                document.head.appendChild(headerStyles);
            }
            
            // Insert the header at the top of the body
            if (headerElement) {
                // If there's already a header, replace it
                const existingHeader = document.querySelector('header');
                if (existingHeader) {
                    existingHeader.parentNode.replaceChild(headerElement, existingHeader);
                } else {
                    // Otherwise insert at the beginning of the body
                    document.body.insertBefore(headerElement, document.body.firstChild);
                }
                
                console.log('Header successfully injected');
            }
            
            // Re-initialize theme toggle functionality after header is injected
            if (window.initializeThemeToggle) {
                window.initializeThemeToggle();
            }
        })
        .catch(error => console.error('Error loading header:', error));
});

// Make sure theme is applied immediately
(function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        
        // Update theme color meta tag if it exists
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', '#0f172a');
        }
    }
})();
