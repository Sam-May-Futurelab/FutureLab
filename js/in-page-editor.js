// In-page editor logic

let isEditModeActive = false;
let currentIframeDocument = null;
let currentIframeWindow = null; // Added to store iframe window reference if needed, though defaultView is often used
let currentEditingElement = null; // Renamed from currentEditingElementForColor for broader use
let colorPickerTargetInfo = null; 
const customCssRules = {}; 
let currentlyHighlightedElement = null; 
const HIGHLIGHT_STYLE = '2px dashed #007bff'; 
let customStyleTagId = 'in-page-editor-custom-styles';

// --- START: Mouse hover highlighting functions ---
function handleMouseOverElement(event) {
    if (!isEditModeActive || !event.target || event.target === currentlyHighlightedElement) return;
    applyHighlight(event.target);
}

function handleMouseOutElement(event) {
    if (!isEditModeActive || !event.target || event.target === currentlyHighlightedElement) return;
    // Only remove highlight if it's not the currently selected (clicked) element
    if (event.target !== currentEditingElement) {
        removeHighlight(event.target);
    }
}

function applyHighlight(element) {
    if (element && element.style) {
        element.style.outline = HIGHLIGHT_STYLE;
        element.style.cursor = 'pointer'; // Indicate interactivity
    }
}

function removeHighlight(element) {
    if (element && element.style) {
        element.style.outline = '';
        element.style.cursor = '';
    }
}
// --- END: Mouse hover highlighting functions ---

// --- START: Panel State Management ---
let activePanel = null; // 'color' or 'image'
// --- END: Panel State Management ---

// Color Picker Panel elements
let colorPickerPanel, bgColorPicker, applyColorsBtn, resetColorsBtn, closeColorPickerBtn;
let useBgGradientCheckbox, bgColorPicker2Group, bgColorPicker2; 
let recentBgColors1 = [];
let recentBgColors2 = [];
const MAX_RECENT_COLORS = 5;

// --- START: Functions for managing recent colors ---
function addRecentColor(color, listKey) {
    let colorsArray = listKey === 'recentBgColors1' ? recentBgColors1 : recentBgColors2;
    if (!color || !isValidHex(color)) return; // Do not add invalid or empty colors

    // Remove the color if it already exists to move it to the front
    const existingIndex = colorsArray.indexOf(color);
    if (existingIndex > -1) {
        colorsArray.splice(existingIndex, 1);
    }
    // Add to the beginning
    colorsArray.unshift(color);
    // Limit to MAX_RECENT_COLORS
    if (colorsArray.length > MAX_RECENT_COLORS) {
        colorsArray.length = MAX_RECENT_COLORS;
    }
    saveRecentColors(); // Save after modification
}

function updateRecentColorsDatalist(datalistId, colorsArray) {
    const datalist = colorPickerPanel ? colorPickerPanel.querySelector(`#${datalistId}`) : null;
    if (datalist) {
        datalist.innerHTML = ''; // Clear existing options
        colorsArray.forEach(color => {
            const option = document.createElement('option');
            option.value = color;
            datalist.appendChild(option);
        });
    }
}

function saveRecentColors() {
    try {
        localStorage.setItem('recentBgColors1', JSON.stringify(recentBgColors1));
        localStorage.setItem('recentBgColors2', JSON.stringify(recentBgColors2));
    } catch (e) {
        console.warn("Could not save recent colors to localStorage:", e);
    }
}

function loadRecentColors() {
    try {
        const storedColors1 = localStorage.getItem('recentBgColors1');
        const storedColors2 = localStorage.getItem('recentBgColors2');
        if (storedColors1) {
            recentBgColors1 = JSON.parse(storedColors1).filter(isValidHex);
        } else {
            recentBgColors1 = [];
        }
        if (storedColors2) {
            recentBgColors2 = JSON.parse(storedColors2).filter(isValidHex);
        } else {
            recentBgColors2 = [];
        }
    } catch (e) {
        console.warn("Could not load recent colors from localStorage:", e);
        recentBgColors1 = [];
        recentBgColors2 = [];
    }
}
// --- END: Functions for managing recent colors ---

