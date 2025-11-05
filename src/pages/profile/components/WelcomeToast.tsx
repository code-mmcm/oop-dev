import React, { useState, useEffect, useRef } from 'react';

type Props = {
  message: string;
  onDismiss: () => void;
  onVisibilityChange?: (isVisible: boolean) => void;
};

const WelcomeToast: React.FC<Props> = ({ message, onDismiss, onVisibilityChange }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const lastScrollY = useRef(0);
  const rafId = useRef<number | null>(null);
  
  // Notify parent of visibility changes (debounced)
  useEffect(() => {
    if (onVisibilityChange) {
      const timeoutId = setTimeout(() => {
        onVisibilityChange(isVisible && !isDismissed);
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible, isDismissed, onVisibilityChange]);

  // Handle scroll to show/hide banner - COMPLETELY PASSIVE, no scroll manipulation
  useEffect(() => {
    const handleScroll = () => {
      // Don't handle scroll if banner is permanently dismissed
      if (isDismissed) return;

      // Cancel any pending animation frame
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }

      // Use requestAnimationFrame to batch updates and avoid blocking
      rafId.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const scrollDifference = currentScrollY - lastScrollY.current;

        // Only update if scroll difference is significant (avoid micro-movements)
        if (Math.abs(scrollDifference) < 2) {
          lastScrollY.current = currentScrollY;
          return;
        }

        // If user scrolls down (positive scroll), hide the banner
        if (scrollDifference > 2 && currentScrollY > 20) {
          if (isVisible) {
            setIsVisible(false);
          }
        }
        // If user scrolls up (negative scroll), show the banner
        else if (scrollDifference < -2) {
          if (!isVisible) {
            setIsVisible(true);
          }
        }

        lastScrollY.current = currentScrollY;
        rafId.current = null;
      });
    };

    // Only listen to scroll if banner is not permanently dismissed
    if (!isDismissed && shouldRender) {
      // Initialize lastScrollY on mount
      lastScrollY.current = window.scrollY;
      
      // Use passive listener - CRITICAL: no scroll manipulation possible
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [isVisible, shouldRender, isDismissed]);

  const handleClose = () => {
    setIsDismissed(true);
    setIsVisible(false);
    setTimeout(() => {
      setShouldRender(false);
      onDismiss();
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <div
      className="fixed left-0 right-0 z-[60]"
      style={{ 
        fontFamily: 'Poppins',
        top: '4rem',
        marginTop: '1rem',
        transform: isVisible && !isDismissed ? 'translateY(0)' : 'translateY(-100%)',
        opacity: isVisible && !isDismissed ? 1 : 0,
        transition: 'transform 0.3s ease-in-out, opacity 0.3s ease-in-out',
        pointerEvents: isVisible && !isDismissed ? 'auto' : 'none',
        willChange: 'transform, opacity'
      }}
    >
      <div 
        className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 rounded-2xl shadow-2xl border border-teal-400/30 mx-4 sm:mx-6 backdrop-blur-sm"
        style={{ 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.95) 0%, rgba(16, 185, 129, 0.95) 50%, rgba(13, 148, 136, 0.95) 100%)'
        }}
      >
        <div className="px-5 sm:px-8 py-4 sm:py-5 flex items-center gap-4 sm:gap-5">
          {/* Welcome Icon */}
          <div className="flex-shrink-0 text-3xl sm:text-4xl animate-pulse" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>
            👋
          </div>
          
          {/* Message - Centered and Bold */}
          <p 
            className="text-base sm:text-lg lg:text-xl text-white leading-relaxed flex-1 text-center font-bold" 
            style={{ 
              fontFamily: 'Poppins', 
              fontWeight: 700,
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              letterSpacing: '0.01em'
            }}
          >
            {message}
          </p>
          
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-white/90 hover:text-white transition-all duration-200 p-2 hover:bg-white/20 rounded-full hover:scale-110 active:scale-95"
            aria-label="Close"
            style={{ 
              fontFamily: 'Poppins',
              backdropFilter: 'blur(4px)'
            }}
          >
            <svg
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))'
              }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeToast;
