// In-page editor logic

let isEditModeActive = false;
let currentIframeDocument = null;
let currentEditingElementForColor = null;
let colorPickerTargetInfo = null; // Reference to the color picker target info div
const customCssRules = {}; // Stores element.id -> { background: '...', text: '...' }
let currentlyHighlightedElement = null; // Added to track highlighted element
const HIGHLIGHT_STYLE = '2px dashed #007bff'; // Style for the highlight
let customStyleTagId = 'in-page-editor-custom-styles'; // Added

// Color Picker Panel elements
let colorPickerPanel, bgColorPicker, textColorPicker, applyColorsBtn, removeCustomColorBtn, closeColorPickerBtn;

// Initialize references to color picker panel elements from the main document
function initInPageEditorControls(panelElement, targetInfoElement) { // SIGNATURE UPDATED
    colorPickerPanel = panelElement;
    colorPickerTargetInfo = targetInfoElement; // CORRECTLY ASSIGNED

    if (!colorPickerPanel) {
        console.error("InPageEditor: Color picker panel element (colorPickerPanel) not provided to initInPageEditorControls.");
        return;
    }
    if (!colorPickerTargetInfo) {
        // Though this is passed, it's good to be aware if it's missing in lab.html
        console.warn("InPageEditor: Target info element (colorPickerTargetInfo) not provided to initInPageEditorControls.");
    }

    // Query for child elements from the provided panelElement
    bgColorPicker = colorPickerPanel.querySelector('#bgColorPicker');
    textColorPicker = colorPickerPanel.querySelector('#textColorPicker');
    applyColorsBtn = colorPickerPanel.querySelector('#applyColorsBtn'); // Corrected ID
    removeCustomColorBtn = colorPickerPanel.querySelector('#removeColorsBtn'); // Corrected ID
    closeColorPickerBtn = colorPickerPanel.querySelector('#closeColorPickerBtn'); // Corrected ID

    // Debugging logs to ensure elements are found (can be removed after verification)
    if (!bgColorPicker) console.error("InPageEditor: bgColorPicker (#bgColorPicker) not found in panel.");
    if (!textColorPicker) console.error("InPageEditor: textColorPicker (#textColorPicker) not found in panel.");
    if (!applyColorsBtn) console.error("InPageEditor: applyColorsBtn (#applyColorsBtn) not found in panel.");
    if (!removeCustomColorBtn) console.error("removeCustomColorBtn (#removeColorsBtn) not found in panel.");
    if (!closeColorPickerBtn) console.error("closeColorPickerBtn (#closeColorPickerBtn) not found in panel.");

    if (applyColorsBtn) applyColorsBtn.addEventListener('click', applyColors);
    if (removeCustomColorBtn) removeCustomColorBtn.addEventListener('click', removeCustomColors);
    if (closeColorPickerBtn) {
        closeColorPickerBtn.addEventListener('click', closeColorPicker); // Corrected listener
    }
}
window.initInPageEditorControls = initInPageEditorControls;

// Function to generate CSS from customCssRules
function getCustomCss() {
    let cssString = "";
    if (!currentIframeDocument) return cssString;

    for (const id in customCssRules) {
        if (Object.prototype.hasOwnProperty.call(customCssRules, id)) {
            // Ensure the element still exists in the current iframe document
            if (currentIframeDocument.getElementById(id)) {
                const rules = customCssRules[id];
                cssString += `#${id} {\n`;
                if (rules.background) {
                    cssString += `  background-color: ${rules.background} !important;\n`;
                }
                if (rules.text) {
                    cssString += `  color: ${rules.text} !important;\n`;
                }
                cssString += `}\n`;
            }
        }
    }
    return cssString;
}
window.getCustomCss = getCustomCss; // Expose for lab.js download functionality

// Function to apply the custom CSS to a <style> tag in the iframe
function applyCustomCssToIframe() {
    if (!currentIframeDocument || !currentIframeDocument.head) {
        return;
    }

    let styleTag = currentIframeDocument.getElementById(customStyleTagId);
    if (!styleTag) {
        styleTag = currentIframeDocument.createElement('style');
        styleTag.id = customStyleTagId;
        styleTag.type = 'text/css';
        currentIframeDocument.head.appendChild(styleTag);
    }
    const cssContent = getCustomCss();
    if (styleTag.innerHTML !== cssContent) { // Only update if changed
        styleTag.innerHTML = cssContent;
    }
}

