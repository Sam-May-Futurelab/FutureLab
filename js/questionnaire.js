// Function to download content as a file
function downloadFile(filename, content, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Make this function globally available for lab.js
window.downloadHtmlContent = function(bodyHtml, cssContent, filename = 'index.html', isOriginal = true) {
    const pageTitle = window.lastProjectName || (isOriginal ? 'Generated Page' : 'Edited Page');
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${pageTitle}</title>
    <style>
        body {
            margin: 0; /* Basic reset */
            padding: 0; /* Basic reset */
        }
${cssContent || '/* No CSS available */'}
    </style>
</head>
<body>
${bodyHtml || '<!-- No HTML content available -->'}
</body>
</html>
    `;
    downloadFile(filename, fullHtml, 'text/html');
    console.log(`${isOriginal ? 'Original' : 'Edited'} page download initiated as: ${filename}`);
};

// --- START: Added for payment flow ---
// Global flag to track payment status, accessible by lab.js too
window.isPaidUser = sessionStorage.getItem('paymentCompleted') === 'true';

async function handleUnlockDownloadsClick() {
    // CRITICAL CHANGE: This function NO LONGER saves HTML/CSS to sessionStorage.
    // The caller (e.g., event listeners for download buttons) is responsible for
    // setting 'paymentAttempt_HTML', 'paymentAttempt_CSS', and 'paymentAttempt_ProjectName'
    // in sessionStorage BEFORE calling this function.

    if (!sessionStorage.getItem('paymentAttempt_HTML') || !sessionStorage.getItem('paymentAttempt_CSS')) {
        alert('Content to be unlocked was not properly prepared. Please try generating or saving your content again, or contact support if the issue persists.');
        console.error('handleUnlockDownloadsClick called without paymentAttempt_HTML or paymentAttempt_CSS in sessionStorage.');
        const generationOverlay = document.querySelector('.generation-overlay');
        if (generationOverlay) generationOverlay.classList.remove('active');
        return;
    }
    // Ensure ProjectName is at least defaulted if not set by caller
    if (!sessionStorage.getItem('paymentAttempt_ProjectName')) {
        sessionStorage.setItem('paymentAttempt_ProjectName', 'Untitled Page');
    }

    try {
        const generationOverlay = document.querySelector('.generation-overlay');
        const generationStep = document.querySelector('.generation-step');
        if (generationOverlay) generationOverlay.classList.add('active');
        if (generationStep) generationStep.textContent = 'Redirecting to payment...';

        const response = await fetch('/api/create-checkout-session', { method: 'POST' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }
        const data = await response.json();
        if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
        } else {
            throw new Error('Checkout URL not provided by server.');
        }
    } catch (error) {
        console.error('Failed to initiate payment:', error);
        alert(`Could not start the payment process: ${error.message}`);
        const generationOverlay = document.querySelector('.generation-overlay');
        if (generationOverlay) generationOverlay.classList.remove('active');
        // Clean up payment attempt items from sessionStorage on error to prevent stale data
        sessionStorage.removeItem('paymentAttempt_HTML');
        sessionStorage.removeItem('paymentAttempt_CSS');
        sessionStorage.removeItem('paymentAttempt_ProjectName');
    }
}
// --- END: Added for payment flow ---


document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const form = document.getElementById('ai-questionnaire');
    const formSteps = document.querySelectorAll('.form-step');
    const progressBar = document.querySelector('.progress-fill');
    const progressSteps = document.querySelectorAll('.progress-step');
    const questionnaireContainer = document.querySelector('.questionnaire-container'); // Added this line
    const nextBtns = document.querySelectorAll('.btn-next');
    const prevBtns = document.querySelectorAll('.btn-prev');
    const generateBtn = document.querySelector('.btn-generate');
    const primaryColorPicker = document.getElementById('primary-color');
    const secondaryColorPicker = document.getElementById('secondary-color');
    const primaryColorHex = document.getElementById('primary-color-hex');
    const secondaryColorHex = document.getElementById('secondary-color-hex');
    const aiColorsCheckbox = document.getElementById('ai-colors');
    const generationOverlay = document.querySelector('.generation-overlay');
    const generationStep = document.querySelector('.generation-step');
    const pagePreview = document.getElementById('page-preview');
    const previewPlaceholderContainer = document.getElementById('preview-placeholder-container'); // Changed to target the container
    const downloadButtonsContainer = document.querySelector('.download-buttons');
    const downloadHtmlBtn = document.getElementById('download-html-btn');
    const downloadCssBtn = document.getElementById('download-css-btn');
    const ctaSectionCheckbox = document.getElementById('cta-section-checkbox');
    const ctaFieldsContainer = document.getElementById('cta-fields-container');
    const socialLinksToggleHeader = document.getElementById('social-links-toggle-header'); 
    const socialInputsContainer = document.getElementById('social-inputs-actual-container'); 
    const socialLinksToggleIcon = socialLinksToggleHeader ? socialLinksToggleHeader.querySelector('.toggle-icon') : null; 
    const seoFieldsToggleHeader = document.getElementById('seo-fields-toggle-header');
    const seoFieldsContainer = document.getElementById('seo-fields-actual-container');
    const seoFieldsToggleIcon = seoFieldsToggleHeader ? seoFieldsToggleHeader.querySelector('.toggle-icon') : null;
    const advancedDesignToggleHeader = document.getElementById('advanced-design-toggle-header'); // Added
    const advancedDesignFieldsContainer = document.getElementById('advanced-design-fields-container'); // Added
    const advancedDesignToggleIcon = advancedDesignToggleHeader ? advancedDesignToggleHeader.querySelector('.toggle-icon') : null; // Added

    // AI Content Suggestion Elements for Hero Headline
    const getHeroSuggestionsBtn = document.getElementById('get-hero-suggestions-btn');
    const heroSuggestionsContainer = document.getElementById('hero-suggestions-container');
    const heroHeadlineInput = document.getElementById('hero-headline');

    // Conditional Page Section Fields
    const aboutSectionCheckbox = document.getElementById('about-section-checkbox');
    const aboutUsFieldsContainer = document.getElementById('about-us-fields-container');
    const testimonialsSectionCheckbox = document.getElementById('testimonials-section-checkbox');
    const testimonialsFieldsContainer = document.getElementById('testimonials-fields-container');
    
    // Consolidated to a single pricing section
    const pricingSectionCheckbox = document.getElementById('pricing-section-checkbox'); 
    const pricingFieldsContainer = document.getElementById('pricing-fields-container'); 

    const featuresSectionCheckbox = document.getElementById('features-section-checkbox'); 
    const featuresBenefitsFieldsContainer = document.getElementById('features-benefits-fields-container'); 
    
    const faqSectionCheckbox = document.getElementById('faq-section-checkbox'); // Added definition
    const faqFieldsContainer = document.getElementById('faq-fields-container'); // Added definition

    const businessTypeDropdown = document.getElementById('business-type'); 
    const otherBusinessTypeContainer = document.getElementById('other-business-type-container'); 
    const otherBusinessTypeInput = document.getElementById('other-business-type'); // Added
    const contactSectionCheckbox = document.getElementById('contact-section-checkbox'); // Added for contact form email
    const contactEmailFieldsContainer = document.getElementById('contact-email-fields-container'); // Added for contact form email
    const contactFormEmailInput = document.getElementById('contact-form-email'); // Added for the actual email input
    
    // Dynamic entry containers and buttons
    const addPricingPlanBtn = document.getElementById('add-pricing-plan-btn'); // Corrected selector
    const pricingPlansDynamicContainer = document.getElementById('pricing-plans-dynamic-container'); // Corrected selector
    let pricingPlanIndex = 0; // Start index for dynamically added plans

    const addTestimonialBtn = document.getElementById('add-testimonial-btn');
    const testimonialsDynamicContainer = document.getElementById('testimonials-dynamic-container');
    let testimonialIndex = 1; // Start index for dynamically added testimonials

    const addFaqBtn = document.getElementById('add-faq-btn');
    const faqDynamicContainer = document.getElementById('faq-dynamic-container');
    let faqIndex = 1; // Start index for dynamically added FAQs
    
    const logoUploadInput = document.getElementById('logo-upload'); 
    const logoUploadLabel = document.querySelector('label[for="logo-upload"]'); // Corrected selector
    const logoFileNameDisplay = document.getElementById('logo-file-name');
    const removeLogoBtn = document.getElementById('remove-logo-btn'); // Added this line

    // Get all section options
    const sectionOptions = document.querySelectorAll('.sections-grid .section-option'); // Added

    let currentStep = 1;
    const totalSteps = formSteps.length;
    let lastGeneratedHTML = '';
    let lastGeneratedCSS = '';
    window.lastProjectName = 'ai-generated-page'; // Initialize on window object

    // Change button text
    if (downloadHtmlBtn) {
        downloadHtmlBtn.textContent = 'Download Original HTML';
    }
    if (downloadCssBtn) {
        downloadCssBtn.textContent = 'Download Original CSS';
    }

    // Initialize form
    initializeForm();
    
    function initializeForm() {
        updateProgressBar();
        setupColorPickers();
        setupEventListeners();
        toggleCTAFieldsVisibility(); // Initial check for CTA fields
        // Initialize SEO fields as collapsed
        if (seoFieldsContainer && seoFieldsToggleHeader && seoFieldsToggleIcon) {
            seoFieldsToggleHeader.setAttribute('aria-expanded', 'false');
            seoFieldsContainer.style.display = 'none';
            seoFieldsToggleIcon.classList.remove('fa-chevron-up');
            seoFieldsToggleIcon.classList.add('fa-chevron-down');
        }
        // Initialize conditional section fields visibility
        toggleConditionalSectionDisplay(aboutSectionCheckbox, aboutUsFieldsContainer);
        toggleConditionalSectionDisplay(testimonialsSectionCheckbox, testimonialsFieldsContainer);
        toggleConditionalSectionDisplay(pricingSectionCheckbox, pricingFieldsContainer); // Consolidated pricing section
        toggleConditionalSectionDisplay(faqSectionCheckbox, faqFieldsContainer); 
        toggleConditionalSectionDisplay(featuresSectionCheckbox, featuresBenefitsFieldsContainer); 
        toggleContactEmailFields(); // MODIFIED: Use specific function for contact email fields
        toggleOtherBusinessTypeVisibility(); // Added: Initial check for "Other" business type

        // Added: Initialize Advanced Design Customizations toggle as collapsed
        if (advancedDesignFieldsContainer && advancedDesignToggleHeader && advancedDesignToggleIcon) {
            advancedDesignToggleHeader.setAttribute('aria-expanded', 'false');
            advancedDesignFieldsContainer.style.display = 'none';
            advancedDesignToggleIcon.classList.remove('fa-chevron-up');
            advancedDesignToggleIcon.classList.add('fa-chevron-down');
        }
    }
    
    function setupEventListeners() {
        // Next button clicks
        nextBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (validateCurrentStep()) {
                    goToNextStep();
                }
            });
        });
        
        // Previous button clicks
        prevBtns.forEach(btn => {
            btn.addEventListener('click', goToPreviousStep);
        });
        
        // Form submission
        form.addEventListener('submit', handleFormSubmit);
        
        // AI colors checkbox
        aiColorsCheckbox.addEventListener('change', toggleColorInputs);
        
        // Allow clicking on progress steps for navigation
        progressSteps.forEach(step => {
            step.addEventListener('click', () => {
                const stepNumber = parseInt(step.dataset.step);
                if (stepNumber < currentStep || validateCurrentStep() || stepNumber === currentStep) { 
                    goToStep(stepNumber);
                }
            });
        });

        // Add event listeners for download buttons
        if (downloadHtmlBtn) {
            downloadHtmlBtn.addEventListener('click', async function() {
                if (!window.isPaidUser) {
                    if (window.lastGeneratedHTML && window.lastGeneratedCSS) {
                        sessionStorage.setItem('paymentAttempt_HTML', window.lastGeneratedHTML);
                        sessionStorage.setItem('paymentAttempt_CSS', window.lastGeneratedCSS);
                        sessionStorage.setItem('paymentAttempt_ProjectName', window.lastProjectName || 'generated-page');
                        console.log('Saved ORIGINAL HTML/CSS to sessionStorage for payment.');
                        await handleUnlockDownloadsClick();
                    } else {
                        alert('No content available to download. Please generate a page first.');
                    }
                } else {
                    if (window.lastGeneratedHTML && window.lastGeneratedCSS) {
                        window.downloadHtmlContent(window.lastGeneratedHTML, window.lastGeneratedCSS, `${window.lastProjectName || 'generated-page'}.html`, true);
                    } else {
                        alert('No content available to download. Please generate a page first.');
                    }
                }
            });
        }

        if (downloadCssBtn) {
            downloadCssBtn.addEventListener('click', async function() {
                if (!window.isPaidUser) {
                     // Even for CSS download, save both HTML and CSS as payment unlocks the "page"
                    if (window.lastGeneratedHTML && window.lastGeneratedCSS) {
                        sessionStorage.setItem('paymentAttempt_HTML', window.lastGeneratedHTML);
                        sessionStorage.setItem('paymentAttempt_CSS', window.lastGeneratedCSS);
                        sessionStorage.setItem('paymentAttempt_ProjectName', window.lastProjectName || 'generated-style');
                        console.log('Saved ORIGINAL HTML/CSS (for CSS download trigger) to sessionStorage for payment.');
                        await handleUnlockDownloadsClick();
                    } else {
                        alert('No CSS available to download. Please generate a page first.');
                    }
                } else {
                    if (window.lastGeneratedCSS) {
                        downloadFile(`${window.lastProjectName || 'generated-styles'}.css`, window.lastGeneratedCSS, 'text/css');
                    } else {
                        alert('No CSS available to download. Please generate a page first.');
                    }
                }
            });
        }
        
        if (ctaSectionCheckbox) {
            ctaSectionCheckbox.addEventListener('change', toggleCTAFieldsVisibility);
        }

        // Event listener for social media links toggle
        if (socialLinksToggleHeader) {
            socialLinksToggleHeader.addEventListener('click', toggleSocialLinksVisibility);
            socialLinksToggleHeader.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault(); 
                    toggleSocialLinksVisibility();
                }
            });
        }

        // Event listener for SEO meta fields toggle
        if (seoFieldsToggleHeader) {
            seoFieldsToggleHeader.addEventListener('click', toggleSEOFieldsVisibility);
            seoFieldsToggleHeader.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleSEOFieldsVisibility();
                }
            });
        }

        // Added: Event listener for Advanced Design Customizations toggle
        if (advancedDesignToggleHeader) {
            advancedDesignToggleHeader.addEventListener('click', toggleAdvancedDesignVisibility);
            advancedDesignToggleHeader.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleAdvancedDesignVisibility();
                }
            });
        }

        // Event listeners for conditional page section checkboxes
        if (aboutSectionCheckbox) {
            aboutSectionCheckbox.addEventListener('change', () => toggleConditionalSectionDisplay(aboutSectionCheckbox, aboutUsFieldsContainer));
        }
        if (testimonialsSectionCheckbox) {
            testimonialsSectionCheckbox.addEventListener('change', () => toggleConditionalSectionDisplay(testimonialsSectionCheckbox, testimonialsFieldsContainer));
        }

        // Listener for the consolidated "Products / Pricing Plans" section
        if (pricingSectionCheckbox) {
            pricingSectionCheckbox.addEventListener('change', () => toggleConditionalSectionDisplay(pricingSectionCheckbox, pricingFieldsContainer));
        }
        
        if (faqSectionCheckbox) { // Corrected: was using undefined variable
            faqSectionCheckbox.addEventListener('change', () => toggleConditionalSectionDisplay(faqSectionCheckbox, faqFieldsContainer));
        }
        if (featuresSectionCheckbox) { 
            featuresSectionCheckbox.addEventListener('change', () => toggleConditionalSectionDisplay(featuresSectionCheckbox, featuresBenefitsFieldsContainer)); 
        } 

        if (contactSectionCheckbox) { // Added for contact form email
            contactSectionCheckbox.addEventListener('change', toggleContactEmailFields);
        }

        // Added: Make entire section-option tile clickable
        if (sectionOptions) {
            sectionOptions.forEach(option => {
                option.addEventListener('click', (event) => {
                    // Prevent clicks on the checkbox or label from triggering this twice
                    if (event.target.type === 'checkbox' || event.target.tagName === 'LABEL' || event.target.classList.contains('checkmark') || event.target.classList.contains('section-name')) {
                        return;
                    }
                    const checkbox = option.querySelector('input[type="checkbox"]');
                    if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                        // Manually trigger change event for conditional logic
                        const changeEvent = new Event('change', { bubbles: true });
                        checkbox.dispatchEvent(changeEvent);
                    }
                });
            });
        }

        // Event listener for adding pricing plans
        if (addPricingPlanBtn) {
            addPricingPlanBtn.addEventListener('click', addPricingPlanEntry);
        } else {
            console.warn("Add Pricing Plan button not found. Dynamic pricing plans might not work.");
        }

        // Event listener for adding testimonials
        if (addTestimonialBtn) {
            addTestimonialBtn.addEventListener('click', addTestimonialEntry);
        }

        // Event listener for adding FAQs
        if (addFaqBtn) {
            addFaqBtn.addEventListener('click', addFaqEntry);
        }

        // Added: Event listener for business type dropdown
        if (businessTypeDropdown) {
            businessTypeDropdown.addEventListener('change', toggleOtherBusinessTypeVisibility);
        }

        // Event listener for custom file upload
        if (logoUploadLabel && logoUploadInput) {
            logoUploadLabel.addEventListener('click', (e) => {
                // If the label is not directly associated with input via `for` attribute matching input's ID,
                // or to ensure click even if it is, explicitly trigger input click.
                // e.preventDefault(); // Prevent default if label's `for` is set to input's ID, to avoid double trigger.
                logoUploadInput.click();
            });
            logoUploadInput.addEventListener('change', () => {
                if (logoFileNameDisplay) {
                    if (logoUploadInput.files && logoUploadInput.files.length > 0) {
                        logoFileNameDisplay.textContent = logoUploadInput.files[0].name;
                        if (removeLogoBtn) removeLogoBtn.style.display = 'inline-block'; // Show remove button
                    } else {
                        logoFileNameDisplay.textContent = 'No file chosen';
                        if (removeLogoBtn) removeLogoBtn.style.display = 'none'; // Hide remove button
                    }
                }
            });
        }

        // Added: Event listener for remove logo button
        if (removeLogoBtn) {
            removeLogoBtn.addEventListener('click', () => {
                if (logoUploadInput) {
                    logoUploadInput.value = ''; // Clear the file input
                }
                if (logoFileNameDisplay) {
                    logoFileNameDisplay.textContent = 'No file chosen'; // Reset file name display
                }
                removeLogoBtn.style.display = 'none'; // Hide the remove button itself
            });
        }

        // Event listener for Hero Headline AI Suggestions
        if (getHeroSuggestionsBtn) {
            getHeroSuggestionsBtn.addEventListener('click', fetchHeroHeadlineSuggestions);
        }
    }
    
    function goToNextStep() {
        if (currentStep < totalSteps) {
            formSteps[currentStep - 1].classList.remove('active');
            currentStep++;
            const activeStep = formSteps[currentStep - 1];
            activeStep.classList.add('active');
            updateProgressBar();
            // Scroll to the top of the questionnaire container
            if (questionnaireContainer) {
                questionnaireContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }
    
    function goToPreviousStep() {
        if (currentStep > 1) {
            formSteps[currentStep - 1].classList.remove('active');
            currentStep--;
            const activeStep = formSteps[currentStep - 1];
            activeStep.classList.add('active');
            updateProgressBar();
            // Scroll to the top of the questionnaire container
            if (questionnaireContainer) {
                questionnaireContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }
    
    function goToStep(stepNumber) {
        formSteps[currentStep - 1].classList.remove('active');
        currentStep = stepNumber;
        const activeStep = formSteps[currentStep - 1];
        activeStep.classList.add('active');
        updateProgressBar();
        // Scroll to the top of the questionnaire container
        if (questionnaireContainer) {
            questionnaireContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    function updateProgressBar() {
        // Update progress bar fill
        const progressPercentage = (currentStep - 1) / (totalSteps - 1) * 100;
        progressBar.style.width = `${progressPercentage}%`;
        
        // Update step indicators
        progressSteps.forEach((step, index) => {
            const stepNum = index + 1;
            // Reset all classes first
            step.classList.remove('active', 'completed');
            
            // Add appropriate classes based on current step
            if (stepNum === currentStep) {
                step.classList.add('active');
            } else if (stepNum < currentStep) {
                step.classList.add('completed');
            }
        });
    }
    
    function validateCurrentStep() {
        const currentStepElement = formSteps[currentStep - 1];
        const requiredInputs = currentStepElement.querySelectorAll('input[required]:not([disabled]), textarea[required]:not([disabled]), select[required]:not([disabled])');
        let isValid = true;
        
        requiredInputs.forEach(input => {
            // For radio buttons, check if any in the group is selected
            if (input.type === 'radio') {
                const radioGroup = currentStepElement.querySelectorAll(`input[name="${input.name}"][required]`);
                if (!Array.from(radioGroup).some(radio => radio.checked)) {
                    isValid = false;
                    // Highlight the first radio in the group or a container
                    highlightInvalidInput(radioGroup[0]); 
                } else {
                    Array.from(radioGroup).forEach(radio => removeInvalidHighlight(radio));
                }
            } else if (!input.value.trim()) {
                isValid = false;
                highlightInvalidInput(input);
            } else {
                removeInvalidHighlight(input);
            }
        });

        // Specific validation for business type dropdown
        if (currentStepElement.contains(document.getElementById('business-type'))) {
            const businessTypeDropdown = document.getElementById('business-type');
            if (businessTypeDropdown && businessTypeDropdown.value === '') {
                isValid = false;
                highlightInvalidInput(businessTypeDropdown);
            } else if (businessTypeDropdown) {
                removeInvalidHighlight(businessTypeDropdown);
            }
        }

        // Validate dynamically added pricing plans if the section is visible and active
        const pricingCheckbox = document.querySelector('input[name="sections[]"][value="pricing"]');
        if (pricingCheckbox && pricingCheckbox.checked && currentStepElement.contains(pricingPlansDynamicContainer)) {
            const priceInputs = pricingPlansDynamicContainer.querySelectorAll('input[name^="pricingPlans"][name$="[price]"][required]');
            priceInputs.forEach(priceInput => {
                if (!priceInput.value.trim()) {
                    isValid = false;
                    highlightInvalidInput(priceInput);
                } else {
                    removeInvalidHighlight(priceInput);
                }
            });
        }
        
        if (!isValid) {
            const activeStep = formSteps[currentStep - 1];
            if (activeStep) {
                activeStep.scrollIntoView({ behavior: 'auto', block: 'start' }); 
            }
        }
        
        return isValid;
    }
    
    function highlightInvalidInput(input) {
        input.classList.add('invalid');
        input.style.borderColor = '#ef4444';
        
        // Add shake animation
        input.classList.add('shake');
        
        // Listen for input to remove error styling
        const removeErrorStyling = () => {
            removeInvalidHighlight(input);
            input.removeEventListener('input', removeErrorStyling);
        };
        
        input.addEventListener('input', removeErrorStyling);
        
        // Remove animation class after it completes
        setTimeout(() => {
            input.classList.remove('shake');
        }, 500);
    }
    
    function removeInvalidHighlight(input) {
        input.classList.remove('invalid');
        input.style.borderColor = '';
    }
    
    function setupColorPickers() {
        // Sync color picker with hex input
        primaryColorPicker.addEventListener('input', () => {
            primaryColorHex.value = primaryColorPicker.value.toUpperCase();
        });
        
        secondaryColorPicker.addEventListener('input', () => {
            secondaryColorHex.value = secondaryColorPicker.value.toUpperCase();
        });
        
        // Sync hex input with color picker
        primaryColorHex.addEventListener('input', () => {
            if (isValidHex(primaryColorHex.value)) {
                primaryColorPicker.value = primaryColorHex.value;
            }
        });
        
        secondaryColorHex.addEventListener('input', () => {
            if (isValidHex(secondaryColorHex.value)) {
                secondaryColorPicker.value = secondaryColorHex.value;
            }
        });
        
        // Ensure hex inputs always have # prefix
        [primaryColorHex, secondaryColorHex].forEach(input => {
            input.addEventListener('blur', () => {
                let value = input.value.trim();
                if (value && !value.startsWith('#')) {
                    input.value = '#' + value;
                }
                
                // Validate and format
                if (isValidHex(input.value)) {
                    // Ensure uppercase for consistency
                    input.value = input.value.toUpperCase();
                } else {
                    // Reset to default if invalid
                    input.value = input === primaryColorHex ? '#4361EE' : '#4CC9F0';
                }
            });
        });
        
        // Initial state check for AI colors checkbox
        toggleColorInputs();
    }
    
    function isValidHex(hex) {
        return /^#?([0-9A-F]{3}){1,2}$/i.test(hex);
    }

    function toggleCTAFieldsVisibility() {
        if (ctaSectionCheckbox && ctaFieldsContainer) {
            ctaFieldsContainer.style.display = ctaSectionCheckbox.checked ? 'block' : 'none';
        }
    }

    function toggleSocialLinksVisibility() {
        if (socialInputsContainer && socialLinksToggleHeader && socialLinksToggleIcon) {
            const isExpanded = socialLinksToggleHeader.getAttribute('aria-expanded') === 'true';
            socialLinksToggleHeader.setAttribute('aria-expanded', String(!isExpanded));
            socialInputsContainer.style.display = isExpanded ? 'none' : 'block';
            socialLinksToggleIcon.classList.toggle('fa-chevron-down', isExpanded);
            socialLinksToggleIcon.classList.toggle('fa-chevron-up', !isExpanded);
        }
    }

    function toggleSEOFieldsVisibility() {
        if (seoFieldsContainer && seoFieldsToggleHeader && seoFieldsToggleIcon) {
            const isExpanded = seoFieldsToggleHeader.getAttribute('aria-expanded') === 'true';
            seoFieldsToggleHeader.setAttribute('aria-expanded', String(!isExpanded));
            seoFieldsContainer.style.display = isExpanded ? 'none' : 'block';
            seoFieldsToggleIcon.classList.toggle('fa-chevron-down', isExpanded);
            seoFieldsToggleIcon.classList.toggle('fa-chevron-up', !isExpanded);
        }
    }

    // Added: Function to toggle visibility of Advanced Design Customizations
    function toggleAdvancedDesignVisibility() {
        if (advancedDesignFieldsContainer && advancedDesignToggleHeader && advancedDesignToggleIcon) {
            const isExpanded = advancedDesignToggleHeader.getAttribute('aria-expanded') === 'true';
            advancedDesignToggleHeader.setAttribute('aria-expanded', String(!isExpanded));
            advancedDesignFieldsContainer.style.display = isExpanded ? 'none' : 'block';
            advancedDesignToggleIcon.classList.toggle('fa-chevron-down', isExpanded);
            advancedDesignToggleIcon.classList.toggle('fa-chevron-up', !isExpanded);
        }
    }

    function toggleConditionalSectionDisplay(checkbox, container) {
        if (checkbox && container) {
            const isChecked = checkbox.checked;
            container.style.display = isChecked ? 'block' : 'none';

            // Find all elements within the container that have the 'required' attribute.
            const requiredElementsInContainer = container.querySelectorAll('[required]');

            requiredElementsInContainer.forEach(el => {
                el.disabled = !isChecked; // Disable if section is hidden, enable if shown.
                                          // Disabled elements are not validated by the browser or custom validation.
                if (!isChecked) {
                    // If hidden, also remove any 'invalid' class
                    if (el.classList.contains('invalid')) {
                        removeInvalidHighlight(el); // Assuming removeInvalidHighlight is available
                    }
                    // Optionally, clear values if needed, though disabled fields aren't submitted.
                    // if (el.type !== 'checkbox' && el.type !== 'radio' && el.tagName.toLowerCase() !== 'select') {
                    //     el.value = '';
                    // } else if (el.tagName.toLowerCase() === 'select') {
                    //     el.selectedIndex = 0; // Or reset to a default/placeholder
                    // }
                }
            });

            // Auto-add a pricing plan entry if the "Products / Pricing Plans" section is checked
            // and the dynamic container for plans is empty.
            if (isChecked && container === pricingFieldsContainer && pricingPlansDynamicContainer && pricingPlansDynamicContainer.children.length === 0) {
                // This ensures that if the user checks the box, at least one plan entry form is available.
                // The static plan's inputs are handled by the loop above.
                addPricingPlanEntry();
            }
        }
    }

    // Added: Function to toggle visibility of "Other business type" input
    function toggleOtherBusinessTypeVisibility() {
        if (businessTypeDropdown && otherBusinessTypeContainer) {
            if (businessTypeDropdown.value === 'other') {
                otherBusinessTypeContainer.style.display = 'block';
                if(otherBusinessTypeInput) otherBusinessTypeInput.required = true;
            } else {
                otherBusinessTypeContainer.style.display = 'none';
                if(otherBusinessTypeInput) {
                    otherBusinessTypeInput.required = false;
                    otherBusinessTypeInput.value = ''; // Clear the value if hidden
                }
            }
        }
    }

    // Added: Function to toggle visibility and validation of contact email fields
    function toggleContactEmailFields() {
        if (contactSectionCheckbox && contactEmailFieldsContainer && contactFormEmailInput) {
            const isChecked = contactSectionCheckbox.checked;
            contactEmailFieldsContainer.style.display = isChecked ? 'block' : 'none';
            contactFormEmailInput.required = isChecked;
            if (!isChecked) {
                contactFormEmailInput.value = ''; // Clear value if hidden
                if (contactFormEmailInput.classList.contains('invalid')) { 
                     removeInvalidHighlight(contactFormEmailInput); // Clear validation styling if it was marked invalid
                }
            }
        }
    }

    function addPricingPlanEntry() {
        if (!pricingPlansDynamicContainer) {
            console.error("Pricing plans dynamic container (pricing-plans-dynamic-container) not found!");
            return;
        }

        const entryIndex = pricingPlansDynamicContainer.children.length; // Use current children length for unique index

        const newEntry = document.createElement('div');
        newEntry.classList.add('pricing-plan-entry', 'form-subsection');
        // Ensure the title is "Product / Plan" and the numbering is correct
        newEntry.innerHTML = `
            <h5 class="subsection-title">Product / Plan ${entryIndex + 1}</h5>
            <div class="form-field">
                <label for="pricing-plan-name-${entryIndex}">Plan/Product Name:</label>
                <input type="text" id="pricing-plan-name-${entryIndex}" name="pricingPlans[${entryIndex}][name]" placeholder="e.g., Basic, Pro, Website Tier 1">
            </div>
            <div class="form-field price-field-group">
                <label for="pricing-plan-price-${entryIndex}">Price:</label>
                <input type="number" id="pricing-plan-price-${entryIndex}" name="pricingPlans[${entryIndex}][price]" placeholder="e.g., 10" required step="any">
                <select id="pricing-plan-currency-${entryIndex}" name="pricingPlans[${entryIndex}][currency]" aria-label="Currency">
                    <option value="USD">$ (USD)</option>
                    <option value="GBP">£ (GBP)</option>
                    <option value="EUR">€ (EUR)</option>
                    <option value="CAD">$ (CAD)</option>
                    <option value="AUD">$ (AUD)</option>
                    <option value="JPY">¥ (JPY)</option>
                </select>
                <select id="pricing-plan-cycle-${entryIndex}" name="pricingPlans[${entryIndex}][cycle]" aria-label="Billing Cycle">
                    <option value="/month">/month</option>
                    <option value="/year">/year</option>
                    <option value="one-time">one-time</option>
                    <option value="">(no cycle)</option>
                </select>
            </div>
            <div class="form-field">
                <label for="pricing-plan-features-${entryIndex}">Key Features (1-3, comma-separated):</label>
                <input type="text" id="pricing-plan-features-${entryIndex}" name="pricingPlans[${entryIndex}][features]" placeholder="e.g., Feature 1, Feature 2, Feature 3">
            </div>
            <button type="button" class="btn btn-remove-item btn-danger btn-sm" aria-label="Remove this pricing plan">
                <i class="fas fa-trash-alt"></i> Remove Plan
            </button>
        `;

        pricingPlansDynamicContainer.appendChild(newEntry);

        const removeBtn = newEntry.querySelector('.btn-remove-item');
        removeBtn.addEventListener('click', () => {
            newEntry.remove();
            // Re-title subsections
            const remainingEntries = pricingPlansDynamicContainer.querySelectorAll('.pricing-plan-entry');
            remainingEntries.forEach((entry, idx) => {
                const titleElement = entry.querySelector('.subsection-title');
                if (titleElement) {
                    titleElement.textContent = `Product / Plan ${idx + 1}`;
                }
            });
        });
    }

    function addTestimonialEntry() {
        if (!testimonialsDynamicContainer) return;

        const newEntry = document.createElement('div');
        newEntry.classList.add('testimonial-entry'); // Use a specific class for styling if needed
        newEntry.innerHTML = `
            <div class="form-field">
                <label for="testimonial-text-${testimonialIndex}">Testimonial Text:</label>
                <textarea id="testimonial-text-${testimonialIndex}" name="testimonials[${testimonialIndex}][text]" placeholder="e.g., Another great testimonial!" rows="3"></textarea>
            </div>
            <div class="form-field">
                <label for="testimonial-author-${testimonialIndex}">Author Name:</label>
                <input type="text" id="testimonial-author-${testimonialIndex}" name="testimonials[${testimonialIndex}][author]" placeholder="e.g., John Smith">
            </div>
            <div class="form-field">
                <label for="testimonial-title-${testimonialIndex}">Author Title/Company (Optional):</label>
                <input type="text" id="testimonial-title-${testimonialIndex}" name="testimonials[${testimonialIndex}][title]" placeholder="e.g., Lead Designer, Creative Solutions">
            </div>
            <button type="button" class="btn btn-remove-item" aria-label="Remove this testimonial entry">
                <i class="fas fa-trash-alt"></i> Remove
            </button>
        `;

        testimonialsDynamicContainer.appendChild(newEntry);

        const removeBtn = newEntry.querySelector('.btn-remove-item');
        removeBtn.addEventListener('click', () => {
            newEntry.remove();
        });

        testimonialIndex++;
    }

    function addFaqEntry() {
        if (!faqDynamicContainer) return;

        const newEntry = document.createElement('div');
        newEntry.classList.add('faq-entry'); // Use a specific class for styling if needed
        newEntry.innerHTML = `
            <div class="form-field">
                <label for="faq-question-${faqIndex}">Question:</label>
                <input type="text" id="faq-question-${faqIndex}" name="faqs[${faqIndex}][question]" placeholder="e.g., How does this work?">
            </div>
            <div class="form-field">
                <label for="faq-answer-${faqIndex}">Answer:</label>
                <textarea id="faq-answer-${faqIndex}" name="faqs[${faqIndex}][answer]" placeholder="e.g., It works by..." rows="2"></textarea>
            </div>
            <button type="button" class="btn btn-remove-item" aria-label="Remove this FAQ entry">
                <i class="fas fa-trash-alt"></i> Remove
            </button>
        `;

        faqDynamicContainer.appendChild(newEntry);

        const removeBtn = newEntry.querySelector('.btn-remove-item');
        removeBtn.addEventListener('click', () => {
            newEntry.remove();
        });

        faqIndex++;
    }

    function formatCTAAction(value) {
        const emailPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        const phonePattern = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        const urlPattern = /^(https?:\/\/|www\.)|[\w-]+\.[a-z]{2,}(\/\S*)?$/i;
        const mailtoTelPattern = /^(mailto:|tel:)/i;

        value = value.trim();

        if (mailtoTelPattern.test(value)) {
            return value;
        }

        if (emailPattern.test(value)) {
            return `mailto:${value}`;
        } else if (phonePattern.test(value)) {
            return `tel:${value.replace(/[^0-9+]/g, '')}`;
        } else if (urlPattern.test(value) && !value.startsWith('http://') && !value.startsWith('https://')) {
            return `https://${value}`;
        } else if (value.includes('.') && !value.includes(' ') && !value.startsWith('http')) {
             return `https://${value}`;
        }

        return value;
    }
    
    function toggleColorInputs() {
        const colorInputs = document.querySelectorAll('.color-inputs input');
        const isDisabled = aiColorsCheckbox.checked;
        
        colorInputs.forEach(input => {
            input.disabled = isDisabled;
            input.style.opacity = isDisabled ? '0.5' : '1';
        });
    }

    async function fetchHeroHeadlineSuggestions() {
        if (!getHeroSuggestionsBtn || !heroSuggestionsContainer || !heroHeadlineInput) return;

        const businessDescription = document.getElementById('business-description')?.value || '';
        const targetAudience = document.getElementById('target-audience')?.value || '';
        const primaryGoal = document.getElementById('primary-goal')?.value || '';

        if (!businessDescription && !targetAudience && !primaryGoal) {
            alert('Please fill in Business Description, Target Audience, or Primary Goal in Step 2 to get relevant suggestions.');
            // Optionally, focus the first empty field or the relevant step
            // goToStep(2); // Example: navigate to step 2
            // document.getElementById('business-description').focus();
            return;
        }

        getHeroSuggestionsBtn.disabled = true;
        getHeroSuggestionsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Getting...';
        heroSuggestionsContainer.style.display = 'block';
        heroSuggestionsContainer.innerHTML = '<p class="loading-suggestions">Fetching suggestions...</p>';

        try {
            const response = await fetch('/api/generate-suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fieldType: 'heroHeadline',
                    context: {
                        businessDescription,
                        targetAudience,
                        primaryGoal
                    }
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to get suggestions. Please try again.' }));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const suggestions = await response.json();

            if (suggestions && suggestions.length > 0) {
                heroSuggestionsContainer.innerHTML = ''; // Clear loading message
                const ul = document.createElement('ul');
                ul.classList.add('suggestions-list');
                suggestions.forEach(suggestion => {
                    const li = document.createElement('li');
                    li.textContent = suggestion;
                    li.classList.add('suggestion-item');
                    li.addEventListener('click', () => {
                        heroHeadlineInput.value = suggestion;
                        heroSuggestionsContainer.style.display = 'none'; // Hide after selection
                        heroSuggestionsContainer.innerHTML = ''; // Clear suggestions
                    });
                    ul.appendChild(li);
                });
                heroSuggestionsContainer.appendChild(ul);
            } else {
                heroSuggestionsContainer.innerHTML = '<p class="no-suggestions">No suggestions available at the moment. Try refining your project details.</p>';
            }

        } catch (error) {
            console.error('Error fetching hero headline suggestions:', error);
            heroSuggestionsContainer.innerHTML = `<p class="error-suggestions">Error: ${error.message}</p>`;
        }
        finally {
            getHeroSuggestionsBtn.disabled = false;
            getHeroSuggestionsBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Suggest';
        }
    }
    
    function handleFormSubmit(e) {
        e.preventDefault();
        if (validateCurrentStep()) {
            const ctaActionInput = document.getElementById('cta-action');
            if (ctaActionInput) {
                ctaActionInput.value = formatCTAAction(ctaActionInput.value);
            }

            const formData = new FormData(form);
            
            getAICodeGeneration(formData); // New call to fetch from backend
        } else {
            console.log("Final step validation failed.");
        }
    }
    
    async function getAICodeGeneration(formData) {
        generationOverlay.classList.add('active');
        generationStep.textContent = 'Connecting to AI assistant...';

        // --- START: Lab-themed loading messages --- 
        const labMessages = [
            "Initializing the flux capacitor...",
            "Reticulating splines...",
            "Polishing the pixels...",
            "Charging the creativity circuits...",
            "Aligning the design constellations...",
            "Brewing a fresh batch of code...",
            "Giving the pixels their sparkle...",
            "Untangling the digital spaghetti...",
            "Warming up the innovation engines...",
            "Making sure all the 1s and 0s are in a happy relationship...",
            "Consulting the digital crystal ball for your design...",
            "Our AI is in its digital zen garden, contemplating your perfect page...",
            "Shaking the magic 8-ball for design inspiration...",
            "Teaching the AI to fetch... your amazing new website!",
            "Assembling the digital building blocks... carefully!",
            "Don't worry, the tiny robots building your page are on a coffee break (a very short one!).",
            "Generating pure web magic, please hold...",
            "The AI is currently performing a digital interpretive dance to design your page."
        ];
        let messageIndex = 0;
        generationStep.textContent = labMessages[messageIndex];
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % labMessages.length;
            generationStep.textContent = labMessages[messageIndex];
        }, 2500); // Change message every 2.5 seconds
        // --- END: Lab-themed loading messages ---

        // Ensure placeholder is visible and iframe is hidden initially for this process
        if (previewPlaceholderContainer) {
            previewPlaceholderContainer.style.display = 'block';
            const placeholderTextElement = previewPlaceholderContainer.querySelector('.preview-placeholder-text');
            if (placeholderTextElement) {
                placeholderTextElement.textContent = 'Your generated page will appear here once you complete the questionnaire.'; // Reset placeholder text
            }
        }
        if (pagePreview) {
            pagePreview.style.display = 'none';
            pagePreview.removeAttribute('srcdoc'); // Clear iframe content
        }

        if (downloadButtonsContainer) downloadButtonsContainer.style.display = 'none';

        const data = {};
        const sections = [];
        const sellingPoints = [];
        const socials = {};
        const testimonials = [];
        const pricingPlans = [];
        const faqs = [];

        // Handle logo upload first
        let logoData = null;
        if (logoUploadInput && logoUploadInput.files && logoUploadInput.files[0]) {
            try {
                generationStep.textContent = 'Processing logo...';
                logoData = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(logoUploadInput.files[0]);
                });
            } catch (error) {
                console.error('Error reading logo file:', error);
                generationStep.textContent = 'Error processing logo. Continuing without it.';
            }
        }
        data.logoData = logoData; // Add logoData (Base64 string or null)

        // Collect logo position
        const logoPositionInput = document.querySelector('input[name="logoPosition"]:checked');
        data.logoPosition = logoPositionInput ? logoPositionInput.value : 'left'; // Default to 'left' if not found

        // Collect new creativity inputs
        const inspirationWebsites = document.getElementById('inspiration-websites');
        const mustHaveElements = document.getElementById('must-have-elements');
        const thingsToAvoid = document.getElementById('things-to-avoid');

        if (inspirationWebsites && inspirationWebsites.value.trim()) {
            data.inspirationWebsites = inspirationWebsites.value.trim();
        }
        if (mustHaveElements && mustHaveElements.value.trim()) {
            data.mustHaveElements = mustHaveElements.value.trim();
        }
        if (thingsToAvoid && thingsToAvoid.value.trim()) {
            data.thingsToAvoid = thingsToAvoid.value.trim();
        }

        for (const [key, value] of formData.entries()) {
            if (key === 'logoUpload' || key === 'logoPosition') { 
                continue;
            }
            if (key === 'business-type' && value === 'other') {
                data['businessType'] = formData.get('other-business-type') ? formData.get('other-business-type').trim() : 'Other';
                continue; 
            }
            if (key === 'other-business-type') {
                continue;
            }
            if (key.startsWith('sections[')) {
                sections.push(value);
            } else if (key.startsWith('sellingPoints[')) {
                if (value.trim()) sellingPoints.push(value.trim());
            } else if (key.startsWith('socials[')) {
                const platform = key.match(/socials\[(.*?)\]/)[1];
                if (value.trim()) socials[platform] = value.trim();
            } else if (key.startsWith('testimonials[')) {
                const match = key.match(/testimonials\[(\d+)\]\[(.*?)\]/);
                if (match) {
                    const index = parseInt(match[1]);
                    const field = match[2];
                    if (!testimonials[index]) testimonials[index] = {};
                    if (value.trim()) testimonials[index][field] = value.trim();
                }
            } else if (key.startsWith('pricingPlans[')) {
                const match = key.match(/pricingPlans\[(\d+)\]\[(.*?)\]/);
                if (match) {
                    const index = parseInt(match[1]);
                    const field = match[2];
                    if (!pricingPlans[index]) pricingPlans[index] = {};
                    if (value.trim() || field === 'price') { // Allow empty strings for non-price fields, but price is crucial
                        pricingPlans[index][field] = value.trim();
                    }
                }
            } else if (key.startsWith('faqs[')) {
                const match = key.match(/faqs\[(\d+)\]\[(.*?)\]/);
                if (match) {
                    const index = parseInt(match[1]);
                    const field = match[2];
                    if (!faqs[index]) faqs[index] = {};
                    if (value.trim()) faqs[index][field] = value.trim();
                }
            } else {
                if (value.trim()) data[key] = value.trim();
            }
        }
        data.sections = sections;
        data.sellingPoints = sellingPoints.filter(sp => sp); // Filter out empty selling points
        data.socials = socials;
        data.testimonials = testimonials.filter(t => t && (t.text || t.author)); // Filter out empty testimonials
        data.pricingPlans = pricingPlans.filter(p => p && p.price); // Ensure price is present
        data.faqs = faqs.filter(f => f && (f.question || f.answer)); // Filter out empty FAQs
        
        // Update project name for downloads
        const projectNameFromForm = data.businessName || 'My Awesome Project';
        window.lastProjectName = projectNameFromForm.toLowerCase().replace(/\s+/g, '-') || 'ai-generated-page';

        try {
            const response = await fetch('/api/generate-page', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (e) {
                    // If parsing errorData fails, create a generic one
                    errorData = { message: `Server returned status ${response.status} but failed to parse the error response body.` };
                }

                // --- START: Clear interval on error ---
                clearInterval(messageInterval);
                // --- END: Clear interval on error ---

                const userFriendlyErrorMessage = "Oops! Looks like there's an error, don't worry, we're working on it!!";

                if (response.status === 429) {
                    handleRateLimitError(errorData.message || "Too many requests. Please wait a minute and try again.");
                } else {
                    const technicalErrorMessage = errorData.message || `HTTP error! status: ${response.status}`;
                    console.error('Server error:', technicalErrorMessage);
                    generationStep.textContent = userFriendlyErrorMessage; // Use user-friendly message
                    displayErrorInPreview(userFriendlyErrorMessage); // Use user-friendly message
                    setTimeout(() => { generationOverlay.classList.remove('active'); }, 5000); // Increased timeout for user to read
                }
                return; // Stop further processing
            }

            const aiOutput = await response.json();
            
            // --- START: Clear interval on success ---
            clearInterval(messageInterval);
            // --- END: Clear interval on success ---
            generationStep.textContent = 'Finalizing your page...';
            
            lastGeneratedHTML = aiOutput.html || '<!-- No HTML generated -->';
            lastGeneratedCSS = aiOutput.css || '/* No CSS generated */';

            let previewDocContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>AI Generated Preview</title>
                    <style>
                        body { 
                            margin: 0; 
                            padding: 15px; 
                            background-color: #f0f0f0; 
                            color: #333; 
                            font-family: sans-serif; 
                        }
                        ${aiOutput.css || '/* No CSS from AI */'}
                    </style>
                </head>
                <body>
                    ${aiOutput.html || '<!-- No HTML content to display -->'}
                </body>
                </html>
            `;

            setTimeout(() => { 
                generationOverlay.classList.remove('active');
                
                if (previewPlaceholderContainer) {
                    previewPlaceholderContainer.style.display = 'none'; 
                }

                if (pagePreview) {
                    pagePreview.style.display = 'block'; 

                    // REMOVED: The problematic pagePreview.onload assignment.
                    // The lab.js script, which hosts the iframe, has an iframe 'load' event listener.
                    // That listener is now solely responsible for calling window.setInPageEditMode 
                    // to initialize or update the in-page editor state when the iframe's content (srcdoc) is loaded.
                    // This change prevents the "initInPageEditor function not found" warning that originated here.

                    // Set the srcdoc to load the content. 
                    // The 'load' event will fire on pagePreview (the iframe element in lab.html),
                    // which lab.js listens to.
                    pagePreview.srcdoc = previewDocContent;

                } else {
                    console.error('pagePreview (iframe) element not found for content injection!');
                    displayErrorInPreview('Preview iframe not found.'); 
                }
                
                if (downloadButtonsContainer) downloadButtonsContainer.style.display = 'block';
                
                // MODIFIED SCROLL LOGIC for successful generation
                if (pagePreview) { // Changed from questionnaireContainer to pagePreview
                    pagePreview.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 1000);

        } catch (error) { // Catches network errors or errors in the success processing path
            console.error('Error in getAICodeGeneration:', error);
            generationStep.textContent = `Error: ${error.message}. Please try again.`;
            displayErrorInPreview(error.message); // Use helper
            // MODIFIED SCROLL for catch block errors
            if (questionnaireContainer) {
                questionnaireContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // --- START: Clear interval on catch ---
            clearInterval(messageInterval);
            // --- END: Clear interval on catch ---
            setTimeout(() => {
                 generationOverlay.classList.remove('active');
            }, 3000); 
        }
    }

    // Helper function to display error messages in the preview area
    function displayErrorInPreview(errorMessage) {
        if (previewPlaceholderContainer) {
            const placeholderTextElement = previewPlaceholderContainer.querySelector('.preview-placeholder-text');
            if (placeholderTextElement) {
                placeholderTextElement.innerHTML = `<p style="color: red; text-align: center; font-weight: bold;">Failed to generate page: ${errorMessage}</p>`;
            }
            previewPlaceholderContainer.style.display = 'block';
            // MODIFIED SCROLL for displayErrorInPreview
            if (questionnaireContainer) {
                questionnaireContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        if (pagePreview) { // Hide iframe on error
            pagePreview.style.display = 'none';
            pagePreview.removeAttribute('srcdoc');
        }
    }

    // New function to handle rate limit errors (429)
    function handleRateLimitError(apiErrorMessage) {
        const userFriendlyMessage = "Hold on! We're making a lot of requests to the AI right now. Please wait about a minute before trying again. If this continues, you might need to check your OpenAI plan and billing details.";
        
        generationStep.textContent = userFriendlyMessage;
        // Display a more specific error in the preview area, including API message if available
        displayErrorInPreview(userFriendlyMessage + (apiErrorMessage && apiErrorMessage !== "Too many requests. Please wait a minute and try again." ? ` (Details: ${apiErrorMessage})` : ""));
        // MODIFIED SCROLL for handleRateLimitError
        if (questionnaireContainer) {
            questionnaireContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (generateBtn) {
            generateBtn.disabled = true;
            const btnTextElement = generateBtn.querySelector('.btn-text');
            const originalBtnText = btnTextElement.textContent; // Store original text for restoration
            
            let countdown = 60; // 60 seconds cooldown
            btnTextElement.textContent = `Wait ${countdown}s`;

            const intervalId = setInterval(() => {
                countdown--;
                if (countdown > 0) {
                    btnTextElement.textContent = `Wait ${countdown}s`;
                } else {
                    clearInterval(intervalId);
                    generateBtn.disabled = false;
                    btnTextElement.textContent = originalBtnText; // Restore original button text
                    generationStep.textContent = 'You can try generating again now.'; 
                    
                    // Optionally reset the placeholder text if it's still showing the rate limit message
                    if (previewPlaceholderContainer) {
                        const placeholderTextElement = previewPlaceholderContainer.querySelector('.preview-placeholder-text');
                        if (placeholderTextElement && placeholderTextElement.innerHTML.includes("Hold on!")) {
                             placeholderTextElement.textContent = 'Your generated page will appear here once you complete the questionnaire.';
                        }
                    }
                }
            }, 1000);
        }
        
        // Remove overlay after a short delay to show the message and disabled button clearly.
        setTimeout(() => {
            generationOverlay.classList.remove('active');
        }, 1500); 
    }

    function downloadHTML() {
        if (lastGeneratedHTML) {
            // Call the global download function with HTML body, CSS, filename, and 'original' flag
            window.downloadHtmlContent(lastGeneratedHTML, lastGeneratedCSS, `${window.lastProjectName}-original.html`, true);
        } else {
            alert("No HTML content has been generated yet.");
        }
    }

    function downloadCSS() {
        if (lastGeneratedCSS) {
            downloadFile(`${window.lastProjectName}-original.css`, lastGeneratedCSS, 'text/css');
        } else {
            alert("No CSS content has been generated yet.");
        }
    }
    
    // Add CSS animation for invalid inputs
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
        }
        
        .shake {
            animation: shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
    `;
    document.head.appendChild(styleSheet);
});
