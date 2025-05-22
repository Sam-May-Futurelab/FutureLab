window.initializeBackToTop = function() {
    const backToTopButton = document.getElementById('backToTopBtn');

    if (!backToTopButton) {
        console.warn('BackToTopButton not found. Skipping initialization.');
        return;
    }

    // Function to show or hide the button based on scroll position
    function toggleBackToTopButton() {
        if (window.scrollY > 300) { // Show button after scrolling 300px
            if (!backToTopButton.classList.contains('show')) {
                backToTopButton.classList.add('show');
            }
        } else {
            if (backToTopButton.classList.contains('show')) {
                backToTopButton.classList.remove('show');
            }
        }
    }

    // Function to scroll to the top of the page smoothly
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Event listeners
    window.addEventListener('scroll', toggleBackToTopButton);
    backToTopButton.addEventListener('click', scrollToTop);

    // Initial check in case the page is already scrolled down
    toggleBackToTopButton();
};
