// In-page editor logic
console.log("In-page editor script loaded.");

let isEditModeActive = false;
let currentIframeDocument = null;
let currentEditingElementForColor = null;
let colorPickerTargetInfo = null; // Reference to the color picker target info div
const customCssRules = {}; // Stores element.id -> { background: '...', text: '...' }
let currentlyHighlightedElement = null; // Added to track highlighted element
const HIGHLIGHT_STYLE = '2px dashed #007bff'; // Style for the highlight
let customStyleTagId = 'in-page-editor-custom-styles'; // Added

// Color Picker Panel elements
let colorPickerPanel, bgColorPicker, textColorPicker, applyColorsBtn, removeColorsBtn, closeColorPickerBtn;

// Initialize references to color picker panel elements from the main document
// This function should be called once the main DOM is loaded, perhaps by lab.js or questionnaire.js
// For now, assuming it's called and populates the variables above.
function initInPageEditorControls(panel, bgPicker, txtPicker, applyBtn, removeBtn, closeBtn, targetInfoDiv) {
    console.log("[DEBUG] initInPageEditorControls: Received panel:", panel ? panel.id : 'null'); // DEBUG
    colorPickerPanel = panel;
    bgColorPicker = bgPicker;
    textColorPicker = txtPicker;
    applyColorsBtn = applyBtn;
    removeColorsBtn = removeBtn;
    closeColorPickerBtn = closeBtn;
    colorPickerTargetInfo = targetInfoDiv;

    if (!panel) console.error("[DEBUG] initInPageEditorControls: colorPickerPanel is NULL!"); // DEBUG
    if (!bgPicker) console.error("[DEBUG] initInPageEditorControls: bgColorPicker is NULL!"); // DEBUG
    if (!txtPicker) console.error("[DEBUG] initInPageEditorControls: textColorPicker is NULL!"); // DEBUG
    if (!targetInfoDiv) console.error("[DEBUG] initInPageEditorControls: colorPickerTargetInfo is NULL!"); // DEBUG

    if (applyColorsBtn) applyColorsBtn.addEventListener('click', applyColors);
    if (removeColorsBtn) removeColorsBtn.addEventListener('click', removeCustomColors);
    if (closeColorPickerBtn) closeColorPickerBtn.addEventListener('click', closeColorPicker);
    console.log("InPageEditor: Controls initialized.");
}
// Make it globally available if lab.js needs to call it with elements from lab.html
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
        console.warn("InPageEditor: Cannot apply custom CSS, iframe document or head is missing.");
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
        console.log("InPageEditor: Click ignored, edit mode off or no iframe doc.");
        return;
    }

    const targetElement = event.target;
    console.log("[DEBUG] handleIframeElementClick: Top of function. Edit mode ON. Clicked in iframe on:", targetElement); // DEBUG

    // Ensure the color picker panel itself isn't the target if it's somehow in the iframe (it shouldn't be)
    if (targetElement.closest && targetElement.closest('#color-picker-panel')) {
        console.log("[DEBUG] handleIframeElementClick: Click was on color picker panel itself. Ignoring."); // DEBUG
        return;
    }
    
    // Check if the click is on a scrollbar (common issue)
    if (event.clientX >= targetElement.clientWidth || event.clientY >= targetElement.clientHeight) {
        console.log("[DEBUG] handleIframeElementClick: Click likely on scrollbar, not element content. Ignoring."); //DEBUG
        // return; // Commenting out for now to see if it's too aggressive
    }

    if (event.altKey) {
        if (targetElement && targetElement !== currentIframeDocument.body && targetElement !== currentIframeDocument.documentElement) {
            console.log("[DEBUG] handleIframeElementClick: Alt+Click detected, attempting to open color picker for:", targetElement); // DEBUG
            applyHighlight(targetElement); 
            openColorPicker(targetElement);
            event.preventDefault();
            event.stopPropagation();
            return;
        }
    }

    const textEditableTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'LI', 'TD', 'TH', 'FIGCAPTION', 'BUTTON', 'LABEL'];
    const structuralOrStylableTags = ['DIV', 'SECTION', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER', 'MAIN', 'NAV', 'FORM', 'UL', 'OL', 'TABLE', 'THEAD', 'TBODY', 'TR'];

    if (targetElement.closest('button, input, textarea, select')) {
        console.log("InPageEditor: Click on form element, default behavior unless Alt-clicked.");
        return;
    }
    
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
        return;
    }

    if (textEditableTags.includes(targetElement.tagName) || (targetElement.tagName === 'DIV' && !targetElement.children.length && targetElement.textContent.trim().length > 0)) {
        if (!targetElement.isContentEditable) {
            console.log("InPageEditor: Making element contentEditable:", targetElement);
            applyHighlight(targetElement); // Highlight for HTML editing
            targetElement.contentEditable = 'true';
            targetElement.focus();
            targetElement.addEventListener('blur', function onBlur() {
                targetElement.contentEditable = 'false';
                removeHighlight(targetElement); // Remove highlight on blur
                console.log("InPageEditor: Element lost focus, contentEditable set to false.", targetElement);
                if (typeof window.notifyUnsavedChange === 'function') {
                    window.notifyUnsavedChange();
                }
                targetElement.removeEventListener('blur', onBlur);
            }, { once: false });
            event.preventDefault(); 
            event.stopPropagation();
            return;
        }
    } else if (structuralOrStylableTags.includes(targetElement.tagName) || targetElement.classList.length > 0 || (targetElement.id && targetElement.id !== 'page-preview')) {
        if (targetElement !== currentIframeDocument.body && targetElement !== currentIframeDocument.documentElement) {
            console.log("[DEBUG] handleIframeElementClick: Structural/stylable element, attempting to open color picker for:", targetElement); // DEBUG
            applyHighlight(targetElement); 
            openColorPicker(targetElement);
            event.preventDefault();
            event.stopPropagation();
            return;
        }
    } else {
        console.log("InPageEditor: Click on unhandled element type for direct editing:", targetElement.tagName, targetElement);
        if ((targetElement.id || targetElement.classList.length > 0) && targetElement !== currentIframeDocument.body && targetElement !== currentIframeDocument.documentElement) {
            console.log("[DEBUG] handleIframeElementClick: Fallback - Opening color picker due to ID/class for:", targetElement); // DEBUG
            applyHighlight(targetElement); 
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

    console.log(`[DEBUG] setInPageEditMode: Active: ${isActive}, iframeDoc: ${iframeDoc ? 'provided' : 'null'}`); // DEBUG

    if (previousDoc && previouslyActive && previousDoc !== currentIframeDocument) {
        console.log("[DEBUG] setInPageEditMode: Detaching listeners from previous document."); // DEBUG
        detachEditListeners(previousDoc);
    }

    if (currentIframeDocument && isEditModeActive) {
        if (!previouslyActive || previousDoc !== currentIframeDocument) {
            console.log("[DEBUG] setInPageEditMode: Attaching listeners to new/current document."); // DEBUG
            attachEditListeners(currentIframeDocument);
        }
        applyCustomCssToIframe(); 
    } else if (isEditModeActive && !currentIframeDocument) {
        console.warn("[DEBUG] setInPageEditMode: Edit mode ON, but no iframe document. Waiting for iframe load."); // DEBUG
    }

    if (!isActive) {
        console.log("[DEBUG] setInPageEditMode: Edit mode turned OFF. Cleaning up highlights and color picker."); // DEBUG
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
    console.log("[DEBUG] openColorPicker: Function called for element:", element); // DEBUG
    if (!colorPickerPanel || !bgColorPicker || !textColorPicker) {
        console.error("[DEBUG] openColorPicker: CRITICAL - Color picker elements (panel, bgPicker, or textColorPicker) are NOT INITIALIZED. Aborting."); // DEBUG
        if (!colorPickerPanel) console.error("   ↳ colorPickerPanel is missing");
        if (!bgColorPicker) console.error("   ↳ bgColorPicker is missing");
        if (!textColorPicker) console.error("   ↳ textColorPicker is missing");
        return;
    }
    currentEditingElementForColor = element;
    ensureId(currentEditingElementForColor); 
    console.log("[DEBUG] openColorPicker: currentEditingElementForColor:", currentEditingElementForColor); // DEBUG
    console.log("[DEBUG] openColorPicker: colorPickerTargetInfo:", colorPickerTargetInfo); // DEBUG

    if (colorPickerTargetInfo) {
        let targetName = currentEditingElementForColor.tagName.toLowerCase();
        if (currentEditingElementForColor.id && !currentEditingElementForColor.id.startsWith('custom-')) {
            targetName += `#${currentEditingElementForColor.id}`;
        } else if (currentEditingElementForColor.classList.length > 0) {
            targetName += `.${Array.from(currentEditingElementForColor.classList).join('.')}`;
        } else {
            const text = currentEditingElementForColor.textContent.trim().split(/\s+/).slice(0, 3).join(" ");
            if (text) targetName += ` ("${text}...")`;
        }
        console.log("[DEBUG] openColorPicker: targetName to be displayed:", targetName); // DEBUG
        const spanElement = colorPickerTargetInfo.querySelector('span');
        if (spanElement) {
            spanElement.textContent = targetName;
        } else {
            console.error("[DEBUG] openColorPicker: Could not find span inside colorPickerTargetInfo:", colorPickerTargetInfo); // DEBUG
        }
    } else {
        console.error("[DEBUG] openColorPicker: colorPickerTargetInfo is null or undefined."); // DEBUG
    }

    const iframeWindow = element.ownerDocument.defaultView;
    const computedStyle = iframeWindow.getComputedStyle(element);

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
    colorPickerPanel.style.display = 'block';
    console.log("[DEBUG] openColorPicker: Color picker panel display set to 'block'. Element:", element.id); // DEBUG
}

function closeColorPicker() {
    if (colorPickerPanel) {
        colorPickerPanel.style.display = 'none';
        console.log("[DEBUG] closeColorPicker: Panel display set to 'none'."); // DEBUG
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

    const elementId = ensureId(currentEditingElementForColor);
    customCssRules[elementId] = {
        background: newBgColor,
        text: newTextColor
    };

    applyCustomCssToIframe(); // Update the stylesheet in the iframe

    if (typeof window.notifyUnsavedChange === 'function') {
        window.notifyUnsavedChange();
    }
    console.log("InPageEditor: Stored custom colors for", elementId, ". Rules:", customCssRules[elementId]);
    closeColorPicker(); // Added to close picker after applying colors
}

function removeCustomColors() {
    if (!currentEditingElementForColor) {
        console.warn("InPageEditor: No element selected to remove custom colors from.");
        return;
    }

    const elementId = currentEditingElementForColor.id;
    if (elementId && customCssRules[elementId]) {
        delete customCssRules[elementId];
        applyCustomCssToIframe(); // Update the stylesheet to remove the rules
        console.log("InPageEditor: Removed custom colors for", elementId);
    } else {
        console.warn("InPageEditor: No custom rules found to remove for", elementId);
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
            } else {
                console.warn(`InPageEditor: Element with ID #${id} not found in current iframe document. Skipping CSS rule.`)
            }
        }
    }
    console.log("InPageEditor: Generated custom CSS string.");
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
