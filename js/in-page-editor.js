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

// Initialize references to panel elements from the main document
function initInPageEditorControls(options) {
    colorPickerPanel = options.colorPickerPanel;
    colorPickerTargetInfo = options.colorPickerTargetInfo;
    imageEditorPanel = options.imageEditorPanel;

    if (!colorPickerPanel) console.error("Color picker panel not found in initInPageEditorControls");
    if (!colorPickerTargetInfo) console.error("Color picker target info div not found in initInPageEditorControls");
    if (!imageEditorPanel) console.error("Image editor panel not found in initInPageEditorControls");

    // Query for Color Picker child elements
    bgColorPicker = colorPickerPanel.querySelector('#bgColorPicker');
    applyColorsBtn = colorPickerPanel.querySelector('#applyColorsBtn');
    resetColorsBtn = colorPickerPanel.querySelector('#resetColorsBtn');
    closeColorPickerBtn = colorPickerPanel.querySelector('#closeColorPickerBtn');
    useBgGradient = colorPickerPanel.querySelector('#useBgGradient');
    bgColorPicker2Group = colorPickerPanel.querySelector('#bgColorPicker2-group');
    bgColorPicker2 = colorPickerPanel.querySelector('#bgColorPicker2');
    switchToImageEditorBtn = colorPickerPanel.querySelector('#switch-to-image-editor');

    // Query for Image Editor child elements
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

    // Event listeners for Color Picker
    if (applyColorsBtn) applyColorsBtn.addEventListener('click', applyColors);
    if (resetColorsBtn) resetColorsBtn.addEventListener('click', removeCustomColors);
    if (closeColorPickerBtn) closeColorPickerBtn.addEventListener('click', closeColorPicker);
    if (useBgGradient && bgColorPicker2Group) {
        useBgGradient.addEventListener('change', () => {
            bgColorPicker2Group.style.display = useBgGradient.checked ? 'block' : 'none';
        });
    }

    // Event listeners for Image Editor
    if (imageEditorPanel) {
        closeImageEditorBtn.addEventListener('click', closeImageEditor);
        applyImageBtn.addEventListener('click', applyImage);
        removeImageBtnEditor.addEventListener('click', removeImage); // Changed from removeImageBtn to removeImageBtnEditor for clarity
        
        // Event listener for file input change
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
        makeTextReadOnly(textEditingTarget); // Finalize any ongoing edit
    }

    const oldText = element.innerHTML;
    element.contentEditable = 'true';
    element.style.outline = '2px solid orange'; 
    element.focus();
    textEditingTarget = element;

    // Store initial content for potential undo, only when starting to edit
    element.dataset.initialTextForUndo = oldText; 

    element.addEventListener('blur', handleTextEditBlur, { once: true });
    element.addEventListener('keydown', handleTextEditKeyDown);
    // Note: recordAction for text edits will be called in makeTextReadOnly or handleTextEditKeyDown (Enter)
}

function makeTextReadOnly(element) {
    if (!element || element.contentEditable !== 'true') return;

    const oldText = element.dataset.initialTextForUndo || element.innerHTML; // Fallback if initial not set
    const newText = element.innerHTML;

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
    delete element.dataset.initialTextForUndo; // Clean up

    if (oldText !== newText) { // Only record if text actually changed
        recordAction({
            undo: () => {
                element.innerHTML = oldText;
                applyCustomCssToIframe(); // Reapply styles if text change affected layout/CSS
            },
            redo: () => {
                element.innerHTML = newText;
                applyCustomCssToIframe();
            }
        });
        // window.notifyUnsavedChange(); // Moved to recordAction
    }
}

function handleTextEditBlur(event) {
    if (event.target === textEditingTarget) {
        makeTextReadOnly(event.target); // This will now record the action
    }
}

