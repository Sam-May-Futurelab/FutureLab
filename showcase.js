document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the showcase page
    if (!document.querySelector('.showcase-hero')) return;
    
    // Initialize GSAP if available
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin();
    }
    
    // Initialize all interactive demos
    initCategoryFilter();
    initProductViewer();
    initMobileTabs();
    initPricingCalculator();
    initChartAnimation();
    initThemeCustomizer();
    initFeedbackWidget();
    initFeaturesCarousel(); // Add this new function call
    
    // Initialize the enhanced night sky animation
    initNightSkyAnimation();
    
    // Also initialize the old particle animation if element exists
    const oldAnimationContainer = document.getElementById('particle-animation');
    if (oldAnimationContainer) {
        initParticleAnimation();
    }
    
    initModalFunctionality();
    initProductCardButtons(); // Add functionality to product card buttons
    
    // REMOVE HAMBURGER MENU FIX FOR SHOWCASE PAGE - Handled by header.html's script
    /*
    const showcaseHamburger = document.querySelector('.hamburger, .menu-toggle, .mobile-menu-button');
    const showcaseMenu = document.querySelector('.mobile-nav, .nav-links, .main-nav');
    
    if (showcaseHamburger && showcaseMenu) {
        console.log("Showcase mobile menu elements found");
        
        // Direct, simple toggle for showcase page
        showcaseHamburger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log("Showcase hamburger clicked");
            
            // Toggle menu visibility using classes
            showcaseMenu.classList.toggle('active');
            this.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (showcaseMenu.classList.contains('active') && 
                !showcaseMenu.contains(e.target) && 
                !showcaseHamburger.contains(e.target)) {
                showcaseMenu.classList.remove('active');
                showcaseHamburger.classList.remove('active');
            }
        });
    } else {
        console.error("Showcase mobile menu elements not found:", { 
            hamburger: showcaseHamburger ? "Found" : "Not found", 
            menu: showcaseMenu ? "Found" : "Not found" 
        });
    }
    */
    
    // 3D Product Viewer - Simplify and fix
    function initProductViewer() {
        const productViewer = document.getElementById('product-viewer');
        if (!productViewer) return;
        
        // Clear existing content and create the new 3D structure
        const existingModel = productViewer.querySelector('.product-model');
        if (existingModel) {
            productViewer.removeChild(existingModel);
        }
        
        // Create new model structure
        const productModel = document.createElement('div');
        productModel.className = 'product-model';
        
        // Create product shape
        const productShape = document.createElement('div');
        productShape.className = 'product-shape';
        
        // Create all faces for the 3D cube
        const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
        faces.forEach(faceName => {
            const face = document.createElement('div');
            face.className = `face ${faceName}`;
            
            // Add specific elements for each face
            if (faceName === 'front') {
                // Add screen to front face
                const screen = document.createElement('div');
                screen.className = 'product-screen';
                face.appendChild(screen);
                
                // Add camera to front face
                const camera = document.createElement('div');
                camera.className = 'product-camera';
                face.appendChild(camera);
                
                // Add controls area at bottom
                const controlsArea = document.createElement('div');
                controlsArea.className = 'product-controls-area';
                const indicator = document.createElement('div');
                indicator.className = 'control-indicator';
                controlsArea.appendChild(indicator);
                face.appendChild(controlsArea);
            }
            else if (faceName === 'back') {
                // Add logo to back face
                const logo = document.createElement('div');
                logo.className = 'product-logo';
                face.appendChild(logo);
            }
            else if (faceName === 'right') {
                // Add buttons to right side
                for (let i = 0; i < 2; i++) {
                    const button = document.createElement('div');
                    button.className = 'product-button';
                    face.appendChild(button);
                }
            }
            else if (faceName === 'left') {
                // Add ports to left side
                for (let i = 0; i < 3; i++) {
                    const port = document.createElement('div');
                    port.className = 'product-port';
                    face.appendChild(port);
                }
            }
            
            productShape.appendChild(face);
        });
        
        // Create shadow element
        const shadow = document.createElement('div');
        shadow.className = 'product-shadow';
        
        // Add all elements to model
        productModel.appendChild(productShape);
        productModel.appendChild(shadow);
        
        // Add model to viewer
        productViewer.appendChild(productModel);
        
        // Add lighting effect (glow sphere)
        const productSphere = document.createElement('div');
        productSphere.className = 'product-sphere';
        productViewer.appendChild(productSphere);
        
        // Get control buttons and drag indicator
        const colorBtns = productViewer.querySelectorAll('.control-btn');
        const dragIndicator = document.querySelector('.drag-indicator');
        
        // Variables for tracking rotation
        let isDragging = false;
        let previousX = 0;
        let previousY = 0;
        let rotationX = 15;
        let rotationY = 45;
        
        // Apply initial rotation
        productShape.style.transform = `translate(-50%, -50%) rotateX(15deg) rotateY(45deg)`;
        
        // Mouse events for dragging - REDUCE ROTATION SPEED
        productViewer.addEventListener('mousedown', function(e) {
            isDragging = true;
            previousX = e.clientX;
            previousY = e.clientY;
            if (dragIndicator) dragIndicator.style.opacity = '0';
            productViewer.style.cursor = 'grabbing';
        });
        
        window.addEventListener('mousemove', function(e) {
            if (!isDragging) return;
            
            const deltaX = e.clientX - previousX;
            const deltaY = e.clientY - previousY;
            
            // REDUCED rotation speed from 0.5 to 0.2 for more graceful movement
            rotationY += deltaX * 0.2;
            rotationX -= deltaY * 0.2;
            
            // Limit rotation
            rotationX = Math.max(Math.min(rotationX, 45), -45);
            
            // Apply smooth rotation
            productShape.style.transform = `translate(-50%, -50%) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
            
            // Update shadow position and size based on rotation
            const shadowScale = 1 - Math.abs(rotationX) / 90 * 0.3;
            shadow.style.transform = `translateX(-50%) scale(${shadowScale})`;
            shadow.style.opacity = (1 - Math.abs(rotationX) / 45 * 0.5).toString();
            
            previousX = e.clientX;
            previousY = e.clientY;
        });
        
        window.addEventListener('mouseup', function() {
            isDragging = false;
            productViewer.style.cursor = 'grab';
        });
        
        // Touch events - REDUCE ROTATION SPEED
        productViewer.addEventListener('touchstart', function(e) {
            isDragging = true;
            previousX = e.touches[0].clientX;
            previousY = e.touches[0].clientY;
            if (dragIndicator) dragIndicator.style.opacity = '0';
        });
        
        window.addEventListener('touchmove', function(e) {
            if (!isDragging) return;
            
            const deltaX = e.touches[0].clientX - previousX;
            const deltaY = e.touches[0].clientY - previousY;
            
            // REDUCED rotation speed from 0.5 to 0.2 for more graceful movement
            rotationY += deltaX * 0.2;
            rotationX -= deltaY * 0.2;
            
            // Limit rotation
            rotationX = Math.max(Math.min(rotationX, 45), -45);
            
            // Apply smooth rotation
            productShape.style.transform = `translate(-50%, -50%) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
            
            // Update shadow position
            const shadowScale = 1 - Math.abs(rotationX) / 90 * 0.3;
            shadow.style.transform = `translateX(-50%) scale(${shadowScale})`;
            shadow.style.opacity = (1 - Math.abs(rotationX) / 45 * 0.5).toString();
            
            previousX = e.touches[0].clientX;
            previousY = e.touches[0].clientY;
        });
        
        window.addEventListener('touchend', function() {
            isDragging = false;
        });
        
        // Color change functionality
        colorBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const color = this.getAttribute('data-color');
                if (!color) return;
                
                // Apply the color to all faces
                document.querySelectorAll('.face').forEach(face => {
                    face.style.backgroundColor = color;
                });
                
                // Adjust glow color
                productSphere.style.background = `radial-gradient(circle, ${color}40 0%, ${color}00 70%)`;
                
                // Reset active state for all buttons
                colorBtns.forEach(b => b.style.transform = 'scale(1)');
                this.style.transform = 'scale(1.2)';
                
                // Create a color change ripple effect
                createColorChangeEffect(productViewer, color);
            });
        });
        
        // Add ambient animation - SLOW DOWN THE AMBIENT ANIMATION
        function ambientAnimation() {
            // Subtle floating animation with reduced speed
            let counter = 0;
            let floatDirection = 1;
            
            function animate() {
                if (!isDragging) {
                    // Reduce animation speed from 0.01 to 0.005 for a slower, more graceful motion
                    counter += 0.005 * floatDirection;
                    if (counter > 1) floatDirection = -1;
                    if (counter < 0) floatDirection = 1;
                    
                    const floatY = Math.sin(counter * Math.PI) * 2;
                    // Reduce rotation amplitude from 0.5 to 0.3 for more subtle movement
                    const floatRotationY = rotationY + Math.sin(counter * Math.PI * 0.5) * 0.3;
                    
                    productShape.style.transform = `translate(-50%, calc(-50% + ${floatY}px)) rotateX(${rotationX}deg) rotateY(${floatRotationY}deg)`;
                }
                
                requestAnimationFrame(animate);
            }
            
            animate();
        }
        
        // Start ambient animation
        ambientAnimation();
    }
    
    // Function to create ripple effect on color change
    function createColorChangeEffect(container, color) {
        // Create a ripple element
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 10px;
            height: 10px;
            background: ${color};
            border-radius: 50%;
            opacity: 0.6;
            pointer-events: none;
            animation: color-ripple 1s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
        `;
        
        // Add the ripple effect to the container
        container.appendChild(ripple);
        
        // Clean up after animation
        setTimeout(() => {
            container.removeChild(ripple);
        }, 1000);
    }
    
    // Add color ripple animation if it doesn't exist
    if (!document.getElementById('color-ripple-animation')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'color-ripple-animation';
        styleSheet.textContent = `
            @keyframes color-ripple {
                0% {
                    width: 10px;
                    height: 10px;
                    opacity: 0.6;
                }
                100% {
                    width: 300px;
                    height: 300px;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }
    
    // Updated mobile tab functionality to work with side-by-side layout
    function initMobileTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        const appScreens = document.querySelectorAll('.app-screen');
        
        if (!tabBtns.length) return;
        
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tab = this.getAttribute('data-tab');
                
                // Update active tab button
                tabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Update tab content
                tabContents.forEach(content => {
                    content.classList.remove('active');
                });
                const activeTab = document.getElementById(`${tab}-tab`);
                if (activeTab) activeTab.classList.add('active');
                
                // Update phone screen with smooth transition
                appScreens.forEach(screen => {
                    // First fade out all screens
                    screen.style.opacity = '0';
                    screen.style.transform = 'translateY(20px)';
                    screen.style.visibility = 'hidden';
                    
                    // Only after fade out, set the active screen and fade it in
                    setTimeout(() => {
                        if (screen.getAttribute('data-screen') === tab) {
                            screen.classList.add('active');
                            screen.style.opacity = '1';
                            screen.style.transform = 'translateY(0)';
                            screen.style.visibility = 'visible';
                        } else {
                            screen.classList.remove('active');
                        }
                    }, 300);
                });
                
                // Initialize specific tab functionality
                if (tab === 'responsive') {
                    initResponsiveDemo();
                } else if (tab === 'app') {
                    initMobileAppDemo();
                } else if (tab === 'pwa') {
                    initPWADemo();
                }
            });
        });
        
        // Initialize the first tab by default
        const defaultTab = tabBtns[0];
        if (defaultTab) {
            setTimeout(() => {
                defaultTab.click();
            }, 500);
        }
    }
    
    // Adjusted mobile app demo initialization to work with side-by-side layout
    function initMobileAppDemo() {
        // Add subtle animation to the main stats card
        const statCard = document.querySelector('.app-stat-card');
        if (statCard) {
            statCard.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = '0 8px 30px rgba(67, 97, 238, 0.3)';
            });
            
            statCard.addEventListener('mouseleave', function() {
                this.style.transform = '';
                this.style.boxShadow = '';
            });
        }
        
        // Add tap effects for activity items
        const activityItems = document.querySelectorAll('.activity-item');
        activityItems.forEach(item => {
            item.addEventListener('click', function() {
                this.style.backgroundColor = 'rgba(67, 97, 238, 0.05)';
                setTimeout(() => {
                    this.style.backgroundColor = '';
                }, 300);
            });
        });
        
        // Simulate active nav items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if (item.classList.contains('nav-item-highlighted')) return;
            
            item.addEventListener('click', function() {
                navItems.forEach(nav => {
                    if (!nav.classList.contains('nav-item-highlighted')) {
                        nav.classList.remove('active');
                    }
                });
                this.classList.add('active');
            });
        });
        
        // Make sure the mobile UI assets are initialized
        if (typeof updateStatusBarTime === 'function') {
            updateStatusBarTime();
        }
        
        if (typeof animateProgressBars === 'function') {
            animateProgressBars();
        }
    }
    
    // New function to handle the responsive design demo
    function initResponsiveDemo() {
        // Get elements
        const responsiveButtons = document.querySelectorAll('.responsive-btn');
        const deviceMockups = document.querySelectorAll('.device-mockup');
        
        // Skip if elements don't exist
        if (!responsiveButtons.length) return;
        
        // Set up event listeners for device buttons
        responsiveButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Get the target device type
                const deviceType = this.getAttribute('data-device');
                
                // Update active button state
                responsiveButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Apply the active class to highlight the selected device mockup
                deviceMockups.forEach(mockup => {
                    if (mockup.classList.contains(deviceType)) {
                        mockup.style.transform = 'scale(1.05)';
                        mockup.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)';
                        mockup.style.border = `2px solid var(--primary-color)`;
                    } else {
                        mockup.style.transform = 'scale(1)';
                        mockup.style.boxShadow = '';
                        mockup.style.border = '1px solid rgba(0, 0, 0, 0.1)';
                    }
                    
                    // For dark theme
                    if (document.documentElement.classList.contains('dark-theme')) {
                        if (mockup.classList.contains(deviceType)) {
                            mockup.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.3)';
                            mockup.style.border = `2px solid var(--primary-color)`;
                        } else {
                            mockup.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                        }
                    }
                });
            });
        });
        
        // Click the first button by default
        if (responsiveButtons[0]) {
            responsiveButtons[0].click();
        }
    }
    
    // New function to handle the PWA demo
    function initPWADemo() {
        // Add hover effects to grid items
        const gridItems = document.querySelectorAll('.pwa-grid-item');
        gridItems.forEach(item => {
            item.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-5px)';
                this.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.1)';
                
                // Add pulse effect to icon
                const icon = this.querySelector('.pwa-grid-icon');
                if (icon) {
                    icon.style.backgroundColor = 'rgba(67, 97, 238, 0.2)';
                }
            });
            
            item.addEventListener('mouseleave', function() {
                this.style.transform = '';
                this.style.boxShadow = '';
                
                // Remove pulse effect from icon
                const icon = this.querySelector('.pwa-grid-icon');
                if (icon) {
                    icon.style.backgroundColor = '';
                }
            });
        });
        
        // Add simulated search field focus behavior
        const pwaSearch = document.querySelector('.pwa-search');
        if (pwaSearch) {
            pwaSearch.addEventListener('click', function() {
                this.style.boxShadow = '0 0 0 3px rgba(67, 97, 238, 0.2)';
                setTimeout(() => {
                    this.style.boxShadow = '';
                }, 1000);
            });
        }
        
        // Simulate active navigation state
        const navItems = document.querySelectorAll('.pwa-nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                navItems.forEach(n => n.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        // Activate the first nav item by default
        if (navItems[0]) {
            navItems[0].classList.add('active');
        }
        
        // Add animation to banner
        const banner = document.querySelector('.pwa-banner');
        if (banner) {
            setTimeout(() => {
                banner.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    banner.style.transform = '';
                }, 300);
            }, 1000);
        }
    }
    
    // Improved Pricing Calculator with dynamic slider background
    function initPricingCalculator() {
        const websiteTypeSelect = document.getElementById('website-type');
        const pageSlider = document.getElementById('page-slider');
        const sliderProgress = document.getElementById('slider-progress');
        const pageValue = document.getElementById('page-value');
        const seoOption = document.getElementById('seo-option');
        const cmsOption = document.getElementById('cms-option');
        const totalPrice = document.getElementById('total-price');
        
        if (!pageSlider || !totalPrice) return;
        
        // Update slider progress bar to match current value
        function updateSliderProgress() {
            if (!sliderProgress) return;
            
            const min = parseInt(pageSlider.min) || 1;
            const max = parseInt(pageSlider.max) || 20;
            const val = parseInt(pageSlider.value) || 5;
            
            // Calculate the percentage width for the progress bar
            const percentage = ((val - min) / (max - min)) * 100;
            sliderProgress.style.width = `${percentage}%`;
        }
        
        // Update calculation and UI
        function updateCalculator() {
            // Updated package pricing to match your real offers
            const websiteTypes = {
                'starter': 350,      // Starter Website
                'professional': 750, // Professional Site/Store
                'ecommerce': 500,    // E-Commerce Starter Store
                'app': 2000          // App MVP
            };
            
            // Get values from inputs
            const selectedType = websiteTypeSelect.value || 'starter';
            const basePrice = websiteTypes[selectedType] || websiteTypes['starter'];
            const pageCount = parseInt(pageSlider.value) || 1;
            // Per-page price: Starter/Professional: £75, E-Commerce: £100, App: £150
            let pagePrice = 0;
            if (selectedType === 'starter' || selectedType === 'professional') {
                pagePrice = (pageCount - 1) * 75;
            } else if (selectedType === 'ecommerce') {
                pagePrice = (pageCount - 1) * 100;
            } else if (selectedType === 'app') {
                pagePrice = (pageCount - 1) * 150;
            }
            // Add-ons
            const seoPrice = seoOption && seoOption.checked ? 350 : 0;
            const cmsPrice = cmsOption && cmsOption.checked ? 400 : 0;
            
            // Calculate total
            const total = basePrice + pagePrice + seoPrice + cmsPrice;
            
            // Get previous price for animation
            const previousPrice = parseInt(totalPrice.textContent.replace(/[^0-9]/g, '')) || 0;
            
            // Update UI elements
            if (pageValue) pageValue.textContent = `${pageCount} page${pageCount > 1 ? 's' : ''}`;
            totalPrice.textContent = `£${total.toLocaleString()}`;
            
            // Update slider progress
            updateSliderProgress();
            
            // Animate price change if it's different
            if (previousPrice !== total) {
                totalPrice.classList.add('highlight');
                setTimeout(() => {
                    totalPrice.classList.remove('highlight');
                }, 500);
            }
        }
        
        // Set up event listeners
        if (websiteTypeSelect) {
            websiteTypeSelect.addEventListener('change', updateCalculator);
        }
        
        if (pageSlider) {
            // Update on both change and input events for smoother UI
            pageSlider.addEventListener('input', updateSliderProgress);
            pageSlider.addEventListener('change', updateCalculator);
            pageSlider.addEventListener('input', updateCalculator);
        }
        
        if (seoOption) {
            seoOption.addEventListener('change', updateCalculator);
        }
        
        if (cmsOption) {
            cmsOption.addEventListener('change', updateCalculator);
        }
        
        // Initialize calculator and slider progress
        updateSliderProgress();
        updateCalculator();
    }
    
    // Interactive Charts - Completely rewrite for proper visualization
    function initChartAnimation() {
        const chartContainer = document.getElementById('analytics-chart');
        if (!chartContainer) return;
        
        // Create chart structure if it doesn't exist
        if (!chartContainer.querySelector('.chart-bars')) {
            // Create chart components
            const chartLabels = document.createElement('div');
            chartLabels.className = 'chart-labels';
            
            // Y-axis labels
            const yAxis = document.createElement('div');
            yAxis.className = 'y-axis';
            for (let i = 5; i >= 0; i--) {
                const label = document.createElement('div');
                label.textContent = `${i * 20}${i === 5 ? 'k' : ''}`;
                yAxis.appendChild(label);
            }
            chartLabels.appendChild(yAxis);
            
            // Chart bars container
            const chartBars = document.createElement('div');
            chartBars.className = 'chart-bars';
            
            // X-axis labels
            const xAxis = document.createElement('div');
            xAxis.className = 'x-axis';
            
            // Add all elements to chart container
            chartContainer.appendChild(chartLabels);
            chartContainer.appendChild(chartBars);
            chartContainer.appendChild(xAxis);
        }
        
        // Get the chart bars container
        const chartBars = chartContainer.querySelector('.chart-bars');
        const xAxis = chartContainer.querySelector('.x-axis');
        const controlBtns = document.querySelectorAll('.chart-control-btn');
        const refreshBtn = document.getElementById('refresh-chart');
        const chartInfo = document.getElementById('chart-info');
        
        // Different period data and labels
        const periodData = {
            monthly: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                baseValues: [30, 45, 35, 60, 50, 70],
                description: 'Monthly revenue vs targets for the first half of 2025'
            },
            quarterly: {
                labels: ['Q1 \'24', 'Q2 \'24', 'Q3 \'24', 'Q4 \'24', 'Q1 \'25', 'Q2 \'25'],
                baseValues: [40, 55, 65, 78, 62, 85],
                description: 'Quarterly revenue compared to targets over the past 18 months'
            },
            yearly: {
                labels: ['2020', '2021', '2022', '2023', '2024', '2025*'],
                baseValues: [48, 52, 67, 83, 92, 110],
                description: 'Annual revenue performance with projected 2025 targets (*forecasted)'
            }
        };
        
        // Current period
        let currentPeriod = 'monthly';
        
        // Generate chart data with visually pleasing patterns
        function generateChartData(period = currentPeriod, animate = true) {
            // Clear existing bars
            chartBars.innerHTML = '';
            xAxis.innerHTML = '';
            
            // Get the data for the current period
            const { labels, baseValues, description } = periodData[period];
            
            // Update chart info
            if (chartInfo) {
                chartInfo.textContent = description;
            }
            
            // Add X-axis labels
            labels.forEach(label => {
                const labelElement = document.createElement('div');
                labelElement.className = 'x-axis-label';
                labelElement.textContent = label;
                xAxis.appendChild(labelElement);
            });
            
            // Create bars for each period
            for (let i = 0; i < baseValues.length; i++) {
                // Create container for a pair of bars
                const barGroup = document.createElement('div');
                barGroup.className = 'bar-group';
                
                // Add some randomness but maintain the trend
                const randomOffset1 = Math.random() * 20 - 10; // -10 to +10
                const randomOffset2 = Math.random() * 15 - 5;  // -5 to +10
                
                // Revenue bar
                const revenueHeight = baseValues[i] + randomOffset1;
                const revenueBar = document.createElement('div');
                revenueBar.className = 'chart-bar revenue';
                revenueBar.style.height = animate ? '0' : `${revenueHeight}%`; // Start at 0 height if animating
                
                // Target bar
                const targetHeight = baseValues[i] * 1.2 + randomOffset2; // Target slightly higher
                const targetBar = document.createElement('div');
                targetBar.className = 'chart-bar target';
                targetBar.style.height = animate ? '0' : `${targetHeight}%`; // Start at 0 height if animating
                
                // Add bars to group
                barGroup.appendChild(revenueBar);
                barGroup.appendChild(targetBar);
                
                // Add group to chart
                chartBars.appendChild(barGroup);
                
                // Animate the bars after a short delay if animation is enabled
                if (animate) {
                    setTimeout(() => {
                        revenueBar.style.height = `${revenueHeight}%`;
                        targetBar.style.height = `${targetHeight}%`;
                    }, 100 * i); // Stagger animation
                }
            }
        }
        
        // Set up period control buttons
        if (controlBtns.length) {
            controlBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const period = this.getAttribute('data-period');
                    if (!period) return;
                    
                    // Update active state
                    controlBtns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Update current period
                    currentPeriod = period;
                    
                    // Generate new data with animation
                    generateChartData(period);
                });
            });
        }
        
        // Add refresh button functionality
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                // Add rotating animation to the refresh icon
                const refreshIcon = this.querySelector('i');
                if (refreshIcon) {
                    refreshIcon.classList.add('rotating');
                    
                    // Remove the animation class after it completes
                    setTimeout(() => {
                        refreshIcon.classList.remove('rotating');
                    }, 600);
                }
                
                // Generate new chart data with animation
                generateChartData(currentPeriod);
            });
        }
        
        // Generate initial chart data
        generateChartData(currentPeriod);
        
        // Set the first control button as active if none are
        const activeBtn = document.querySelector('.chart-control-btn.active');
        if (!activeBtn && controlBtns.length > 0) {
            controlBtns[0].classList.add('active');
        }
    }
    
    // Modal Functionality
    function initModalFunctionality() {
        const modalOverlay = document.getElementById('demo-modal-overlay');
        const modal = document.getElementById('demo-modal');
        const modalClose = document.getElementById('modal-close');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalCTA = document.getElementById('modal-cta');
        const demoDetailBtns = document.querySelectorAll('.demo-details-btn');
        
        if (!modalOverlay || !modal) return;
        
        // Demo detail buttons
        if (demoDetailBtns.length) {
            demoDetailBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    const demoType = this.getAttribute('data-demo');
                    
                    // Set modal content based on demo type
                    updateModalContent(demoType);
                    
                    // Show modal
                    modalOverlay.classList.add('active');
                });
            });
        }
        
        // Close modal
        if (modalClose) {
            modalClose.addEventListener('click', closeModal);
        }
        
        // Close modal when clicking outside
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
        
        function closeModal() {
            modalOverlay.classList.remove('active');
        }
        
        function updateModalContent(demoType) {
            // Default values
            let title = 'Demo Details';
            let content = '<p>Information about this demo is not available.</p>';
            
            // Set content based on demo type
            switch (demoType) {
                case 'product-viewer':
                    title = '3D Product Viewer';
                    content = `
                        <div class="modal-section">
                            <h3>Interactive 3D Product Experience</h3>
                            <p>The 3D Product Viewer transforms traditional product images into interactive experiences, giving customers a deeper understanding of your products before purchasing.</p>
                            
                            <h4>Key Features:</h4>
                            <ul class="feature-list">
                                <li><strong>360° Rotation</strong> - Mouse, touch, and gesture-based controls for seamless interaction across all devices</li>
                                <li><strong>Real-time Customization</strong> - Allow customers to change colors, materials, and configurations instantly</li>
                                <li><strong>Zoom & Focus</strong> - Detailed inspection of product features with high-resolution texture rendering</li>
                                <li><strong>AR Integration</strong> - Optional "View in Your Space" feature using WebAR technology</li>
                                <li><strong>Analytics Integration</strong> - Track which product views and features get the most attention</li>
                            </ul>
                            
                            <h4>Business Impact:</h4>
                            <p>Our clients report a <strong>40% increase</strong> in product page conversion rates and a <strong>25% reduction</strong> in returns after implementing 3D product viewers. By giving customers confidence in their purchase decisions, you can significantly improve satisfaction and reduce support inquiries.</p>
                            
                            <h4>Technical Details:</h4>
                            <p>Built with WebGL and optimized Three.js libraries, our 3D viewers work across all modern browsers with automatic performance optimizations for mobile devices. The solution can be integrated with any e-commerce platform and supports common 3D model formats.</p>
                        </div>
                    `;
                    break;
                    
                case 'product-card':
                    title = 'Smart Product Cards';
                    content = `
                        <div class="modal-section">
                            <h3>Interactive Product Card System</h3>
                            <p>Smart Product Cards create engaging shopping experiences by turning static product listings into interactive elements that convey more information while encouraging action.</p>
                            
                            <h4>Key Features:</h4>
                            <ul class="feature-list">
                                <li><strong>Motion Design</strong> - Subtle animations highlight key information and guide user attention</li>
                                <li><strong>Quick Actions</strong> - Add to cart, wishlist, and comparison features without page navigation</li>
                                <li><strong>Instant Preview</strong> - Quick-look modals with essential product information and gallery</li>
                                <li><strong>Live Updates</strong> - Real-time price, inventory, and promotion indicators</li>
                                <li><strong>Personalization</strong> - Recently viewed and tailored recommendations based on browsing history</li>
                            </ul>
                            
                            <h4>Conversion Benefits:</h4>
                            <p>E-commerce sites implementing Smart Product Cards see an average <strong>32% increase</strong> in product engagement and up to <strong>27% higher</strong> cart addition rates. Mobile shoppers particularly benefit, with conversion improvements of <strong>35-45%</strong> on touch devices.</p>
                            
                            <h4>Implementation:</h4>
                            <p>Smart Product Cards are built with performance in mind, using modern CSS and minimal JavaScript for smooth animations. The system works with any product database and can be customized to match your brand's unique visual language and interaction design.</p>
                        </div>
                    `;
                    break;
                    
                case 'calculator':
                    title = 'Interactive Pricing Calculator';
                    content = `
                        <div class="modal-section">
                            <h3>Dynamic Pricing & Quote Calculator</h3>
                            <p>Help customers understand your pricing structure and get instant, personalized quotes with an intuitive calculator tailored to your business needs.</p>
                            
                            <h4>Key Features:</h4>
                            <ul class="feature-list">
                                <li><strong>Real-time Calculation</strong> - Instant updates as customers explore different options with visual feedback</li>
                                <li><strong>Multi-step Configuration</strong> - Guide customers through complex product or service offerings</li>
                                <li><strong>Conditional Logic</strong> - Display only relevant options based on previous selections</li>
                                <li><strong>Comparison Tools</strong> - Side-by-side package comparisons for informed decision making</li>
                                <li><strong>Quote Generation</strong> - PDF download options and email integration for lead capture</li>
                                <li><strong>Analytics Dashboard</strong> - Understand customer preferences and quote completion metrics</li>
                            </ul>
                            
                            <h4>Business ROI:</h4>
                            <p>Pricing calculators provide multiple business benefits beyond lead generation:</p>
                            <ul>
                                <li>Reduce sales team workload by pre-qualifying leads with accurate estimates</li>
                                <li>Gain valuable insights into customer budget expectations and feature priorities</li>
                                <li>Build transparency and trust by making complex pricing structures accessible</li>
                                <li>Increase conversion rates by guiding customers to appropriate service tiers</li>
                            </ul>
                            
                            <h4>Case Study:</h4>
                            <p>A website development agency implemented our calculator and saw lead quality improve by <strong>63%</strong>, with a <strong>45% increase</strong> in high-value project inquiries and significantly reduced time spent on initial consultations.</p>
                        </div>
                    `;
                    break;
                    
                case 'feedback':
                    title = 'Customer Feedback System';
                    content = `
                        <div class="modal-section">
                            <h3>Comprehensive Feedback & Review Platform</h3>
                            <p>Build trust, improve operations, and boost conversions with a robust system for collecting, analyzing, and showcasing authentic customer experiences.</p>
                            
                            <h4>Key Features:</h4>
                            <ul class="feature-list">
                                <li><strong>Multi-channel Collection</strong> - Gather feedback via email, SMS, QR codes, and embedded forms</li>
                                <li><strong>Rich Media Reviews</strong> - Support for photos, videos, and audio testimonials</li>
                                <li><strong>Intelligent Moderation</strong> - AI-powered filtering with sentiment analysis and response suggestions</li>
                                <li><strong>Customizable Widgets</strong> - Showcase reviews with widgets tailored to match your site design</li>
                                <li><strong>Insights Dashboard</strong> - Track trends, sentiment, and key metrics over time</li>
                                <li><strong>Competitive Analysis</strong> - Benchmark your ratings against industry averages and competitors</li>
                                <li><strong>Review Response System</strong> - Manage, prioritize and respond to reviews from a single interface</li>
                            </ul>
                            
                            <h4>Business Impact:</h4>
                            <p>An effective feedback system creates a virtuous cycle of improvement and trust-building:</p>
                            <ul>
                                <li>Businesses showcasing authentic reviews see <strong>62% higher</strong> conversion rates</li>
                                <li>Structured feedback data reveals specific improvement opportunities in products and services</li>
                                <li>Proactive response to customer concerns can turn <strong>65% of negative experiences</strong> into positive ones</li>
                                <li>SEO benefits from constantly updated, unique content with relevant keywords</li>
                            </ul>
                            
                            <h4>Implementation:</h4>
                            <p>The system can be deployed as a fully managed solution or integrated with your existing CRM/customer service platforms, with white-label options available for agencies and enterprise clients.</p>
                        </div>
                    `;
                    break;
                    
                // Handle other demo types...
                default:
                    content = '<p>Please select a specific demo to see more information.</p>';
            }
            
            // Update modal content
            const modalTitle = document.getElementById('modal-title');
            const modalBody = document.getElementById('modal-body');
            const modalCTA = document.getElementById('modal-cta');
            
            if (modalTitle) modalTitle.textContent = title;
            if (modalBody) modalBody.innerHTML = content;
            if (modalCTA) modalCTA.textContent = `Discuss ${title} Solution`;
        }
    }
    
    // Category Filter Functionality
    function initCategoryFilter() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        const showcaseSections = document.querySelectorAll('.showcase-section[data-category]');
        
        if (!filterBtns.length || !showcaseSections.length)
            return;
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Get filter value
                const filterValue = this.getAttribute('data-filter');
                
                // Fix "mobile" vs "mobile-solutions" mismatch
                const targetCategory = filterValue === 'mobile-solutions' ? 'mobile' : filterValue;
                
                // Remove active class from all buttons and add to clicked
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // Show all or filter
                if (filterValue === 'all') {
                    showcaseSections.forEach(section => {
                        section.style.display = 'block';
                        addFadeInAnimation(section);
                    });
                } else {
                    // Show only matching categories
                    showcaseSections.forEach(section => {
                        const sectionCategory = section.getAttribute('data-category');
                        
                        // Show if category matches OR if it's "mobile-solutions" and section is "mobile"
                        if (sectionCategory === targetCategory) {
                            section.style.display = 'block';
                            addFadeInAnimation(section);
                        } else {
                            section.style.display = 'none';
                        }
                    });
                    
                    // Find and scroll to the first matching section
                    const targetSection = document.querySelector(`.showcase-section[data-category="${targetCategory}"]`);
                    if (targetSection) {
                        const headerOffset = 100;
                        const sectionPosition = targetSection.getBoundingClientRect().top;
                        const offsetPosition = sectionPosition + window.pageYOffset - headerOffset;
                        
                        window.scrollTo({
                            top: offsetPosition,
                            behavior: 'smooth'
                        });
                    }
                }
            });
        });
        
        function addFadeInAnimation(element) {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
                element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            }, 50);
        }
    }
    
    // Enhanced Stable Night Sky Animation
    function initParticleAnimation() {
        const animationContainer = document.getElementById('particle-animation');
        
        if (!animationContainer) return;
        
        // Clear any existing content first
        while (animationContainer.firstChild) {
            animationContainer.removeChild(animationContainer.firstChild);
        }
        
        // Add the central text
        const particleText = document.createElement('div');
        particleText.className = 'particle-text';
        particleText.textContent = 'Creative Technology';
        animationContainer.appendChild(particleText);
        
        // Add subtitle text
        const particleSubText = document.createElement('div');
        particleSubText.className = 'particle-subtext';
        particleSubText.textContent = 'Bringing your ideas to life';
        animationContainer.appendChild(particleSubText);
        
        // Create a stable set of stars/particles
        try {
            // Create different types of particles for visual interest
            for (let i = 0; i < 60; i++) {
                createStar(animationContainer, i < 45);
            }
            
            // Add a few "shooting stars" for dynamic effect
            for (let i = 0; i < 3; i++) {
                createShootingStar(animationContainer);
            }
            
            // Add subtle interactive glow
            animationContainer.addEventListener('mousemove', createStarGlow);
            animationContainer.addEventListener('touchmove', handleTouchGlow);
            
            // Periodically create new shooting stars
            setInterval(() => {
                if (Math.random() > 0.7 && document.visibilityState === 'visible') {
                    createShootingStar(animationContainer);
                }
            }, 4000);
            
        } catch (error) {
            console.error("Error creating night sky animation:", error);
        }
        
        function createStar(container, isSmall) {
            const star = document.createElement('div');
            star.className = isSmall ? 'star small' : 'star';
            
            // Random position
            const posX = Math.random() * 100;
            const posY = Math.random() * 100;
            
            // Vary opacity and size for depth effect
            const size = isSmall ? 1 + Math.random() * 2 : 2 + Math.random() * 3;
            const opacity = 0.2 + Math.random() * 0.8;
            
            // Add pulsing animation with random delays
            const delay = Math.random() * 10;
            const duration = 3 + Math.random() * 5;
            
            star.style.cssText = `
                position: absolute;
                left: ${posX}%;
                top: ${posY}%;
                width: ${size}px;
                height: ${size}px;
                background-color: rgba(255, 255, 255, ${opacity});
                border-radius: 50%;
                animation: pulse-star ${duration}s infinite ease-in-out ${delay}s;
                box-shadow: 0 0 ${size}px rgba(255, 255, 255, 0.8);
            `;
            
            container.appendChild(star);
            return star;
        }
        
        function createShootingStar(container) {
            const shootingStar = document.createElement('div');
            shootingStar.className = 'shooting-star';
            
            // Random starting position along the top edge
            const startX = 20 + Math.random() * 60; // Not too close to edges
            
            // Random angle for the shooting star
            const angle = 30 + Math.random() * 60;
            const distance = 30 + Math.random() * 40;
            
            shootingStar.style.cssText = `
                position: absolute;
                left: ${startX}%;
                top: 0;
                width: 2px;
                height: 2px;
                background: #fff;
                border-radius: 50%;
                box-shadow: 0 0 4px 2px rgba(255, 255, 255, 0.7);
                opacity: 0;
                animation: shooting-star 2s ease-out forwards;
                z-index: 10;
            `;
            
            container.appendChild(shootingStar);
            
            // Remove shooting star after animation completes
            setTimeout(() => {
                if (container.contains(shootingStar)) {
                    container.removeChild(shootingStar);
                }
            }, 2000);
        }
        
        function createStarGlow(e) {
            // Limit how often we create glows to prevent performance issues
            if (Math.random() > 0.92) {
                const rect = animationContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                createGlowEffect(x, y);
            }
        }
        
        function handleTouchGlow(e) {
            // Don't scroll the page when interacting with animation
            e.preventDefault();
            
            if (e.touches && e.touches.length > 0) {
                const touch = e.touches[0];
                const rect = animationContainer.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                
                createGlowEffect(x, y);
            }
        }
        
        function createGlowEffect(x, y) {
            const glow = document.createElement('div');
            const size = 5 + Math.random() * 10;
            
            glow.className = 'star-glow';
            glow.style.cssText = `
                position: absolute;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
                border-radius: 50%;
                opacity: 0.7;
                transform: translate(-50%, -50%);
                animation: glow-fade 1.5s forwards ease-out;
                pointer-events: none;
                z-index: 5;
            `;
            
            animationContainer.appendChild(glow);
            
            // Remove glow after animation completes
            setTimeout(() => {
                if (animationContainer.contains(glow)) {
                    animationContainer.removeChild(glow);
                }
            }, 1500);
        }
    }
    
    // Theme Customizer - Simplify
    function initThemeCustomizer() {
        const colorOptions = document.querySelectorAll('.color-option');
        const styleOptions = document.querySelectorAll('.style-option');
        const preview = document.querySelector('.customizer-preview');
        
        if (!colorOptions.length || !styleOptions.length || !preview) return;
        
        const previewHeader = preview.querySelector('.preview-header');
        const previewButton = preview.querySelector('.preview-button');
        
        // Color options
        colorOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Get color
                const color = this.getAttribute('data-color');
                if (!color) return;
                
                // Update active status
                colorOptions.forEach(o => o.classList.remove('active'));
                this.classList.add('active');
                
                // Update preview elements
                if (previewHeader) previewHeader.style.backgroundColor = color;
                if (previewButton) previewButton.style.backgroundColor = color;
            });
        });
        
        // Style options
        styleOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Get style
                const style = this.getAttribute('data-style');
                if (!style) return;
                
                // Update active status
                styleOptions.forEach(o => o.classList.remove('active'));
                this.classList.add('active');
                
                // Update preview
                preview.className = 'customizer-preview';
                preview.classList.add(`layout-${style}`);
            });
        });
    }
    
    // Customer Feedback Widget Implementation
    function initFeedbackWidget() {
        // Get elements
        const feedbackTabs = document.querySelectorAll('.feedback-tab');
        const feedbackPanels = document.querySelectorAll('.feedback-panel');
        const ratingInputStars = document.querySelectorAll('.rating-input i');
        const paginationButtons = document.querySelectorAll('.pagination-btn');
        const reviewLists = document.querySelectorAll('.review-list');
        const feedbackForm = document.querySelector('.feedback-form');
        
        // Handle tab switching
        if (feedbackTabs.length && feedbackPanels.length) {
            feedbackTabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    const tabId = this.getAttribute('data-tab');
                    
                    // Update active tab
                    feedbackTabs.forEach(t => t.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Update active panel
                    feedbackPanels.forEach(panel => {
                        panel.classList.remove('active');
                        if (panel.id === `${tabId}-panel`) {
                            panel.classList.add('active');
                        }
                    });
                });
            });
        }
        
        // Handle star rating input
        if (ratingInputStars.length) {
            ratingInputStars.forEach(star => {
                // Handle click events on stars
                star.addEventListener('click', function() {
                    const rating = parseInt(this.getAttribute('data-rating'));
                    
                    // Update visual selection
                    ratingInputStars.forEach(s => {
                        const starRating = parseInt(s.getAttribute('data-rating'));
                        if (starRating <= rating) {
                            s.classList.remove('far');
                            s.classList.add('fas');
                            s.classList.add('selected');
                        } else {
                            s.classList.remove('fas');
                            s.classList.remove('selected');
                            s.classList.add('far');
                        }
                    });
                });
                
                // Handle hover events for preview
                star.addEventListener('mouseenter', function() {
                    const rating = parseInt(this.getAttribute('data-rating'));
                    
                    ratingInputStars.forEach(s => {
                        const starRating = parseInt(s.getAttribute('data-rating'));
                        if (starRating <= rating) {
                            s.classList.add('hover');
                        }
                    });
                });
                
                star.addEventListener('mouseleave', function() {
                    ratingInputStars.forEach(s => {
                        s.classList.remove('hover');
                    });
                });
            });
        }
        
        // Handle pagination buttons with actual page changing
        if (paginationButtons.length && reviewLists.length) {
            paginationButtons.forEach(btn => {
                btn.addEventListener('click', function() {
                    const pageNumber = this.getAttribute('data-page');
                    
                    // Update active button
                    paginationButtons.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Show the selected page and hide others
                    reviewLists.forEach(list => {
                        list.classList.add('hidden');
                        if (list.id === `page-${pageNumber}`) {
                            list.classList.remove('hidden');
                        }
                    });
                    
                    // Scroll to top of reviews panel
                    const reviewsPanel = document.getElementById('reviews-panel');
                    if (reviewsPanel) {
                        reviewsPanel.scrollTop = 0;
                    }
                });
            });
        }
        
        // Handle form submission
        if (feedbackForm) {
            feedbackForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Get form values
                const nameInput = this.querySelector('input[type="text"]');
                const ratingValue = document.querySelectorAll('.rating-input i.selected').length;
                const feedbackText = this.querySelector('textarea');
                
                // Validate input
                if (!nameInput.value || !ratingValue || !feedbackText.value) {
                    alert('Please fill in all fields and provide a rating');
                    return;
                }
                
                // Show success message (in a real app, this would send data to server)
                const submitBtn = this.querySelector('.submit-feedback');
                const originalText = submitBtn.textContent;
                
                submitBtn.textContent = 'Thank you!';
                submitBtn.style.backgroundColor = '#10b981';
                
                // Reset form
                setTimeout(() => {
                    nameInput.value = '';
                    feedbackText.value = '';
                    
                    // Reset rating
                    ratingInputStars.forEach(s => {
                        s.classList.remove('fas');
                        s.classList.remove('selected');
                        s.classList.add('far');
                    });
                    
                    submitBtn.textContent = originalText;
                    submitBtn.style.backgroundColor = '';
                    
                    // Switch back to reviews tab and go to page 1
                    document.querySelector('.feedback-tab[data-tab="reviews"]').click();
                    document.querySelector('.pagination-btn[data-page="1"]').click();
                }, 2000);
            });
        }
        
        // Add the feedback details to modal content
        window.updateModalContent = function(demoType) {
            if (demoType === 'feedback') {
                const modalTitle = document.getElementById('modal-title');
                const modalBody = document.getElementById('modal-body');
                const modalCTA = document.getElementById('modal-cta');
                
                const title = 'Customer Feedback System';
                const content = `
                    <div class="modal-section">
                        <h3>Customer Feedback & Testimonials</h3>
                        <p>Build trust with potential customers and continuously improve your business by collecting and showcasing genuine customer feedback.</p>
                        
                        <h4>Key Features:</h4>
                        <ul class="feature-list">
                            <li>Customizable feedback collection forms</li>
                            <li>Star rating system with detailed analytics</li>
                            <li>Moderation tools to highlight the best testimonials</li>
                            <li>Social proof widgets for your website and marketing</li>
                            <li>Customer satisfaction trends and reporting</li>
                        </ul>
                        
                        <h4>Business Benefits:</h4>
                        <p>Businesses that effectively showcase customer testimonials see up to 62% higher conversion rates. Our feedback system helps identify areas of improvement while building trust with potential customers.</p>
                    </div>
                `;
                
                if (modalTitle) modalTitle.textContent = title;
                if (modalBody) modalBody.innerHTML = content;
                if (modalCTA) modalCTA.textContent = `Discuss ${title} Solution`;
            } else {
                // Handle other demo types with default implementation
                // ...existing code...
            }
        };
    }
    
    // Features Carousel Functionality
    function initFeaturesCarousel() {
        const carousel = document.querySelector('.features-carousel');
        const cards = document.querySelectorAll('.features-carousel .feature-card');
        const prevBtn = document.querySelector('.carousel-nav.prev-btn');
        const nextBtn = document.querySelector('.carousel-nav.next-btn');
        const indicatorsContainer = document.querySelector('.carousel-indicators');
        
        if (!carousel || !cards.length) return;
        
        // Initialize variables
        let currentIndex = 0;
        let cardWidth = 0;
        let cardsPerView = 0;
        let totalSlides = 0;
        
        // Create indicators based on visible cards
        function createIndicators() {
            // Clear existing indicators
            if (indicatorsContainer) {
                indicatorsContainer.innerHTML = '';
                
                // Calculate how many indicators we need
                for (let i = 0; i < totalSlides; i++) {
                    const indicator = document.createElement('div');
                    indicator.className = 'carousel-indicator';
                    if (i === currentIndex) {
                        indicator.classList.add('active');
                    }
                    
                    // Click on indicator to go to that slide
                    indicator.addEventListener('click', () => {
                        goToSlide(i);
                        updateIndicators(i);
                    });
                    
                    indicatorsContainer.appendChild(indicator);
                }
            }
        }
        
        // Update active indicator
        function updateIndicators(index) {
            const indicators = document.querySelectorAll('.carousel-indicator');
            indicators.forEach((indicator, i) => {
                indicator.classList.toggle('active', i === index);
            });
        }
        
        // Calculate dimensions based on viewport
        function calculateDimensions() {
            cardWidth = cards[0].offsetWidth + parseInt(window.getComputedStyle(cards[0]).marginRight);
            cardsPerView = Math.max(1, Math.floor(carousel.offsetWidth / cardWidth));
            totalSlides = Math.max(1, Math.ceil(cards.length - cardsPerView) + 1);
            
            // Recreate indicators with new calculations
            createIndicators();
        }
        
        // Scroll to specific slide
        function goToSlide(index) {
            // Make sure index is within bounds
            currentIndex = Math.max(0, Math.min(index, totalSlides - 1));
            
            // Calculate scroll position
            const scrollPosition = currentIndex * cardWidth;
            carousel.scrollTo({ left: scrollPosition, behavior: 'smooth' });
            
            // Update button states
            updateButtonStates();
            
            // Update active card styling
            updateActiveCards();
        }
        
        // Update active card styling based on visibility
        function updateActiveCards() {
            const scrollPosition = carousel.scrollLeft;
            const viewportWidth = carousel.offsetWidth;
            
            cards.forEach(card => {
                const cardLeft = card.offsetLeft - carousel.offsetLeft;
                const cardRight = cardLeft + card.offsetWidth;
                
                // Card is fully visible in the viewport
                if (cardLeft >= scrollPosition && cardRight <= scrollPosition + viewportWidth) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }
        
        // Update button states (disable if at the beginning/end)
        function updateButtonStates() {
            if (prevBtn && nextBtn) {
                prevBtn.classList.toggle('disabled', currentIndex === 0);
                nextBtn.classList.toggle('disabled', currentIndex === totalSlides - 1);
            }
        }
        
        // Set up navigation buttons
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                goToSlide(currentIndex - 1);
                updateIndicators(currentIndex);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                goToSlide(currentIndex + 1);
                updateIndicators(currentIndex);
            });
        }
        
        // Handle scroll event to sync indicators
        carousel.addEventListener('scroll', () => {
            // Debounce scroll event for performance
            clearTimeout(carousel.scrollTimeout);
            carousel.scrollTimeout = setTimeout(() => {
                // Calculate current index based on scroll position
                const scrollPosition = carousel.scrollLeft;
                currentIndex = Math.round(scrollPosition / cardWidth);
                updateIndicators(currentIndex);
                updateButtonStates();
                updateActiveCards();
            }, 100);
        });
        
        // Handle keyboard navigation when carousel is focused
        carousel.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                goToSlide(currentIndex - 1);
                updateIndicators(currentIndex);
            } else if (e.key === 'ArrowRight') {
                goToSlide(currentIndex + 1);
                updateIndicators(currentIndex);
            }
        });
        
        // Add touch swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
        
        function handleSwipe() {
            const swipeThreshold = 70; // Minimum pixels to be considered a swipe
            
            if (touchStartX - touchEndX > swipeThreshold) {
                // Swipe left, go to next slide
                goToSlide(currentIndex + 1);
                updateIndicators(currentIndex);
            } else if (touchEndX - touchStartX > swipeThreshold) {
                // Swipe right, go to previous slide
                goToSlide(currentIndex - 1);
                updateIndicators(currentIndex);
            }
        }
        
        // Initial setup
        function initCarousel() {
            calculateDimensions();
            updateButtonStates();
            updateActiveCards();
            
            // Make first few cards active initially
            for (let i = 0; i < Math.min(cardsPerView, cards.length); i++) {
                cards[i].classList.add('active');
            }
        }
        
        // Initialize on load
        initCarousel();
        
        // Recalculate on window resize
        window.addEventListener('resize', debounce(() => {
            calculateDimensions();
            goToSlide(0);
            updateIndicators(0);
        }, 200));
    }
});

