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
let originalTextContent = ''; // Added for text editing undo
let pagePreviewIframeElement; // NEW: To store the iframe DOM element itself

// NEW: State management for image previews
let imagePreviewState = {
    elementId: null,
    initialState: null,
    isPreviewing: false
};

// --- START: Undo/Redo History Management ---
const undoStack = [];
const redoStack = [];
const MAX_HISTORY_SIZE = 50; // Limit the size of the history

/**
 * Adds an action to the undo stack.
 * An action should be an object with `undo` and `redo` methods.
 * @param {object} action - The action to add.
 */
function recordAction(action) {
    if (undoStack.length >= MAX_HISTORY_SIZE) {
        undoStack.shift(); // Remove the oldest action if max size is reached
    }
    undoStack.push(action);
    redoStack.length = 0; // Clear redo stack whenever a new action is performed
    if (window.updateUndoRedoButtons) window.updateUndoRedoButtons();
    if (window.notifyUnsavedChange) window.notifyUnsavedChange(); // Also notify unsaved change
}

function undo() {
    if (undoStack.length > 0) {
        const action = undoStack.pop();
        action.undo();
        redoStack.push(action);
        if (window.updateUndoRedoButtons) window.updateUndoRedoButtons();
        if (window.notifyUnsavedChange) window.notifyUnsavedChange();
    }
}

function redo() {
    if (redoStack.length > 0) {
        const action = redoStack.pop();
        action.redo();
        undoStack.push(action);
        if (window.updateUndoRedoButtons) window.updateUndoRedoButtons();
        if (window.notifyUnsavedChange) window.notifyUnsavedChange();
    }
}

function canUndo() {
    return undoStack.length > 0;
}

function canRedo() {
    return redoStack.length > 0;
}

function clearUndoRedoHistory() {
    undoStack.length = 0;
    redoStack.length = 0;
    if (window.updateUndoRedoButtons) window.updateUndoRedoButtons();
}

// Expose to global scope for lab.js to call
window.undoInPageEdit = undo;
window.redoInPageEdit = redo;
window.canUndoInPageEdit = canUndo;
window.canRedoInPageEdit = canRedo;
window.clearInPageEditorHistory = clearUndoRedoHistory;
// --- END: Undo/Redo History Management ---

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

// --- START: Text Editing Functions ---
function makeTextEditable(element) {
    if (!element || textEditingTarget === element) return;

    if (textEditingTarget) {
        makeTextReadOnly(textEditingTarget); // Make previously edited element read-only
    }

    textEditingTarget = element;
    originalTextContent = element.textContent; // Store original content
    element.contentEditable = 'true';
    element.focus();
    // Optional: Add some visual cue that it's editable, e.g., different outline
    element.style.outline = '1px solid #00ff00'; 

    element.addEventListener('blur', handleTextEditBlur, { once: true });
    element.addEventListener('keydown', handleTextEditKeyDown);
}

function makeTextReadOnly(element, saveChanges = true) {
    if (!element || !textEditingTarget || textEditingTarget !== element) return;

    element.contentEditable = 'false';
    element.style.outline = ''; // Remove editing visual cue
    element.removeEventListener('blur', handleTextEditBlur);
    element.removeEventListener('keydown', handleTextEditKeyDown);

    const newTextContent = element.textContent;

    if (saveChanges && newTextContent !== originalTextContent) {
        ensureId(element);
        const actionElementId = element.id;
        const oldText = originalTextContent; // Capture for closure
        const newText = newTextContent;   // Capture for closure

        recordAction({
            type: 'text',
            elementId: actionElementId,
            undo: function() {
                const doc = getActiveIframeDocument();
                if (!doc) { console.error("Undo Text: iframe doc not found."); return; }
                const targetElement = doc.getElementById(this.elementId);
                if (targetElement) {
                    targetElement.textContent = oldText;
                }
            },
            redo: function() {
                const doc = getActiveIframeDocument();
                if (!doc) { console.error("Redo Text: iframe doc not found."); return; }
                const targetElement = doc.getElementById(this.elementId);
                if (targetElement) {
                    targetElement.textContent = newText;
                }
            }
        });
    }
    textEditingTarget = null;
    originalTextContent = '';
}

function handleTextEditBlur(event) {
    if (event.target === textEditingTarget) {
        makeTextReadOnly(event.target, true);
    }
}

function handleTextEditKeyDown(event) {
    if (event.target === textEditingTarget) {
        if (event.key === 'Enter' && !event.shiftKey) { // Save on Enter (if not Shift+Enter for newline)
            event.preventDefault(); // Prevent newline in contentEditable
            makeTextReadOnly(event.target, true);
        } else if (event.key === 'Escape') { // Cancel on Escape
            event.preventDefault();
            event.target.textContent = originalTextContent; // Revert to original
            makeTextReadOnly(event.target, false); // Don't save changes
        }
    }
}
// --- END: Text Editing Functions ---

// Color Picker Panel elements
let colorPickerPanel, closeColorPickerBtn, bgColorPicker, useBgGradient, bgColorPicker2, bgColorPicker2Group, applyColorsBtn, resetColorsBtn, colorPickerTargetElementName, recentBgColorsList, recentBgColorsList2;
let imageEditorPanel, closeImageEditorBtn, imageFileInput, imageUrlInput, imageWidthSelect, imageHeightSelect, imageFitSelect, applyImageBtn, removeImageBtnEditor, imageEditorTargetElementName, fileNameDisplay; // Renamed imageWidthInput to imageWidthSelect, imageHeightInput to imageHeightSelect, added fileNameDisplay
let switchToImageEditorBtn, switchToColorEditorBtn;
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
// --- END: Image Editor Panel elements ---