// --- START: Image Editor Panel elements ---
let imageEditorPanel, imageFileInput, imageUrlInput, applyImageBtn, removeImageBtn, closeImageEditorBtn;
let imageEditorTargetElementNameSpan; // To show which element is being edited for image
let switchToImageEditorBtn, switchToColorEditorBtn; // Buttons to switch between panels
// --- END: Image Editor Panel elements ---


// Initialize references to panel elements from the main document
function initInPageEditorControls(
    colorPanelElement, 
    colorTargetInfoElement,
    imagePanelElement // New parameter for the image editor panel
) {
    colorPickerPanel = colorPanelElement;
    colorPickerTargetInfo = colorTargetInfoElement;
    imageEditorPanel = imagePanelElement; // Initialize image panel

    if (!colorPickerPanel) console.error("Color picker panel not found in initInPageEditorControls");
    if (!colorPickerTargetInfo) console.error("Color picker target info div not found in initInPageEditorControls");
    if (!imageEditorPanel) console.error("Image editor panel not found in initInPageEditorControls");

    // Query for Color Picker child elements
    bgColorPicker = colorPickerPanel.querySelector('#bgColorPicker');
    applyColorsBtn = colorPickerPanel.querySelector('#applyColorsBtn');
    resetColorsBtn = colorPickerPanel.querySelector('#resetColorsBtn');
    closeColorPickerBtn = colorPickerPanel.querySelector('#closeColorPickerBtn');
    useBgGradientCheckbox = colorPickerPanel.querySelector('#useBgGradient');
    bgColorPicker2Group = colorPickerPanel.querySelector('#bgColorPicker2-group');
    bgColorPicker2 = colorPickerPanel.querySelector('#bgColorPicker2');
    switchToImageEditorBtn = colorPickerPanel.querySelector('#switch-to-image-editor');

    // Query for Image Editor child elements
    if (imageEditorPanel) {
        imageFileInput = imageEditorPanel.querySelector('#image-file-input');
        imageUrlInput = imageEditorPanel.querySelector('#image-url-input');
        applyImageBtn = imageEditorPanel.querySelector('#apply-image-btn');
        removeImageBtn = imageEditorPanel.querySelector('#remove-image-btn');
        closeImageEditorBtn = imageEditorPanel.querySelector('#close-image-editor-btn');
        imageEditorTargetElementNameSpan = imageEditorPanel.querySelector('#imageEditorTargetElementName');
        switchToColorEditorBtn = imageEditorPanel.querySelector('#switch-to-color-editor');

        if (!imageFileInput) console.error("Image file input not found");
        if (!imageUrlInput) console.error("Image URL input not found");
        if (!applyImageBtn) console.error("Apply image button not found");
        if (!removeImageBtn) console.error("Remove image button not found");
        if (!closeImageEditorBtn) console.error("Close image editor button not found");
        if (!imageEditorTargetElementNameSpan) console.error("Image editor target element name span not found");
        if (!switchToColorEditorBtn) console.error("Switch to color editor button not found");
    }
    
    // Event listeners for Color Picker
    if (applyColorsBtn) applyColorsBtn.addEventListener('click', applyColors);
    if (resetColorsBtn) resetColorsBtn.addEventListener('click', removeCustomColors);
    if (closeColorPickerBtn) closeColorPickerBtn.addEventListener('click', closeColorPicker);
    if (useBgGradientCheckbox && bgColorPicker2Group) {
        useBgGradientCheckbox.addEventListener('change', () => {
            bgColorPicker2Group.style.display = useBgGradientCheckbox.checked ? 'block' : 'none';
        });
    }

    // Event listeners for Image Editor
    if (applyImageBtn) applyImageBtn.addEventListener('click', applyImage);
    if (removeImageBtn) removeImageBtn.addEventListener('click', removeImage);
    if (closeImageEditorBtn) closeImageEditorBtn.addEventListener('click', closeImageEditor);
    
    // Event listeners for switching panels
    if (switchToImageEditorBtn) {
        switchToImageEditorBtn.addEventListener('click', () => {
            if (currentEditingElement) {
                openImageEditor(currentEditingElement);
            }
        });
    }
    if (switchToColorEditorBtn) {
        switchToColorEditorBtn.addEventListener('click', () => {
            if (currentEditingElement) {
                openColorPicker(currentEditingElement);
            }
        });
    }

    // Load recent colors from localStorage & update datalists
    loadRecentColors();
    updateRecentColorsDatalist('recentBgColorsList', recentBgColors1);
    updateRecentColorsDatalist('recentBgColorsList2', recentBgColors2);

    // Add event listeners to update recent colors when a color is chosen
    if (bgColorPicker) {
        bgColorPicker.addEventListener('change', () => addRecentColor(bgColorPicker.value, 'recentBgColors1'));
    }
    if (bgColorPicker2) {
        bgColorPicker2.addEventListener('change', () => addRecentColor(bgColorPicker2.value, 'recentBgColors2'));
    }

    // Ensure panels are not active initially (they are off-screen by default CSS)
    if(colorPickerPanel) colorPickerPanel.classList.remove('active');
    if(imageEditorPanel) imageEditorPanel.classList.remove('active');
}
window.initInPageEditorControls = initInPageEditorControls;

