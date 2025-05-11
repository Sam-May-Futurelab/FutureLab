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
    if (closeColorPickerBtn) {
        closeColorPickerBtn.addEventListener('click', () => {
            closeColorPicker();
        });
    }
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

    // Ensure the color picker panel itself isn't the target if it's somehow in the iframe (it shouldn't be)
    if (targetElement.closest && targetElement.closest('#color-picker-panel')) {
        return;
    }
    
    // Check if the click is on a scrollbar (common issue)
    if (event.clientX >= targetElement.clientWidth || event.clientY >= targetElement.clientHeight) {
        // return; // Commenting out for now to see if it's too aggressive
    }

    if (event.altKey) {
        if (targetElement && targetElement !== currentIframeDocument.body && targetElement !== currentIframeDocument.documentElement) {
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
        return;
    }

    if (textEditableTags.includes(targetElement.tagName) || (targetElement.tagName === 'DIV' && !targetElement.children.length && targetElement.textContent.trim().length > 0)) {
        if (!targetElement.isContentEditable) {
            applyHighlight(targetElement); // Highlight for HTML editing
            targetElement.contentEditable = 'true';
            targetElement.focus();
            targetElement.addEventListener('blur', function onBlur() {
                targetElement.contentEditable = 'false';
                removeHighlight(targetElement); // Remove highlight on blur
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
            applyHighlight(targetElement); 
            openColorPicker(targetElement);
            event.preventDefault();
            event.stopPropagation();
            return;
        }
    } else {
        if ((targetElement.id || targetElement.classList.length > 0) && targetElement !== currentIframeDocument.body && targetElement !== currentIframeDocument.documentElement) {
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
    if (!colorPickerPanel || !bgColorPicker || !textColorPicker || !colorPickerTargetInfo) {
        return;
    }
    currentEditingElementForColor = element;
    ensureId(currentEditingElementForColor); 
    
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
        const spanElement = colorPickerTargetInfo.querySelector('span');
        if (spanElement) {
            spanElement.textContent = targetName;
        }
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
