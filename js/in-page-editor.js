// In-page editor logic

let isEditModeActive = false;
let currentIframeDocument = null;
let currentEditingElement = null; // Renamed from currentEditingElementForColor for broader use
let colorPickerTargetInfo = null; 
const customCssRules = {}; 
let currentlyHighlightedElement = null; 
const HIGHLIGHT_STYLE = '2px dashed #007bff'; 
let customStyleTagId = 'in-page-editor-custom-styles';

// --- START: Panel State Management ---
let activePanel = null; // 'color' or 'image'
// --- END: Panel State Management ---

// Color Picker Panel elements
let colorPickerPanel, bgColorPicker, applyColorsBtn, resetColorsBtn, closeColorPickerBtn;
let useBgGradientCheckbox, bgColorPicker2Group, bgColorPicker2; 
let recentBgColors1 = [];
let recentBgColors2 = [];
const MAX_RECENT_COLORS = 5;

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

    loadRecentColors();
    updateRecentColorsDatalist('recentBgColorsList', recentBgColors1);
    updateRecentColorsDatalist('recentBgColorsList2', recentBgColors2);

    // Hide both panels initially
    if(colorPickerPanel) colorPickerPanel.classList.add('hidden');
    if(imageEditorPanel) imageEditorPanel.classList.add('hidden');
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

    if(imageEditorPanel) imageEditorPanel.classList.add('hidden');
    if(colorPickerPanel) colorPickerPanel.classList.remove('hidden');
    activePanel = 'color';
    colorPickerPanel.focus(); 
}

function closeColorPicker() {
    if (colorPickerPanel) colorPickerPanel.classList.add('hidden');
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

    if(colorPickerPanel) colorPickerPanel.classList.add('hidden');
    if(imageEditorPanel) imageEditorPanel.classList.remove('hidden');
    activePanel = 'image';
    imageEditorPanel.focus();
}

function closeImageEditor() {
    if (imageEditorPanel) imageEditorPanel.classList.add('hidden');
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
