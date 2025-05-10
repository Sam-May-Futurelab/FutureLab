document.addEventListener('DOMContentLoaded', function() {
    // Initialize any lab page specific functionality
    console.log('Lab page loaded with new questionnaire form.');
    
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
    const previewControlsContainer = document.getElementById('preview-controls-container');
    const saveNotificationPopup = document.getElementById('save-notification-popup');
    const saveNotificationMessage = document.getElementById('save-notification-message');
    const closeSaveNotificationBtn = document.getElementById('close-save-notification');

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
            saveEditedPageBtn.classList.remove('btn-success'); // Default style
            saveEditedPageBtn.classList.add('btn-warning'); // Indicate action needed
        }
        // Disable download button if there are unsaved changes
        if (downloadEditedPageBtn) {
            downloadEditedPageBtn.disabled = true;
            downloadEditedPageBtn.title = "Save your changes before downloading.";
        }
        if (downloadEditedCssBtn) { // New
            downloadEditedCssBtn.disabled = true;
            downloadEditedCssBtn.title = "Save your changes before downloading CSS.";
        }
    };

    if (toggleEditModeBtn) {
        toggleEditModeBtn.addEventListener('click', () => {
            editorActive = !editorActive;
            if (typeof window.setInPageEditMode === 'function') {
                window.setInPageEditMode(editorActive);
            }
            toggleEditModeBtn.classList.toggle('active', editorActive);
            toggleEditModeBtn.innerHTML = editorActive ? '<i class="fas fa-times-circle"></i> Disable Edit Mode' : '<i class="fas fa-pencil-alt"></i> Toggle Edit Mode';
            
            // Visual cue for edit mode active on the container
            if (previewControlsContainer) {
                if (editorActive) {
                    previewControlsContainer.style.backgroundColor = 'var(--light-blue-bg)'; // Or a more prominent color
                } else {
                    previewControlsContainer.style.backgroundColor = 'transparent';
                }
            }

            if (saveEditedPageBtn) {
                saveEditedPageBtn.style.display = editorActive ? 'inline-block' : 'none';
            }
            if (downloadEditedPageBtn) {
                downloadEditedPageBtn.style.display = editorActive ? 'inline-block' : 'none';
                downloadEditedPageBtn.disabled = !lastSavedEditedHtml; // Disable if no saved content yet
                downloadEditedPageBtn.title = !lastSavedEditedHtml ? "Save your edits first to enable page download." : "Download the last saved version of your edited page (HTML with embedded CSS).";
            }
            if (downloadEditedCssBtn) { // New
                downloadEditedCssBtn.style.display = editorActive ? 'inline-block' : 'none';
                downloadEditedCssBtn.disabled = !lastSavedCustomCSS; // Disable if no custom CSS was saved
                downloadEditedCssBtn.title = !lastSavedCustomCSS ? "Save your edits first to enable CSS download." : "Download the custom CSS for your edits.";
            }
            if (editModeInstructions) {
                editModeInstructions.style.display = editorActive ? 'block' : 'none';
            }
            // If turning off edit mode, hide unsaved changes indicator and reset its state
            if (!editorActive && unsavedChangesIndicator) {
                unsavedChangesIndicator.style.display = 'none';
                hasUnsavedChanges = false;
                if (saveEditedPageBtn) {
                    saveEditedPageBtn.classList.remove('btn-warning');
                    saveEditedPageBtn.classList.add('btn-success');
                }
                // If disabling edit mode, ensure download buttons reflect last saved state
                if (downloadEditedPageBtn) {
                    downloadEditedPageBtn.disabled = !lastSavedEditedHtml;
                }
                if (downloadEditedCssBtn) { // New
                    downloadEditedCssBtn.disabled = !lastSavedCustomCSS;
                }
            }
        });
    }

    if (saveEditedPageBtn) {
        saveEditedPageBtn.addEventListener('click', () => {
            const pagePreviewIframe = document.getElementById('page-preview');
            if (pagePreviewIframe && pagePreviewIframe.contentDocument && pagePreviewIframe.contentDocument.body) {
                lastSavedEditedHtml = pagePreviewIframe.contentDocument.body.innerHTML;
                
                // Get custom CSS from in-page-editor.js
                if (typeof window.getCustomCss === 'function') {
                    lastSavedCustomCSS = window.getCustomCss();
                } else {
                    lastSavedCustomCSS = ''; // Fallback
                    console.warn("window.getCustomCss function not found. Custom CSS will not be available for download separately.");
                }

                hasUnsavedChanges = false;
                if (unsavedChangesIndicator) {
                    unsavedChangesIndicator.style.display = 'none';
                }
                saveEditedPageBtn.classList.remove('btn-warning');
                saveEditedPageBtn.classList.add('btn-success');
                showSaveNotification("Your edits have been saved! You can now download the page or continue editing.");
                console.log("Saved HTML content and custom CSS prepared.");

                // Enable download button after saving
                if (downloadEditedPageBtn) {
                    downloadEditedPageBtn.disabled = false;
                    downloadEditedPageBtn.title = "Download the last saved version of your edited page (HTML with embedded CSS).";
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
                if (typeof window.downloadEditedPageAsHTML === 'function') {
                    window.downloadEditedPageAsHTML(lastSavedEditedHtml);
                } else {
                    alert("Download function for edited page is not available.");
                    console.error("window.downloadEditedPageAsHTML is not defined.");
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
                console.log("Downloaded custom CSS.");
            } else {
                alert("No custom CSS has been saved. Apply some color changes and save your edits first.");
            }
        });
    }
});
