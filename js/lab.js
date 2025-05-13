document.addEventListener('DOMContentLoaded', function() {
    // Initialize any lab page specific functionality
    
    // If the page was loaded with a hash, scroll to that section
    if (window.location.hash) {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
            setTimeout(() => {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
    
    // Initialize theme toggle functionality if not already done
    // initializeThemeToggle(); // Removed: Rely on global js/theme-toggle.js

    // In-page editor toggle button logic
    const toggleEditModeBtn = document.getElementById('toggle-edit-mode-btn');
    const saveEditedPageBtn = document.getElementById('save-edited-page-btn');
    const downloadEditedPageBtn = document.getElementById('download-edited-page-btn');
    const downloadEditedCssBtn = document.getElementById('download-edited-css-btn'); // New
    const editModeInstructions = document.getElementById('edit-mode-instructions');
    const unsavedChangesIndicator = document.getElementById('unsaved-changes-indicator');
    const saveNotificationPopup = document.getElementById('save-notification-popup');
    const saveNotificationMessage = document.getElementById('save-notification-message');
    const closeSaveNotificationBtn = document.getElementById('close-save-notification');
    const pagePreviewIframe = document.getElementById('page-preview'); // Defined earlier for broader scope

    // Smooth scroll for hero CTA
    const heroCtaButton = document.querySelector('.hero-cta-button');
    if (heroCtaButton) {
        heroCtaButton.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    }

    // Initialize In-Page Editor Controls
    const colorPickerPanel = document.getElementById('color-picker-panel');
    const colorPickerTargetInfoDiv = document.getElementById('color-picker-target-info'); // Correctly get the div
    const imageEditorPanel = document.getElementById('image-editor-panel'); // Get the new image editor panel

    if (window.initInPageEditorControls) {
        window.initInPageEditorControls(
            colorPickerPanel, // Pass the main panel
            colorPickerTargetInfoDiv, // Pass the target info div
            imageEditorPanel // Pass the image editor panel to the init function
        );
    } else {
        console.error("Lab.js: In-page editor control initialization function not found.");
    }

    let editorActive = false;
    let hasUnsavedChanges = false;
    let lastSavedEditedHtml = '';
    let lastSavedCustomCSS = ''; // New: To store generated CSS at the time of saving HTML

    // Function to show the save notification
    function showSaveNotification(message) {
        if (saveNotificationPopup && saveNotificationMessage) {
            saveNotificationMessage.textContent = message;
            saveNotificationPopup.classList.add('show');
            saveNotificationPopup.style.display = 'flex'; // Use flex as per CSS

            // Automatically hide after 5 seconds
            setTimeout(() => {
                hideSaveNotification();
            }, 5000);
        }
    }

    // Function to hide the save notification
    function hideSaveNotification() {
        if (saveNotificationPopup) {
            saveNotificationPopup.classList.remove('show');
            saveNotificationPopup.classList.remove('success-message'); // Remove the success class
            // Wait for animation to complete before setting display to none
            setTimeout(() => {
                saveNotificationPopup.style.display = 'none';
            }, 300); // Match CSS transition time
        }
    }

    // Event listener for the close button on the notification
    if (closeSaveNotificationBtn) {
        closeSaveNotificationBtn.addEventListener('click', hideSaveNotification);
    }

    // Function to be called from in-page-editor.js when a change is made
    window.notifyUnsavedChange = () => {
        hasUnsavedChanges = true;
        if (unsavedChangesIndicator) {
            unsavedChangesIndicator.style.display = 'block';
        }
        if (saveEditedPageBtn) {
            saveEditedPageBtn.classList.remove('btn-success'); 
            saveEditedPageBtn.classList.add('btn-warning'); 
        }
        if (downloadEditedPageBtn) {
            downloadEditedPageBtn.disabled = true;
            downloadEditedPageBtn.title = "Save your changes before downloading the page."; // Changed title for consistency
        }
        if (downloadEditedCssBtn) { 
            downloadEditedCssBtn.disabled = true;
            downloadEditedCssBtn.title = "Save your changes before downloading CSS.";
        }
    };

    // Function to initialize or re-initialize in-page editor event handlers
    function setupInPageEditorForIframe() {
        if (editorActive && pagePreviewIframe && pagePreviewIframe.contentDocument && pagePreviewIframe.contentWindow) {
            if (typeof window.setInPageEditMode === 'function') {
                window.setInPageEditMode(true, pagePreviewIframe.contentDocument, pagePreviewIframe.contentWindow);
            }
        }
    }

    // Listen for iframe load event to setup editor if active
    if (pagePreviewIframe) {
        pagePreviewIframe.addEventListener('load', () => {
            if (editorActive && pagePreviewIframe.contentDocument && pagePreviewIframe.contentWindow) {
                if (typeof window.setInPageEditMode === 'function') {
                    window.setInPageEditMode(true, pagePreviewIframe.contentDocument, pagePreviewIframe.contentWindow);
                }
            }
        });
    }

    if (toggleEditModeBtn) {
        toggleEditModeBtn.addEventListener('click', () => {
            editorActive = !editorActive;
            if (typeof window.setInPageEditMode === 'function') {
                if (pagePreviewIframe && pagePreviewIframe.contentDocument && pagePreviewIframe.contentWindow) {
                    window.setInPageEditMode(editorActive, pagePreviewIframe.contentDocument, pagePreviewIframe.contentWindow);
                } else {
                    if (editorActive) {
                        console.warn("Lab.js: Tried to toggle edit mode, but iframe contentDocument is not available yet.");
                    }
                }
            }
            toggleEditModeBtn.classList.toggle('active', editorActive);
            // Updated to match btn-flex structure
            toggleEditModeBtn.innerHTML = editorActive 
                ? '<i class="fas fa-times-circle"></i><span class="btn-text">Disable Edit Mode</span>' 
                : '<i class="fas fa-pencil-alt"></i><span class="btn-text">Toggle Edit Mode</span>';

            if (saveEditedPageBtn) {
                saveEditedPageBtn.style.display = editorActive ? 'inline-block' : 'none';
            }
            
            const hasEverBeenSaved = lastSavedEditedHtml !== '';

            if (downloadEditedPageBtn) {
                downloadEditedPageBtn.style.display = editorActive ? 'inline-block' : 'none';
                downloadEditedPageBtn.disabled = !hasEverBeenSaved;
                downloadEditedPageBtn.title = hasEverBeenSaved ? "Download the last saved version of your edited page (HTML with embedded CSS)." : "Save your edits first to enable page download.";
            }
            if (downloadEditedCssBtn) { 
                downloadEditedCssBtn.style.display = editorActive ? 'inline-block' : 'none';
                downloadEditedCssBtn.disabled = !hasEverBeenSaved;
                downloadEditedCssBtn.title = hasEverBeenSaved 
                                                ? (lastSavedCustomCSS ? "Download the custom CSS for your edits." : "Download custom CSS (no color styles were saved).") 
                                                : "Save your edits first to enable CSS download.";
            }
            if (editModeInstructions) {
                editModeInstructions.style.display = editorActive ? 'block' : 'none';
            }
            
            if (!editorActive) { // When turning OFF edit mode
                if (unsavedChangesIndicator) unsavedChangesIndicator.style.display = 'none';
                hasUnsavedChanges = false;
                if (saveEditedPageBtn) {
                    saveEditedPageBtn.classList.remove('btn-warning');
                    saveEditedPageBtn.classList.add('btn-success');
                }
                // Buttons are hidden by display:none, but ensure their logical disabled state is correct if they were to be shown.
                if (downloadEditedPageBtn) downloadEditedPageBtn.disabled = !hasEverBeenSaved;
                if (downloadEditedCssBtn) downloadEditedCssBtn.disabled = !hasEverBeenSaved;
            } else { // Edit mode is being turned ON
                setupInPageEditorForIframe(); // Ensure listeners are attached if iframe is ready
            }
        });
    }

    if (saveEditedPageBtn) {
        saveEditedPageBtn.addEventListener('click', () => {
            if (pagePreviewIframe && pagePreviewIframe.contentDocument && pagePreviewIframe.contentDocument.body) {
                lastSavedEditedHtml = pagePreviewIframe.contentDocument.body.innerHTML;
                
                if (typeof window.getCustomCss === 'function') {
                    lastSavedCustomCSS = window.getCustomCss();
                } else {
                    lastSavedCustomCSS = ''; 
                }

                hasUnsavedChanges = false;
                if (unsavedChangesIndicator) {
                    unsavedChangesIndicator.style.display = 'none';
                }
                saveEditedPageBtn.classList.remove('btn-warning');
                saveEditedPageBtn.classList.add('btn-success');
                
                if (saveNotificationPopup) {
                    saveNotificationPopup.classList.add('success-message'); // Add class for specific styling
                }
                showSaveNotification("Your edits have been saved! You can now download the page or continue editing.");

                // Enable download buttons after saving, based on content availability
                if (downloadEditedPageBtn) {
                    downloadEditedPageBtn.disabled = !lastSavedEditedHtml; // Uniformly check content
                    downloadEditedPageBtn.title = lastSavedEditedHtml ? 
                        "Download the last saved version of your edited page (HTML with embedded CSS)." : 
                        "No HTML content was saved to download.";
                }
                if (downloadEditedCssBtn) { // New
                    downloadEditedCssBtn.disabled = !lastSavedCustomCSS; // Enable only if there's custom CSS
                    downloadEditedCssBtn.title = lastSavedCustomCSS ? "Download the custom CSS for your edits." : "No custom color styles saved to download.";
                }
            } else {
                alert("Could not retrieve content from the preview to save.");
            }
        });
    }

    if (downloadEditedPageBtn) {
        downloadEditedPageBtn.addEventListener('click', () => {
            if (hasUnsavedChanges) {
                alert("You have unsaved changes. Please save your edits before downloading.");
                return;
            }
            if (lastSavedEditedHtml) {
                // Ensure lastSavedCustomCSS is defined, even if empty
                const customCssToEmbed = lastSavedCustomCSS || ''; 
                if (typeof window.downloadHtmlContent === 'function') {
                    // Call the global download function with HTML body, custom CSS, filename, and 'not original' flag
                    window.downloadHtmlContent(lastSavedEditedHtml, customCssToEmbed, 'index.html', false);
                } else {
                    alert("Download function (downloadHtmlContent) is not available.");
                }
            } else {
                alert("No saved edits available to download. Please make and save some edits first.");
            }
        });
    }

    // New: Event listener for Download Edited CSS button
    if (downloadEditedCssBtn) {
        downloadEditedCssBtn.addEventListener('click', () => {
            if (hasUnsavedChanges) {
                alert("You have unsaved changes. Please save your edits before downloading the CSS.");
                return;
            }
            if (lastSavedCustomCSS) {
                const blob = new Blob([lastSavedCustomCSS], { type: 'text/css' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                const projectName = window.lastProjectName || 'custom-styles';
                a.href = url;
                a.download = `${projectName}-edited.css`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else {
                alert("No custom CSS has been saved. Apply some color changes and save your edits first.");
            }
        });
    }
});
