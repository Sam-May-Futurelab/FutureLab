document.addEventListener('DOMContentLoaded', function() {
    const head = document.querySelector('head');
    const body = document.querySelector('body');

    let basePath = '';
    let headerPath = 'header.html';
    let footerPath = 'footer.html';
    let themeToggleScriptPath = 'js/theme-toggle.js'; // Renamed for clarity
    let backToTopScriptPath = 'js/back-to-top.js';
    let backToTopCSSPath = 'css/back-to-top.css';
    let mobileMenuScriptPath = 'mobile-responsive.js'; // CORRECTED PATH: remove 'js/'

    const isBlogPage = window.location.pathname.includes('/blog/');

    if (isBlogPage) {
        basePath = '../';
        headerPath = '../header.html';
        footerPath = '../footer.html';
        themeToggleScriptPath = '../js/theme-toggle.js';
        backToTopScriptPath = '../js/back-to-top.js';
        backToTopCSSPath = '../css/back-to-top.css';
        mobileMenuScriptPath = '../mobile-responsive.js'; // CORRECTED PATH for blog pages
    }

    // Function to load a script dynamically
    function loadScript(scriptPath, defer = true, type = '') {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src=\"${scriptPath}\"]`)) {
                // Script already loaded or requested
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = scriptPath;
            script.defer = defer;
            if (type) script.type = type;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Failed to load script: ${scriptPath}`));
            document.body.appendChild(script);
        });
    }

    // Function to load CSS dynamically
    function loadCSS(cssPath) {
        if (!document.querySelector(`link[href=\"${cssPath}\"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = cssPath;
            head.appendChild(link);
        }
    }
    
    // Create header placeholder if it doesn\'t exist
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

    // Create footer placeholder if it doesn\'t exist
    let footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) {
        footerPlaceholder = document.createElement('div');
        footerPlaceholder.id = 'footer-placeholder';
        body.appendChild(footerPlaceholder); // Append to end, BTT button is inside footer.html
    }


    function fetchAndInsert(url, placeholderId, isHeader) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${url}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(async data => { // Made async to await script loading
                const placeholder = document.getElementById(placeholderId);
                if (!placeholder) {
                    console.error(`Placeholder with ID \'${placeholderId}\' not found.`);
                    return;
                }
                placeholder.innerHTML = data;

                const elementsToAdjust = placeholder.querySelectorAll('link[href], script[src], img[src], a[href]');
                elementsToAdjust.forEach(el => {
                    let attributeName = '';
                    if (el.hasAttribute('href')) attributeName = 'href';
                    else if (el.hasAttribute('src')) attributeName = 'src';

                    if (attributeName) {
                        let pathValue = el.getAttribute(attributeName);
                        if (basePath && pathValue && !pathValue.startsWith('/') && !pathValue.startsWith('#') && !pathValue.startsWith('http') && !pathValue.startsWith('mailto:') && !pathValue.startsWith('data:')) {
                            if (!(isBlogPage && pathValue.startsWith('../'))) {
                                el.setAttribute(attributeName, basePath + pathValue);
                            }
                        }
                    }
                });

                if (isHeader) {
                    // Execute scripts within the fetched header HTML
                    const headerScripts = placeholder.querySelectorAll('script');
                    headerScripts.forEach(script => {
                        if (script.src) { // For external scripts within header.html
                            // Ensure correct path for scripts sourced from within header.html
                            let scriptSrc = script.getAttribute('src');
                            if (basePath && !scriptSrc.startsWith('http') && !scriptSrc.startsWith('/')) {
                                scriptSrc = basePath + scriptSrc;
                            }
                            loadScript(scriptSrc, script.defer, script.type).catch(console.error);
                        } else { // For inline scripts within header.html
                            try {
                                const newScript = document.createElement('script');
                                newScript.textContent = script.textContent;
                                document.body.appendChild(newScript); // Re-append to execute
                            } catch (e) {
                                console.error('Error evaluating header inline script:', e);
                            }
                        }
                    });

                    // Load and initialize theme toggle script
                    await loadScript(themeToggleScriptPath).catch(console.error);
                    if (typeof initializeThemeToggle === 'function') {
                        console.log('includeElements.js: Calling initializeThemeToggle() after header load.');
                        initializeThemeToggle();
                    } else {
                        console.error('includeElements.js: initializeThemeToggle function not found after loading script.');
                    }
                    
                    // Load mobile-responsive.js, which might contain general mobile utilities or specific menu helpers
                    // if not already handled by header.html's own scripts.
                    await loadScript(mobileMenuScriptPath).catch(e => console.error('Error loading mobile-responsive.js: ' + e.message));

                } else { // Footer loaded
                    // Load Back to Top CSS & JS
                    loadCSS(backToTopCSSPath);
                    await loadScript(backToTopScriptPath).catch(console.error);
                     // Attempt to initialize BTT if function exists
                    if (typeof setupBackToTopButton === 'function') {
                        setupBackToTopButton();
                    }

                    // Re-run the year script if it's embedded in footer.html
                    const yearScriptElement = placeholder.querySelector('script#footerYearScript'); // Expecting an ID
                    if (yearScriptElement) {
                        try {
                            const newScript = document.createElement('script');
                            newScript.textContent = yearScriptElement.textContent;
                            document.body.appendChild(newScript);
                        } catch (e) {
                            console.error('Error evaluating footer year script:', e);
                        }
                    }
                }
            })
            .catch(error => console.error('Error loading HTML:', error));
    }

    // Load header then footer
    fetchAndInsert(headerPath, 'header-placeholder', true)
        .then(() => {
            return fetchAndInsert(footerPath, 'footer-placeholder', false);
        })
        .catch(error => console.error("Error in sequential loading:", error));
});
