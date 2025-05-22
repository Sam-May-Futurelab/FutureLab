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
    const undoBtn = document.getElementById('undo-edit-btn');
    const redoBtn = document.getElementById('redo-edit-btn');

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
        window.initInPageEditorControls({
            colorPickerPanel: colorPickerPanel,
            colorPickerTargetInfo: colorPickerTargetInfoDiv,
            imageEditorPanel: imageEditorPanel
        });
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
        if (window.updateUndoRedoButtons) window.updateUndoRedoButtons(); // Update button states
    };

    // Function to update Undo/Redo button states
    window.updateUndoRedoButtons = () => {
        if (undoBtn && redoBtn && typeof window.canUndoInPageEdit === 'function' && typeof window.canRedoInPageEdit === 'function') {
            undoBtn.disabled = !window.canUndoInPageEdit();
            redoBtn.disabled = !window.canRedoInPageEdit();
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
            if (undoBtn) {
                undoBtn.style.display = editorActive ? 'inline-block' : 'none';
            }
            if (redoBtn) {
                redoBtn.style.display = editorActive ? 'inline-block' : 'none';
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
                if (typeof window.clearInPageEditorHistory === 'function') {
                    window.clearInPageEditorHistory(); // Clear history when disabling edit mode
                }
            } else { // Edit mode is being turned ON
                setupInPageEditorForIframe(); // Ensure listeners are attached if iframe is ready
            }
            if (window.updateUndoRedoButtons) window.updateUndoRedoButtons(); // Update on mode toggle
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
                // After saving, it's common to clear the undo/redo history as the saved state is the new baseline
                if (typeof window.clearInPageEditorHistory === 'function') {
                    window.clearInPageEditorHistory();
                }
                if (window.updateUndoRedoButtons) window.updateUndoRedoButtons(); // Update button states
            } else {
                alert("Could not retrieve content from the preview to save.");
            }
        });
    }

    if (downloadEditedPageBtn) {
        downloadEditedPageBtn.addEventListener('click', async () => { // Make async for payment check
            if (!window.isPaidUser && lastSavedEditedHtml) { // Check if there's content to save before payment
                sessionStorage.setItem('paymentAttempt_HTML', lastSavedEditedHtml);
                sessionStorage.setItem('paymentAttempt_CSS', lastSavedCustomCSS); // Save associated CSS
                sessionStorage.setItem('paymentAttempt_ProjectName', window.lastProjectName || 'edited-page');
                sessionStorage.setItem('paymentAttempt_Type', 'edited'); // Mark as edited
                console.log('Saved EDITED content to sessionStorage before Stripe redirect. Type: edited');
                await window.handleUnlockDownloadsClick(); // Use the global function from questionnaire.js
                return;
            }
            if (lastSavedEditedHtml) {
                window.downloadHtmlContent(lastSavedEditedHtml, lastSavedCustomCSS, `${window.lastProjectName || 'edited-page'}.html`, false);
            } else {
                showSaveNotification('No edited content saved to download.');
            }
        });
    }

    // New: Event listener for Download Edited CSS button
    if (downloadEditedCssBtn) {
        downloadEditedCssBtn.addEventListener('click', async () => { // Make async for payment check
            if (!window.isPaidUser && lastSavedCustomCSS) { // Check if there's content to save before payment
                sessionStorage.setItem('paymentAttempt_HTML', lastSavedEditedHtml); // Also save HTML for context
                sessionStorage.setItem('paymentAttempt_CSS', lastSavedCustomCSS);
                sessionStorage.setItem('paymentAttempt_ProjectName', window.lastProjectName || 'edited-page');
                sessionStorage.setItem('paymentAttempt_Type', 'edited'); // Mark as edited
                console.log('Saved EDITED content (for CSS download trigger) to sessionStorage before Stripe redirect. Type: edited');
                await window.handleUnlockDownloadsClick(); // Use the global function from questionnaire.js
                return;
            }
            if (lastSavedCustomCSS) {
                downloadFile(`${window.lastProjectName || 'edited-styles'}.css`, lastSavedCustomCSS, 'text/css');
            } else {
                showSaveNotification('No edited CSS saved to download.');
            }
        });
    }

    if (undoBtn && typeof window.undoInPageEdit === 'function') {
        undoBtn.addEventListener('click', () => {
            window.undoInPageEdit();
        });
    }

    if (redoBtn && typeof window.redoInPageEdit === 'function') {
        redoBtn.addEventListener('click', () => {
            window.redoInPageEdit();
        });
    }

    // --- START: Added for payment flow and content restoration ---
    function checkPaymentStatusAndRestoreContent() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('payment_success') && urlParams.get('payment_success') === 'true') {
            console.log('Payment successful, session ID:', urlParams.get('session_id'));
            sessionStorage.setItem('paymentCompleted', 'true');
            window.isPaidUser = true; // Update global flag

            // Restore content from sessionStorage
            const savedHtml = sessionStorage.getItem('paymentAttempt_HTML');
            const savedCss = sessionStorage.getItem('paymentAttempt_CSS');
            const savedProjectName = sessionStorage.getItem('paymentAttempt_ProjectName');
            const savedContentType = sessionStorage.getItem('paymentAttempt_Type'); // 'original' or 'edited'

            if (savedHtml && savedCss) {
                console.log(`Restoring content from sessionStorage after payment. Type: ${savedContentType}`);
                
                // Update the global/module-level variables that hold the content
                if (savedContentType === 'original') {
                    window.lastGeneratedHTML = savedHtml; // This is in questionnaire.js scope
                    window.lastGeneratedCSS = savedCss;
                    if (savedProjectName) window.lastProjectName = savedProjectName; // questionnaire.js scope
                    console.log('Updated window.lastGeneratedHTML/CSS with restored original content.');
                } else if (savedContentType === 'edited') {
                    lastSavedEditedHtml = savedHtml; // This is in lab.js scope
                    lastSavedCustomCSS = savedCss;
                    // window.lastProjectName is global, might be updated if needed, but usually pertains to original generation
                    if (savedProjectName && window.lastProjectName !== savedProjectName) {
                        // Potentially update window.lastProjectName if the edited version had a distinct name saved
                        // For now, assume window.lastProjectName from questionnaire.js is the primary one.
                    }
                    console.log('Updated lastSavedEditedHtml/CSS with restored edited content.');
                }

                // Update the preview iframe using srcdoc for direct HTML/CSS injection
                if (pagePreviewIframe) {
                    const fullHtmlForPreview = `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>${savedProjectName || 'Preview'}</title>
                            <style>
                                body { margin: 0; padding: 0; }
                                ${savedCss}
                            </style>
                        </head>
                        <body>${savedHtml}</body>
                        </html>
                    `;
                    pagePreviewIframe.srcdoc = fullHtmlForPreview;
                    console.log('Preview iframe updated with restored content using srcdoc.');
                }
                
                // Update UI elements (e.g., enable download buttons, hide payment prompts)
                // This requires access to buttons from both questionnaire.js and lab.js contexts if they are distinct
                // For simplicity, we assume these IDs are unique and globally accessible for this example
                const originalDownloadHtmlBtn = document.getElementById('download-html-btn');
                const originalDownloadCssBtn = document.getElementById('download-css-btn');
                // downloadEditedPageBtn and downloadEditedCssBtn are already defined in lab.js scope

                if (originalDownloadHtmlBtn) originalDownloadHtmlBtn.disabled = false;
                if (originalDownloadCssBtn) originalDownloadCssBtn.disabled = false;
                if (downloadEditedPageBtn) downloadEditedPageBtn.disabled = false;
                if (downloadEditedCssBtn) downloadEditedCssBtn.disabled = false;

                // If edit mode was active and it was edited content, potentially re-enable edit mode controls
                if (savedContentType === 'edited' && toggleEditModeBtn && editorActive) {
                    // May need to re-initialize editor if state was lost, or ensure it picks up new srcdoc content
                    // For now, just log. A robust solution might re-trigger parts of edit mode setup.
                    console.log('Restored edited content. Edit mode may need re-initialization if it was active.');
                }

                showSaveNotification('Payment successful! You can now download your page.');

                // Clean up sessionStorage items
                sessionStorage.removeItem('paymentAttempt_HTML');
                sessionStorage.removeItem('paymentAttempt_CSS');
                sessionStorage.removeItem('paymentAttempt_ProjectName');
                sessionStorage.removeItem('paymentAttempt_Type');
            } else {
                console.warn('Payment success detected, but no saved content found in sessionStorage to restore.');
            }

            // Clean URL
            const newUrl = window.location.pathname + window.location.hash; // Keep hash if present
            window.history.replaceState({}, document.title, newUrl);

        } else if (urlParams.has('payment_cancelled') && urlParams.get('payment_cancelled') === 'true') {
            console.log('Payment cancelled by user.');
            showSaveNotification('Payment was cancelled. You can try again anytime.');
            // Clean up sessionStorage items even on cancellation
            sessionStorage.removeItem('paymentAttempt_HTML');
            sessionStorage.removeItem('paymentAttempt_CSS');
            sessionStorage.removeItem('paymentAttempt_ProjectName');
            sessionStorage.removeItem('paymentAttempt_Type');
            // Clean URL
            const newUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, document.title, newUrl);
        }
    }

    checkPaymentStatusAndRestoreContent(); // Call on page load

    // Initial button state update
    if (window.updateUndoRedoButtons) window.updateUndoRedoButtons();
});