// Utility function to read a file as a Data URL
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// NEW HELPER FUNCTION
function getActiveIframeDocument() {
    if (!pagePreviewIframeElement) {
        console.error("pagePreviewIframeElement is not initialized.");
        return null;
    }
    if (!pagePreviewIframeElement.contentWindow) {
        // This can happen if the iframe is not in the DOM or not loaded
        console.warn("pagePreviewIframeElement.contentWindow is not available. Iframe might not be ready.");
        return null;
    }
    return pagePreviewIframeElement.contentDocument || pagePreviewIframeElement.contentWindow.document;
}

// Moved setImageSource here to ensure it's defined before previewImageChanges and applyImage
function setImageSource(element, src, width, height, fit, originalFileName) {
    ensureId(element); // Ensure element has an ID for CSS rules if needed

    if (element.tagName === 'IMG') {
        if (src !== undefined && src !== null) { // Only update src if a value is explicitly passed
            if (src === '') element.removeAttribute('src');
            else element.src = src;
        }
        element.style.width = width;
        element.style.height = height;
        element.style.objectFit = fit;
    } else { // For background images on other elements
        if (src !== undefined && src !== null) { // Only update background image if a value is explicitly passed
            if (src === '') {
                element.style.backgroundImage = 'none';
            } else {
                element.style.backgroundImage = `url('${src}')`;
            }
        }
        
        element.style.width = width;
        element.style.height = height;

        if (fit === 'cover' || fit === 'contain') {
            element.style.backgroundSize = fit;
        } else if (fit === 'fill') {
            element.style.backgroundSize = '100% 100%';
        } else if (fit === 'none') {
            element.style.backgroundSize = 'auto';
        } else if (fit === 'scale-down') {
            element.style.backgroundSize = 'contain'; 
        } else { 
            element.style.backgroundSize = 'auto auto';
        }
        element.style.backgroundRepeat = 'no-repeat';
        element.style.backgroundPosition = 'center';
    }

    if (originalFileName !== undefined) {
        if (originalFileName === null || originalFileName === '') {
            delete element.dataset.originalFileName;
        } else {
            element.dataset.originalFileName = originalFileName;
        }
    }
    
    if (element.tagName !== 'IMG' && (src !== undefined && src !== null)) {
        customCssRules[element.id] = customCssRules[element.id] || {};
        if (src === '' || element.style.backgroundImage === 'none') {
            delete customCssRules[element.id]['background-image'];
            delete customCssRules[element.id]['background-size'];
            delete customCssRules[element.id]['background-repeat'];
            delete customCssRules[element.id]['background-position'];
        } else {
            customCssRules[element.id]['background-image'] = element.style.backgroundImage;
            customCssRules[element.id]['background-size'] = element.style.backgroundSize;
            customCssRules[element.id]['background-repeat'] = element.style.backgroundRepeat;
            customCssRules[element.id]['background-position'] = element.style.backgroundPosition;
        }
    }
    applyCustomCssToIframe();
}

// NEW: Function to apply image changes for live preview
async function previewImageChanges() {
    if (!currentEditingElement || !imageEditorPanel || !imageEditorPanel.classList.contains('active')) return;
    if (!currentEditingElement.id) {
        console.warn("Preview: currentEditingElement has no ID. Ensure ID before preview.");
        ensureId(currentEditingElement); // Try to ensure ID
        if(!currentEditingElement.id) return; // Still no ID, abort
    }

    if (imagePreviewState.elementId === currentEditingElement.id && !imagePreviewState.isPreviewing) {
        imagePreviewState.isPreviewing = true;
    } else if (imagePreviewState.elementId !== currentEditingElement.id) {
        console.warn("Preview: Mismatch or uninitialized preview state for currentEditingElement. Re-initializing.");
        openImageEditor(currentEditingElement); // This will set up imagePreviewState correctly
        imagePreviewState.isPreviewing = true; // Start previewing for the current element
    }

    const newWidth = imageWidthSelect.value;
    const newHeight = imageHeightSelect.value;
    const newFit = imageFitSelect.value;

    let imageFile = (imageFileInput.files && imageFileInput.files.length > 0) ? imageFileInput.files[0] : null;
    let imageUrlFromInput = imageUrlInput.value.trim();
    let finalImageSrcToApply;
    let finalOriginalFileNameToSet;

    if (imageFile) {
        try {
            finalImageSrcToApply = await readFileAsDataURL(imageFile);
            finalOriginalFileNameToSet = imageFile.name;
            if(fileNameDisplay) fileNameDisplay.textContent = imageFile.name;
            if(imageUrlInput) imageUrlInput.value = ''; // Clear URL if file is chosen
        } catch (error) {
            console.error("Error reading file for preview:", error);
            return; // Don't proceed with faulty src
        }
    } else if (imageUrlFromInput) {
        finalImageSrcToApply = imageUrlFromInput;
        finalOriginalFileNameToSet = null; // No original file name if URL is used
        if(fileNameDisplay) fileNameDisplay.textContent = 'No file chosen';
    } else {
        finalImageSrcToApply = undefined; // No change to src if both are empty, allows size/fit preview on existing
        finalOriginalFileNameToSet = undefined; // No change to filename
    }

    setImageSource(currentEditingElement, finalImageSrcToApply, newWidth, newHeight, newFit, finalOriginalFileNameToSet);
}