// Function to apply highlight
function applyHighlight(element) {
    if (currentlyHighlightedElement && currentlyHighlightedElement !== element) {
        removeHighlight(currentlyHighlightedElement);
    }
    if (element) {
        element.style.outline = HIGHLIGHT_STYLE;
        element.style.outlineOffset = '2px'; // Prevents overlap with element's own border
        currentlyHighlightedElement = element;
    }
}

// Function to remove highlight
function removeHighlight(element) {
    if (element) {
        element.style.outline = '';
        element.style.outlineOffset = '';
    }
    if (currentlyHighlightedElement === element) {
        currentlyHighlightedElement = null;
    }
}

// Event handler for clicks inside the iframe
function handleIframeElementClick(event) {
    if (!isEditModeActive || !currentIframeDocument) {
        return;
    }

    const targetElement = event.target;

    // Ignore clicks on the color picker panel itself (it's in the parent document)
    if (targetElement.closest && targetElement.closest('#color-picker-panel')) {
        return;
    }
    
    // ALT-CLICK: Force open color picker for the clicked element
    if (event.altKey) {
        if (targetElement && targetElement !== currentIframeDocument.body && targetElement !== currentIframeDocument.documentElement) {
            applyHighlight(targetElement); 
            openColorPicker(targetElement);
            event.preventDefault();
            event.stopPropagation();
            return;
        }
    }

    // Ignore clicks on common interactive form elements for this flow unless they are specifically designated as editable (e.g. button text)
    // This check is simplified; specific handling for A and BUTTON tags happens later.
    if (targetElement.closest('input, textarea, select')) { 
        if (!targetElement.closest('input[type=button], input[type=submit]')) { // Allow button-like inputs to be potentially styled/edited
             return;
        }
    }
    
    // If already content editable (e.g., user clicked into an already focused editable element from our system)
    let el = targetElement;
    let isNestedInActiveEditable = false;
    while(el && el !== currentIframeDocument.body) {
        // Check if it's an *active* edit session initiated by this script
        if (el.isContentEditable && el.style.outline && el.style.outline.includes('dashed')) { 
            isNestedInActiveEditable = true;
            break;
        }
        el = el.parentElement;
    }
    if (isNestedInActiveEditable) {
        return; // Allow normal editing within that element
    }

    const textEditableTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'LI', 'TD', 'TH', 'FIGCAPTION', 'BUTTON', 'LABEL', 'PRE', 'BLOCKQUOTE', 'DT', 'DD'];
    const structuralOrStylableTags = ['DIV', 'SECTION', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER', 'MAIN', 'NAV', 'FORM', 'UL', 'OL', 'TABLE', 'THEAD', 'TBODY', 'TR', 'FIGURE'];

    // PRIORITY 1: Text Editing for specific tags or simple DIVs with text
    if (textEditableTags.includes(targetElement.tagName) || 
        (targetElement.tagName === 'DIV' && !targetElement.children.length && targetElement.textContent && targetElement.textContent.trim().length > 0)) {
        
        if (targetElement.isContentEditable && targetElement.style.outline.includes('dashed')) {
            // Already actively being edited by us, do nothing extra, let user type.
            return;
        }
        
        // Make it contentEditable
        applyHighlight(targetElement); 
        targetElement.contentEditable = 'true';
        targetElement.focus();
        
        // Add a blur listener to clean up
        targetElement.addEventListener('blur', function tempBlurHandler() {
            targetElement.contentEditable = 'false';
            removeHighlight(targetElement);
            if (typeof window.notifyUnsavedChange === 'function') {
                window.notifyUnsavedChange();
            }
            targetElement.removeEventListener('blur', tempBlurHandler); // Remove self
        });

        event.preventDefault(); 
        event.stopPropagation();
        return;
    } 
    // PRIORITY 2: Color Picker for structural elements or elements with class/id
    else if (
        targetElement !== currentIframeDocument.body && 
        targetElement !== currentIframeDocument.documentElement &&
        (structuralOrStylableTags.includes(targetElement.tagName) ||
         (targetElement.classList && targetElement.classList.length > 0) ||
         (targetElement.id && targetElement.id !== 'page-preview' && targetElement.id !== customStyleTagId) // customStyleTagId is id of <style> tag
        )
    ) {
        applyHighlight(targetElement); 
        openColorPicker(targetElement);
        event.preventDefault();
        event.stopPropagation();
        return;
    }

    // If a click didn't result in an action & a different element is highlighted, clear old highlight.
    // This is a soft reset for context.
    if (currentlyHighlightedElement && currentlyHighlightedElement !== targetElement) {
        // Ensure the click wasn't inside the color picker panel itself
        let mainDocColorPicker = document.getElementById('color-picker-panel'); // Get panel from main doc
        if (!mainDocColorPicker || !mainDocColorPicker.contains(event.target)) {
             removeHighlight(currentlyHighlightedElement);
        }
    }
}