// Event handler for clicks inside the iframe
function handleIframeElementClick(event) {
    event.preventDefault();
    event.stopPropagation();

    let el = event.target;
    if (!el) return;

    currentEditingElement = el; // Keep track of the raw clicked element

    if (currentlyHighlightedElement && currentlyHighlightedElement !== el) {
        removeHighlight(currentlyHighlightedElement);
    }
    applyHighlight(el);
    currentlyHighlightedElement = el;

    // Determine which editor to open based on element type or existing styles
    if (el.tagName === 'IMG') {
        openImageEditor(el);
    } else {
        // For other elements, default to color picker, but allow switching
        openColorPicker(el); 
    }
}

function openColorPicker(element) {
    if (!colorPickerPanel || !element) return;
    currentEditingElement = element; // Ensure this is set

    // Ensure ID and update target info
    ensureId(element);
    const targetName = element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '');
    if (colorPickerTargetInfo) {
        const targetElementNameSpan = colorPickerTargetInfo.querySelector('#colorPickerTargetElementName');
        if (targetElementNameSpan) targetElementNameSpan.textContent = targetName;
        else console.warn("colorPickerTargetElementName span not found in colorPickerTargetInfo");
    } else {
        console.warn("colorPickerTargetInfo div not found");
    }
    
    // Pre-fill color pickers
    const computedStyle = currentIframeDocument.defaultView.getComputedStyle(element);
    let bgColor = computedStyle.backgroundColor;

    if (customCssRules[element.id] && customCssRules[element.id].background) {
        const customBg = customCssRules[element.id].background;
        if (customBg.startsWith('linear-gradient')) {
            const colors = parseGradientColors(customBg);
            bgColorPicker.value = colors[0] ? rgbToHex(colors[0]) : '#ffffff'; // Default if parse fails
            if (colors[1]) {
                bgColorPicker2.value = rgbToHex(colors[1]);
                useBgGradientCheckbox.checked = true;
                bgColorPicker2Group.style.display = 'block';
            } else {
                useBgGradientCheckbox.checked = false;
                bgColorPicker2Group.style.display = 'none';
            }
        } else { // Solid color
            bgColorPicker.value = rgbToHex(customBg); // Assumes custom rule is a valid color
            useBgGradientCheckbox.checked = false;
            bgColorPicker2Group.style.display = 'none';
        }
    } else { // No custom rule, use computed style
        bgColorPicker.value = rgbToHex(bgColor);
        useBgGradientCheckbox.checked = false;
        bgColorPicker2Group.style.display = 'none';
    }

    if(imageEditorPanel) imageEditorPanel.classList.remove('active');
    if(colorPickerPanel) colorPickerPanel.classList.add('active');
    activePanel = 'color';
    colorPickerPanel.focus(); 
}

