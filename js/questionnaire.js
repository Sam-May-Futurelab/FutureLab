document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const form = document.getElementById('ai-questionnaire');
    const formSteps = document.querySelectorAll('.form-step');
    const progressBar = document.querySelector('.progress-fill');
    const progressSteps = document.querySelectorAll('.progress-step');
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

    // Conditional Page Section Fields
    const aboutSectionCheckbox = document.getElementById('about-section-checkbox');
    const aboutUsFieldsContainer = document.getElementById('about-us-fields-container');
    const testimonialsSectionCheckbox = document.getElementById('testimonials-section-checkbox');
    const testimonialsFieldsContainer = document.getElementById('testimonials-fields-container');
    const pricingSectionCheckbox = document.getElementById('pricing-section-checkbox');
    const pricingFieldsContainer = document.getElementById('pricing-fields-container');
    const faqSectionCheckbox = document.getElementById('faq-section-checkbox');
    const faqFieldsContainer = document.getElementById('faq-fields-container');
    const addPricingPlanBtn = document.getElementById('add-pricing-plan-btn');
    const pricingPlansDynamicContainer = document.getElementById('pricing-plans-dynamic-container');
    let pricingPlanIndex = 1; // Start index for dynamically added plans
    
    let currentStep = 1;
    const totalSteps = formSteps.length;
    let lastGeneratedHTML = '';
    let lastGeneratedCSS = '';
    let lastProjectName = 'ai-generated-page';

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
        toggleConditionalSectionDisplay(pricingSectionCheckbox, pricingFieldsContainer);
        toggleConditionalSectionDisplay(faqSectionCheckbox, faqFieldsContainer);
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
            downloadHtmlBtn.addEventListener('click', downloadHTML);
        }
        if (downloadCssBtn) {
            downloadCssBtn.addEventListener('click', downloadCSS);
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

        // Event listeners for conditional page section checkboxes
        if (aboutSectionCheckbox) {
            aboutSectionCheckbox.addEventListener('change', () => toggleConditionalSectionDisplay(aboutSectionCheckbox, aboutUsFieldsContainer));
        }
        if (testimonialsSectionCheckbox) {
            testimonialsSectionCheckbox.addEventListener('change', () => toggleConditionalSectionDisplay(testimonialsSectionCheckbox, testimonialsFieldsContainer));
        }
        if (pricingSectionCheckbox) {
            pricingSectionCheckbox.addEventListener('change', () => toggleConditionalSectionDisplay(pricingSectionCheckbox, pricingFieldsContainer));
        }
        if (faqSectionCheckbox) {
            faqSectionCheckbox.addEventListener('change', () => toggleConditionalSectionDisplay(faqSectionCheckbox, faqFieldsContainer));
        }

        // Event listener for adding pricing plans
        if (addPricingPlanBtn) {
            addPricingPlanBtn.addEventListener('click', addPricingPlanEntry);
        }
    }
    
    function goToNextStep() {
        if (currentStep < totalSteps) {
            formSteps[currentStep - 1].classList.remove('active');
            currentStep++;
            formSteps[currentStep - 1].classList.add('active');
            updateProgressBar();
        }
    }
    
    function goToPreviousStep() {
        if (currentStep > 1) {
            formSteps[currentStep - 1].classList.remove('active');
            currentStep--;
            formSteps[currentStep - 1].classList.add('active');
            updateProgressBar();
        }
    }
    
    function goToStep(stepNumber) {
        formSteps[currentStep - 1].classList.remove('active');
        currentStep = stepNumber;
        formSteps[currentStep - 1].classList.add('active');
        updateProgressBar();
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
        const requiredInputs = currentStepElement.querySelectorAll('input[required], textarea[required]');
        let isValid = true;
        
        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                highlightInvalidInput(input);
            } else {
                removeInvalidHighlight(input);
            }
        });
        
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

    function toggleConditionalSectionDisplay(checkbox, container) {
        if (checkbox && container) {
            container.style.display = checkbox.checked ? 'block' : 'none';
        }
    }

    function addPricingPlanEntry() {
        if (!pricingPlansDynamicContainer) return;

        const newEntry = document.createElement('div');
        newEntry.classList.add('pricing-plan-entry');
        newEntry.innerHTML = `
            <div class="form-field">
                <label for="pricing-plan-name-${pricingPlanIndex}">Plan/Product Name:</label>
                <input type="text" id="pricing-plan-name-${pricingPlanIndex}" name="pricingPlans[${pricingPlanIndex}][name]" placeholder="e.g., Standard Plan, Premium Product">
            </div>
            <div class="form-field">
                <label for="pricing-plan-price-${pricingPlanIndex}">Price:</label>
                <input type="text" id="pricing-plan-price-${pricingPlanIndex}" name="pricingPlans[${pricingPlanIndex}][price]" placeholder="e.g., $49/month, $199">
            </div>
            <div class="form-field">
                <label for="pricing-plan-features-${pricingPlanIndex}">Key Features (1-3, comma-separated):</label>
                <input type="text" id="pricing-plan-features-${pricingPlanIndex}" name="pricingPlans[${pricingPlanIndex}][features]" placeholder="e.g., Feature A, Feature B, Feature C">
            </div>
            <button type="button" class="btn btn-remove-item" aria-label="Remove this pricing entry">
                <i class="fas fa-trash-alt"></i> Remove
            </button>
        `;

        pricingPlansDynamicContainer.appendChild(newEntry);

        // Add event listener to the new remove button
        const removeBtn = newEntry.querySelector('.btn-remove-item');
        removeBtn.addEventListener('click', () => {
            newEntry.remove();
            // Optionally, re-index remaining items if necessary, though form submission will handle array notation correctly.
        });

        pricingPlanIndex++;
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
    
    function handleFormSubmit(e) {
        e.preventDefault();
        if (validateCurrentStep()) {
            const ctaActionInput = document.getElementById('cta-action');
            if (ctaActionInput) {
                ctaActionInput.value = formatCTAAction(ctaActionInput.value);
            }

            const formData = new FormData(form);
            
            showPagePreview(formData);
        } else {
            console.log("Final step validation failed.");
        }
    }
    
    function simulateAICodeGeneration(formData) {
        console.log("Form Data Entries:");
        for (const [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
        }

        let generatedHTML = '<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">';
        const projectName = formData.get('businessName') || 'My Awesome Project';
        lastProjectName = projectName.toLowerCase().replace(/\s+/g, '-') || 'ai-generated-page';

        generatedHTML += `    <title>${projectName}</title>\n    <link rel="stylesheet" href="${lastProjectName}.css">\n</head>\n<body>\n`;
        
        let generatedCSS = `/* CSS for ${projectName} */\n`;
        generatedCSS += 'body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f0f8ff; }\n';
        generatedCSS += '.ai-generated-content { padding: 20px; border: 2px dashed #4361ee; background-color: #fff; margin: 20px; border-radius: 8px; }\n';
        
        const primaryColor = formData.get('primary-color') || '#4361ee';
        const secondaryColor = formData.get('secondary-color') || '#3a86ff';

        generatedCSS += `h1 { color: ${primaryColor}; }\n`;
        generatedCSS += `p { color: #333; }\n`;
        generatedCSS += `button { background-color: ${primaryColor}; color: white; padding: 10px 15px; border: none; border-radius: 5px; cursor: pointer; }\n`;
        generatedCSS += `button:hover { background-color: ${secondaryColor}; }\n`;

        let previewHTML = '<style>\n';
        previewHTML += 'body { --ai-primary-color: ' + primaryColor + '; --ai-secondary-color: ' + secondaryColor + '; }\n';
        previewHTML += '.ai-generated-content { padding: 20px; border: 2px dashed var(--ai-primary-color); background-color: #f0f8ff; font-family: Arial, sans-serif; }\n';
        previewHTML += '.ai-generated-content h1 { color: var(--ai-primary-color); }\n';
        previewHTML += '.ai-generated-content p { color: #333; }\n';
        previewHTML += '.ai-generated-content button { background-color: var(--ai-primary-color); color: white; padding: 10px 15px; border: none; border-radius: 5px; }\n';
        previewHTML += '.ai-generated-content button:hover { background-color: var(--ai-secondary-color); }\n';
        previewHTML += '</style>\n';
        
        previewHTML += '<div class="ai-generated-content">\n';
        const businessDesc = formData.get('businessDescription') || 'A fantastic new landing page.';
        const primaryGoal = formData.get('primaryGoal') || 'Achieve great things.';
        
        previewHTML += `    <h1>${projectName}</h1>\n`;
        previewHTML += `    <p>${businessDesc}</p>\n`;
        previewHTML += `    <p><strong>Main Goal:</strong> ${primaryGoal}</p>\n`;
        previewHTML += '    <p>This is a basic structure generated by the AI based on your inputs.</p>\n';
        previewHTML += '    <button>Call to Action</button>\n';
        previewHTML += '</div>';

        generatedHTML += previewHTML;
        generatedHTML += '\n</body>\n</html>';
        
        lastGeneratedHTML = generatedHTML;
        lastGeneratedCSS = generatedCSS;

        return {
            html: previewHTML,
            css: generatedCSS
        };
    }

    function showPagePreview(formData) {
        generationOverlay.classList.add('active');
        generationStep.textContent = 'Analyzing your inputs...';
        if(pagePreview.firstChild && pagePreview.firstChild.nodeType === Node.TEXT_NODE) {
            pagePreview.removeChild(pagePreview.firstChild);
        }
        if (downloadButtonsContainer) downloadButtonsContainer.style.display = 'none';
        
        setTimeout(() => {
            generationStep.textContent = 'Generating HTML & CSS...';
            
            const aiOutput = simulateAICodeGeneration(formData);

            setTimeout(() => {
                generationStep.textContent = 'Finalizing your page...';
                setTimeout(() => {
                    generationOverlay.classList.remove('active');
                    pagePreview.innerHTML = aiOutput.html;
                    if (downloadButtonsContainer) downloadButtonsContainer.style.display = 'block';
                    
                    const previewSection = document.querySelector('.preview-section');
                    if (previewSection) {
                        previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 1000);
            }, 1500);
        }, 1000);
    }

    function downloadFile(filename, content, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    function downloadHTML() {
        if (lastGeneratedHTML) {
            downloadFile(`${lastProjectName}.html`, lastGeneratedHTML, 'text/html');
        }
    }

    function downloadCSS() {
        if (lastGeneratedCSS) {
            downloadFile(`${lastProjectName}.css`, lastGeneratedCSS, 'text/css');
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
