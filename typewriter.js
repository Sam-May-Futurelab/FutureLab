/**
 * Robust typewriter animation for hero heading with error prevention
 */
document.addEventListener('DOMContentLoaded', function() {
  // Target only the main hero heading
  const heroHeading = document.querySelector('.hero h1');
  
  if (!heroHeading) return;

  // Skip animation on mobile devices
  const isMobile = window.innerWidth <= 768 || 
                  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) return;
  
  // Prevent other scripts from interfering by marking this heading
  heroHeading.setAttribute('data-typewriter', 'active');
  
  // Store original text and clear the heading
  const originalText = heroHeading.innerText;
  const originalHTML = heroHeading.innerHTML;
  
  // Create a wrapper to protect our animation
  const wrapper = document.createElement('span');
  wrapper.className = 'typewriter-wrapper';
  wrapper.style.cssText = 'position: relative; display: inline-block;';
  heroHeading.innerHTML = '';
  heroHeading.appendChild(wrapper);
  
  // Set minimum height to prevent layout shift
  const computedStyle = window.getComputedStyle(heroHeading);
  heroHeading.style.minHeight = computedStyle.height;
  
  // Add blinking cursor as a separate element
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  cursor.innerHTML = '|';
  cursor.style.cssText = 'display: inline-block; animation: cursor-blink 1s step-end infinite;';
  
  // Safety mechanism - if animation doesn't start within 1 second, show original text
  const fallbackTimer = setTimeout(() => {
    console.log("Typewriter fallback activated");
    heroHeading.innerHTML = originalHTML;
  }, 1000);
  
  // Start typing with a slight delay
  setTimeout(() => {
    // Clear the fallback timer since animation is starting
    clearTimeout(fallbackTimer);
    
    // Reset the heading to empty and add the cursor
    wrapper.innerHTML = '';
    wrapper.appendChild(cursor);
    
    let charIndex = 0;
    const typeDelay = 50; // ms between each character
    
    function typeWriter() {
      if (charIndex < originalText.length) {
        // Insert character before cursor
        const textNode = document.createTextNode(originalText.charAt(charIndex));
        wrapper.insertBefore(textNode, cursor);
        charIndex++;
        setTimeout(typeWriter, typeDelay);
      } else {
        // Animation complete - remove cursor after delay
        setTimeout(() => {
          if (cursor.parentNode === wrapper) {
            wrapper.removeChild(cursor);
          }
        }, 3000);
      }
    }
    
    // Start the typing animation
    typeWriter();
  }, 500);
  
  // Add fallback style for cursor blinking if not already added
  if (!document.getElementById('typewriter-styles')) {
    const style = document.createElement('style');
    style.id = 'typewriter-styles';
    style.textContent = `
      @keyframes cursor-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
});

// Prevent multiple initializations
window.typewriterInitialized = true;