function closeColorPicker() {
    if (colorPickerPanel) colorPickerPanel.classList.remove('active');
    if (currentlyHighlightedElement) {
        removeHighlight(currentlyHighlightedElement);
        currentlyHighlightedElement = null;
    }
    currentEditingElement = null;
    activePanel = null;
}

// --- START: Image Editor Functions ---
function openImageEditor(element) {
    if (!imageEditorPanel || !element) return;
    currentEditingElement = element;

    ensureId(element);
    const targetName = element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '');
    if (imageEditorTargetElementNameSpan) {
        imageEditorTargetElementNameSpan.textContent = targetName;
    } else {
        console.warn("imageEditorTargetElementNameSpan not found");
    }

    // Pre-fill URL input if current element is an image or has a background image
    if (element.tagName === 'IMG') {
        imageUrlInput.value = element.src || '';
    } else {
        const computedStyle = currentIframeDocument.defaultView.getComputedStyle(element);
        const bgImage = computedStyle.backgroundImage;
        if (bgImage && bgImage !== 'none' && bgImage.startsWith('url("')) {
            imageUrlInput.value = bgImage.slice(5, -2); // Extract URL from url("...")
        } else {
            imageUrlInput.value = '';
        }
    }
    imageFileInput.value = ''; // Clear file input

    if(colorPickerPanel) colorPickerPanel.classList.remove('active');
    if(imageEditorPanel) imageEditorPanel.classList.add('active');
    activePanel = 'image';
    imageEditorPanel.focus();
}

function closeImageEditor() {
    if (imageEditorPanel) imageEditorPanel.classList.remove('active');
    if (currentlyHighlightedElement) {
        removeHighlight(currentlyHighlightedElement);
        currentlyHighlightedElement = null;
    }
    currentEditingElement = null;
    activePanel = null;
}

function applyImage() {
    if (!currentEditingElement || !currentIframeDocument) return;
    ensureId(currentEditingElement);

    const file = imageFileInput.files[0];
    const url = imageUrlInput.value.trim();

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            setImageSource(currentEditingElement, e.target.result);
        };
        reader.readAsDataURL(file);
    } else if (url) {
        setImageSource(currentEditingElement, url);
    } else {
        return; 
    }
    if (window.notifyUnsavedChange) window.notifyUnsavedChange();
}

function setImageSource(element, src) {
    if (element.tagName === 'IMG') {
        element.setAttribute('src', src);
    } else {
        if (!customCssRules[element.id]) {
            customCssRules[element.id] = {};
        }
        customCssRules[element.id].background = src ? `url("${src}")` : 'none';
        customCssRules[element.id]['background-size'] = 'cover'; 
        customCssRules[element.id]['background-position'] = 'center'; 
        customCssRules[element.id]['background-repeat'] = 'no-repeat'; 
        applyCustomCssToIframe();
    }
}

function removeImage() {
    if (!currentEditingElement) return;
    ensureId(currentEditingElement);

    if (currentEditingElement.tagName === 'IMG') {
        currentEditingElement.removeAttribute('src');
    } else {
        if (customCssRules[currentEditingElement.id]) {
            delete customCssRules[currentEditingElement.id].background;
            delete customCssRules[currentEditingElement.id]['background-size'];
            delete customCssRules[currentEditingElement.id]['background-position'];
            delete customCssRules[currentEditingElement.id]['background-repeat'];
            if (Object.keys(customCssRules[currentEditingElement.id]).length === 0) {
                delete customCssRules[currentEditingElement.id];
            }
        }
        currentEditingElement.style.backgroundImage = ''; 
        applyCustomCssToIframe();
    }
    if (window.notifyUnsavedChange) window.notifyUnsavedChange();
    if(imageUrlInput) imageUrlInput.value = '';
    if(imageFileInput) imageFileInput.value = '';
}