// Add float-particle animation if it doesn't exist
if (!document.getElementById('particle-animations')) {
    const styleSheet = document.createElement('style');
    styleSheet.id = 'particle-animations';
    styleSheet.textContent = `
        @keyframes float-particle {
            0%, 100% {
                transform: translateY(0) translateX(0);
            }
            25% {
                transform: translateY(-20px) translateX(10px);
            }
            50% {
                transform: translateY(-10px) translateX(-15px);
            }
            75% {
                transform: translateY(15px) translateX(-5px);
            }
        }
        
        .highlight {
            animation: price-highlight 0.3s ease-in-out;
        }
        
        @keyframes price-highlight {
            0%, 100% {
                color: var(--primary-color);
            }
            50% {
                color: var(--accent-color);
            }
        }
    `;
    document.head.appendChild(styleSheet);
}

// Enhanced Night Sky Animation as Hero
function initNightSkyAnimation() {
    // Target the new ID for our enhanced night sky
    const animationContainer = document.getElementById('night-sky-animation');
    
    if (!animationContainer) {
        console.log('Night sky animation container not found');
        return;
    }
    
    console.log('Initializing night sky animation');
    
    // Clear any existing content first
    while (animationContainer.firstChild) {
        animationContainer.removeChild(animationContainer.firstChild);
    }
    
    try {
        // Add depth with nebula clouds
        createNebulaClouds(animationContainer);
        
        // Create stars with varying sizes for depth
        const starCounts = {
            small: 120,
            medium: 60,
            large: 25
        };
        
        // Create stars at different depths/sizes
        for (let i = 0; i < starCounts.small; i++) {
            createStar(animationContainer, 'small');
        }
        
        for (let i = 0; i < starCounts.medium; i++) {
            createStar(animationContainer, 'medium');
        }
        
        for (let i = 0; i < starCounts.large; i++) {
            createStar(animationContainer, 'large');
        }
        
        // Add special bright stars
        for (let i = 0; i < 3; i++) {
            createLargeStar(animationContainer);
        }
        
        // Add shooting stars periodically
        createShootingStar(animationContainer);
        
        setInterval(() => {
            if (Math.random() > 0.6 && document.visibilityState === 'visible') {
                createShootingStar(animationContainer);
            }
        }, 3000);
        
        // Add interactive effects
        animationContainer.addEventListener('mousemove', handleInteraction);
        animationContainer.addEventListener('touchmove', handleTouchInteraction);
        
        // Initial meteor shower effect
        setTimeout(() => {
            createMeteorShower(animationContainer);
        }, 1000);
        
        // Hide the interaction hint after user has interacted
        let hasInteracted = false;
        const interactionHint = document.querySelector('.interaction-hint');
        
        function hideHintAfterInteraction() {
            if (!hasInteracted && interactionHint) {
                hasInteracted = true;
                interactionHint.style.opacity = '0';
                setTimeout(() => {
                    if (interactionHint.parentNode) {
                        interactionHint.parentNode.removeChild(interactionHint);
                    }
                }, 500);
            }
        }
        
        // Add this call to our event listeners
        animationContainer.addEventListener('mousemove', hideHintAfterInteraction);
        animationContainer.addEventListener('touchstart', hideHintAfterInteraction);
        
        // Add text without animations - simple static positioning
        const nightSkyContent = document.querySelector('.night-sky-content');
        const headingText = document.querySelector('.night-sky-content h2');
        const paragraphText = document.querySelector('.night-sky-content p');
        
        if (nightSkyContent && headingText && paragraphText) {
            // Keep the original content without any animation
            const headingHTML = headingText.innerHTML;
            const paragraphContent = paragraphText.textContent;
            paragraphText.innerHTML = paragraphContent;
            
            // Remove any event listeners that might be triggering animations
            const oldNode = nightSkyContent.cloneNode(true);
            nightSkyContent.parentNode.replaceChild(oldNode, nightSkyContent);
        }
        
    } catch (error) {
        console.error("Error creating night sky animation:", error);
    }
}

