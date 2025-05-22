document.addEventListener('DOMContentLoaded', function() {
    // Determine the correct path to header.html based on the current page's location
    let headerPath = 'header.html'; // Default for root pages
    let linkPrefix = ''; // Prefix for relative links in the header
    const currentPath = window.location.pathname;

    // Check for known subdirectories
    // Add more conditions here if you have other subdirectories like /products/, /services/, etc.
    if (currentPath.includes('/blog/')) { 
        headerPath = '../header.html';
        linkPrefix = '../';
    }
    // Example for deeper subdirectories:
    // else if (currentPath.includes('/some/other/dir/')) {
    //     headerPath = '../../header.html';
    //     linkPrefix = '../../';
    // }

    fetch(headerPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch header: ${response.status} ${response.statusText}`);
            }
            return response.text();
        })
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const headerElement = doc.querySelector('header');
            const headerStyles = doc.querySelector('style'); // Assuming one main style block in header.html's head or body
            const scriptElements = Array.from(doc.querySelectorAll('script')); // Get all script tags

            if (linkPrefix && headerElement) {
                const links = headerElement.querySelectorAll('a[href]');
                links.forEach(link => {
                    const href = link.getAttribute('href');
                    // Check if it's a relative path to a page/file, 
                    // not an external link, mailto, tel, anchor link, or an absolute path starting with '/'
                    if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('/')) {
                        link.setAttribute('href', linkPrefix + href);
                    }
                });
            }

            if (headerStyles) {
                // Clone the style node before appending to avoid issues if it's already in a document
                document.head.appendChild(headerStyles.cloneNode(true));
            }
            
            if (headerElement) {
                const existingHeader = document.querySelector('header');
                if (existingHeader) {
                    existingHeader.parentNode.replaceChild(headerElement, existingHeader);
                } else {
                    document.body.insertBefore(headerElement, document.body.firstChild);
                }
                console.log('Header element successfully injected');

                // Execute scripts from header.html
                scriptElements.forEach(scriptTag => {
                    const newScript = document.createElement('script');
                    // Copy attributes like src, type, defer, async
                    for (let i = 0; i < scriptTag.attributes.length; i++) {
                        const attr = scriptTag.attributes[i];
                        newScript.setAttribute(attr.name, attr.value);
                    }
                    // Copy inline script content
                    if (scriptTag.innerHTML) {
                        newScript.innerHTML = scriptTag.innerHTML;
                    }
                    // Append to body to execute. For external scripts (with src), this will load and execute them.
                    // For inline scripts, this will execute them.
                    document.body.appendChild(newScript);
                });
                console.log('Header scripts processed.');
                
                const themeToggles = document.querySelectorAll('.theme-toggle');
                if (themeToggles.length > 1) {
                    const headerToggle = headerElement.querySelector('.theme-toggle');
                    themeToggles.forEach(toggle => {
                        if (toggle !== headerToggle) {
                            toggle.remove();
                        }
                    });
                }

                // Call initializeThemeToggle if it exists, after header is injected
                if (window.initializeThemeToggle) {
                    console.log('headerInclude.js: Calling window.initializeThemeToggle() after header injection.');
                    window.initializeThemeToggle();
                } else {
                    console.warn('headerInclude.js: initializeThemeToggle function not found on window.');
                }
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
