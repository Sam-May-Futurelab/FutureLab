// In-page editor logic
console.log("In-page editor script loaded.");

let isEditModeActive = false;
let currentIframeDocument = null; 
let currentEditingElementForColor = null;
const customCssRules = {}; // Stores element.id -> { background: '...', text: '...' }

// Color Picker Panel elements (to be initialized in initInPageEditor if they are in the main document)
let colorPickerPanel, bgColorPicker, textColorPicker, applyColorsBtn, removeColorsBtn, closeColorPickerBtn;

// Function to set the status of edit mode
function setInPageEditMode(isActive) {
    isEditModeActive = isActive;
    console.log(`InPageEditor: Edit mode ${isActive ? 'enabled' : 'disabled'}.`);
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
        console.error("Color picker elements not initialized.");
        return;
    }
    currentEditingElementForColor = element;
    const computedStyle = window.getComputedStyle(element);

    // Attempt to get existing inline style first, then computed, then default
    let currentBgColor = element.style.backgroundColor ? rgbToHex(element.style.backgroundColor) : rgbToHex(computedStyle.backgroundColor);
    let currentTextColor = element.style.color ? rgbToHex(element.style.color) : rgbToHex(computedStyle.color);

    // Fallback if parsing fails or color is 'transparent' or similar
    if (!isValidHex(currentBgColor) || currentBgColor === '#000000' && computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)') { // Check for transparent
        currentBgColor = '#ffffff'; // Default background
    }
    if (!isValidHex(currentTextColor)) {
        currentTextColor = '#000000'; // Default text
    }
    
    bgColorPicker.value = currentBgColor;
    textColorPicker.value = currentTextColor;
    colorPickerPanel.style.display = 'block';
}

function closeColorPicker() {
    if (colorPickerPanel) {
        colorPickerPanel.style.display = 'none';
    }
    currentEditingElementForColor = null;
}

function applyColors() {
    if (!currentEditingElementForColor || !bgColorPicker || !textColorPicker) return;

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
    console.log("Applied colors:", customCssRules);
    // No need to close picker here, user might want to try other colors
}

function removeCustomColors() {
    if (!currentEditingElementForColor) return;

    currentEditingElementForColor.style.backgroundColor = ''; // Remove inline style
    currentEditingElementForColor.style.color = '';       // Remove inline style

    const elementId = currentEditingElementForColor.id;
    if (elementId && customCssRules[elementId]) {
        delete customCssRules[elementId];
    }

    if (typeof window.notifyUnsavedChange === 'function') {
        window.notifyUnsavedChange();
    }
    // Optionally, close picker or reset its values
    // For now, let's just reflect that custom styles are removed
    const computedStyle = window.getComputedStyle(currentEditingElementForColor);
    bgColorPicker.value = rgbToHex(computedStyle.backgroundColor);
    textColorPicker.value = rgbToHex(computedStyle.color);

    console.log("Removed custom colors. Current rules:", customCssRules);
}