// NEW: Function to revert previewed image changes
function revertPreviewedImageChanges(targetElementIdToRevert) {
    if (!imagePreviewState.isPreviewing || !imagePreviewState.elementId || !imagePreviewState.initialState) {
        return; // Nothing to revert or state is invalid
    }

    if (targetElementIdToRevert && imagePreviewState.elementId !== targetElementIdToRevert) {
        return;
    }

    const doc = getActiveIframeDocument();
    if (!doc) {
        console.error("RevertPreview: Failed to get iframe document.");
        return;
    }
    const elementToRevert = doc.getElementById(imagePreviewState.elementId);

    if (!elementToRevert) {
        console.warn(`RevertPreview: Element ${imagePreviewState.elementId} not found in iframe.`);
        imagePreviewState.isPreviewing = false;
        imagePreviewState.initialState = null;
        imagePreviewState.elementId = null;
        return;
    }

    const stateToRestore = imagePreviewState.initialState;

    if (elementToRevert.tagName === 'IMG') {
        if (stateToRestore.src) elementToRevert.setAttribute('src', stateToRestore.src);
        else elementToRevert.removeAttribute('src');
        elementToRevert.style.objectFit = stateToRestore.objectFit || '';
    } else { // Background image
        elementToRevert.style.backgroundImage = stateToRestore.backgroundImage || '';
        elementToRevert.style.backgroundSize = stateToRestore.backgroundSize || '';
        elementToRevert.style.backgroundRepeat = stateToRestore.backgroundRepeat || '';
        elementToRevert.style.backgroundPosition = stateToRestore.backgroundPosition || '';

        customCssRules[elementToRevert.id] = customCssRules[elementToRevert.id] || {};
        if (!stateToRestore.backgroundImage || stateToRestore.backgroundImage === 'none') {
            delete customCssRules[elementToRevert.id]['background-image'];
            delete customCssRules[elementToRevert.id]['background-size'];
            delete customCssRules[elementToRevert.id]['background-repeat'];
            delete customCssRules[elementToRevert.id]['background-position'];
        } else {
            customCssRules[elementToRevert.id]['background-image'] = stateToRestore.backgroundImage;
            customCssRules[elementToRevert.id]['background-size'] = stateToRestore.backgroundSize;
            customCssRules[elementToRevert.id]['background-repeat'] = stateToRestore.backgroundRepeat;
            customCssRules[elementToRevert.id]['background-position'] = stateToRestore.backgroundPosition;
        }
    }
    elementToRevert.style.width = stateToRestore.width || '';
    elementToRevert.style.height = stateToRestore.height || '';

    if (stateToRestore.originalFileName) elementToRevert.dataset.originalFileName = stateToRestore.originalFileName;
    else delete elementToRevert.dataset.originalFileName;

    applyCustomCssToIframe();

    imagePreviewState.isPreviewing = false;
}

function initInPageEditorControls(options) {
    colorPickerPanel = options.colorPickerPanel;
    colorPickerTargetInfo = options.colorPickerTargetInfo;
    imageEditorPanel = options.imageEditorPanel;

    if (!colorPickerPanel) console.error("Color picker panel not found in initInPageEditorControls");
    if (!colorPickerTargetInfo) console.error("Color picker target info div not found in initInPageEditorControls");
    if (!imageEditorPanel) console.error("Image editor panel not found in initInPageEditorControls");

    pagePreviewIframeElement = document.getElementById('page-preview'); // Initialize here

    if (!pagePreviewIframeElement) {
        console.error("CRITICAL: page-preview iframe element not found! In-page editor cannot initialize.");
        return;
    }

    const setupEventListeners = () => {
        iframeDocument = getActiveIframeDocument(); // Use helper
        if (!iframeDocument) {
            console.error("Failed to get iframe document for event listeners setup.");
            return;
        }
    };

    if (pagePreviewIframeElement.contentDocument && pagePreviewIframeElement.contentDocument.readyState === 'complete') {
        setupEventListeners();
    } else {
        pagePreviewIframeElement.onload = setupEventListeners;
    }

    bgColorPicker = colorPickerPanel.querySelector('#bgColorPicker');
    applyColorsBtn = colorPickerPanel.querySelector('#applyColorsBtn');
    resetColorsBtn = colorPickerPanel.querySelector('#resetColorsBtn');
    closeColorPickerBtn = colorPickerPanel.querySelector('#closeColorPickerBtn');
    useBgGradient = colorPickerPanel.querySelector('#useBgGradient');
    bgColorPicker2Group = colorPickerPanel.querySelector('#bgColorPicker2-group');
    bgColorPicker2 = colorPickerPanel.querySelector('#bgColorPicker2');
    switchToImageEditorBtn = colorPickerPanel.querySelector('#switch-to-image-editor');

    closeImageEditorBtn = document.getElementById('close-image-editor-btn');
    imageFileInput = document.getElementById('image-file-input');
    fileNameDisplay = document.getElementById('file-name-display'); // Initialize fileNameDisplay
    imageUrlInput = document.getElementById('image-url-input');
    imageWidthSelect = document.getElementById('image-width-select'); // Updated ID
    imageHeightSelect = document.getElementById('image-height-select'); // Updated ID
    imageFitSelect = document.getElementById('image-fit-select');
    applyImageBtn = document.getElementById('apply-image-btn');
    removeImageBtnEditor = document.getElementById('remove-image-btn'); // Ensure this is the button in the editor panel
    imageEditorTargetElementName = document.getElementById('imageEditorTargetElementName');
    switchToColorEditorBtn = imageEditorPanel.querySelector('#switch-to-color-editor');

    if (applyColorsBtn) applyColorsBtn.addEventListener('click', applyColors);
    if (resetColorsBtn) resetColorsBtn.addEventListener('click', removeCustomColors);
    if (closeColorPickerBtn) closeColorPickerBtn.addEventListener('click', closeColorPicker);
    if (useBgGradient && bgColorPicker2Group) {
        useBgGradient.addEventListener('change', () => {
            bgColorPicker2Group.style.display = useBgGradient.checked ? 'block' : 'none';
        });
    }

    if (imageEditorPanel) {
        closeImageEditorBtn.addEventListener('click', closeImageEditor);
        applyImageBtn.addEventListener('click', applyImage);
        removeImageBtnEditor.addEventListener('click', removeImage); // Changed from removeImageBtn to removeImageBtnEditor for clarity
        
        if (imageFileInput && fileNameDisplay) {
            imageFileInput.addEventListener('change', () => {
                if (imageFileInput.files && imageFileInput.files.length > 0) {
                    fileNameDisplay.textContent = imageFileInput.files[0].name;
                } else {
                    fileNameDisplay.textContent = 'No file chosen';
                }
            });
        }
    }

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

    if (bgColorPicker) {
        bgColorPicker.addEventListener('change', () => addRecentColor(bgColorPicker.value, 'recentBgColors1'));
    }
    if (bgColorPicker2) {
        bgColorPicker2.addEventListener('change', () => addRecentColor(bgColorPicker2.value, 'recentBgColors2'));
    }

    if (imageFileInput) imageFileInput.addEventListener('change', previewImageChanges);
    if (imageUrlInput) imageUrlInput.addEventListener('input', previewImageChanges); // 'input' for immediate response
    if (imageWidthSelect) imageWidthSelect.addEventListener('change', previewImageChanges);
    if (imageHeightSelect) imageHeightSelect.addEventListener('change', previewImageChanges);
    if (imageFitSelect) imageFitSelect.addEventListener('change', previewImageChanges);

    if(colorPickerPanel) colorPickerPanel.classList.remove('active');
    if(imageEditorPanel) imageEditorPanel.classList.remove('active');
}
window.initInPageEditorControls = initInPageEditorControls;