// Add these helper functions for the night sky
function createNebulaClouds(container) {
    // Create 3 nebula clouds at different positions
    const nebulaPositions = [
        { top: '20%', left: '30%', size: '600px', hue: '250' },
        { top: '60%', left: '70%', size: '500px', hue: '290' },
        { top: '75%', left: '20%', size: '400px', hue: '220' }
    ];
    
    nebulaPositions.forEach(pos => {
        const nebula = document.createElement('div');
        nebula.className = 'nebula';
        nebula.style.cssText = `
            top: ${pos.top};
            left: ${pos.left};
            width: ${pos.size};
            height: ${pos.size};
            background: radial-gradient(
                circle at center,
                hsla(${pos.hue}, 70%, 60%, 0.15),
                hsla(${parseInt(pos.hue) + 20}, 60%, 50%, 0.1),
                transparent 70%
            );
            animation: nebula-float ${40 + Math.random() * 20}s infinite alternate ease-in-out;
            animation-delay: ${Math.random() * 10}s;
            position: absolute;
            border-radius: 50%;
            filter: blur(40px);
            opacity: 0.2;
            pointer-events: none;
            z-index: 1;
        `;
        
        container.appendChild(nebula);
    });
}

function createStar(container, size) {
    const star = document.createElement('div');
    star.className = 'star ' + size;
    
    // Random position
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    
    // Size and opacity based on star type
    let starSize, opacity, blurRadius;
    
    switch(size) {
        case 'small':
            starSize = 1 + Math.random();
            opacity = 0.3 + Math.random() * 0.3;
            blurRadius = 1;
            break;
        case 'medium':
            starSize = 2 + Math.random();
            opacity = 0.5 + Math.random() * 0.3;
            blurRadius = 2;
            break;
        case 'large':
            starSize = 2.5 + Math.random() * 1.5;
            opacity = 0.7 + Math.random() * 0.3;
            blurRadius = 3;
            break;
        default:
            starSize = 1.5;
            opacity = 0.5;
            blurRadius = 2;
    }
    
    // Add pulsing animation with random delays and durations
    const delay = Math.random() * 10;
    const duration = 3 + Math.random() * 5;
    
    star.style.cssText = `
        position: absolute;
        left: ${posX}%;
        top: ${posY}%;
        width: ${starSize}px;
        height: ${starSize}px;
        background-color: rgba(255, 255, 255, ${opacity});
        border-radius: 50%;
        animation: pulse-star ${duration}s infinite ease-in-out ${delay}s;
        box-shadow: 0 0 ${blurRadius}px rgba(255, 255, 255, ${opacity});
    `;
    
    container.appendChild(star);
    return star;
}