// Helper to convert RGB or RGBA to HEX
function rgbToHex(rgbString) {
    if (!rgbString || typeof rgbString !== 'string') return '#ffffff'; // Default if invalid
    if (rgbString.startsWith('#')) return rgbString; // Already hex

    const match = rgbString.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
    if (!match) return '#ffffff'; // Default if parsing fails

    const r = parseInt(match[1]).toString(16).padStart(2, '0');
    const g = parseInt(match[2]).toString(16).padStart(2, '0');
    const b = parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

function isValidHex(hex) {
    return /^#[0-9A-F]{6}$/i.test(hex);
}


window.getCustomCss = () => {
    let cssString = '';
    for (const id in customCssRules) {
        if (customCssRules.hasOwnProperty(id)) {
            const rule = customCssRules[id];
            cssString += `#${id} {\n`;
            if (rule.background) {
                cssString += `    background-color: ${rule.background} !important;\n`;
            }
            if (rule.text) {
                cssString += `    color: ${rule.text} !important;\n`;
            }
            cssString += `}\n\n`;
        }
    }
    return cssString;
};


function initInPageEditor(iframeDocument) {
    if (!iframeDocument) {
        console.error("InPageEditor: Iframe document not provided.");
        return;
    }
    currentIframeDocument = iframeDocument;
    console.log("InPageEditor: Initializing for iframe...");

    // Initialize color picker elements from the main document (parent of the iframe)
    // This assumes lab.html (parent) contains the color picker panel
    colorPickerPanel = window.parent.document.getElementById('color-picker-panel');
    bgColorPicker = window.parent.document.getElementById('bgColorPicker');
    textColorPicker = window.parent.document.getElementById('textColorPicker');
    applyColorsBtn = window.parent.document.getElementById('applyColorsBtn');
    removeColorsBtn = window.parent.document.getElementById('removeColorsBtn');
    closeColorPickerBtn = window.parent.document.getElementById('closeColorPickerBtn');

    if (applyColorsBtn) applyColorsBtn.addEventListener('click', applyColors);
    if (removeColorsBtn) removeColorsBtn.addEventListener('click', removeCustomColors);
    if (closeColorPickerBtn) closeColorPickerBtn.addEventListener('click', closeColorPicker);

    const textEditableSelectors = 'h1, h2, h3, h4, h5, h6, p, a, span, li, button, label, th, td'; // Elements for direct text editing
    // General clickable selectors for color editing (broader)
    const colorEditableSelectors = 'section, div, header, footer, nav, main, article, aside, td, th, li, ul, ol, a, button, .btn';


    const handleClickToEditOrColor = function(event) {
        if (!isEditModeActive) {
            if (colorPickerPanel && colorPickerPanel.style.display !== 'none') {
                 closeColorPicker(); // Close picker if user clicks outside while not in edit mode
            }
            return; 
        }

        const target = event.target;
        
        // If click is inside the color picker panel (which is in parent doc), do nothing here.
        // This check might be tricky due to event bubbling from iframe to parent.
        // For now, assume clicks handled by color picker buttons stop propagation or are handled by lab.js.

        // Priority to text editing for specific elements
        const textTarget = target.closest(textEditableSelectors);

        if (textTarget && !textTarget.closest('svg, canvas, img, video, input, textarea, select') && textTarget.tagName !== 'BODY' && textTarget.tagName !== 'HTML') {
            // Check if the click was on an element that should be text-editable
            // and not something that should open the color picker primarily.
            // This logic can be refined. For example, a <div> with text might be for color, but a <p> inside it for text.
            
            // If an element is already contentEditable, let it be.
            if (textTarget.isContentEditable) return;

            console.log("InPageEditor: Making element text-editable:", textTarget);
            const originalContent = textTarget.innerHTML;
            let escapePressed = false;

            textTarget.contentEditable = 'true';
            textTarget.focus();
            textTarget.style.outline = '2px dashed #007bff'; // Text edit visual cue

            const onBlur = () => {
                textTarget.contentEditable = 'false';
                textTarget.style.outline = 'none';
                if (!escapePressed) {
                    if (typeof window.notifyUnsavedChange === 'function') {
                        window.notifyUnsavedChange();
                    }
                }
                textTarget.removeEventListener('blur', onBlur);
                textTarget.removeEventListener('keydown', onKeydown);
            };

            const onKeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); escapePressed = false; textTarget.blur();
                } else if (e.key === 'Escape') {
                    e.preventDefault(); textTarget.innerHTML = originalContent; escapePressed = true; textTarget.blur();
                }
            };

            textTarget.addEventListener('blur', onBlur);
            textTarget.addEventListener('keydown', onKeydown);
            event.stopPropagation(); // Prevent color picker from opening for this element
            return; // Handled as text edit
        }

        // If not a text edit, consider for color editing
        const colorTarget = target.closest(colorEditableSelectors);
        if (colorTarget && !colorTarget.closest('svg, canvas, img, video, input, textarea, select') && colorTarget.tagName !== 'BODY' && colorTarget.tagName !== 'HTML') {
            console.log("InPageEditor: Opening color picker for element:", colorTarget);
            openColorPicker(colorTarget);
            event.stopPropagation(); // Prevent further bubbling if needed
        }
    };

    iframeDocument.removeEventListener('click', handleClickToEditOrColor); 
    iframeDocument.addEventListener('click', handleClickToEditOrColor);

    console.log("InPageEditor: Click event listener for text/color editing attached to iframe document.");
}

// Ensure initInPageEditor is globally available if it wasn't already
window.initInPageEditor = initInPageEditor;