function handleIframeElementClick(event) {
    console.log("handleIframeElementClick triggered. Target:", event.target.tagName, event.target.id); // DEBUG LINE
    event.preventDefault();
    event.stopPropagation();

    let el = event.target;
    if (!el) return;
    ensureId(el); // Ensure the newly clicked element has an ID

    if (textEditingTarget && textEditingTarget !== el) {
        makeTextReadOnly(textEditingTarget);
    }

    if (activePanel === 'image' && currentEditingElement && currentEditingElement.id !== el.id) {
        if (imagePreviewState.isPreviewing && imagePreviewState.elementId === currentEditingElement.id) {
            revertPreviewedImageChanges(currentEditingElement.id);
        }
        imagePreviewState.isPreviewing = false;
        imagePreviewState.initialState = null;
        imagePreviewState.elementId = null;
    }

    currentEditingElement = el; // This is the element that was clicked.

    if (currentlyHighlightedElement && currentlyHighlightedElement !== el) {
        removeHighlight(currentlyHighlightedElement);
    }
    applyHighlight(el); // Apply highlight to the clicked element
    currentlyHighlightedElement = el;

    if (el.tagName === 'IMG') {
        openImageEditor(el);
    } else {
        openColorPicker(el);

        const editableTextTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'A', 'BUTTON', 'LI', 'FIGCAPTION', 'LABEL', 'STRONG', 'EM', 'TD', 'TH'];
        
        if (editableTextTags.includes(el.tagName) &&
            el.tagName !== 'INPUT' && 
            el.tagName !== 'TEXTAREA' && 
            el.tagName !== 'SELECT') {
            makeTextEditable(el); // This will set contentEditable=true and focus
        }
    }
}

function openColorPicker(element) {
    console.log("[DEBUG] openColorPicker called for:", element ? element.tagName : 'null', "ID:", element ? element.id : 'N/A'); // DEBUG
    if (!colorPickerPanel || !element) {
        console.error("[DEBUG] openColorPicker: Panel or element missing. Panel:", colorPickerPanel, "Element:", element); // DEBUG
        return;
    }

    if (activePanel === 'image' && currentEditingElement) { // currentEditingElement is the one image panel was for
         if (imagePreviewState.isPreviewing && imagePreviewState.elementId === currentEditingElement.id) {
            revertPreviewedImageChanges(currentEditingElement.id);
         }
         imagePreviewState.isPreviewing = false;
         imagePreviewState.initialState = null;
         imagePreviewState.elementId = null;
    }

    currentEditingElement = element; // Ensure this is set

    ensureId(element);
    const targetName = element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '');
    if (colorPickerTargetInfo) {
        const targetElementNameSpan = colorPickerTargetInfo.querySelector('#colorPickerTargetElementName');
        if (targetElementNameSpan) targetElementNameSpan.textContent = targetName;
        else console.warn("colorPickerTargetElementName span not found in colorPickerTargetInfo");
    } else {
        console.warn("colorPickerTargetInfo div not found");
    }
    
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
                    useBgGradient.checked = true;
                    if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'block';
                } else {
                    useBgGradient.checked = false;
                    if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'none';
                }
            } else { // Solid color
                bgColorPicker.value = rgbToHex(customBg);
                useBgGradient.checked = false;
                if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'none';
            }
        } else { // No custom rule, use computed style
            bgColorPicker.value = rgbToHex(bgColor);
            useBgGradient.checked = false;
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

// Helper function to set select option
function setSelectOption(selectElement, value) {
    if (!selectElement) return;
    let optionFound = false;
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].value === value || 
            (selectElement.options[i].value === 'auto' && (value === '' || value === null || value === 'auto')) ||
            (selectElement.options[i].value === 'initial' && (value === '' || value === null || value === 'initial')) ||
            (selectElement.options[i].value === 'fill' && (value === '' || value === null || value === 'fill'))
           ) {
            selectElement.selectedIndex = i;
            optionFound = true;
            break;
        }
    }
    if (!optionFound) {
        // If the exact value isn't found, try to find a common default or set to auto/first
        const autoOption = Array.from(selectElement.options).find(opt => opt.value.toLowerCase() === 'auto');
        if (autoOption) {
            selectElement.value = autoOption.value;
        } else if (selectElement.options.length > 0) {
            selectElement.selectedIndex = 0; // Default to the first option
        }
    }
}

