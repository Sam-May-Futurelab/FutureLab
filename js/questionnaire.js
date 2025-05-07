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
    
    let currentStep = 1;
    const totalSteps = formSteps.length;
    
    // Initialize form
    initializeForm();
    
    function initializeForm() {
        updateProgressBar();
        setupColorPickers();
        setupEventListeners();
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
                if (stepNumber < currentStep) {
                    goToStep(stepNumber);
                }
            });
        });
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
        
        // Show generation overlay
        generationOverlay.classList.add('active');
        
        // Simulate AI processing with step messages
        const steps = [
            'Analyzing your inputs...',
            'Generating design concepts...',
            'Creating page structure...',
            'Optimizing content layout...',
            'Finalizing your landing page...'
        ];
        
        let currentStepIndex = 0;
        
        const stepInterval = setInterval(() => {
            if (currentStepIndex < steps.length) {
                generationStep.textContent = steps[currentStepIndex];
                currentStepIndex++;
            } else {
                clearInterval(stepInterval);
                
                // Hide overlay after "generation" is complete
                setTimeout(() => {
                    generationOverlay.classList.remove('active');
                    showPagePreview();
                }, 800);
            }
        }, 1200);
    }
    
    function showPagePreview() {
        // Collect form data
        const formData = new FormData(form);
        const businessName = formData.get('businessName');
        const businessType = formData.get('businessType');
        const primaryColor = formData.get('primaryColorHex');
        const secondaryColor = formData.get('secondaryColorHex');
        
        // Create a simple preview HTML
        const previewHTML = `
            <style>
                .preview-page {
                    font-family: 'Inter', sans-serif;
                    color: #333;
                }
                .preview-header {
                    background-color: ${primaryColor};
                    padding: 20px;
                    color: white;
                    text-align: center;
                }
                .preview-hero {
                    background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
                    color: white;
                    padding: 60px 20px;
                    text-align: center;
                }
                .preview-hero h1 {
                    font-size: 2.5rem;
                    margin-bottom: 20px;
                }
                .preview-features {
                    padding: 50px 20px;
                    text-align: center;
                    background-color: #f8fafc;
                }
                .preview-features-grid {
                    display: flex;
                    justify-content: center;
                    gap: 30px;
                    margin-top: 40px;
                }
                .preview-feature {
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
                    max-width: 300px;
                }
                .preview-feature i {
                    font-size: 2.5rem;
                    color: ${primaryColor};
                    margin-bottom: 15px;
                }
                .preview-button {
                    display: inline-block;
                    background: ${primaryColor};
                    color: white;
                    padding: 15px 30px;
                    border-radius: 30px;
                    text-decoration: none;
                    font-weight: 600;
                    margin-top: 25px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                }
                .preview-footer {
                    background-color: #1e293b;
                    color: white;
                    text-align: center;
                    padding: 30px 20px;
                }
            </style>
            <div class="preview-page">
                <div class="preview-header">
                    <h2>${businessName}</h2>
                </div>
                <div class="preview-hero">
                    <h1>Welcome to ${businessName}</h1>
                    <p>The premier ${businessType.toLowerCase()} solution for your needs</p>
                    <a href="#" class="preview-button">Get Started Now</a>
                </div>
                <div class="preview-features">
                    <h2>Our Key Features</h2>
                    <div class="preview-features-grid">
                        <div class="preview-feature">
                            <i class="fas fa-star"></i>
                            <h3>Feature 1</h3>
                            <p>A powerful benefit that helps your customers achieve their goals.</p>
                        </div>
                        <div class="preview-feature">
                            <i class="fas fa-bolt"></i>
                            <h3>Feature 2</h3>
                            <p>Another important capability that sets your business apart.</p>
                        </div>
                    </div>
                </div>
                <div class="preview-footer">
                    <p>© 2023 ${businessName}. All rights reserved.</p>
                </div>
            </div>
        `;
        
        // Update preview container with the generated content
        pagePreview.innerHTML = previewHTML;
        
        // Scroll to preview section
        document.querySelector('.preview-section').scrollIntoView({
            behavior: 'smooth'
        });
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
