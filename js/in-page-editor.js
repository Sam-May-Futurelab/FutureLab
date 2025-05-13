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
let textEditingTarget = null; // For managing direct text editing

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
let imageWidthInput, imageHeightInput, imageFitSelect; // Added for image sizing
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
        imageWidthInput = imageEditorPanel.querySelector('#image-width-input'); // Added
        imageHeightInput = imageEditorPanel.querySelector('#image-height-input'); // Added
        imageFitSelect = imageEditorPanel.querySelector('#image-fit-select'); // Added
        applyImageBtn = imageEditorPanel.querySelector('#apply-image-btn');
        removeImageBtn = imageEditorPanel.querySelector('#remove-image-btn');
        closeImageEditorBtn = imageEditorPanel.querySelector('#close-image-editor-btn');
        imageEditorTargetElementNameSpan = imageEditorPanel.querySelector('#imageEditorTargetElementName');
        switchToColorEditorBtn = imageEditorPanel.querySelector('#switch-to-color-editor');

        if (!imageFileInput) console.error("Image file input not found");
        if (!imageUrlInput) console.error("Image URL input not found");
        if (!imageWidthInput) console.error("Image width input not found"); // Added
        if (!imageHeightInput) console.error("Image height input not found"); // Added
        if (!imageFitSelect) console.error("Image fit select not found"); // Added
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
    console.log("handleIframeElementClick triggered. Target:", event.target.tagName, event.target.id); // DEBUG LINE
    event.preventDefault();
    event.stopPropagation();

    let el = event.target;
    if (!el) return;

    // If a text element is already being edited, finalize it before handling new click.
    if (textEditingTarget && textEditingTarget !== el) {
        makeTextReadOnly(textEditingTarget);
    }

    currentEditingElement = el; // This is the element that was clicked.

    // Manage highlights
    if (currentlyHighlightedElement && currentlyHighlightedElement !== el) {
        removeHighlight(currentlyHighlightedElement);
    }
    applyHighlight(el); // Apply highlight to the clicked element
    currentlyHighlightedElement = el;

    // Determine which panel to open and/or if text should be editable
    if (el.tagName === 'IMG') {
        openImageEditor(el);
        // Images are not typically text-editable directly via contentEditable in this system
    } else {
        // For all non-image elements, open the color picker
        openColorPicker(el);

        // Additionally, if the element is suitable for text editing, make it so.
        const editableTextTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'BUTTON', 'LI', 'FIGCAPTION', 'LABEL', 'STRONG', 'EM', 'TD', 'TH'];
        
        if (editableTextTags.includes(el.tagName) &&
            el.tagName !== 'INPUT' && 
            el.tagName !== 'TEXTAREA' && 
            el.tagName !== 'SELECT') {
            makeTextEditable(el); // This will set contentEditable=true and focus
        }
    }
}

// --- START: Text Editing Functions ---
function makeTextEditable(element) {
    if (!element) return;
    if (textEditingTarget && textEditingTarget !== element) {
        makeTextReadOnly(textEditingTarget);
    }

    element.contentEditable = 'true';
    element.style.outline = '2px solid orange'; 
    element.focus();
    textEditingTarget = element;

    element.addEventListener('blur', handleTextEditBlur, { once: true });
    element.addEventListener('keydown', handleTextEditKeyDown);
    if (window.notifyUnsavedChange) window.notifyUnsavedChange();
}

function makeTextReadOnly(element) {
    if (!element || element.contentEditable !== 'true') return;
    element.contentEditable = 'false';
    element.style.outline = ''; 
    if (element === currentlyHighlightedElement) {
        applyHighlight(element); 
    }
    if (textEditingTarget === element) {
        textEditingTarget = null;
    }
    element.removeEventListener('blur', handleTextEditBlur);
    element.removeEventListener('keydown', handleTextEditKeyDown);
}

function handleTextEditBlur(event) {
    if (event.target === textEditingTarget) {
        makeTextReadOnly(event.target);
    }
}

function handleTextEditKeyDown(event) {
    if (!textEditingTarget || event.target !== textEditingTarget) return;
    if (event.key === 'Enter' && !event.shiftKey) { 
        event.preventDefault(); 
        makeTextReadOnly(event.target);
    } else if (event.key === 'Escape') {
        makeTextReadOnly(event.target);
    }
}
// --- END: Text Editing Functions ---