function createLargeStar(container) {
    const star = document.createElement('div');
    star.className = 'large-star';
    
    // Random position, but not too close to the edges
    const posX = 10 + Math.random() * 80;
    const posY = 10 + Math.random() * 80;
    
    star.style.cssText = `
        left: ${posX}%;
        top: ${posY}%;
    `;
    
    container.appendChild(star);
    
    // Add an extra glow effect for large stars
    const glow = document.createElement('div');
    glow.style.cssText = `
        position: absolute;
        left: ${posX}%;
        top: ${posY}%;
        width: 2px;
        height: 2px;
        border-radius: 50%;
        background: transparent;
        box-shadow: 0 0 60px 20px rgba(255, 255, 255, 0.7);
        filter: blur(2px);
        animation: pulse-glow 6s infinite ease-in-out ${Math.random() * 3}s;
        pointer-events: none;
        z-index: 4;
    `;
    container.appendChild(glow);
    
    // Create cross rays for the star
    const rays = document.createElement('div');
    rays.style.cssText = `
        position: absolute;
        left: ${posX}%;
        top: ${posY}%;
        width: 20px;
        height: 20px;
        transform: translate(-50%, -50%);
        opacity: 0.4;
        pointer-events: none;
        z-index: 3;
    `;
    
    // Create the star cross effect
    rays.innerHTML = `
        <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: linear-gradient(to right, transparent, white, transparent);"></div>
        <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: linear-gradient(to bottom, transparent, white, transparent);"></div>
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; transform: rotate(45deg);">
            <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent);"></div>
        </div>
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; transform: rotate(-45deg);">
            <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: linear-gradient(to right, transparent, rgba(255,255,255,0.5), transparent);"></div>
        </div>
    `;
    
    container.appendChild(rays);
    
    return star;
}