// --- START: Image Editor Functions ---
function openImageEditor(element) {
    console.log("[DEBUG] openImageEditor called for:", element ? element.tagName : 'null', "ID:", element ? element.id : 'N/A'); // DEBUG
    if (!element) return;
    ensureId(element); // Ensure element has an ID first

    if (imagePreviewState.isPreviewing && imagePreviewState.elementId && imagePreviewState.elementId !== element.id) {
        revertPreviewedImageChanges(imagePreviewState.elementId); // Pass specific ID to revert
        imagePreviewState.initialState = null; // It will be re-captured below
        imagePreviewState.elementId = null;   // It will be re-captured below
    }
    
    currentEditingElement = element; 

    if (imagePreviewState.elementId !== element.id || !imagePreviewState.isPreviewing || !imagePreviewState.initialState) {
        imagePreviewState.initialState = {
            src: element.tagName === 'IMG' ? element.getAttribute('src') : null,
            backgroundImage: element.style.backgroundImage,
            width: element.style.width,
            height: element.style.height,
            objectFit: element.style.objectFit,
            backgroundSize: element.style.backgroundSize,
            backgroundRepeat: element.style.backgroundRepeat,
            backgroundPosition: element.style.backgroundPosition,
            originalFileName: element.dataset.originalFileName
        };
        imagePreviewState.elementId = element.id;
        imagePreviewState.isPreviewing = false; // Reset previewing flag until a change is made via inputs
    }
    
    imageEditorTargetElementName.textContent = element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '') + (element.className ? `.${element.className.split(' ')[0]}` : '');
    
    const computedStyle = currentIframeDocument.defaultView.getComputedStyle(element);
    let currentSrc = element.src || element.style.backgroundImage.slice(4, -1).replace(/"/g, "");
    if (currentSrc && currentSrc.startsWith('blob:')) { // If it's a blob URL from a previous file upload
        imageUrlInput.value = ''; // Don't show blob URL to user
    } else {
        imageUrlInput.value = currentSrc.startsWith(window.location.origin) ? '' : currentSrc; // Clear if it's a blob or internal URL
    }
    
    const widthValue = element.style.width || computedStyle.width;
    const heightValue = element.style.height || computedStyle.height;
    const fitValue = element.style.objectFit || computedStyle.objectFit;

    setSelectOption(imageWidthSelect, widthValue);
    setSelectOption(imageHeightSelect, heightValue);
    setSelectOption(imageFitSelect, fitValue);
    
    if (!element.dataset.originalFileName) {
        imageFileInput.value = ''; // Clear file input
        fileNameDisplay.textContent = 'No file chosen';
    } else {
        fileNameDisplay.textContent = element.dataset.originalFileName;
    }

    imageEditorPanel.classList.add('active');
    colorPickerPanel.classList.remove('active');
    activePanel = 'image';
}

function closeImageEditor() {
    if (imagePreviewState.isPreviewing && imagePreviewState.elementId) {
        revertPreviewedImageChanges(imagePreviewState.elementId);
    }
    imagePreviewState.isPreviewing = false;
    imagePreviewState.initialState = null;
    imagePreviewState.elementId = null;

    if (imageEditorPanel) imageEditorPanel.classList.remove('active');
    if (currentlyHighlightedElement) {
        removeHighlight(currentlyHighlightedElement);
        currentlyHighlightedElement = null;
    }
    currentEditingElement = null;
    activePanel = null;
}