function handleTextEditKeyDown(event) {
    if (!textEditingTarget || event.target !== textEditingTarget) return;
    if (event.key === 'Enter' && !event.shiftKey) { 
        event.preventDefault(); 
        makeTextReadOnly(event.target); // This will now record the action
    } else if (event.key === 'Escape') {
        // For Escape, revert to initial text and don't record an action
        const initialText = event.target.dataset.initialTextForUndo;
        if (typeof initialText === 'string') {
            event.target.innerHTML = initialText;
        }
        makeTextReadOnly(event.target); // Finalize without recording a new state
    }
    // No notifyUnsavedChange here, it's handled by recordAction or makeTextReadOnly
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
    if (!element) return;
    currentEditingElement = element;
    imageEditorTargetElementName.textContent = element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '') + (element.className ? `.${element.className.split(' ')[0]}` : '');
    
    // Pre-fill controls
    const computedStyle = currentIframeDocument.defaultView.getComputedStyle(element);
    let currentSrc = element.src || element.style.backgroundImage.slice(4, -1).replace(/"/g, "");
    if (currentSrc && currentSrc.startsWith('blob:')) { // If it's a blob URL from a previous file upload
        imageUrlInput.value = ''; // Don't show blob URL to user
        // fileNameDisplay might still hold the previous file name if not cleared
    } else {
        imageUrlInput.value = currentSrc.startsWith(window.location.origin) ? '' : currentSrc; // Clear if it's a blob or internal URL
    }
    
    // Pre-fill select dropdowns
    const widthValue = element.style.width || computedStyle.width;
    const heightValue = element.style.height || computedStyle.height;
    const fitValue = element.style.objectFit || computedStyle.objectFit;

    setSelectOption(imageWidthSelect, widthValue);
    setSelectOption(imageHeightSelect, heightValue);
    setSelectOption(imageFitSelect, fitValue);
    
    // Reset file input and display if no file was used for the current image
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
    if (imageEditorPanel) imageEditorPanel.classList.remove('active');
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
        if (selectElement.options[i].value === value) {
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

async function applyImage() {
    if (!currentEditingElement) return;
    ensureId(currentEditingElement);

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

    const width = imageWidthSelect.value;
    const height = imageHeightSelect.value;
    const fit = imageFitSelect.value;
    let imageSource = imageUrlInput.value.trim();
    let newOriginalFileName = oldState.originalFileName;

    // Prioritize file input if a file is selected
    if (imageFileInput.files && imageFileInput.files.length > 0) {
        const file = imageFileInput.files[0];
        imageSource = await readFileAsDataURL(file);
        newOriginalFileName = file.name;
    } else {
        if (imageSource) { // If URL is provided, clear original file name
            newOriginalFileName = undefined;
        }
    }
    
    setImageSource(currentEditingElement, imageSource, width, height, fit, newOriginalFileName);
    
    const newState = {
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
        undo: () => {
            if (currentEditingElement.tagName === 'IMG') {
                if (oldState.src) currentEditingElement.setAttribute('src', oldState.src); else currentEditingElement.removeAttribute('src');
            } else {
                currentEditingElement.style.backgroundImage = oldState.backgroundImage || '';
                currentEditingElement.style.backgroundSize = oldState.backgroundSize || '';
                currentEditingElement.style.backgroundRepeat = oldState.backgroundRepeat || '';
                currentEditingElement.style.backgroundPosition = oldState.backgroundPosition || '';
            }
            currentEditingElement.style.width = oldState.width || '';
            currentEditingElement.style.height = oldState.height || '';
            currentEditingElement.style.objectFit = oldState.objectFit || '';
            if (oldState.originalFileName) currentEditingElement.dataset.originalFileName = oldState.originalFileName;
            else delete currentEditingElement.dataset.originalFileName;
            
            fileNameDisplay.textContent = oldState.originalFileName || 'No file chosen';
            imageUrlInput.value = (oldState.src && !oldState.src.startsWith('blob:')) ? oldState.src : (oldState.backgroundImage && !oldState.backgroundImage.includes('blob:')) ? oldState.backgroundImage.slice(5, -2) : '';

            applyCustomCssToIframe(); // Important if background image was in CSS rules
        },
        redo: () => {
            if (currentEditingElement.tagName === 'IMG') {
                if (newState.src) currentEditingElement.setAttribute('src', newState.src); else currentEditingElement.removeAttribute('src');
            } else {
                currentEditingElement.style.backgroundImage = newState.backgroundImage || '';
                currentEditingElement.style.backgroundSize = newState.backgroundSize || '';
                currentEditingElement.style.backgroundRepeat = newState.backgroundRepeat || '';
                currentEditingElement.style.backgroundPosition = newState.backgroundPosition || '';
            }
            currentEditingElement.style.width = newState.width || '';
            currentEditingElement.style.height = newState.height || '';
            currentEditingElement.style.objectFit = newState.objectFit || '';
            if (newState.originalFileName) currentEditingElement.dataset.originalFileName = newState.originalFileName;
            else delete currentEditingElement.dataset.originalFileName;

            fileNameDisplay.textContent = newState.originalFileName || 'No file chosen';
            imageUrlInput.value = (newState.src && !newState.src.startsWith('blob:')) ? newState.src : (newState.backgroundImage && !newState.backgroundImage.includes('blob:')) ? newState.backgroundImage.slice(5, -2) : '';

            applyCustomCssToIframe();
        }
    });
}

function removeImage() {
    if (!currentEditingElement) return;
    ensureId(currentEditingElement);

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

    const element = currentEditingElement;
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

    imageFileInput.value = ''; 
    fileNameDisplay.textContent = 'No file chosen';
    imageUrlInput.value = '';
    setSelectOption(imageWidthSelect, 'auto');
    setSelectOption(imageHeightSelect, 'auto');
    setSelectOption(imageFitSelect, 'fill'); 

    recordAction({
        undo: () => {
            if (element.tagName === 'IMG') {
                if (oldState.src) element.setAttribute('src', oldState.src);
            } else {
                element.style.backgroundImage = oldState.backgroundImage || '';
                if (customCssRules[element.id] && oldState.backgroundImage) {
                    customCssRules[element.id].background = oldState.backgroundImage;
                    customCssRules[element.id]['background-size'] = oldState.backgroundSize || '';
                    customCssRules[element.id]['background-repeat'] = oldState.backgroundRepeat || '';
                    customCssRules[element.id]['background-position'] = oldState.backgroundPosition || '';
                }
            }
            element.style.width = oldState.width || '';
            element.style.height = oldState.height || '';
            element.style.objectFit = oldState.objectFit || '';
            if (oldState.originalFileName) element.dataset.originalFileName = oldState.originalFileName;
            
            fileNameDisplay.textContent = oldState.originalFileName || 'No file chosen';
            imageUrlInput.value = (oldState.src && !oldState.src.startsWith('blob:')) ? oldState.src : (oldState.backgroundImage && !oldState.backgroundImage.includes('blob:')) ? oldState.backgroundImage.slice(5, -2) : '';

            applyCustomCssToIframe();
        },
        redo: () => {
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

            imageFileInput.value = ''; 
            fileNameDisplay.textContent = 'No file chosen';
            imageUrlInput.value = '';
            setSelectOption(imageWidthSelect, 'auto');
            setSelectOption(imageHeightSelect, 'auto');
            setSelectOption(imageFitSelect, 'fill');
            applyCustomCssToIframe();
        }
    });
}

function setImageSource(element, src, width, height, fit, originalFileName) { // Added originalFileName
    const isImgTag = element.tagName === 'IMG';
    ensureId(element); // Ensure element has an ID for CSS rules if needed

    if (originalFileName) {
        element.dataset.originalFileName = originalFileName;
        if (fileNameDisplay) fileNameDisplay.textContent = originalFileName;
    } else {
        delete element.dataset.originalFileName;
        if (fileNameDisplay) fileNameDisplay.textContent = 'No file chosen';
    }
    if (imageUrlInput && src && !src.startsWith('blob:')) { // If src is a URL, update input
        imageUrlInput.value = src;
    } else if (imageUrlInput && !src) { // If src is cleared (e.g. by removeImage)
        imageUrlInput.value = '';
    }

    if (src) { 
        if (isImgTag) {
            element.setAttribute('src', src);
        } else {
            if (!customCssRules[element.id]) {
                customCssRules[element.id] = {};
            }
            const existingBg = customCssRules[element.id].background;
            if (existingBg && existingBg.startsWith('linear-gradient')) {
                customCssRules[element.id].background = `url("${src}")`;
            } else {
                customCssRules[element.id].background = `url("${src}")`;
            }
            customCssRules[element.id]['background-repeat'] = 'no-repeat';
            customCssRules[element.id]['background-position'] = 'center'; 
        }
    } else { // No src, means remove image
        if (isImgTag) {
            element.removeAttribute('src');
        } else {
            if (customCssRules[element.id]) {
                if (customCssRules[element.id].background && customCssRules[element.id].background.includes('url(')) {
                    delete customCssRules[element.id].background;
                    delete customCssRules[element.id]['background-size'];
                    delete customCssRules[element.id]['background-repeat'];
                    delete customCssRules[element.id]['background-position'];
                }
            }
        }
    }

    if (isImgTag) {
        element.style.width = width || 'auto';
        element.style.height = height || 'auto';
        element.style.objectFit = fit || 'fill';
    } else {
        if (!customCssRules[element.id]) { // Should not happen if src was applied
            customCssRules[element.id] = {};
        }
        if (customCssRules[element.id].background && customCssRules[element.id].background.includes('url(')) {
            if (fit === 'cover' || fit === 'contain') {
                customCssRules[element.id]['background-size'] = fit;
            } else if (width && height && width !== 'auto' && height !== 'auto') {
                customCssRules[element.id]['background-size'] = `${width} ${height}`;
            } else if (width && width !== 'auto') {
                customCssRules[element.id]['background-size'] = `${width} auto`;
            } else if (height && height !== 'auto') {
                customCssRules[element.id]['background-size'] = `auto ${height}`;
            } else {
                customCssRules[element.id]['background-size'] = 'cover'; 
            }
        } else if (!customCssRules[element.id].background || !customCssRules[element.id].background.includes('url(')) {
            delete customCssRules[element.id]['background-size'];
        }
    }

    if (!isImgTag) {
        applyCustomCssToIframe();
    }
}

// --- END: Image Editor Functions ---

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
    if (!currentIframeDocument || !currentIframeDocument.head) { // Ensure doc and head exist
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
