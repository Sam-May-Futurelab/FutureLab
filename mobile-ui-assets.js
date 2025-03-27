/**
 * Mobile UI assets and helpers for showcase mockups
 */

// Function to create realistic time for status bar
function updateStatusBarTime() {
    const statusTimeElements = document.querySelectorAll('.status-time');
    
    if (!statusTimeElements.length) return;
    
    // Update the time
    const updateTime = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const formattedTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
        
        statusTimeElements.forEach(el => {
            el.textContent = formattedTime;
        });
    };
    
    // Update immediately and then every minute
    updateTime();
    setInterval(updateTime, 60000);
}

// Add subtle animation to the stat card
function animateStatCard() {
    const statCard = document.querySelector('.app-stat-card');
    if (!statCard) return;
    
    setTimeout(() => {
        statCard.style.transform = 'translateY(-5px)';
        statCard.style.boxShadow = '0 8px 30px rgba(67, 97, 238, 0.3)';
        
        setTimeout(() => {
            statCard.style.transform = '';
            statCard.style.boxShadow = '';
        }, 1000);
    }, 1000);
}

// Animate the progress bars
function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-bar');
    
    progressBars.forEach((bar, index) => {
        const originalWidth = bar.style.width;
        bar.style.width = '0%';
        
        setTimeout(() => {
            bar.style.width = originalWidth;
            bar.style.transition = 'width 1s ease-out';
        }, 500 + (index * 200));
    });
}

// Add subtle interactions to the nav items
function setupNavInteractions() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Don't change active status of highlighted item
            if (this.classList.contains('nav-item-highlighted')) return;
            
            navItems.forEach(navItem => {
                if (!navItem.classList.contains('nav-item-highlighted')) {
                    navItem.classList.remove('active');
                }
            });
            
            this.classList.add('active');
        });
    });
}

// Add ripple effect to activity items
function setupActivityInteractions() {
    const activityItems = document.querySelectorAll('.activity-item');
    
    activityItems.forEach(item => {
        item.addEventListener('click', function() {
            // Create ripple element
            const ripple = document.createElement('div');
            ripple.className = 'activity-ripple';
            this.appendChild(ripple);
            
            // Positioning and animation
            const rect = this.getBoundingClientRect();
            ripple.style.top = '0';
            ripple.style.left = '0';
            ripple.style.width = `${rect.width}px`;
            ripple.style.height = `${rect.height}px`;
            
            // Remove after animation
            setTimeout(() => {
                ripple.remove();
            }, 500);
        });
    });
}

// Add keyframe definitions for UI animations if they don't exist
function addUiAnimationStyles() {
    if (!document.getElementById('mobile-ui-animations')) {
        const styleEl = document.createElement('style');
        styleEl.id = 'mobile-ui-animations';
        styleEl.textContent = `
            .activity-ripple {
                position: absolute;
                background: rgba(67, 97, 238, 0.1);
                border-radius: 12px;
                transform: scale(0);
                animation: activity-ripple 0.5s ease-out;
            }
            
            @keyframes activity-ripple {
                to {
                    transform: scale(1);
                    opacity: 0;
                }
            }
            
            .progress-bar {
                transition: width 1s ease-out;
            }
            
            .app-stat-card {
                transition: transform 0.5s ease, box-shadow 0.5s ease;
            }
            
            .nav-item {
                transition: transform 0.2s ease, color 0.2s ease;
            }
            
            .nav-item:active {
                transform: scale(0.9);
            }
        `;
        document.head.appendChild(styleEl);
    }
}

// Initialize mobile UI assets
document.addEventListener('DOMContentLoaded', function() {
    updateStatusBarTime();
    addUiAnimationStyles();
    
    // Add a little delay to ensure elements are rendered
    setTimeout(() => {
        animateStatCard();
        animateProgressBars();
        setupNavInteractions();
        setupActivityInteractions();
    }, 500);
});