async function applyImage() {
    if (!currentEditingElement) {
        console.warn("ApplyImage: No current editing element.");
        return;
    }
    ensureId(currentEditingElement);
    if (!imagePreviewState.elementId || currentEditingElement.id !== imagePreviewState.elementId || !imagePreviewState.initialState) {
        console.warn("ApplyImage: Preview state mismatch or not initialized. Capturing current state as 'old state'.");
        imagePreviewState.initialState = {
            src: currentEditingElement.tagName === 'IMG' ? currentEditingElement.getAttribute('src') : null,
            backgroundImage: currentEditingElement.style.backgroundImage,
            width: currentEditingElement.style.width,
            height: currentEditingElement.style.height,
            objectFit: currentEditingElement.style.objectFit,
            backgroundSize: currentEditingElement.style.backgroundSize,
            backgroundRepeat: currentEditingElement.style.backgroundRepeat,
            backgroundPosition: currentEditingElement.style.backgroundPosition,
            originalFileName: currentEditingElement.dataset.originalFileName
        };
        imagePreviewState.elementId = currentEditingElement.id;
        imagePreviewState.isPreviewing = false; // No active preview was in progress
    }

    const actionElementId = currentEditingElement.id;
    const oldStateForUndo = imagePreviewState.initialState;

    const newWidth = imageWidthSelect.value;
    const newHeight = imageHeightSelect.value;
    const newFit = imageFitSelect.value;
    
    let imageFile = (imageFileInput.files && imageFileInput.files.length > 0) ? imageFileInput.files[0] : null;
    let imageUrlFromInput = imageUrlInput.value.trim();

    let finalImageSrcToApply; 
    let finalOriginalFileNameToSet;

    if (imageFile) {
        try {
            finalImageSrcToApply = await readFileAsDataURL(imageFile);
            finalOriginalFileNameToSet = imageFile.name;
            if(fileNameDisplay) fileNameDisplay.textContent = imageFile.name; 
            if(imageUrlInput) imageUrlInput.value = ''; 
        } catch (error) {
            console.error("Error reading file for applyImage:", error);
            return; 
        }
    } else if (imageUrlFromInput) {
        finalImageSrcToApply = imageUrlFromInput;
        finalOriginalFileNameToSet = null; 
        if(fileNameDisplay) fileNameDisplay.textContent = 'No file chosen';
    } else {
        finalImageSrcToApply = undefined; 
        finalOriginalFileNameToSet = undefined; 
    }
    
    setImageSource(currentEditingElement, finalImageSrcToApply, newWidth, newHeight, newFit, finalOriginalFileNameToSet);
    
    const newStateForRedo = { 
        src: currentEditingElement.tagName === 'IMG' ? currentEditingElement.getAttribute('src') : null,
        backgroundImage: currentEditingElement.style.backgroundImage,
        width: currentEditingElement.style.width,
        height: currentEditingElement.style.height,
        objectFit: currentEditingElement.style.objectFit,
        backgroundSize: currentEditingElement.style.backgroundSize,
        backgroundRepeat: currentEditingElement.style.backgroundRepeat,
        backgroundPosition: currentEditingElement.style.backgroundPosition,
        originalFileName: currentEditingElement.dataset.originalFileName
    };

    recordAction({
        type: 'image',
        elementId: actionElementId,
        undo: function() {
            const doc = getActiveIframeDocument();
            if (!doc) { console.error("Undo ApplyImage: iframe doc not found."); return; }
            const targetElement = doc.getElementById(this.elementId);
            if (!targetElement) { console.warn(`Undo ApplyImage: Target '${this.elementId}' not found.`); return; }

            if (targetElement.tagName === 'IMG') {
                if (oldStateForUndo.src) targetElement.setAttribute('src', oldStateForUndo.src); 
                else targetElement.removeAttribute('src');
                targetElement.style.objectFit = oldStateForUndo.objectFit || '';
            } else { // Background image
                targetElement.style.backgroundImage = oldStateForUndo.backgroundImage || '';
                targetElement.style.backgroundSize = oldStateForUndo.backgroundSize || '';
                targetElement.style.backgroundRepeat = oldStateForUndo.backgroundRepeat || '';
                targetElement.style.backgroundPosition = oldStateForUndo.backgroundPosition || '';
                
                customCssRules[this.elementId] = customCssRules[this.elementId] || {};
                if (!oldStateForUndo.backgroundImage || oldStateForUndo.backgroundImage === 'none') {
                    delete customCssRules[this.elementId]['background-image'];
                    delete customCssRules[this.elementId]['background-size'];
                    delete customCssRules[this.elementId]['background-repeat'];
                    delete customCssRules[this.elementId]['background-position'];
                } else {
                    customCssRules[this.elementId]['background-image'] = oldStateForUndo.backgroundImage;
                    customCssRules[this.elementId]['background-size'] = oldStateForUndo.backgroundSize;
                    customCssRules[this.elementId]['background-repeat'] = oldStateForUndo.backgroundRepeat;
                    customCssRules[this.elementId]['background-position'] = oldStateForUndo.backgroundPosition;
                }
            }
            targetElement.style.width = oldStateForUndo.width || '';
            targetElement.style.height = oldStateForUndo.height || '';
            
            if (oldStateForUndo.originalFileName) targetElement.dataset.originalFileName = oldStateForUndo.originalFileName;
            else delete targetElement.dataset.originalFileName;
            
            if (window.currentEditingElement && window.currentEditingElement.id === this.elementId && imageEditorPanel && imageEditorPanel.classList.contains('active')) {
                openImageEditor(targetElement); 
            }
            applyCustomCssToIframe();
        },
        redo: function() {
            const doc = getActiveIframeDocument();
            if (!doc) { console.error("Redo ApplyImage: iframe doc not found."); return; }
            const targetElement = doc.getElementById(this.elementId);
            if (!targetElement) { console.warn(`Redo ApplyImage: Target '${this.elementId}' not found.`); return; }

            if (targetElement.tagName === 'IMG') {
                if (newStateForRedo.src) targetElement.setAttribute('src', newStateForRedo.src); 
                else targetElement.removeAttribute('src');
                targetElement.style.objectFit = newStateForRedo.objectFit || '';
            } else { // Background image
                targetElement.style.backgroundImage = newStateForRedo.backgroundImage || '';
                targetElement.style.backgroundSize = newStateForRedo.backgroundSize || '';
                targetElement.style.backgroundRepeat = newStateForRedo.backgroundRepeat || '';
                targetElement.style.backgroundPosition = newStateForRedo.backgroundPosition || '';

                customCssRules[this.elementId] = customCssRules[this.elementId] || {};
                if (!newStateForRedo.backgroundImage || newStateForRedo.backgroundImage === 'none') {
                    delete customCssRules[this.elementId]['background-image'];
                    delete customCssRules[this.elementId]['background-size'];
                    delete customCssRules[this.elementId]['background-repeat'];
                    delete customCssRules[this.elementId]['background-position'];
                } else {
                    customCssRules[this.elementId]['background-image'] = newStateForRedo.backgroundImage;
                    customCssRules[this.elementId]['background-size'] = newStateForRedo.backgroundSize;
                    customCssRules[this.elementId]['background-repeat'] = newStateForRedo.backgroundRepeat;
                    customCssRules[this.elementId]['background-position'] = newStateForRedo.backgroundPosition;
                }
            }
            targetElement.style.width = newStateForRedo.width || '';
            targetElement.style.height = newStateForRedo.height || '';

            if (newStateForRedo.originalFileName) targetElement.dataset.originalFileName = newStateForRedo.originalFileName;
            else delete targetElement.dataset.originalFileName;

            if (window.currentEditingElement && window.currentEditingElement.id === this.elementId && imageEditorPanel && imageEditorPanel.classList.contains('active')) {
                openImageEditor(targetElement); 
            }
            applyCustomCssToIframe();
        }
    });

    imagePreviewState.initialState = newStateForRedo; 
    imagePreviewState.isPreviewing = false; 
    imagePreviewState.elementId = currentEditingElement.id; 

    if (imageFileInput) imageFileInput.value = ''; 
}

