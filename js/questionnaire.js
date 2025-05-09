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
            
            getAICodeGeneration(formData); // New call to fetch from backend
        } else {
            console.log("Final step validation failed.");
        }
    }
    
    async function getAICodeGeneration(formData) {
        generationOverlay.classList.add('active');
        generationStep.textContent = 'Connecting to AI assistant...';
        if(pagePreview.firstChild && pagePreview.firstChild.nodeType === Node.TEXT_NODE) {
            pagePreview.removeChild(pagePreview.firstChild);
        }
        if (downloadButtonsContainer) downloadButtonsContainer.style.display = 'none';

        const data = {};
        const sections = [];
        const sellingPoints = [];
        const socials = {};
        const testimonials = [];
        const pricingPlans = [];
        const faqs = [];

        for (const [key, value] of formData.entries()) {
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
                    if (value.trim()) pricingPlans[index][field] = value.trim();
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
        data.sellingPoints = sellingPoints;
        data.socials = socials;
        data.testimonials = testimonials.filter(t => t && (t.text || t.author));
        data.pricingPlans = pricingPlans.filter(p => p && (p.name || p.price || p.features));
        data.faqs = faqs.filter(f => f && (f.question || f.answer));
        
        // Update project name for downloads
        const projectNameFromForm = data.businessName || 'My Awesome Project';
        lastProjectName = projectNameFromForm.toLowerCase().replace(/\s+/g, '-') || 'ai-generated-page';

        try {
            generationStep.textContent = 'Sending data to AI assistant...';
            const response = await fetch('/api/generate-page', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            generationStep.textContent = 'Waiting for AI response...';
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const aiOutput = await response.json();
            
            generationStep.textContent = 'Finalizing your page...';
            
            // Store for download
            lastGeneratedHTML = aiOutput.html || '<!-- No HTML generated -->';
            lastGeneratedCSS = aiOutput.css || '/* No CSS generated */';

            // Create preview HTML for the iframe
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
                            padding: 15px; /* Add some padding inside the iframe */
                            background-color: #f0f0f0; /* Default light gray background */
                            color: #333; /* Default dark text color */
                            font-family: sans-serif; /* Basic font stack */
                        }
                        /* Embed AI-generated CSS */
                        ${aiOutput.css || '/* No CSS from AI */'}
                    </style>
                </head>
                <body>
                    ${aiOutput.html || '<!-- No HTML content to display -->'}
                </body>
                </html>
            `;


            setTimeout(() => { // Simulate finalization
                generationOverlay.classList.remove('active');
                
                const iframe = pagePreview; // pagePreview is the iframe element
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                
                iframeDoc.open();
                iframeDoc.write(previewDocContent);
                iframeDoc.close();
                
                if (downloadButtonsContainer) downloadButtonsContainer.style.display = 'block';
                
                const previewSection = document.querySelector('.preview-section');
                if (previewSection) {
                    previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 1000);

        } catch (error) {
            console.error('Error fetching AI code:', error);
            generationStep.textContent = `Error: ${error.message}. Please try again.`;
            // Keep overlay active or show an error message
            setTimeout(() => {
                 generationOverlay.classList.remove('active');
                 pagePreview.innerHTML = `<p style="color: red; text-align: center;">Failed to generate page. ${error.message}</p>`;
            }, 3000); // Keep error message for a bit
        }
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
