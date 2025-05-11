document.addEventListener('DOMContentLoaded', function() {
    const backToTopButton = document.createElement('div');
    backToTopButton.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopButton.className = 'back-to-top-btn'; // This class is styled in back-to-top.css
    document.body.appendChild(backToTopButton);

    const scrollOffset = 300; // Show button after scrolling this amount (px)

    window.addEventListener('scroll', function() {
        if (window.pageYOffset > scrollOffset) {
            backToTopButton.classList.add('show');
        } else {
            backToTopButton.classList.remove('show');
        }
    });

    backToTopButton.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
});