function createShootingStar(container) {
    const shootingStar = document.createElement('div');
    shootingStar.className = 'shooting-star';
    
    // Random starting position on the top-left portion
    const startX = Math.random() * 50;
    const startY = Math.random() * 30;
    
    // Random angle for the shooting star (from top-left to bottom-right)
    const angle = 30 + Math.random() * 30;
    
    shootingStar.style.cssText = `
        position: absolute;
        left: ${startX}%;
        top: ${startY}%;
        width: 3px;
        height: 3px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.8),
                    0 0 20px 5px rgba(255, 255, 255, 0.4);
        opacity: 0;
        transform-origin: center;
        transform: rotate(${angle}deg);
        z-index: 10;
        animation: shooting-star 2s ease-out forwards;
    `;
    
    // Add a trail for the shooting star
    const trail = document.createElement('div');
    trail.style.cssText = `
        position: absolute;
        top: 0;
        right: 0;
        width: 20px;
        height: 2px;
        background: linear-gradient(to left, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.8));
        border-radius: 2px;
        transform: translateX(100%);
    `;
    
    shootingStar.appendChild(trail);
    container.appendChild(shootingStar);
    
    // Remove shooting star after animation completes
    setTimeout(() => {
        if (container.contains(shootingStar)) {
            container.removeChild(shootingStar);
        }
    }, 2000);
}