function removeImage() {
    if (!currentEditingElement) return;
    ensureId(currentEditingElement);
    const actionElementId = currentEditingElement.id;

    const oldState = {
        src: currentEditingElement.tagName === 'IMG' ? currentEditingElement.getAttribute('src') : null,
        backgroundImage: currentEditingElement.style.backgroundImage,
        width: currentEditingElement.style.width,
        height: currentEditingElement.style.height,
        objectFit: currentEditingElement.style.objectFit,
        backgroundSize: currentEditingElement.style.backgroundSize,
        backgroundRepeat: currentEditingElement.style.backgroundRepeat,
        backgroundPosition: currentEditingElement.style.backgroundPosition,
        originalFileName: currentEditingElement.dataset.originalFileName
    };

    const element = currentEditingElement; // Keep reference for immediate changes
    if (element.tagName === 'IMG') {
        element.src = '';
    } else {
        element.style.backgroundImage = 'none';
        if (customCssRules[element.id]) {
            delete customCssRules[element.id]['background-image'];
            delete customCssRules[element.id]['background-size'];
            delete customCssRules[element.id]['background-repeat'];
            delete customCssRules[element.id]['background-position'];
        }
    }
    element.style.width = 'auto'; 
    element.style.height = 'auto';
    element.style.objectFit = 'initial'; 
    delete element.dataset.originalFileName; 

    if(imageFileInput) imageFileInput.value = ''; 
    if(fileNameDisplay) fileNameDisplay.textContent = 'No file chosen';
    if(imageUrlInput) imageUrlInput.value = '';
    if(imageWidthSelect) setSelectOption(imageWidthSelect, 'auto');
    if(imageHeightSelect) setSelectOption(imageHeightSelect, 'auto');
    if(imageFitSelect) setSelectOption(imageFitSelect, 'fill'); 
    applyCustomCssToIframe();

    recordAction({
        type: 'image',
        elementId: actionElementId,
        undo: function() {
            const doc = getActiveIframeDocument(); 
            if (!doc) {
                console.error("CRITICAL_ERROR: iframe document not available in image remove undo.");
                return;
            }
            const targetElement = doc.getElementById(this.elementId);
            if (!targetElement) {
                console.warn(`Undo Image Remove: Target element '${this.elementId}' not found.`);
                return;
            }

            if (targetElement.tagName === 'IMG') {
                if (oldState.src) targetElement.setAttribute('src', oldState.src);
                targetElement.style.objectFit = oldState.objectFit || '';
            } else { // Background image
                targetElement.style.backgroundImage = oldState.backgroundImage || '';
                targetElement.style.backgroundSize = oldState.backgroundSize || '';
                targetElement.style.backgroundRepeat = oldState.backgroundRepeat || '';
                targetElement.style.backgroundPosition = oldState.backgroundPosition || '';
                customCssRules[this.elementId] = customCssRules[this.elementId] || {};
                if (!oldState.backgroundImage || oldState.backgroundImage === 'none') {
                    delete customCssRules[this.elementId]['background-image'];
                    delete customCssRules[this.elementId]['background-size'];
                    delete customCssRules[this.elementId]['background-repeat'];
                    delete customCssRules[this.elementId]['background-position'];
                } else {
                    customCssRules[this.elementId]['background-image'] = oldState.backgroundImage;
                    customCssRules[this.elementId]['background-size'] = oldState.backgroundSize;
                    customCssRules[this.elementId]['background-repeat'] = oldState.backgroundRepeat;
                    customCssRules[this.elementId]['background-position'] = oldState.backgroundPosition;
                }
            }
            targetElement.style.width = oldState.width || '';
            targetElement.style.height = oldState.height || '';
            if (oldState.originalFileName) targetElement.dataset.originalFileName = oldState.originalFileName;
            else delete targetElement.dataset.originalFileName;

            if (window.currentEditingElement && window.currentEditingElement.id === this.elementId && imageEditorPanel && imageEditorPanel.classList.contains('active')) {
                openImageEditor(targetElement);
            }
            applyCustomCssToIframe();
        },
        redo: function() {
            const doc = getActiveIframeDocument(); 
            if (!doc) {
                console.error("CRITICAL_ERROR: iframe document not available in image remove redo.");
                return;
            }
            const targetElement = doc.getElementById(this.elementId);
            if (!targetElement) {
                console.warn(`Redo Image Remove: Target element '${this.elementId}' not found.`);
                return;
            }

            if (targetElement.tagName === 'IMG') {
                targetElement.src = '';
            } else {
                targetElement.style.backgroundImage = 'none';
                if (customCssRules[targetElement.id]) {
                    delete customCssRules[targetElement.id]['background-image'];
                    delete customCssRules[targetElement.id]['background-size'];
                    delete customCssRules[targetElement.id]['background-repeat'];
                    delete customCssRules[targetElement.id]['background-position'];
                }
            }
            targetElement.style.width = 'auto'; 
            targetElement.style.height = 'auto';
            targetElement.style.objectFit = 'initial'; 
            delete targetElement.dataset.originalFileName; 

            if (window.currentEditingElement && window.currentEditingElement.id === this.elementId && imageEditorPanel && imageEditorPanel.classList.contains('active')) {
                if(imageFileInput) imageFileInput.value = ''; 
                if(fileNameDisplay) fileNameDisplay.textContent = 'No file chosen';
                if(imageUrlInput) imageUrlInput.value = '';
                if(imageWidthSelect) setSelectOption(imageWidthSelect, 'auto');
                if(imageHeightSelect) setSelectOption(imageHeightSelect, 'auto');
                if(imageFitSelect) setSelectOption(imageFitSelect, 'fill');
            }
            applyCustomCssToIframe();
        }
    });
}

