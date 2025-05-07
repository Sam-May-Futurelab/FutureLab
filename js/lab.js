document.addEventListener('DOMContentLoaded', function() {
    // Initialize any lab page specific functionality
    console.log('Lab page loaded with new questionnaire form.');
    
    // If the page was loaded with a hash, scroll to that section
    if (window.location.hash) {
        const targetElement = document.querySelector(window.location.hash);
        if (targetElement) {
            setTimeout(() => {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }, 100);
        }
    }
    
    // Initialize theme toggle functionality if not already done
    initializeThemeToggle();
    
    // Function to initialize theme toggle
    function initializeThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        
        if (!themeToggle) return;
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('theme') || 
                         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        
        // Apply saved theme
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            themeToggle.querySelector('i').className = 'fas fa-sun';
        }
        
        // Add toggle functionality
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-theme');
            
            const isDark = document.body.classList.contains('dark-theme');
            const iconElement = themeToggle.querySelector('i');
            
            iconElement.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
});
