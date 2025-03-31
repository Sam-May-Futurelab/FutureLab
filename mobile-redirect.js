/**
 * Mobile redirection and navigation management
 * Controls visibility of showcase and other mobile-specific navigation behaviors
 */
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on mobile
  const isMobile = window.innerWidth <= 768 || 
                  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Hide showcase links on mobile
  function hideShowcaseLinks() {
    if (isMobile) {
      // Find all showcase links
      const showcaseLinks = document.querySelectorAll(
        'a[href*="showcase"], .showcase-link, a.showcase-link'
      );
      
      // Hide each link and its parent li
      showcaseLinks.forEach(link => {
        link.style.display = 'none';
        
        // If link is in a list item, also hide the list item
        const parentLi = link.closest('li');
        if (parentLi) {
          parentLi.style.display = 'none';
        }
      });
      
      // If user is on showcase page and using mobile, redirect to home
      if (window.location.href.includes('showcase.html')) {
        // Optional - uncomment to enable redirect:
        // window.location.href = 'index.html';
      }
    }
  }
  
  // Run initially
  hideShowcaseLinks();
  
  // Check again on resize
  window.addEventListener('resize', function() {
    hideShowcaseLinks();
  });
});
