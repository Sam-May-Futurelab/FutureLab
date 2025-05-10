// In-page editor logic
console.log("In-page editor script loaded.");

let isEditModeActive = false;
let currentIframeDocument = null;
let currentEditingElementForColor = null;
let colorPickerTargetInfo = null; // Reference to the color picker target info div
const customCssRules = {}; // Stores element.id -> { background: '...', text: '...' }

// Color Picker Panel elements
let colorPickerPanel, bgColorPicker, textColorPicker, applyColorsBtn, removeColorsBtn, closeColorPickerBtn;

// Initialize references to color picker panel elements from the main document
// This function should be called once the main DOM is loaded, perhaps by lab.js or questionnaire.js
// For now, assuming it's called and populates the variables above.
function initInPageEditorControls(panel, bgPicker, txtPicker, applyBtn, removeBtn, closeBtn, targetInfoDiv) {
    colorPickerPanel = panel;
    bgColorPicker = bgPicker;
    textColorPicker = txtPicker;
    applyColorsBtn = applyBtn;
    removeColorsBtn = removeBtn;
    closeColorPickerBtn = closeBtn;
    colorPickerTargetInfo = targetInfoDiv;

    if (applyColorsBtn) applyColorsBtn.addEventListener('click', applyColors);
    if (removeColorsBtn) removeColorsBtn.addEventListener('click', removeCustomColors);
    if (closeColorPickerBtn) closeColorPickerBtn.addEventListener('click', closeColorPicker);
    console.log("InPageEditor: Controls initialized.");
}
// Make it globally available if lab.js needs to call it with elements from lab.html
window.initInPageEditorControls = initInPageEditorControls;


// Event handler for clicks inside the iframe
function handleIframeElementClick(event) {
    if (!isEditModeActive || !currentIframeDocument) {
        console.log("InPageEditor: Click ignored, edit mode off or no iframe doc.");
        return;
    }

    const targetElement = event.target;
    console.log("InPageEditor: Clicked in iframe on:", targetElement);

    // Prevent default behavior for links, etc., while in edit mode if we handle the click
    // event.preventDefault(); // Use cautiously, might interfere

    // Priority: Alt+Click always tries to open color picker for the clicked element
    if (event.altKey) {
        if (targetElement && targetElement !== currentIframeDocument.body && targetElement !== currentIframeDocument.documentElement) {
            console.log("InPageEditor: Alt+Click detected, opening color picker for:", targetElement);
            openColorPicker(targetElement);
            event.preventDefault();
            event.stopPropagation();
            return;
        }
    }

    // Define tags that are typically for text content editing
    const textEditableTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'LI', 'TD', 'TH', 'FIGCAPTION', 'BUTTON', 'LABEL'];
    // Define tags that are primarily structural or containers, for which color editing is more likely
    const structuralOrStylableTags = ['DIV', 'SECTION', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER', 'MAIN', 'NAV', 'FORM', 'UL', 'OL', 'TABLE', 'THEAD', 'TBODY', 'TR'];

    if (targetElement.closest('button, input, textarea, select')) { // Let form elements behave normally unless alt-clicked
        console.log("InPageEditor: Click on form element, default behavior unless Alt-clicked.");
        return;
    }
    
    // Check if the element or its parent is contentEditable (e.g. an already focused text element)
    let el = targetElement;
    let isNestedInEditable = false;
    while(el && el !== currentIframeDocument.body) {
        if (el.isContentEditable) {
            isNestedInEditable = true;
            break;
        }
        el = el.parentElement;
    }

    if (isNestedInEditable) {
        console.log("InPageEditor: Click inside an already contentEditable element. Letting it be.");
        return; // Don't interfere with existing contentEditable state
    }


    // If it's a text-like element, make it contentEditable for HTML editing
    if (textEditableTags.includes(targetElement.tagName) || (targetElement.tagName === 'DIV' && !targetElement.children.length && targetElement.textContent.trim().length > 0)) {
        if (!targetElement.isContentEditable) { // Check again, as closest might not be self
            console.log("InPageEditor: Making element contentEditable:", targetElement);
            targetElement.contentEditable = 'true';
            targetElement.focus();
            // Add blur listener to turn off contentEditable and notify of change
            targetElement.addEventListener('blur', function onBlur() {
                targetElement.contentEditable = 'false';
                console.log("InPageEditor: Element lost focus, contentEditable set to false.", targetElement);
                if (typeof window.notifyUnsavedChange === 'function') {
                    window.notifyUnsavedChange();
                }
                targetElement.removeEventListener('blur', onBlur); // Clean up listener
            }, { once: false }); // 'once: false' might be better if focus can be lost and regained without finishing edit
            event.preventDefault(); 
            event.stopPropagation();
            return;
        }
    }
    // If it's a structural/stylable element (and not body/html), open color picker
    else if (structuralOrStylableTags.includes(targetElement.tagName) || targetElement.classList.length > 0 || (targetElement.id && targetElement.id !== 'page-preview')) {
        if (targetElement !== currentIframeDocument.body && targetElement !== currentIframeDocument.documentElement) {
            console.log("InPageEditor: Opening color picker for structural/styled element:", targetElement);
            openColorPicker(targetElement);
            event.preventDefault();
            event.stopPropagation();
            return;
        }
    } else {
        console.log("InPageEditor: Click on unhandled element type for direct editing:", targetElement.tagName, targetElement);
        // Fallback: if it has an ID or classes, maybe it's stylable
         if ((targetElement.id || targetElement.classList.length > 0) && targetElement !== currentIframeDocument.body && targetElement !== currentIframeDocument.documentElement) {
            console.log("InPageEditor: Fallback - Opening color picker due to ID/class:", targetElement);
            openColorPicker(targetElement);
            event.preventDefault();
            event.stopPropagation();
            return;
        }
    }
}