// --- END: Image Editor Functions ---

function applyColors() {
    if (!currentEditingElement || !bgColorPicker) return;
    ensureId(currentEditingElement);
    const newBgColor = bgColorPicker.value;
    const useGradient = useBgGradientCheckbox.checked;
    const newBgColor2 = bgColorPicker2.value;

    if (!customCssRules[currentEditingElement.id]) {
        customCssRules[currentEditingElement.id] = {};
    }

    if (useGradient && newBgColor2) {
        customCssRules[currentEditingElement.id].background = `linear-gradient(${newBgColor}, ${newBgColor2})`;
        addRecentColor(newBgColor2, 'recentBgColors2');
        updateRecentColorsDatalist('recentBgColorsList2', recentBgColors2);
    } else {
        customCssRules[currentEditingElement.id].background = newBgColor;
    }
    
    addRecentColor(newBgColor, 'recentBgColors1');
    updateRecentColorsDatalist('recentBgColorsList', recentBgColors1);
    saveRecentColors();

    applyCustomCssToIframe();
    if (window.notifyUnsavedChange) window.notifyUnsavedChange();
}

function removeCustomColors() {
    if (!currentEditingElement) return;
    ensureId(currentEditingElement);
    if (customCssRules[currentEditingElement.id] && customCssRules[currentEditingElement.id].background) {
        delete customCssRules[currentEditingElement.id].background;
        if (Object.keys(customCssRules[currentEditingElement.id]).length === 0) {
            delete customCssRules[currentEditingElement.id];
        }
        applyCustomCssToIframe();
        if (window.notifyUnsavedChange) window.notifyUnsavedChange();
    }
    const computedStyle = currentIframeDocument.defaultView.getComputedStyle(currentEditingElement);
    bgColorPicker.value = rgbToHex(computedStyle.backgroundColor);
    useBgGradientCheckbox.checked = false;
    bgColorPicker2Group.style.display = 'none';
}

function setInPageEditMode(isActive, iframeDoc, iframeWin) {
    console.log(`setInPageEditMode: requested state: ${isActive}, current isEditModeActive: ${isEditModeActive}, currentDoc valid: ${!!currentIframeDocument}, newDoc valid: ${!!iframeDoc}`);

    // If trying to activate on the exact same document that's already active, do nothing.
    if (isActive && isEditModeActive && currentIframeDocument === iframeDoc) {
        console.log("setInPageEditMode: Already active on this document. No change.");
        return;
    }

    // If trying to deactivate but already inactive, do nothing.
    if (!isActive && !isEditModeActive) {
        console.log("setInPageEditMode: Already inactive. No change.");
        return;
    }

    // Cleanup listeners from the current/previous document if it exists and had listeners.
    if (currentIframeDocument && currentIframeDocument.body) {
        console.log("setInPageEditMode: Cleaning up listeners from previous/current document body.");
        const oldElements = currentIframeDocument.body.querySelectorAll('*');
        oldElements.forEach(el => {
            el.removeEventListener('click', handleIframeElementClick, true);
            el.removeEventListener('mouseover', handleMouseOverElement, true);
            el.removeEventListener('mouseout', handleMouseOutElement, true);
            removeHighlight(el); // Clean up any highlights
        });
    } else if (currentIframeDocument) {
        console.warn("setInPageEditMode: currentIframeDocument existed but body was null during cleanup attempt.");
    }


    isEditModeActive = isActive; // Set the new intended state
    currentIframeDocument = iframeDoc;
    currentIframeWindow = iframeWin; // Store iframe window reference

    if (!isEditModeActive) { // Deactivating
        console.log("In-Page Editor: Deactivating edit mode. Closing panels.");
        closeColorPicker();
        closeImageEditor();
        // currentEditingElement and currentlyHighlightedElement are reset by close functions.
        // currentIframeDocument is now the new doc (could be null).
        // isEditModeActive is false.
        return; // Done with deactivation
    }

    // If we've reached here, we are trying to ACTIVATE (isEditModeActive is true)

    if (!currentIframeDocument || !currentIframeDocument.body) {
        console.error("setInPageEditMode: Cannot activate. Iframe document or its body is not available.");
        isEditModeActive = false; // Revert state as activation failed
        currentIframeDocument = null; // Clear doc reference
        currentIframeWindow = null;
        // Close panels just in case they were somehow opened
        closeColorPicker();
        closeImageEditor();
        return;
    }

    console.log("In-Page Editor: Activating edit mode. Adding listeners to elements in iframe body.");
    const allElements = currentIframeDocument.body.querySelectorAll('*');
    allElements.forEach(el => {
        el.addEventListener('click', handleIframeElementClick, true);
        el.addEventListener('mouseover', handleMouseOverElement, true);
        el.addEventListener('mouseout', handleMouseOutElement, true);
    });
    applyCustomCssToIframe(); // Apply any existing custom styles to the newly active document
}
window.setInPageEditMode = setInPageEditMode;