function attachEditListeners(doc) {
    if (!doc || !doc.body) {
        return;
    }
    doc.body.addEventListener('click', handleIframeElementClick, true);
}

function detachEditListeners(doc) {
    if (!doc || !doc.body) {
        return;
    }
    doc.body.removeEventListener('click', handleIframeElementClick, true);
}

// Function to set the status of edit mode
function setInPageEditMode(isActive, iframeDoc = null) {
    const previouslyActive = isEditModeActive;
    const previousDoc = currentIframeDocument;

    isEditModeActive = isActive;
    currentIframeDocument = iframeDoc; 

    if (previousDoc && previouslyActive && previousDoc !== currentIframeDocument) {
        detachEditListeners(previousDoc);
    }

    if (currentIframeDocument && isEditModeActive) {
        if (!previouslyActive || previousDoc !== currentIframeDocument) {
            attachEditListeners(currentIframeDocument);
        }
        applyCustomCssToIframe(); 
    } else if (isEditModeActive && !currentIframeDocument) {
    }

    if (!isActive) {
        if (currentlyHighlightedElement) {
            removeHighlight(currentlyHighlightedElement);
        }
        if (colorPickerPanel && colorPickerPanel.style.display !== 'none') {
            closeColorPicker();
        }
    }
}
window.setInPageEditMode = setInPageEditMode;