function createMeteorShower(container) {
    // Create 5-10 shooting stars in quick succession
    const count = 5 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            createShootingStar(container);
        }, i * 300);
    }
}

function handleInteraction(e) {
    // Create interactive effects based on mouse position
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Create glow effects occasionally
    if (Math.random() > 0.85) {
        createGlowEffect(x, y, this);
    }
}

function handleTouchInteraction(e) {
    // Prevent scrolling when interacting with animation
    e.preventDefault();
    
    if (e.touches && e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = this.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        
        createGlowEffect(x, y, this);
    }
}

function createGlowEffect(x, y, container) {
    const glow = document.createElement('div');
    const size = 5 + Math.random() * 10;
    
    glow.className = 'star-glow';
    glow.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
        border-radius: 50%;
        opacity: 0.7;
        transform: translate(-50%, -50%);
        animation: glow-fade 1.5s forwards ease-out;
        pointer-events: none;
        z-index: 5;
    `;
    
    container.appendChild(glow);
    
    // Remove glow after animation completes
    setTimeout(() => {
        if (container.contains(glow)) {
            container.removeChild(glow);
        }
    }, 1500);
}

// Improved Theme Customizer - Enhanced interactive features
function initThemeCustomizer() {
    const colorOptions = document.querySelectorAll('.color-option');
    const styleOptions = document.querySelectorAll('.style-option');
    const preview = document.querySelector('.customizer-preview');
    
    if (!colorOptions.length || !styleOptions.length || !preview) return;
    
    const previewHeader = preview.querySelector('.preview-header');
    const previewHero = preview.querySelector('.preview-hero');
    const previewFeatures = preview.querySelectorAll('.preview-feature');
    
    // Color options
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Get color
            const color = this.getAttribute('data-color');
            if (!color) return;
            
            // Update active status
            colorOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            
            // Update preview elements with smooth transitions
            if (previewHeader) {
                previewHeader.style.background = color;
                document.documentElement.style.setProperty('--preview-color', color);
            }
            
            // Update hero with subtle background based on color
            if (previewHero) {
                previewHero.style.setProperty('--hero-bg', color);
                previewHero.querySelector('.preview-hero-title').style.background = 
                    `linear-gradient(90deg, ${color}, ${adjustColorBrightness(color, 30)})`;
            }
            
            // Ripple animation for selection
            createColorRipple(this, color);
        });
    });
    
    // Style options with visual feedback
    styleOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Get style
            const style = this.getAttribute('data-style');
            if (!style) return;
            
            // Update active status
            styleOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            
            // Update preview with animation
            preview.style.opacity = '0.7';
            preview.style.transform = 'scale(0.97)';
            
            setTimeout(() => {
                // Reset classes and add new style class
                preview.className = 'customizer-preview';
                preview.classList.add(`layout-${style}`);
                
                // Apply specific style adjustments
                applyStylePreview(style, preview);
                
                // Restore preview
                preview.style.opacity = '1';
                preview.style.transform = 'scale(1)';
            }, 300);
        });
    });
    
    // Helper function to create ripple effect on color selection
    function createColorRipple(element, color) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        
        ripple.style.cssText = `
            position: absolute;
            width: 5px;
            height: 5px;
            background: ${color};
            left: ${rect.width / 2}px;
            top: ${rect.height / 2}px;
            border-radius: 50%;
            transform: translate(-50%, -50%);
            animation: ripple-effect 0.6s ease-out;
            pointer-events: none;
            opacity: 0.5;
            z-index: 1;
        `;
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    // Helper function to apply different style presets
    function applyStylePreview(style, preview) {
        const previewHeader = preview.querySelector('.preview-header');
        const previewHero = preview.querySelector('.preview-hero');
        const previewFeatures = preview.querySelectorAll('.preview-feature');
        const activeColor = document.querySelector('.color-option.active').getAttribute('data-color');
        
        switch (style) {
            case 'modern':
                if (previewHeader) previewHeader.style.height = '50px';
                if (previewHero) {
                    previewHero.style.borderLeft = '';
                    previewHero.style.paddingLeft = '12px';
                    previewHero.style.background = 'rgba(226, 232, 240, 0.3)';
                    if (document.documentElement.classList.contains('dark-theme')) {
                        previewHero.style.background = 'rgba(30, 41, 59, 0.4)';
                    }
                }
                previewFeatures.forEach(feature => {
                    feature.style.borderTop = '';
                    feature.style.borderRadius = '8px';
                    feature.style.background = 'rgba(226, 232, 240, 0.5)';
                    if (document.documentElement.classList.contains('dark-theme')) {
                        feature.style.background = 'rgba(30, 41, 59, 0.5)';
                    }
                });
                break;
                
            case 'classic':
                if (previewHeader) {
                    previewHeader.style.height = '60px';
                    previewHeader.style.backgroundImage = 'linear-gradient(to right, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%)';
                    previewHeader.style.borderBottom = `4px solid ${activeColor}`;
                }
                if (previewHero) {
                    previewHero.style.borderRadius = '0';
                    previewHero.style.background = 'transparent';
                    previewHero.style.borderLeft = `4px solid ${activeColor}`;
                    previewHero.style.paddingLeft = '20px';
                }
                previewFeatures.forEach(feature => {
                    feature.style.borderRadius = '0';
                    feature.style.background = 'rgba(226, 232, 240, 0.3)';
                    feature.style.borderTop = `3px solid ${activeColor}`;
                    feature.style.paddingTop = '12px';
                    
                    if (document.documentElement.classList.contains('dark-theme')) {
                        feature.style.background = 'rgba(30, 41, 59, 0.3)';
                    }
                    
                    // Make feature title and text rectangular
                    const title = feature.querySelector('.preview-feature-title');
                    const text = feature.querySelector('.preview-feature-text');
                    if (title) title.style.borderRadius = '0';
                    if (text) text.style.borderRadius = '0';
                });
                break;
                
            case 'minimal':
                if (previewHeader) {
                    previewHeader.style.height = '30px';
                    previewHeader.style.background = 'transparent';
                    previewHeader.style.borderBottom = '1px solid #e2e8f0';
                    if (document.documentElement.classList.contains('dark-theme')) {
                        previewHeader.style.borderColor = '#334155';
                    }
                }
                if (previewHero) {
                    previewHero.style.borderRadius = '0';
                    previewHero.style.background = 'transparent';
                    previewHero.style.border = 'none';
                    previewHero.style.padding = '0';
                    previewHero.style.height = '50px';
                    
                    // Make the title and text elements more minimal
                    const heroTitle = previewHero.querySelector('.preview-hero-title');
                    const heroText = previewHero.querySelector('.preview-hero-text');
                    if (heroTitle) {
                        heroTitle.style.height = '12px';
                        heroTitle.style.width = '60%';
                    }
                    if (heroText) {
                        heroText.style.height = '6px';
                        heroText.style.width = '40%';
                    }
                }
                previewFeatures.forEach(feature => {
                    feature.style.background = 'transparent';
                    feature.style.borderRadius = '0';
                    feature.style.padding = '0';
                    feature.style.height = '30px';
                    feature.style.borderTop = 'none';
                    feature.style.borderBottom = '1px solid #e2e8f0';
                    
                    if (document.documentElement.classList.contains('dark-theme')) {
                        feature.style.borderColor = '#334155';
                    }
                    
                    // Make the feature title and text elements more minimal
                    const featureTitle = feature.querySelector('.preview-feature-title');
                    const featureText = feature.querySelector('.preview-feature-text');
                    if (featureTitle) {
                        featureTitle.style.height = '6px';
                        featureTitle.style.width = '70%';
                    }
                    if (featureText) {
                        featureText.style.height = '4px';
                        featureText.style.width = '50%';
                    }
                });
                break;
        }
    }
    
    // Helper function to adjust color brightness
    function adjustColorBrightness(hex, percent) {
        // Convert hex to RGB
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        
        // Increase brightness
        r = Math.min(255, Math.round(r * (1 + percent / 100)));
        g = Math.min(255, Math.round(g * (1 + percent / 100)));
        b = Math.min(255, Math.round(b * (1 + percent / 100)));
        
        // Convert back to hex
        const brightHex = '#' + 
            r.toString(16).padStart(2, '0') +
            g.toString(16).padStart(2, '0') +
            b.toString(16).padStart(2, '0');
            
        return brightHex;
    }
    
    // Add ripple effect animation style if it doesn't exist
    if (!document.getElementById('ripple-animation')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'ripple-animation';
        styleSheet.innerHTML = `
            @keyframes ripple-effect {
                0% {
                    width: 5px;
                    height: 5px;
                    opacity: 0.8;
                }
                100% {
                    width: 50px;
                    height: 50px;
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styleSheet);
    }
}

