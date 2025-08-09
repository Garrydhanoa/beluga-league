/* Dynamic header size adjustment for mobile */

// This script runs only on client-side to adjust header size based on actual viewport
if (typeof window !== 'undefined') {
  function adjustHeaderSize() {
    const headers = document.querySelectorAll('.super-large-mobile-header');
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    
    // For mobile screens
    if (vw <= 640) {
      const fontSize = Math.min(Math.max(vw * 0.18, 60), 140); // 18% of viewport width, min 60px, max 140px
      
      headers.forEach(header => {
        header.style.fontSize = `${fontSize}px`;
        header.style.lineHeight = '0.85';
        header.style.letterSpacing = '-2px';
      });
    }
  }
  
  // Run on load and resize
  window.addEventListener('DOMContentLoaded', adjustHeaderSize);
  window.addEventListener('resize', adjustHeaderSize);
}
