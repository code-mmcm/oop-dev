import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getLenis } from '../App';

/**
 * ScrollToTop component that scrolls to top of page on route change
 * Works with both regular scroll and Lenis smooth scroll
 */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Get Lenis instance if available
    const lenis = getLenis();
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      if (lenis) {
        // Use Lenis smooth scroll if available
        lenis.scrollTo(0, {
          duration: 0.5,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });
      } else {
        // Fallback to regular scroll
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