// Make product card buttons stay highlighted when clicked
function initProductCardButtons() {
    const quickViewButtons = document.querySelectorAll('.quick-view-btn');
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    
    // Handle quick view buttons
    quickViewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle active class
            this.classList.toggle('active');
            
            // Add visual feedback when toggling
            const icon = this.querySelector('i');
            if (icon) {
                if (this.classList.contains('active')) {
                    icon.className = 'fas fa-eye'; // Solid icon when active
                } else {
                    icon.className = 'far fa-eye'; // Regular (outline) icon when inactive
                }
                
                // Add pulse animation
                icon.classList.add('button-pulse');
                setTimeout(() => {
                    icon.classList.remove('button-pulse');
                }, 500);
            }
        });
    });
    
    // Handle wishlist buttons
    wishlistButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Toggle active class
            this.classList.toggle('active');
            
            // Add visual feedback when toggling
            const icon = this.querySelector('i');
            if (icon) {
                if (this.classList.contains('active')) {
                    icon.className = 'fas fa-heart'; // Solid heart when active
                    icon.style.color = '#f72585'; // Pink heart when active
                } else {
                    icon.className = 'far fa-heart'; // Regular (outline) heart when inactive
                    icon.style.color = ''; // Reset color
                }
                
                // Add pulse animation
                icon.classList.add('button-pulse');
                setTimeout(() => {
                    icon.classList.remove('button-pulse');
                }, 500);
            }
        });
    });
}
