import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getLenis } from '../lib/lenis';

/**
 * ScrollToTop component that automatically scrolls to the top of the page
 * when the route changes. Works with both programmatic navigation and
 * browser back/forward buttons. Compatible with Lenis smooth scroll.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Try using Lenis if available, otherwise fallback to window.scrollTo
      const lenisInstance = getLenis();
      
      if (lenisInstance) {
        // Use Lenis for smooth scroll if it's available
        lenisInstance.scrollTo(0, {
          duration: 0.8,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
        });
      } else {
        // Fallback to native smooth scroll
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }
    });
  }, [pathname]);

  return null;
};

export default ScrollToTop;

