document.addEventListener('DOMContentLoaded', function() {
    const backToTopButton = document.getElementById('backToTopBtn');

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
    if (backToTopButton) { // Check if the button exists
        window.addEventListener('scroll', toggleBackToTopButton);
        backToTopButton.addEventListener('click', scrollToTop);

        // Initial check in case the page is already scrolled down
        toggleBackToTopButton();
    }
});