function openColorPicker(element) {
    console.log("[DEBUG] openColorPicker called for:", element ? element.tagName : 'null', "ID:", element ? element.id : 'N/A'); // DEBUG
    if (!colorPickerPanel || !element) {
        console.error("[DEBUG] openColorPicker: Panel or element missing. Panel:", colorPickerPanel, "Element:", element); // DEBUG
        return;
    }
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
    if (currentIframeDocument && currentIframeDocument.defaultView) {
        const computedStyle = currentIframeDocument.defaultView.getComputedStyle(element);
        let bgColor = computedStyle.backgroundColor;

        if (customCssRules[element.id] && customCssRules[element.id].background) {
            const customBg = customCssRules[element.id].background;
            if (customBg.startsWith('linear-gradient')) {
                const colors = parseGradientColors(customBg);
                bgColorPicker.value = colors[0] ? rgbToHex(colors[0]) : '#ffffff';
                if (colors[1]) {
                    bgColorPicker2.value = rgbToHex(colors[1]);
                    useBgGradientCheckbox.checked = true;
                    if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'block';
                } else {
                    useBgGradientCheckbox.checked = false;
                    if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'none';
                }
            } else { // Solid color
                bgColorPicker.value = rgbToHex(customBg);
                useBgGradientCheckbox.checked = false;
                if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'none';
            }
        } else { // No custom rule, use computed style
            bgColorPicker.value = rgbToHex(bgColor);
            useBgGradientCheckbox.checked = false;
            if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'none';
        }
    } else {
        console.warn("[DEBUG] openColorPicker: currentIframeDocument or defaultView not available for computedStyle.");
    }

    if(imageEditorPanel) {
        console.log("[DEBUG] openColorPicker: Removing 'active' from image panel."); // DEBUG
        imageEditorPanel.classList.remove('active');
    }
    if(colorPickerPanel) {
        console.log("[DEBUG] openColorPicker: Adding 'active' to color panel. Panel classList before:", colorPickerPanel.classList.toString()); // DEBUG
        colorPickerPanel.classList.add('active');
        console.log("[DEBUG] openColorPicker: Panel classList after:", colorPickerPanel.classList.toString()); // DEBUG
    }
    activePanel = 'color';
    // colorPickerPanel.focus(); 
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
    console.log("[DEBUG] openImageEditor called for:", element ? element.tagName : 'null', "ID:", element ? element.id : 'N/A'); // DEBUG
    if (!imageEditorPanel || !element) {
        console.error("[DEBUG] openImageEditor: Panel or element missing. Panel:", imageEditorPanel, "Element:", element); // DEBUG
        return;
    }
    currentEditingElement = element;

    ensureId(element);
    const targetName = element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '');
    if (imageEditorTargetElementNameSpan) {
        imageEditorTargetElementNameSpan.textContent = targetName;
    } else {
        console.warn("imageEditorTargetElementNameSpan not found");
    }

    // Pre-fill URL input and sizing controls
    if (element.tagName === 'IMG') {
        imageUrlInput.value = element.getAttribute('src') || ''; // Use getAttribute for src
        imageWidthInput.value = element.style.width || 'auto';
        imageHeightInput.value = element.style.height || 'auto';
        imageFitSelect.value = element.style.objectFit || 'fill'; // Default to 'fill' or another sensible default
    } else {
        // Background image
        let bgImage = '';
        let bgSize = 'cover'; // Default for backgrounds
        let bgWidth = 'auto';
        let bgHeight = 'auto';

        if (customCssRules[element.id] && customCssRules[element.id].background) {
            const ruleBackground = customCssRules[element.id].background;
            if (ruleBackground.startsWith('url("')) {
                bgImage = ruleBackground.slice(5, -2);
            }
            // Prefer custom rules for size if they exist
            const customBgSize = customCssRules[element.id]['background-size'];
            if (customBgSize) {
                bgSize = customBgSize;
            }
        } else if (currentIframeDocument && currentIframeDocument.defaultView) {
            const computedStyle = currentIframeDocument.defaultView.getComputedStyle(element);
            const computedBgImage = computedStyle.backgroundImage;
            if (computedBgImage && computedBgImage !== 'none' && computedBgImage.startsWith('url("')) {
                bgImage = computedBgImage.slice(5, -2);
            }
            bgSize = computedStyle.backgroundSize;
        }

        imageUrlInput.value = bgImage;
        
        // Attempt to parse bgSize for width, height, and fit
        if (bgSize === 'cover' || bgSize === 'contain') {
            imageFitSelect.value = bgSize;
            imageWidthInput.value = 'auto';
            imageHeightInput.value = 'auto';
        } else if (bgSize && bgSize !== 'auto' && bgSize.includes(' ')) {
            // Potentially two values e.g., "100px 50%" or "auto 100px"
            const parts = bgSize.split(' ');
            imageWidthInput.value = parts[0] || 'auto';
            imageHeightInput.value = parts[1] || 'auto';
            imageFitSelect.value = 'fill'; // Default if specific dimensions are set
        } else if (bgSize && bgSize !== 'auto'){
            // Single value like "100%" or "100px" - could be width, height or both depending on context
            // For simplicity, apply to width and set height to auto, or let user adjust
            imageWidthInput.value = bgSize;
            imageHeightInput.value = 'auto';
            imageFitSelect.value = 'fill'; 
        } else { // Default / auto
            imageWidthInput.value = 'auto';
            imageHeightInput.value = 'auto';
            imageFitSelect.value = 'cover'; // Default for background images
        }
    }
    if (imageFileInput) imageFileInput.value = ''; // Clear file input

    if(colorPickerPanel) {
        console.log("[DEBUG] openImageEditor: Removing 'active' from color panel."); // DEBUG
        colorPickerPanel.classList.remove('active');
    }
    if(imageEditorPanel) {
        console.log("[DEBUG] openImageEditor: Adding 'active' to image panel. Panel classList before:", imageEditorPanel.classList.toString()); // DEBUG
        imageEditorPanel.classList.add('active');
        console.log("[DEBUG] openImageEditor: Panel classList after:", imageEditorPanel.classList.toString()); // DEBUG
    }
    activePanel = 'image';
    // imageEditorPanel.focus();
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
    const width = imageWidthInput.value.trim();
    const height = imageHeightInput.value.trim();
    const fit = imageFitSelect.value;

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            setImageSource(currentEditingElement, e.target.result, width, height, fit);
        };
        reader.readAsDataURL(file);
    } else if (url) {
        setImageSource(currentEditingElement, url, width, height, fit);
    } else {
        // If no new image source, but sizing might have changed, apply sizing to existing image/background
        setImageSource(currentEditingElement, null, width, height, fit); 
    }
    if (window.notifyUnsavedChange) window.notifyUnsavedChange();
}