function attachEditListeners(doc) {
    if (!doc || !doc.body) {
        console.warn("InPageEditor: Cannot attach listeners, iframe document or body is missing.");
        return;
    }
    // Using capture true to get the event before it might be stopped by other listeners.
    doc.body.addEventListener('click', handleIframeElementClick, true);
    console.log("InPageEditor: Attached click listeners to iframe document's body.");
}

function detachEditListeners(doc) {
    if (!doc || !doc.body) {
        console.warn("InPageEditor: Cannot detach listeners, iframe document or body is missing.");
        return;
    }
    doc.body.removeEventListener('click', handleIframeElementClick, true);
    console.log("InPageEditor: Detached click listeners from iframe document's body.");
}

// Function to set the status of edit mode
function setInPageEditMode(isActive, iframeDoc = null) {
    const previouslyActive = isEditModeActive;
    const previousDoc = currentIframeDocument;

    isEditModeActive = isActive;
    currentIframeDocument = iframeDoc; 

    console.log(`InPageEditor: setInPageEditMode called. Active: ${isActive}, iframeDoc: ${iframeDoc ? 'provided' : 'null'}`);

    // Detach from old document if it existed and mode was active
    if (previousDoc && previouslyActive) {
        detachEditListeners(previousDoc);
    }

    // Attach to new document if mode is active and document is provided
    if (currentIframeDocument && isEditModeActive) {
        attachEditListeners(currentIframeDocument);
    } else if (isEditModeActive && !currentIframeDocument) {
        console.warn("InPageEditor: Edit mode enabled, but no iframe document provided to attach listeners immediately. Waiting for iframe load.");
    }

    if (!isActive && colorPickerPanel && colorPickerPanel.style.display !== 'none') {
        closeColorPicker(); // Close color picker if edit mode is disabled
    }
}
window.setInPageEditMode = setInPageEditMode;

