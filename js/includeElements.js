document.addEventListener('DOMContentLoaded', function() {
    const head = document.querySelector('head');
    const body = document.querySelector('body');

    const cssLoadPromises = {}; // Cache for CSS loading promises

    let basePath = '';
    let headerPath = 'header.html';
    let footerPath = 'footer.html';
    let themeToggleScriptPath = 'js/theme-toggle.js';
    let backToTopScriptPath = 'js/back-to-top.js';
    let backToTopCSSPath = 'css/back-to-top.css';
    // let mobileMenuScriptPath = 'mobile-responsive.js'; // Likely handled by header's inline script
    let stylesCssPath = 'styles.css';
    let animationsCssPath = 'animations.css';

    const isBlogPage = window.location.pathname.includes('/blog/');
    const isLocationPage = window.location.pathname.includes('/locations/');
    const isIndustryPage = window.location.pathname.includes('/industries/');

    if (isBlogPage || isLocationPage || isIndustryPage) {
        basePath = '../';
        headerPath = basePath + 'header.html';
        footerPath = basePath + 'footer.html';
        themeToggleScriptPath = basePath + 'js/theme-toggle.js';
        backToTopScriptPath = basePath + 'js/back-to-top.js';
        backToTopCSSPath = basePath + 'css/back-to-top.css';
        // mobileMenuScriptPath = basePath + 'mobile-responsive.js';
        stylesCssPath = basePath + 'styles.css';
        animationsCssPath = basePath + 'animations.css';
    } else {
        backToTopCSSPath = 'css/back-to-top.css';
        stylesCssPath = 'styles.css';
        animationsCssPath = 'animations.css';
    }

    function loadCSS(cssPath) {
        if (cssLoadPromises[cssPath]) {
            return cssLoadPromises[cssPath];
        }

        cssLoadPromises[cssPath] = new Promise((resolve, reject) => {
            let link = document.head.querySelector(`link[rel="stylesheet"][href="${cssPath}"]`);
            if (link) {
                if (link.sheet) {
                    console.log(`INFO: CSS already loaded (link.sheet exists): ${cssPath}`);
                    resolve();
                } else {
                    console.log(`INFO: CSS link exists, waiting for it to load: ${cssPath}`);
                    link.addEventListener('load', function handleExistingLoad() {
                        console.log(`SUCCESS: Existing CSS link loaded: ${cssPath}`);
                        link.removeEventListener('load', handleExistingLoad);
                        resolve();
                    });
                    link.addEventListener('error', function handleExistingError() {
                        console.error(`ERROR: Existing CSS link failed to load: ${cssPath}`);
                        link.removeEventListener('error', handleExistingError);
                        reject(new Error(`Failed to load existing CSS: ${cssPath}`));
                    });
                }
            } else {
                link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = cssPath;
                link.onload = () => {
                    console.log(`SUCCESS: Newly added CSS loaded: ${cssPath}`);
                    resolve();
                };
                link.onerror = () => {
                    console.error(`ERROR: Newly added CSS failed to load: ${cssPath}`);
                    reject(new Error(`Failed to load CSS: ${cssPath}`));
                };
                document.head.appendChild(link);
                console.log(`INFO: Appending new CSS link to <head>: ${cssPath}`);
            }
        });
        return cssLoadPromises[cssPath];
    }

    function loadScript(scriptPath, defer = true, type = '') {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${scriptPath}"]`)) {
                console.log(`INFO: Script already requested or loaded: ${scriptPath}`);
                // Resolve if it's already there, assuming it will load/has loaded.
                // For robust check, one might need a more complex loading state manager.
                resolve(); 
                return;
            }
            const script = document.createElement('script');
            script.src = scriptPath;
            script.defer = defer;
            if (type) script.type = type;
            script.onload = () => {
                console.log(`SUCCESS: Script loaded: ${scriptPath}`);
                resolve();
            };
            script.onerror = () => {
                console.error(`ERROR: Failed to load script: ${scriptPath}`);
                reject(new Error(`Failed to load script: ${scriptPath}`));
            };
            document.body.appendChild(script);
        });
    }
    
    async function executeInlineScripts(placeholderElement, contextName) {
        const inlineScripts = Array.from(placeholderElement.querySelectorAll('script:not([src])'));
        for (const script of inlineScripts) {
            try {
                const newScript = document.createElement('script');
                newScript.textContent = script.textContent;
                document.body.appendChild(newScript); // Appending to body should execute it
                console.log(`INFO: Executed inline script from ${contextName}.`);
                await new Promise(r => setTimeout(r, 0)); // Ensure script has a chance to run
            } catch (e) {
                console.error(`ERROR: Evaluating inline script from ${contextName}:`, e);
            }
        }
        console.log(`INFO: All inline scripts from ${contextName} processed.`);
    }


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

    let footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) {
        footerPlaceholder = document.createElement('div');
        footerPlaceholder.id = 'footer-placeholder';
        body.appendChild(footerPlaceholder);
    }

    function fetchAndInsert(url, placeholderId, isHeader) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${url}: ${response.statusText} (${response.status})`);
                }
                return response.text();
            })
            .then(async data => {
                const placeholder = document.getElementById(placeholderId);
                if (!placeholder) {
                    console.error(`Placeholder with ID '${placeholderId}' not found.`);
                    return;
                }
                placeholder.innerHTML = data;

                const elementsToAdjust = placeholder.querySelectorAll('img[src], a[href], link[href], script[src]');
                elementsToAdjust.forEach(el => {
                    let attributeName = '';
                    if (el.hasAttribute('href')) attributeName = 'href';
                    else if (el.hasAttribute('src')) attributeName = 'src';

                    if (attributeName) {
                        let pathValue = el.getAttribute(attributeName);
                        // Skip absolute URLs, data URIs, mailto links, or anchor links
                        if (pathValue && !pathValue.startsWith('http') && !pathValue.startsWith('/') && 
                            !pathValue.startsWith('#') && !pathValue.startsWith('mailto:') && 
                            !pathValue.startsWith('data:')) {
                            // Apply basePath if isBlogPage/isLocationPage and path doesn't already reflect it
                            if ((isBlogPage || isLocationPage) && !pathValue.startsWith('../')) {
                                el.setAttribute(attributeName, basePath + pathValue);
                            } else if (!isBlogPage && !isLocationPage && pathValue.startsWith('../')) {
                                // This case should ideally not happen if paths are consistent
                                console.warn(`WARN: Path ${pathValue} in ${url} on a non-blog/non-location page starts with ../. Check consistency.`);
                            }
                            // For non-blog/non-location pages, direct relative paths are assumed correct from root.
                        }
                    }
                });

                if (isHeader) {
                    console.log('INFO: Processing header content.');
                    await executeInlineScripts(placeholder, 'header.html');

                    const headerExternalScripts = Array.from(placeholder.querySelectorAll('script[src]'));
                    for (const script of headerExternalScripts) {
                        let scriptSrc = script.getAttribute('src');
                        // Path adjustment for external scripts from header.html was already here, ensure it's correct
                         if ((isBlogPage || isLocationPage) && scriptSrc && !scriptSrc.startsWith('http') && !scriptSrc.startsWith('/') && !scriptSrc.startsWith('../')) {
                            scriptSrc = basePath + scriptSrc;
                        }
                        console.log(`INFO: Loading external script from header: ${scriptSrc}`);
                        try {
                            await loadScript(scriptSrc, script.defer, script.type);
                        } catch (e) {
                            console.error(`ERROR: Loading external script from header (${scriptSrc}):`, e);
                        }
                    }
                    console.log('INFO: All external header scripts processed.');

                    console.log('INFO: Ensuring global CSS (styles, animations) is loaded before theme-toggle...');
                    let criticalCssLoaded = false;
                    try {
                        await Promise.all([
                            loadCSS(stylesCssPath),
                            loadCSS(animationsCssPath)
                        ]);
                        console.log('SUCCESS: Global CSS (styles.css, animations.css) confirmed loaded.');
                        criticalCssLoaded = true;
                    } catch (error) {
                        console.error('ERROR: Critical CSS (styles.css or animations.css) failed to load. Theme toggle functionality will be disabled.', error);
                    }

                    if (criticalCssLoaded) {
                        console.log('INFO: Critical CSS loaded, proceeding to load theme toggle script.');
                        try {
                            await loadScript(themeToggleScriptPath);
                            if (window.initializeThemeToggle) {
                                console.log('INFO: Initializing theme toggle.');
                                window.initializeThemeToggle();
                            } else {
                                console.error('ERROR: initializeThemeToggle function not found after loading theme-toggle.js.');
                            }
                        } catch (scriptError) {
                            console.error('ERROR: Failed to load or execute theme-toggle.js.', scriptError);
                        }
                    } else {
                        console.warn('WARN: Theme toggle script and initialization skipped due to critical CSS loading failure.');
                    }
                } else if (placeholderId === 'footer-placeholder') {
                    console.log('INFO: Processing footer content.');
                    await executeInlineScripts(placeholder, 'footer.html');
                    
                    console.log('INFO: Loading back-to-top CSS and JS for footer.');
                    try {
                        await loadCSS(backToTopCSSPath);
                        console.log('SUCCESS: Back-to-top CSS loaded.');
                        await loadScript(backToTopScriptPath);
                        if (window.initializeBackToTop) {
                            console.log('INFO: Initializing back-to-top.');
                            window.initializeBackToTop();
                        } else {
                            console.warn('WARN: initializeBackToTop function not found. Back-to-top might not work.');
                        }
                    } catch (error) {
                        console.error('ERROR: Failed to load back-to-top CSS or JS.', error);
                    }
                }
            })
            .catch(error => { // Catches fetch error or error from .then block
                console.error(`CRITICAL: Error in fetchAndInsert for ${url} (${placeholderId}):`, error);
                // throw error; // Optionally rethrow if Promise.all needs to catch it
            });
    }

    Promise.all([
        fetchAndInsert(headerPath, 'header-placeholder', true),
        fetchAndInsert(footerPath, 'footer-placeholder', false)
    ]).then(() => {
        console.log('INFO: Header and Footer HTML content fetched, inserted, and their specific scripts processed (or attempted).');
        // If mobileMenuScriptPath ('mobile-responsive.js') was still needed and confirmed separate:
        // loadScript(mobileMenuScriptPath).catch(e => console.error('Failed to load mobileMenuScriptPath', e));
        // For now, assuming header's inline script handles mobile menu.
    }).catch(error => {
        // This will catch errors if fetchAndInsert rethrows them, or if Promise.all itself fails.
        console.error("CRITICAL ERROR: One or more essential components (header/footer) failed to load and process.", error);
    });
});
