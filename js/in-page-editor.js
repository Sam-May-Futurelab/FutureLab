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
    const handleDblClick = function(event) {
        if (!isEditModeActive) {
            // console.log("InPageEditor: Edit mode is disabled. Double-click ignored.");
            return; // Do nothing if edit mode is not active
        }

        const target = event.target.closest(editableSelectors);

        if (target && !target.isContentEditable) {
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

    iframeDocument.removeEventListener('dblclick', handleDblClick); // Remove existing listener first to prevent duplicates
    iframeDocument.addEventListener('dblclick', handleDblClick);

    console.log("InPageEditor: Double-click event listener attached to iframe document.");
}

// The initInPageEditor function will be called from questionnaire.js
// after the iframe content is loaded. It sets up the listener.
// The setInPageEditMode function (now on window) will be called by a UI toggle elsewhere.