function setImageSource(element, src, width, height, fit) {
    const isImgTag = element.tagName === 'IMG';

    if (src) { // If a new source (file or URL) is provided
        if (isImgTag) {
            element.setAttribute('src', src);
        } else {
            if (!customCssRules[element.id]) {
                customCssRules[element.id] = {};
            }
            customCssRules[element.id].background = `url("${src}")`;
            // Default repeat and position, fit will be handled below
            customCssRules[element.id]['background-repeat'] = 'no-repeat';
            customCssRules[element.id]['background-position'] = 'center'; 
        }
    }

    // Apply sizing and fit
    if (isImgTag) {
        element.style.width = width || 'auto';
        element.style.height = height || 'auto';
        element.style.objectFit = fit || 'fill';
    } else {
        // For background images
        if (!customCssRules[element.id]) {
            customCssRules[element.id] = {};
        }
        if (fit === 'cover' || fit === 'contain') {
            customCssRules[element.id]['background-size'] = fit;
        } else if (width && height && width !== 'auto' && height !== 'auto') {
            customCssRules[element.id]['background-size'] = `${width} ${height}`;
        } else if (width && width !== 'auto') {
            customCssRules[element.id]['background-size'] = `${width} auto`;
        } else if (height && height !== 'auto') {
            customCssRules[element.id]['background-size'] = `auto ${height}`;
        } else {
            // If fit is something else (like 'fill', 'none', 'scale-down') and no dimensions,
            // or dimensions are auto, it's harder to map directly to background-size without context.
            // 'cover' is a safe default if no specific dimensions are given for backgrounds.
            customCssRules[element.id]['background-size'] = 'cover'; 
        }
        // object-fit doesn't apply to background images, background-size is used instead.
        // background-position could be adjusted further if needed, e.g. based on 'fit' for 'none' or 'scale-down'.
    }

    if (!isImgTag) {
        applyCustomCssToIframe();
    }
}

function removeImage() {
    if (!currentEditingElement) return;
    ensureId(currentEditingElement);

    if (currentEditingElement.tagName === 'IMG') {
        currentEditingElement.removeAttribute('src');
        currentEditingElement.style.width = '';
        currentEditingElement.style.height = '';
        currentEditingElement.style.objectFit = '';
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
        // Clear inline styles too, if any were applied directly (though we prefer customCssRules for backgrounds)
        currentEditingElement.style.backgroundImage = ''; 
        currentEditingElement.style.backgroundSize = '';
        currentEditingElement.style.backgroundPosition = '';
        currentEditingElement.style.backgroundRepeat = '';
        applyCustomCssToIframe();
    }
    if (window.notifyUnsavedChange) window.notifyUnsavedChange();
    if(imageUrlInput) imageUrlInput.value = '';
    if(imageFileInput) imageFileInput.value = '';
    if(imageWidthInput) imageWidthInput.value = 'auto';
    if(imageHeightInput) imageHeightInput.value = 'auto';
    if(imageFitSelect) imageFitSelect.value = 'fill'; // Reset to a default
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

    if (!isActive && textEditingTarget) {
        makeTextReadOnly(textEditingTarget);
    }

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