// Function to generate a unique ID for an element
function ensureId(element) {
    if (!element.id) {
        element.id = 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    return element.id;
}

function openColorPicker(element) {
    if (!colorPickerPanel || !bgColorPicker || !textColorPicker) {
        console.error("Color picker elements not initialized. Ensure initInPageEditorControls was called.");
        return;
    }
    currentEditingElementForColor = element;
    ensureId(currentEditingElementForColor); 

    if (colorPickerTargetInfo) {
        let targetName = currentEditingElementForColor.tagName.toLowerCase();
        if (currentEditingElementForColor.id) {
            targetName += `#${currentEditingElementForColor.id}`;
        } else if (currentEditingElementForColor.classList.length > 0) {
            targetName += `.${Array.from(currentEditingElementForColor.classList).join('.')}`;
        } else {
            const text = currentEditingElementForColor.textContent.trim().split(/\s+/).slice(0, 3).join(" ");
            if (text) targetName += ` ("${text}...")`;
        }
        colorPickerTargetInfo.querySelector('span').textContent = targetName;
    }

    // Use the iframe's window for getComputedStyle
    const iframeWindow = element.ownerDocument.defaultView;
    const computedStyle = iframeWindow.getComputedStyle(element);

    let currentBgColor = element.style.backgroundColor ? rgbToHex(element.style.backgroundColor) : rgbToHex(computedStyle.backgroundColor);
    let currentTextColor = element.style.color ? rgbToHex(element.style.color) : rgbToHex(computedStyle.color);

    if (!isValidHex(currentBgColor) || currentBgColor === '#000000' && (computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || computedStyle.backgroundColor === 'transparent')) {
        currentBgColor = '#ffffff'; 
    }
    if (!isValidHex(currentTextColor)) {
        currentTextColor = '#000000'; 
    }
    
    bgColorPicker.value = currentBgColor;
    textColorPicker.value = currentTextColor;
    colorPickerPanel.style.display = 'block';
    console.log("InPageEditor: Color picker opened for", element, "Current BG:", currentBgColor, "Current Text:", currentTextColor);
}

function closeColorPicker() {
    if (colorPickerPanel) {
        colorPickerPanel.style.display = 'none';
    }
    currentEditingElementForColor = null;
    if (colorPickerTargetInfo) { 
        colorPickerTargetInfo.querySelector('span').textContent = 'N/A';
    }
    console.log("InPageEditor: Color picker closed.");
}

function applyColors() {
    if (!currentEditingElementForColor || !bgColorPicker || !textColorPicker) {
        console.error("InPageEditor: Cannot apply colors, target element or pickers missing.");
        return;
    }

    const newBgColor = bgColorPicker.value;
    const newTextColor = textColorPicker.value;

    currentEditingElementForColor.style.backgroundColor = newBgColor;
    currentEditingElementForColor.style.color = newTextColor;

    const elementId = ensureId(currentEditingElementForColor);
    customCssRules[elementId] = {
        background: newBgColor,
        text: newTextColor
    };

    if (typeof window.notifyUnsavedChange === 'function') {
        window.notifyUnsavedChange();
    }
    console.log("InPageEditor: Applied colors to", currentEditingElementForColor, ". Rules:", customCssRules);
}

function removeCustomColors() {
    if (!currentEditingElementForColor) {
        console.warn("InPageEditor: No element selected to remove custom colors from.");
        return;
    }

    currentEditingElementForColor.style.backgroundColor = ''; 
    currentEditingElementForColor.style.color = '';       

    const elementId = currentEditingElementForColor.id;
    if (elementId && customCssRules[elementId]) {
        delete customCssRules[elementId];
    }

    if (typeof window.notifyUnsavedChange === 'function') {
        window.notifyUnsavedChange();
    }
    
    // Reflect removal in picker by setting to computed styles
    const iframeWindow = currentEditingElementForColor.ownerDocument.defaultView;
    const computedStyle = iframeWindow.getComputedStyle(currentEditingElementForColor);
    let currentBgColor = rgbToHex(computedStyle.backgroundColor);
    let currentTextColor = rgbToHex(computedStyle.color);

    if (!isValidHex(currentBgColor) || currentBgColor === '#000000' && (computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || computedStyle.backgroundColor === 'transparent')) {
        currentBgColor = '#ffffff'; 
    }
    if (!isValidHex(currentTextColor)) {
        currentTextColor = '#000000'; 
    }
    bgColorPicker.value = currentBgColor;
    textColorPicker.value = currentTextColor;

    console.log("InPageEditor: Removed custom colors for", currentEditingElementForColor, ". Rules:", customCssRules);
}

// Helper function to get all custom CSS rules as a string
// This is called by lab.js to save the CSS
window.getCustomCss = function() {
    let cssString = "/* Custom CSS rules generated by In-Page Editor */\n";
    for (const id in customCssRules) {
        if (Object.hasOwnProperty.call(customCssRules, id)) {
            const rule = customCssRules[id];
            // Ensure element exists in the current iframe document before adding rule
            if (currentIframeDocument && currentIframeDocument.getElementById(id)) {
                 cssString += `#${id} {\n`;
                if (rule.background) {
                    cssString += `  background-color: ${rule.background} !important;\n`;
                }
                if (rule.text) {
                    cssString += `  color: ${rule.text} !important;\n`;
                }
                cssString += `}\n`;
            } else {
                console.warn(`InPageEditor: Element with ID #${id} not found in current iframe document. Skipping CSS rule.`)
            }
        }
    }
    console.log("InPageEditor: Generated custom CSS string.");
    return cssString;
}

// --- Helper Functions ---
function rgbToHex(rgbString) {
    if (!rgbString || typeof rgbString !== 'string') return '#ffffff'; // Default for safety
    // Check if it's already a hex color
    if (/^#[0-9A-F]{6}$/i.test(rgbString) || /^#[0-9A-F]{3}$/i.test(rgbString)) {
        return rgbString.toLowerCase();
    }

    const match = rgbString.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
    if (!match) {
        // Handle named colors or other formats if necessary, or return a default
        // For simplicity, if it's 'transparent' or unparsable, treat as white for background, black for text (handled in openColorPicker)
        if (rgbString === 'transparent' || rgbString === 'rgba(0, 0, 0, 0)') return '#000000'; // Special case for transparent
        return '#ffffff'; // Default for unparsable
    }

    function componentToHex(c) {
        const hex = Number(c).toString(16);
        return hex.length === 1 ? "0" + hex : hex;
    }
    return ("#" + componentToHex(match[1]) + componentToHex(match[2]) + componentToHex(match[3])).toLowerCase();
}

function isValidHex(hex) {
    return /^#[0-9A-F]{6}$/i.test(hex) || /^#[0-9A-F]{3}$/i.test(hex);
}

// Ensure lab.js calls initInPageEditorControls with the correct elements from lab.html
// Example:
// In lab.js, after DOMContentLoaded:
// const panel = document.getElementById('color-picker-panel');
// const bgPicker = document.getElementById('bgColorPicker');
// ...etc.
// window.initInPageEditorControls(panel, bgPicker, ...);