function ensureId(element) {
    if (!element.id) {
        element.id = 'custom-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    return element.id;
}

function openColorPicker(element) {
    if (!colorPickerPanel || !bgColorPicker || !textColorPicker) { // Removed colorPickerTargetInfo from this initial check as it's for display only
        console.error("InPageEditor: Color picker panel or essential color inputs not initialized.");
        return;
    }
    currentEditingElementForColor = element;
    ensureId(currentEditingElementForColor); 
    
    // Debugging for "N/A" issue
    console.log("InPageEditor: openColorPicker called for element:", element);
    console.log("InPageEditor: colorPickerTargetInfo element:", colorPickerTargetInfo);

    if (colorPickerTargetInfo) {
        let targetName = currentEditingElementForColor.tagName.toLowerCase();
        if (currentEditingElementForColor.id && !currentEditingElementForColor.id.startsWith('custom-')) {
            targetName += `#${currentEditingElementForColor.id}`;
        } else if (currentEditingElementForColor.classList && currentEditingElementForColor.classList.length > 0) {
            targetName += `.${Array.from(currentEditingElementForColor.classList).join('.')}`;
        }
        console.log("InPageEditor: Constructed targetName for display:", targetName);

        const spanElement = colorPickerTargetInfo.querySelector('span');
        console.log("InPageEditor: Found spanElement for target info:", spanElement);
        if (spanElement) {
            spanElement.textContent = targetName;
        } else {
            console.error("InPageEditor: Could not find span element within colorPickerTargetInfo to display target name.");
        }
    } else {
        console.warn("InPageEditor: colorPickerTargetInfo is null or undefined in openColorPicker. Target name won't be displayed.");
    }

    const iframeWindow = currentEditingElementForColor.ownerDocument.defaultView;
    if (!iframeWindow) {
        return; 
    }

    const computedStyle = iframeWindow.getComputedStyle(currentEditingElementForColor);
    if (!computedStyle) {
        return; 
    }

    let currentBgColor = '#ffffff'; // Default
    let currentTextColor = '#000000'; // Default

    try {
        currentBgColor = rgbToHex(computedStyle.backgroundColor);
        currentTextColor = rgbToHex(computedStyle.color);
    } catch (e) {
    }
    
    if (!isValidHex(currentBgColor) || currentBgColor === '#000000' && (computedStyle.backgroundColor === 'rgba(0, 0, 0, 0)' || computedStyle.backgroundColor === 'transparent')) {
        currentBgColor = '#ffffff'; 
    }
    if (!isValidHex(currentTextColor)) {
        currentTextColor = '#000000'; 
    }
    
    bgColorPicker.value = currentBgColor;
    textColorPicker.value = currentTextColor;
    
    colorPickerPanel.style.display = 'flex'; // Ensure display is set to flex
}

function closeColorPicker() {
    if (colorPickerPanel) {
        colorPickerPanel.style.display = 'none';
    }
    currentEditingElementForColor = null;
    document.removeEventListener('click', handleFocusOutColorPicker, true);
    if (colorPickerPanel) {
        colorPickerPanel.dataset.focusOutListenerAttached = 'false';
    }
}

function handleFocusOutColorPicker(event) {
    if (colorPickerPanel && colorPickerPanel.style.display === 'flex' && !colorPickerPanel.contains(event.target) && currentEditingElementForColor && !currentEditingElementForColor.contains(event.target)) {
        const targetIsEditable = event.target.closest('body > *');
        if (targetIsEditable && event.target !== currentEditingElementForColor) {
            document.removeEventListener('click', handleFocusOutColorPicker, true);
            if (colorPickerPanel) {
                colorPickerPanel.dataset.focusOutListenerAttached = 'false';
            }
            return; 
        }
    }
}

function applyColors() {
    if (!currentEditingElementForColor || !bgColorPicker || !textColorPicker) {
        return;
    }

    const newBgColor = bgColorPicker.value;
    const newTextColor = textColorPicker.value;

    const elementId = ensureId(currentEditingElementForColor);
    customCssRules[elementId] = {
        background: newBgColor,
        text: newTextColor
    };

    applyCustomCssToIframe(); // Update the stylesheet in the iframe

    if (typeof window.notifyUnsavedChange === 'function') {
        window.notifyUnsavedChange();
    }
    closeColorPicker(); // Added to close picker after applying colors
}

function removeCustomColors() {
    if (!currentEditingElementForColor) {
        return;
    }

    const elementId = currentEditingElementForColor.id;
    if (elementId && customCssRules[elementId]) {
        delete customCssRules[elementId];
        applyCustomCssToIframe(); // Update the stylesheet to remove the rules
    }

    if (typeof window.notifyUnsavedChange === 'function') {
        window.notifyUnsavedChange();
    }
    openColorPicker(currentEditingElementForColor);
}

window.getCustomCss = function() {
    let cssString = "/* Custom CSS rules generated by In-Page Editor */\n";
    for (const id in customCssRules) {
        if (Object.hasOwnProperty.call(customCssRules, id)) {
            const rule = customCssRules[id];
            if (currentIframeDocument && currentIframeDocument.getElementById(id)) {
                cssString += `#${id} {\n`;
                if (rule.background) {
                    cssString += `  background-color: ${rule.background} !important;\n`;
                }
                if (rule.text) {
                    cssString += `  color: ${rule.text} !important;\n`;
                }
                cssString += `}\n`;
            }
        }
    }
    return cssString;
}

function rgbToHex(rgbString) {
    if (!rgbString || typeof rgbString !== 'string') return '#ffffff';
    if (/^#[0-9A-F]{6}$/i.test(rgbString) || /^#[0-9A-F]{3}$/i.test(rgbString)) {
        return rgbString.toLowerCase();
    }

    const match = rgbString.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)$/);
    if (!match) {
        if (rgbString === 'transparent' || rgbString === 'rgba(0, 0, 0, 0)') return '#000000';
        return '#ffffff';
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