function applyColors() {
    if (!currentEditingElement || !bgColorPicker) return;
    ensureId(currentEditingElement);

    const oldBackground = customCssRules[currentEditingElement.id] ? customCssRules[currentEditingElement.id].background : currentIframeDocument.defaultView.getComputedStyle(currentEditingElement).background;

    const newBgColor = bgColorPicker.value;
    const useGradient = useBgGradient.checked;
    const newBgColor2 = bgColorPicker2.value;

    if (!customCssRules[currentEditingElement.id]) {
        customCssRules[currentEditingElement.id] = {};
    }

    let newBackgroundValue;
    if (useGradient && newBgColor2) {
        newBackgroundValue = `linear-gradient(${newBgColor}, ${newBgColor2})`;
        addRecentColor(newBgColor2, 'recentBgColors2');
        updateRecentColorsDatalist('recentBgColorsList2', recentBgColors2);
    } else {
        newBackgroundValue = newBgColor;
    }
    
    customCssRules[currentEditingElement.id].background = newBackgroundValue;
    
    addRecentColor(newBgColor, 'recentBgColors1');
    updateRecentColorsDatalist('recentBgColorsList', recentBgColors1);
    saveRecentColors();

    applyCustomCssToIframe();
    
    recordAction({
        undo: () => {
            if (oldBackground) {
                customCssRules[currentEditingElement.id].background = oldBackground;
            } else {
                delete customCssRules[currentEditingElement.id].background;
            }
            applyCustomCssToIframe();
            if (oldBackground && oldBackground.startsWith('linear-gradient')) {
                const colors = parseGradientColors(oldBackground);
                bgColorPicker.value = colors[0] ? rgbToHex(colors[0]) : '#ffffff';
                if (colors[1]) {
                    bgColorPicker2.value = rgbToHex(colors[1]);
                    useBgGradient.checked = true;
                    if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'block';
                } else {
                    useBgGradient.checked = false;
                    if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'none';
                }
            } else {
                bgColorPicker.value = oldBackground ? rgbToHex(oldBackground) : '#ffffff';
                useBgGradient.checked = false;
                if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'none';
            }
        },
        redo: () => {
            customCssRules[currentEditingElement.id].background = newBackgroundValue;
            applyCustomCssToIframe();
            bgColorPicker.value = newBgColor;
            if (useGradient && newBgColor2) {
                bgColorPicker2.value = newBgColor2;
                useBgGradient.checked = true;
                if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'block';
            } else {
                useBgGradient.checked = false;
                if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'none';
            }
        }
    });
}

function removeCustomColors() {
    if (!currentEditingElement) return;
    ensureId(currentEditingElement);

    const oldBackground = customCssRules[currentEditingElement.id] ? customCssRules[currentEditingElement.id].background : null;

    if (customCssRules[currentEditingElement.id] && customCssRules[currentEditingElement.id].background) {
        delete customCssRules[currentEditingElement.id].background;
        if (Object.keys(customCssRules[currentEditingElement.id]).length === 0) {
            delete customCssRules[currentEditingElement.id];
        }
        applyCustomCssToIframe();

        recordAction({
            undo: () => {
                if (oldBackground) {
                    if (!customCssRules[currentEditingElement.id]) { // Recreate if deleted
                        customCssRules[currentEditingElement.id] = {};
                    }
                    customCssRules[currentEditingElement.id].background = oldBackground;
                    applyCustomCssToIframe();
                    if (oldBackground.startsWith('linear-gradient')) {
                        const colors = parseGradientColors(oldBackground);
                        bgColorPicker.value = colors[0] ? rgbToHex(colors[0]) : '#ffffff';
                        if (colors[1]) {
                            bgColorPicker2.value = rgbToHex(colors[1]);
                            useBgGradient.checked = true;
                            if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'block';
                        } else {
                             useBgGradient.checked = false;
                            if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'none';
                        }
                    } else {
                        bgColorPicker.value = rgbToHex(oldBackground);
                        useBgGradient.checked = false;
                        if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'none';
                    }
                }
            },
            redo: () => {
                if (customCssRules[currentEditingElement.id] && customCssRules[currentEditingElement.id].background) {
                    delete customCssRules[currentEditingElement.id].background;
                    if (Object.keys(customCssRules[currentEditingElement.id]).length === 0) {
                        delete customCssRules[currentEditingElement.id];
                    }
                    applyCustomCssToIframe();
                }
                const computedStyle = currentIframeDocument.defaultView.getComputedStyle(currentEditingElement);
                bgColorPicker.value = rgbToHex(computedStyle.backgroundColor);
                useBgGradient.checked = false;
                if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'none';
            }
        });
    }
    const computedStyle = currentIframeDocument.defaultView.getComputedStyle(currentEditingElement);
    bgColorPicker.value = rgbToHex(computedStyle.backgroundColor);
    useBgGradient.checked = false;
    if (bgColorPicker2Group) bgColorPicker2Group.style.display = 'none';
}

function setInPageEditMode(isActive, iframeDoc, iframeWin) {
    console.log(`setInPageEditMode: requested state: ${isActive}, current isEditModeActive: ${isEditModeActive}, currentDoc valid: ${!!currentIframeDocument}, newDoc valid: ${!!iframeDoc}`);

    if (!isActive && textEditingTarget) {
        makeTextReadOnly(textEditingTarget);
    }

    if (isActive && isEditModeActive && currentIframeDocument === iframeDoc) {
        console.log("setInPageEditMode: Already active on this document. No change.");
        return;
    }

    if (!isActive && !isEditModeActive) {
        console.log("setInPageEditMode: Already inactive. No change.");
        return;
    }

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
        return; // Done with deactivation
    }

    if (!currentIframeDocument || !currentIframeDocument.body) {
        console.error("setInPageEditMode: Cannot activate. Iframe document or its body is not available.");
        isEditModeActive = false; // Revert state as activation failed
        currentIframeDocument = null; // Clear doc reference
        currentIframeWindow = null;
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
        const elementExists = currentIframeDocument.getElementById(id);
        if (elementExists && Object.keys(rules).length > 0) {
            cssString += `#${id} {\n`;
            for (const prop in rules) {
                cssString += `  ${prop}: ${rules[prop]};\n`;
            }
            cssString += "}\n\n";
        }
    }
    return cssString;
}

function applyCustomCssToIframe() {
    let doc = getActiveIframeDocument(); // USE HELPER
    if (!doc || !doc.head) { // Ensure doc and head exist
        console.error("Cannot apply custom CSS, iframe document not available (applyCustomCssToIframe).");
        return;
    }
    let styleTag = doc.getElementById(customStyleTagId);
    if (!styleTag) {
        styleTag = doc.createElement('style');
        styleTag.id = customStyleTagId;
        doc.head.appendChild(styleTag);
    }
    styleTag.textContent = getCustomCss();
}

function ensureId(element) {
    if (!element) return null;
    if (!element.id) {
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
