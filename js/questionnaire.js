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
    
    // Dynamic entry containers and buttons
    const addPricingPlanBtn = document.getElementById('add-pricing-plan-btn');
    const pricingPlansDynamicContainer = document.getElementById('pricing-plans-dynamic-container');
    let pricingPlanIndex = 1; // Start index for dynamically added plans

    const addTestimonialBtn = document.getElementById('add-testimonial-btn');
    const testimonialsDynamicContainer = document.getElementById('testimonials-dynamic-container');
    let testimonialIndex = 1; // Start index for dynamically added testimonials

    const addFaqBtn = document.getElementById('add-faq-btn');
    const faqDynamicContainer = document.getElementById('faq-dynamic-container');
    let faqIndex = 1; // Start index for dynamically added FAQs
    
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

        // Event listener for adding testimonials
        if (addTestimonialBtn) {
            addTestimonialBtn.addEventListener('click', addTestimonialEntry);
        }

        // Event listener for adding FAQs
        if (addFaqBtn) {
            addFaqBtn.addEventListener('click', addFaqEntry);
        }
    }
    
    function goToNextStep() {
        if (currentStep < totalSteps) {
            formSteps[currentStep - 1].classList.remove('active');
            currentStep++;
            formSteps[currentStep - 1].classList.add('active');
            updateProgressBar();
            if (questionnaireContainer) {
                questionnaireContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }
    
    function goToPreviousStep() {
        if (currentStep > 1) {
            formSteps[currentStep - 1].classList.remove('active');
            currentStep--;
            formSteps[currentStep - 1].classList.add('active');
            updateProgressBar();
            if (questionnaireContainer) {
                questionnaireContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    }
    
    function goToStep(stepNumber) {
        formSteps[currentStep - 1].classList.remove('active');
        currentStep = stepNumber;
        formSteps[currentStep - 1].classList.add('active');
        updateProgressBar();
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

        if (!isValid && questionnaireContainer) {
            questionnaireContainer.scrollIntoView({ behavior: 'auto', block: 'start' }); // Changed to 'auto' for potentially better mobile compatibility
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
        console.log("Form Data Entries for AI Generation:");
        const data = {};
        const sections = [];
        const sellingPoints = [];
        const socials = {};
        const testimonials = [];
        const pricingPlans = [];
        const faqs = [];

        for (const [key, value] of formData.entries()) {
            console.log(`${key}: ${value}`);
            if (key.startsWith('sections[')) {
                sections.push(value);
            } else if (key.startsWith('sellingPoints[')) {
                sellingPoints.push(value);
            } else if (key.startsWith('socials[')) {
                const platform = key.match(/socials\[(.*?)\]/)[1];
                if (value) socials[platform] = value;
            } else if (key.startsWith('testimonials[')) {
                const match = key.match(/testimonials\[(\d+)\]\[(.*?)\]/);
                if (match) {
                    const index = parseInt(match[1]);
                    const field = match[2];
                    if (!testimonials[index]) testimonials[index] = {};
                    if (value) testimonials[index][field] = value;
                }
            } else if (key.startsWith('pricingPlans[')) {
                const match = key.match(/pricingPlans\[(\d+)\]\[(.*?)\]/);
                if (match) {
                    const index = parseInt(match[1]);
                    const field = match[2];
                    if (!pricingPlans[index]) pricingPlans[index] = {};
                    if (value) pricingPlans[index][field] = value;
                }
            } else if (key.startsWith('faqs[')) {
                const match = key.match(/faqs\[(\d+)\]\[(.*?)\]/);
                if (match) {
                    const index = parseInt(match[1]);
                    const field = match[2];
                    if (!faqs[index]) faqs[index] = {};
                    if (value) faqs[index][field] = value;
                }
            } else {
                data[key] = value;
            }
        }
        data.sections = sections;
        data.sellingPoints = sellingPoints;
        data.socials = socials;
        data.testimonials = testimonials.filter(t => t && (t.text || t.author)); // Filter out empty/partially empty testimonials
        data.pricingPlans = pricingPlans.filter(p => p && (p.name || p.price || p.features)); // Filter out empty pricing plans
        data.faqs = faqs.filter(f => f && (f.question || f.answer)); // Filter out empty FAQs

        console.log("Processed Data for AI:", data);

        const projectName = data.businessName || 'My Awesome Project';
        lastProjectName = projectName.toLowerCase().replace(/\s+/g, '-') || 'ai-generated-page';

        let generatedHTML = `<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
        if (data.metaDescription) {
            generatedHTML += `    <meta name="description" content="${data.metaDescription}">\n`;
        }
        if (data.metaKeywords) {
            generatedHTML += `    <meta name="keywords" content="${data.metaKeywords}">\n`;
        }
        generatedHTML += `    <title>${projectName}</title>\n    <link rel="stylesheet" href="${lastProjectName}.css">\n</head>\n<body>\n`;
        
        let generatedCSS = `/* CSS for ${projectName} */\n`;
        generatedCSS += 'body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f7f6; color: #333; line-height: 1.6; }\n';
        generatedCSS += '.container { width: 90%; max-width: 1200px; margin: 0 auto; padding: 20px; }\n';
        generatedCSS += 'header, section, footer { margin-bottom: 30px; padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }\n';
        
        const primaryColor = data.primaryColorHex || '#4361EE';
        const secondaryColor = data.secondaryColorHex || '#4CC9F0';
        const fontStyle = data.fontStyle || 'Arial, sans-serif'; // Basic default

        generatedCSS += `body { font-family: '${fontStyle}', sans-serif; }\n`;
        generatedCSS += `h1, h2, h3 { color: ${primaryColor}; }\n`;
        generatedCSS += `.btn { background-color: ${primaryColor}; color: white; padding: 12px 20px; text-decoration: none; border: none; border-radius: 5px; cursor: pointer; display: inline-block; font-size: 1rem; }\n`;
        generatedCSS += `.btn:hover { background-color: ${secondaryColor}; }\n`;
        generatedCSS += '.social-links a { margin-right: 10px; color: ' + primaryColor + '; text-decoration: none; font-size: 1.5rem; }\n';
        generatedCSS += '.social-links a:hover { color: ' + secondaryColor + '; }\n';
        generatedCSS += '.testimonial, .pricing-plan, .faq-item { margin-bottom: 15px; padding: 15px; border-left: 4px solid ' + primaryColor + '; background-color: #f9f9f9; }\n';
        generatedCSS += '.pricing-plan h4 { margin-top: 0; color: ${secondaryColor}; }\n';

        // Inline styles for preview - simplified version of generatedCSS
        let previewStyle = '<style>\n';
        previewStyle += `body { font-family: '${fontStyle}', sans-serif; margin: 10px; background-color: #f4f7f6; color: #333; line-height: 1.6; --ai-primary-color: ${primaryColor}; --ai-secondary-color: ${secondaryColor}; }\n`;
        previewStyle += '.ai-preview-container { padding: 20px; border: 1px solid #ddd; background-color: #fff; border-radius: 8px; }\n';
        previewStyle += 'h1, h2, h3 { color: var(--ai-primary-color); }\n';
        previewStyle += '.btn { background-color: var(--ai-primary-color); color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; }\n';
        previewStyle += '.btn:hover { background-color: var(--ai-secondary-color); }\n';
        previewStyle += '.section-preview { margin-bottom: 20px; padding: 15px; border: 1px dashed #ccc; border-radius: 5px; }\n';
        previewStyle += '.section-preview h3 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 5px; }\n';
        previewStyle += '.social-links-preview a { margin-right: 8px; color: var(--ai-primary-color); text-decoration: none; }\n';
        previewStyle += '.testimonial-preview, .pricing-plan-preview, .faq-item-preview { margin-bottom: 10px; padding: 10px; border-left: 3px solid var(--ai-primary-color); background-color: #f9f9f9; font-size: 0.9em; }\n';
        previewStyle += '.pricing-plan-preview h4 { margin-top: 0; color: var(--ai-secondary-color); }\n';
        previewStyle += '</style>\n';

        let previewHTML = previewStyle + '<div class="ai-preview-container">\n';
        previewHTML += `<h1>${projectName} (Preview)</h1>\n`;
        previewHTML += `<p><em>Tone: ${data.tone || 'Default'}</em></p>\n`;
        previewHTML += `<p><strong>Business Description:</strong> ${data.businessDescription || 'N/A'}</p>\n`;
        previewHTML += `<p><strong>Primary Goal:</strong> ${data.primaryGoal || 'N/A'}</p>\n`;
        previewHTML += `<p><strong>Target Audience:</strong> ${data.targetAudience || 'N/A'}</p>\n`;

        if (data.sellingPoints && data.sellingPoints.length > 0) {
            previewHTML += '<div class="section-preview"><h3>Key Selling Points:</h3><ul>';
            data.sellingPoints.forEach(point => { if(point) previewHTML += `<li>${point}</li>`; });
            previewHTML += '</ul></div>\n';
        }

        // --- Constructing the full generatedHTML based on selected sections ---
        generatedHTML += '<header class="container"><h1>' + projectName + '</h1></header>\n';

        if (data.sections.includes('hero')) {
            generatedHTML += '<section class="hero-section container"><h2>Welcome!</h2><p>' + (data.businessDescription || 'Achieve your goals with us.') + '</p>';
            if (data.ctaText && data.ctaAction && data.sections.includes('cta')) {
                 generatedHTML += `<p><a href="${data.ctaAction}" class="btn">${data.ctaText}</a></p>`;
            }
            generatedHTML += '</section>\n';
            previewHTML += '<div class="section-preview"><h3>Hero Section (Simplified)</h3><p>' + (data.businessDescription || 'Achieve your goals with us.') + '</p>';
            if (data.ctaText && data.ctaAction && data.sections.includes('cta')) {
                 previewHTML += `<p><a href="${data.ctaAction}" class="btn">${data.ctaText}</a></p>`;
            }
             previewHTML += '</div>\n';
        }

        if (data.sections.includes('about') && data.aboutUsSnippet) {
            generatedHTML += `<section class="about-section container"><h2>About Us</h2><p>${data.aboutUsSnippet}</p></section>\n`;
            previewHTML += `<div class="section-preview"><h3>About Us</h3><p>${data.aboutUsSnippet}</p></div>\n`;
        }

        if (data.sections.includes('features') && data.sellingPoints && data.sellingPoints.length > 0) {
            generatedHTML += '<section class="features-section container"><h2>Features/Benefits</h2><ul>';
            data.sellingPoints.forEach(point => { if(point) generatedHTML += `<li>${point}</li>`; });
            generatedHTML += '</ul></section>\n';
            // Preview for selling points already added above
        }

        if (data.sections.includes('testimonials') && data.testimonials.length > 0) {
            generatedHTML += '<section class="testimonials-section container"><h2>Testimonials</h2>';
            previewHTML += '<div class="section-preview"><h3>Testimonials</h3>';
            data.testimonials.forEach(t => {
                if (t.text && t.author) {
                    generatedHTML += `<div class="testimonial"><p>"${t.text}"</p><footer>- ${t.author}${t.title ? ', ' + t.title : ''}</footer></div>`;
                    previewHTML += `<div class="testimonial-preview"><p>"${t.text}"</p><footer>- ${t.author}${t.title ? ', ' + t.title : ''}</footer></div>`;
                }
            });
            generatedHTML += '</section>\n';
            previewHTML += '</div>\n';
        }

        if (data.sections.includes('pricing') && data.pricingPlans.length > 0) {
            generatedHTML += '<section class="pricing-section container"><h2>Our Plans</h2>';
            previewHTML += '<div class="section-preview"><h3>Pricing Plans</h3>';
            data.pricingPlans.forEach(p => {
                if (p.name && p.price) {
                    generatedHTML += `<div class="pricing-plan"><h4>${p.name}</h4><p><strong>Price:</strong> ${p.price}</p>${p.features ? '<p>Features: ' + p.features + '</p>' : ''}</div>`;
                    previewHTML += `<div class="pricing-plan-preview"><h4>${p.name}</h4><p><strong>Price:</strong> ${p.price}</p>${p.features ? '<p>Features: ' + p.features + '</p>' : ''}</div>`;
                }
            });
            generatedHTML += '</section>\n';
            previewHTML += '</div>\n';
        }

        if (data.sections.includes('faq') && data.faqs.length > 0) {
            generatedHTML += '<section class="faq-section container"><h2>FAQs</h2>';
            previewHTML += '<div class="section-preview"><h3>FAQs</h3>';
            data.faqs.forEach(f => {
                if (f.question && f.answer) {
                    generatedHTML += `<div class="faq-item"><h4>${f.question}</h4><p>${f.answer}</p></div>`;
                    previewHTML += `<div class="faq-item-preview"><h4>${f.question}</h4><p>${f.answer}</p></div>`;
                }
            });
            generatedHTML += '</section>\n';
            previewHTML += '</div>\n';
        }
        
        // CTA section (if not part of hero and cta checkbox is checked)
        // The CTA button might already be in the hero. This is a standalone CTA section if selected.
        if (data.sections.includes('cta') && data.ctaText && data.ctaAction && !data.sections.includes('hero')) {
            generatedHTML += `<section class="cta-section container"><h2>Ready to Start?</h2><p><a href="${data.ctaAction}" class="btn">${data.ctaText}</a></p></section>\n`;
            previewHTML += `<div class="section-preview"><h3>Call to Action</h3><p><a href="${data.ctaAction}" class="btn">${data.ctaText}</a></p></div>\n`;
        } else if (data.sections.includes('cta') && data.ctaText && data.ctaAction && ctaFieldsContainer.style.display !== 'none' && !data.sections.includes('hero')) {
            // If CTA section is checked AND its fields are visible (even if hero is also checked, but we want a separate CTA section)
            generatedHTML += `<section class="cta-section container"><h2>Ready to Start?</h2><p><a href="${data.ctaAction}" class="btn">${data.ctaText}</a></p></section>\n`;
            previewHTML += `<div class="section-preview"><h3>Call to Action</h3><p><a href="${data.ctaAction}" class="btn">${data.ctaText}</a></p></div>\n`;
        }

        if (Object.keys(data.socials).length > 0) {
            generatedHTML += '<footer class="container social-links"><h3>Follow Us</h3>';
            previewHTML += '<div class="section-preview social-links-preview"><h3>Social Links</h3>';
            for (const [platform, url] of Object.entries(data.socials)) {
                if (url) { // Ensure URL is not empty
                    generatedHTML += `<a href="${url}" target="_blank" aria-label="${platform}"><i class="fab fa-${platform.toLowerCase()}"></i> ${platform}</a> `;
                    previewHTML += `<a href="${url}" target="_blank">${platform}</a> `;
                }
            }
            generatedHTML += '</footer>\n';
            previewHTML += '</div>\n';
        }
        
        generatedHTML += '</body>\n</html>';
        previewHTML += '</div>'; // Close ai-preview-container
        
        lastGeneratedHTML = generatedHTML;
        lastGeneratedCSS = generatedCSS;

        return {
            html: previewHTML, // This is what's shown in the iframe
            // css: generatedCSS // This is for the downloadable CSS file
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