function getCustomCss() {
    let cssString = "";
    if (!currentIframeDocument) return cssString; // Ensure doc exists

    for (const id in customCssRules) {
        const rules = customCssRules[id];
        // Check if element with this ID still exists in the current iframe document
        const elementExists = currentIframeDocument.getElementById(id);
        if (elementExists && Object.keys(rules).length > 0) {
            cssString += `#${id} {\n`;
            for (const prop in rules) {
                cssString += `  ${prop}: ${rules[prop]};\n`;
            }
            cssString += "}\n\n";
        } else if (!elementExists) {
            // Optionally, clean up rules for elements that no longer exist
            // console.warn(`Element with ID #${id} not found in iframe, consider cleaning up its CSS rules.`);
            // delete customCssRules[id]; // Be cautious with auto-deletion
        }
    }
    return cssString;
}

function applyCustomCssToIframe() {
    if (!currentIframeDocument || !currentIframeDocument.head) { // Ensure doc and head exist
        // console.warn("applyCustomCssToIframe: No iframe document or head to apply styles to.");
        return;
    }
    let styleTag = currentIframeDocument.getElementById(customStyleTagId);
    if (!styleTag) {
        styleTag = currentIframeDocument.createElement('style');
        styleTag.id = customStyleTagId;
        currentIframeDocument.head.appendChild(styleTag);
    }
    styleTag.textContent = getCustomCss();
}

function ensureId(element) {
    if (!element) return null;
    if (!element.id) {
        // Generate a simple unique ID if one doesn't exist
        element.id = 'editable-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    return element.id;
}

function isValidHex(color) {
    if (!color || typeof color !== 'string') return false;
    return /^#[0-9A-F]{6}$/i.test(color) || /^#[0-9A-F]{3}$/i.test(color);
}

function rgbToHex(rgbString) {
    if (!rgbString || typeof rgbString !== 'string') return '#ffffff'; // Default for invalid input
    if (rgbString.startsWith('#')) return rgbString; // Already hex

    const match = rgbString.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
    if (!match) {
        return '#ffffff'; 
    }

    function componentToHex(c) {
        const hex = parseInt(c).toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }
    return "#" + componentToHex(match[1]) + componentToHex(match[2]) + componentToHex(match[3]);
}

function parseGradientColors(gradientString) {
    const colorMatches = gradientString.match(/rgb\([^\)]+\)/g);
    if (colorMatches && colorMatches.length >= 1) {
        const colors = colorMatches.map(rgbStr => rgbToHex(rgbStr));
        return colors;
    }
    return [null, null]; // Default if parsing fails
}

window.isValidHex = isValidHex;
window.rgbToHex = rgbToHex;
window.parseGradientColors = parseGradientColors;
window.ensureId = ensureId;
