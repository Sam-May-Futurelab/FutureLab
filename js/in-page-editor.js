// In-page editor logic
console.log("In-page editor script loaded.");

let isEditModeActive = false;
let currentIframeDocument = null; // To store the iframe document reference

// Function to set the status of edit mode
function setInPageEditMode(isActive) {
    isEditModeActive = isActive;
    console.log(`InPageEditor: Edit mode ${isActive ? 'enabled' : 'disabled'}.`);
    // We can add visual cues here if needed, e.g., changing a global page style or the editor button
}

// Expose setInPageEditMode to be callable from other scripts (e.g., lab.js)
window.setInPageEditMode = setInPageEditMode;

function initInPageEditor(iframeDocument) {
    if (!iframeDocument) {
        console.error("InPageEditor: Iframe document not provided.");
        return;
    }
    currentIframeDocument = iframeDocument; // Store for potential future use
    console.log("InPageEditor: Initializing for iframe...");

    const editableSelectors = 'h1, h2, h3, h4, h5, h6, p, a, span, div, li, button, label, th, td';

    // Define the event handler function so it can be potentially removed if we need to fully disable
    // For now, we just check isEditModeActive at the start.
    const handleClickToEdit = function(event) { // Renamed from handleDblClick
        if (!isEditModeActive) {
            return; // Do nothing if edit mode is not active
        }

        const target = event.target.closest(editableSelectors);

        // Prevent editing if the click is on an already contentEditable element or a button/link to allow normal interaction first
        if (target && target.isContentEditable) {
            return;
        }
        
        // If the target is an interactive element like a link or button, 
        // ensure we are not preventing its default action immediately.
        // For simplicity, we allow editing, but this might need refinement if it interferes with navigation/actions.
        // A common pattern is to require a modifier key (e.g., Ctrl+Click) for editing interactive elements.

        if (target && !target.isContentEditable) { // Check !target.isContentEditable again to be sure
            if (target.closest('svg, canvas, img, video')) {
                console.log("InPageEditor: Editing of this element type is not supported.");
                return;
            }
            if (target.tagName === 'BODY' || target.tagName === 'HTML') return;

            console.log("InPageEditor: Making element editable:", target);
            
            const originalContent = target.innerHTML;
            let escapePressed = false;

            target.contentEditable = 'true';
            target.focus();
            target.style.outline = '2px dashed #007bff';

            const onBlur = () => {
                target.contentEditable = 'false';
                target.style.outline = 'none';
                if (!escapePressed) {
                    console.log("InPageEditor: Changes saved for:", target);
                    if (typeof window.notifyUnsavedChange === 'function') {
                        window.notifyUnsavedChange(); // Notify lab.js of a change
                    }
                } else {
                    console.log("InPageEditor: Changes reverted for:", target);
                }
                target.removeEventListener('blur', onBlur);
                target.removeEventListener('keydown', onKeydown);
            };

            const onKeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    escapePressed = false;
                    target.blur();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    target.innerHTML = originalContent;
                    escapePressed = true;
                    target.blur();
                }
            };

            target.addEventListener('blur', onBlur);
            target.addEventListener('keydown', onKeydown);
        }
    };

    iframeDocument.removeEventListener('dblclick', handleClickToEdit); // Remove old dblclick listener if any (though it was named handleDblClick before)
    iframeDocument.removeEventListener('click', handleClickToEdit); // Remove existing click listener first to prevent duplicates
    iframeDocument.addEventListener('click', handleClickToEdit); // Add the new single click listener

    console.log("InPageEditor: Single-click event listener attached to iframe document.");
}

// The initInPageEditor function will be called from questionnaire.js
// after the iframe content is loaded. It sets up the listener.
// The setInPageEditMode function (now on window) will be called by a UI toggle elsewhere.
