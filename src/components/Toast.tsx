import React, { useState, useEffect, useRef, useCallback } from 'react';

type ToastProps = {
  message: string;
  onClose?: () => void;
  duration?: number; // Duration in milliseconds (default: 5000)
};

const Toast: React.FC<ToastProps> = ({ 
  message, 
  onClose,
  duration = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [isManuallyClosed, setIsManuallyClosed] = useState(false);
  const lastScrollYRef = useRef<number>(0);

  // Handle close with smooth fade animation
  const handleClose = useCallback((manual: boolean = false) => {
    if (manual) {
      setIsManuallyClosed(true);
    }
    setIsClosing(true);
    // Wait for fade-out animation to complete before actually hiding
    setTimeout(() => {
      setIsVisible(false);
      if (manual && onClose) {
        onClose();
      }
    }, 300); // Match the transition duration
  }, [onClose]);

  // Toast only responds to scroll direction and X button click

  // Handle scroll - hide on scroll down, show on scroll up
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      // Don't respond to scroll if manually closed
      if (isManuallyClosed) {
        return;
      }

      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollYRef.current;
      
      // Clear any pending scroll timeout
      clearTimeout(scrollTimeout);
      
      // Use a small threshold to avoid jitter
      if (Math.abs(scrollDelta) < 5) {
        lastScrollYRef.current = currentScrollY;
        return;
      }
      
      if (scrollDelta > 0) {
        // Scrolling down - hide toast
        if (isVisible && !isClosing) {
          setIsClosing(true);
          scrollTimeout = setTimeout(() => {
            setIsVisible(false);
          }, 300);
        }
      } else if (scrollDelta < 0) {
        // Scrolling up - show toast again
        // Clear any pending hide timeout first
        clearTimeout(scrollTimeout);
        
        if (!isVisible && !isManuallyClosed) {
          setIsClosing(false);
          setIsVisible(true);
        } else if (isClosing && !isManuallyClosed) {
          // If currently closing, cancel the close and show it
          setIsClosing(false);
          setIsVisible(true);
        }
      }
      
      lastScrollYRef.current = currentScrollY;
    };

    // Initialize scroll position
    lastScrollYRef.current = window.scrollY;

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [isVisible, isClosing, isManuallyClosed]);

  // No auto-hide timer - toast only hides on scroll down or X button

  // Calculate toast height for spacer
  const toastHeight = 56; // Height of the toast in pixels (medium size)
  const toastTopOffset = 88; // Top position offset

  return (
    <>
      {/* Spacer to reserve fixed space in layout - prevents layout shift */}
      <div
        className="w-full transition-all duration-300 ease-in-out"
        style={{
          height: isVisible && !isClosing ? `${toastHeight + 20}px` : '0px',
          opacity: isVisible && !isClosing ? 1 : 0,
          pointerEvents: 'none'
        }}
        aria-hidden="true"
      />
      
      {/* Fixed positioned toast that floats above content */}
      <div
        className={`fixed left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
          isClosing ? 'opacity-0 translate-y-[-10px]' : 'opacity-100 translate-y-0'
        }`}
        style={{ 
          fontFamily: 'Poppins',
          top: `${toastTopOffset}px`,
          pointerEvents: 'none',
          display: isVisible ? 'block' : 'none'
        }}
      >
        <div 
          className="bg-teal-600 text-white shadow-lg flex items-center"
          style={{ 
            pointerEvents: 'auto',
            borderRadius: '9999px',
            paddingLeft: '24px',
            paddingRight: '24px',
            paddingTop: '14px',
            paddingBottom: '14px',
            height: '56px',
            gap: '16px',
            width: 'fit-content',
            maxWidth: 'calc(100vw - 32px)'
          }}
        >
        {/* House Icon */}
        <div className="flex-shrink-0" style={{ display: 'flex', alignItems: 'center' }}>
          <svg 
            className="w-6 h-6" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ strokeWidth: 2 }}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
            />
          </svg>
        </div>

        {/* Message Text - Single Line */}
        <div className="flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>
          <p 
            className="text-base font-medium" 
            style={{ 
              fontFamily: 'Poppins', 
              fontWeight: 500,
              lineHeight: '1.4'
            }}
          >
            {message}
          </p>
        </div>

        {/* Close Button */}
        <button
          onClick={() => handleClose(true)}
          className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            padding: '0'
          }}
          aria-label="Close notification"
        >
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            style={{ strokeWidth: 2.5 }}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>
        </div>
      </div>
    </>
  );
};

export default Toast;

