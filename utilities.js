/**
 * Common utility functions for Future Me site
 */

// Debounce function for performance optimization
function debounce(func, wait, immediate) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Generate a random number between min and max
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Format currency based on locale and currency
function formatCurrency(amount, currency = 'GBP', locale = 'en-GB') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}
