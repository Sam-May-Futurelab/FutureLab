/**
 * Mobile utilities - simplified
 * Only handles very basic mobile-specific functionality
 */
document.addEventListener('DOMContentLoaded', function() {
  // Hide comparison section on mobile
  function handleComparisonVisibility() {
    const comparisonSection = document.querySelector('.comparison');
    if (comparisonSection) {
      if (window.innerWidth <= 768) {
        comparisonSection.style.display = 'none';
      } else {
        comparisonSection.style.display = '';
      }
    }
  }
  
  // Run on load
  handleComparisonVisibility();
  
  // Run on resize
  window.addEventListener('resize', handleComparisonVisibility);
});
