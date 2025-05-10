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
    const saveEditedPageBtn = document.getElementById('save-edited-page-btn'); // Get the save button
    let editorActive = false;

    if (toggleEditModeBtn) {
        toggleEditModeBtn.addEventListener('click', () => {
            editorActive = !editorActive;
            if (typeof window.setInPageEditMode === 'function') {
                window.setInPageEditMode(editorActive);
            }
            toggleEditModeBtn.classList.toggle('active', editorActive);
            toggleEditModeBtn.innerHTML = editorActive ? '<i class="fas fa-times-circle"></i> Disable Edit Mode' : '<i class="fas fa-pencil-alt"></i> Toggle Edit Mode';
            
            // Show/hide the save button based on edit mode
            if (saveEditedPageBtn) {
                saveEditedPageBtn.style.display = editorActive ? 'inline-block' : 'none';
            }
        });
    }

    // Placeholder for Save Edits button functionality
    if (saveEditedPageBtn) {
        saveEditedPageBtn.addEventListener('click', () => {
            // Logic to extract and save HTML will go here
            const pagePreviewIframe = document.getElementById('page-preview');
            if (pagePreviewIframe && pagePreviewIframe.contentDocument) {
                const editedHtml = pagePreviewIframe.contentDocument.body.innerHTML;
                console.log("Edited HTML content:", editedHtml);
                alert("Edited HTML logged to console. Integration for saving this content is pending.");
                // Further steps: send to server, offer as download, etc.
            } else {
                alert("Could not retrieve edited content from the preview.");
            }
        });
    }
});
