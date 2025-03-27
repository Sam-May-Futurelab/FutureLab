// Simple script to replace missing images with placeholders

document.addEventListener('DOMContentLoaded', function() {
    // Find all images on the page
    const images = document.querySelectorAll('img');
    
    // Handle image error events
    images.forEach(img => {
        img.onerror = function() {
            // Get image dimensions
            const width = this.getAttribute('width') || this.clientWidth || 300;
            const height = this.getAttribute('height') || this.clientHeight || 200;
            
            // Get image alt text or fallback
            const altText = this.alt || 'Placeholder Image';
            
            // Set placeholder image
            this.src = `https://via.placeholder.com/${width}x${height}?text=${encodeURIComponent(altText)}`;
            this.onerror = null; // Prevent infinite error loop
        };
    });
});
