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
    const downloadEditedPageBtn = document.getElementById('download-edited-page-btn'); // Added
    const editModeInstructions = document.getElementById('edit-mode-instructions');
    const unsavedChangesIndicator = document.getElementById('unsaved-changes-indicator'); // Added
    const previewControlsContainer = document.getElementById('preview-controls-container'); // Added

    let editorActive = false;
    let hasUnsavedChanges = false; // Added
    let lastSavedEditedHtml = ''; // Added to store the last explicitly saved HTML

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
                downloadEditedPageBtn.title = !lastSavedEditedHtml ? "Save your edits first to enable download." : "Download the last saved version of your edited page.";
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
            }
        });
    }

    if (saveEditedPageBtn) {
        saveEditedPageBtn.addEventListener('click', () => {
            const pagePreviewIframe = document.getElementById('page-preview');
            if (pagePreviewIframe && pagePreviewIframe.contentDocument && pagePreviewIframe.contentDocument.body) {
                lastSavedEditedHtml = pagePreviewIframe.contentDocument.body.innerHTML;
                hasUnsavedChanges = false;
                if (unsavedChangesIndicator) {
                    unsavedChangesIndicator.style.display = 'none';
                }
                saveEditedPageBtn.classList.remove('btn-warning');
                saveEditedPageBtn.classList.add('btn-success');
                alert("Your edits have been saved! You can now download the page or continue editing.");
                console.log("Saved HTML content:", lastSavedEditedHtml);

                // Enable download button after saving
                if (downloadEditedPageBtn) {
                    downloadEditedPageBtn.disabled = false;
                    downloadEditedPageBtn.title = "Download the last saved version of your edited page.";
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
});
