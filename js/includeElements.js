document.addEventListener('DOMContentLoaded', function() {
    const head = document.querySelector('head');
    const body = document.querySelector('body');

    // Determine base path for resources (e.g., ../ for /blog/, '' for root)
    let basePath = '';
    let headerPath = 'header.html';
    let footerPath = 'footer.html';
    let themeTogglePath = 'js/theme-toggle.js';
    let backToTopScriptPath = 'js/back-to-top.js';
    let backToTopCSSPath = 'css/back-to-top.css';

    const isBlogPage = window.location.pathname.includes('/blog/');

    if (isBlogPage) {
        basePath = '../';
        headerPath = '../header.html';
        footerPath = '../footer.html';
        themeTogglePath = '../js/theme-toggle.js';
        backToTopScriptPath = '../js/back-to-top.js';
        backToTopCSSPath = '../css/back-to-top.css';
    }

    // Create header placeholder if it doesn't exist
    let headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) {
        headerPlaceholder = document.createElement('div');
        headerPlaceholder.id = 'header-placeholder';
        if (body.firstChild) {
            body.insertBefore(headerPlaceholder, body.firstChild);
        } else {
            body.appendChild(headerPlaceholder);
        }
    }

    // Create footer placeholder if it doesn't exist
    let footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) {
        footerPlaceholder = document.createElement('div');
        footerPlaceholder.id = 'footer-placeholder';
        // Ensure footer is appended at the end, but before any specific elements like backToTopBtn if they are outside footer
        const backToTopBtn = document.getElementById('backToTopBtn');
        if (backToTopBtn) {
            body.insertBefore(footerPlaceholder, backToTopBtn);
        } else {
            body.appendChild(footerPlaceholder);
        }
    }

    // Function to fetch and insert HTML, and adjust paths
    function fetchAndInsert(url, placeholderId, isHeader) {
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${url}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(data => {
                const placeholder = document.getElementById(placeholderId);
                if (!placeholder) {
                    console.error(`Placeholder with ID '${placeholderId}' not found.`);
                    return;
                }
                placeholder.innerHTML = data;

                // Adjust paths for links, scripts, and images within the fetched content
                const elementsToAdjust = placeholder.querySelectorAll('link[href], script[src], img[src], a[href]');
                elementsToAdjust.forEach(el => {
                    let attributeName = '';
                    if (el.hasAttribute('href')) attributeName = 'href';
                    else if (el.hasAttribute('src')) attributeName = 'src';

                    if (attributeName) {
                        let path = el.getAttribute(attributeName);
                        // Only prepend basePath if it's a relative path not starting with '/', '#', 'http', 'mailto', or 'data:'
                        if (basePath && path && !path.startsWith('/') && !path.startsWith('#') && !path.startsWith('http') && !path.startsWith('mailto:') && !path.startsWith('data:')) {
                            // Avoid double-prepending if already correct for blog subfolder context
                            if (!(isBlogPage && path.startsWith('../'))) {
                                el.setAttribute(attributeName, basePath + path);
                            }
                        }
                    }
                });

                if (isHeader) {
                    // Dynamically load theme-toggle.js after header is inserted
                    const themeScript = document.createElement('script');
                    themeScript.src = themeTogglePath;
                    themeScript.defer = true;
                    document.body.appendChild(themeScript);
                    // Manually call initializeThemeToggle if it exists, after a short delay for script loading
                    setTimeout(() => {
                        if (typeof initializeThemeToggle === 'function') {
                            initializeThemeToggle();
                        }
                    }, 100);
                } else { // Footer loaded
                    // Re-run the year script if it's embedded in footer.html
                    const yearScriptElement = placeholder.querySelector('script'); 
                    if (yearScriptElement && yearScriptElement.textContent.includes('footerYear')) {
                        try {
                            // Create a new script element and append it to run the code
                            const newScript = document.createElement('script');
                            newScript.textContent = yearScriptElement.textContent;
                            document.body.appendChild(newScript);
                            // Optionally remove the original script from the placeholder to avoid duplicate IDs if any
                            // yearScriptElement.remove(); 
                        } catch (e) {
                            console.error('Error evaluating footer script:', e);
                        }
                    }
                }
            })
            .catch(error => console.error('Error loading HTML:', error));
    }

    // Load header and footer
    fetchAndInsert(headerPath, 'header-placeholder', true);
    fetchAndInsert(footerPath, 'footer-placeholder', false);

    // Inject Back to Top CSS if not already present
    if (!document.querySelector(`link[href="${backToTopCSSPath}"]`)) {
        const backToTopCSSLink = document.createElement('link');
        backToTopCSSLink.rel = 'stylesheet';
        backToTopCSSLink.href = backToTopCSSPath;
        head.appendChild(backToTopCSSLink);
    }

    // Inject Back to Top JS if not already present and button exists
    // Check if backToTop.js is already included by a script tag
    let backToTopScriptExists = false;
    document.querySelectorAll('script[src]').forEach(s => {
        if (s.src.includes('back-to-top.js')) {
            backToTopScriptExists = true;
        }
    });

    if (!backToTopScriptExists && document.getElementById('backToTopBtn')) {
        const backToTopScript = document.createElement('script');
        backToTopScript.src = backToTopScriptPath;
        backToTopScript.defer = true;
        document.body.appendChild(backToTopScript);
    } else if (backToTopScriptExists && typeof setupBackToTopButton === 'function') {
        // If script is already there, ensure its setup function is called (if it has one)
        // This might be necessary if the button is added after the initial script run
        // setupBackToTopButton(); // This line depends on how back-to-top.js is structured
    }

});
