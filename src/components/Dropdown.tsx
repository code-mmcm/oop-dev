import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Custom scrollbar styles for dropdown lists
 * These styles ensure the scrollbar is always visible and functional
 */
const scrollbarStyles = `
  /* Webkit browsers (Chrome, Safari, Edge) */
  .dropdown-scrollable-list {
    overflow-y: scroll !important;
    overflow-x: hidden !important;
    scroll-behavior: smooth;
    /* Enhanced smooth scrolling */
    -webkit-overflow-scrolling: touch;
    scrollbar-gutter: stable;
  }
  
  .dropdown-scrollable-list::-webkit-scrollbar {
    width: 8px;
    background: transparent;
  }
  
  .dropdown-scrollable-list::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 4px;
    margin: 2px 0;
  }
  
  .dropdown-scrollable-list::-webkit-scrollbar-thumb {
    background: #9ca3af;
    border-radius: 4px;
    border: 1px solid #f3f4f6;
  }
  
  .dropdown-scrollable-list::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
  
  .dropdown-scrollable-list::-webkit-scrollbar-thumb:active {
    background: #4b5563;
  }
  
  /* Firefox */
  .dropdown-scrollable-list {
    scrollbar-width: thin;
    scrollbar-color: #9ca3af #f3f4f6;
  }
`;

// Inject scrollbar styles once
if (typeof document !== 'undefined') {
  const styleId = 'dropdown-scrollbar-styles';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = scrollbarStyles;
    document.head.appendChild(styleSheet);
  }
  
  // Create a robust portal container in document.body (no transforms, no forced positioning)
  const portalId = 'dropdown-portal-container';
  if (!document.getElementById(portalId)) {
    const portalContainer = document.createElement('div');
    portalContainer.id = portalId;
    // Ensure the portal container has no CSS transforms or positioning that could affect dropdown positioning
    portalContainer.style.cssText = `
      position: static !important;
      transform: none !important;
      will-change: auto !important;
      contain: none !important;
      isolation: auto !important;
      z-index: auto !important;
    `;
    document.body.appendChild(portalContainer);
  }
}

/**
 * Unified Dropdown component with smart scrolling, portal rendering, and keyboard navigation
 * 
 * Features:
 * - Portal rendering to prevent clipping by parent overflow
 * - Smart scrolling behavior: >= 5 options = capped height with scroll, < 5 options = no scroll
 * - Keyboard navigation (Arrow Up/Down, Enter, Escape)
 * - Outside click and Escape to close
 * - Smooth scrolling with custom scrollbar styling
 * - Auto-close on any scroll event (UX-safe behavior)
 * - Auto-close on window resize
 * - High z-index to sit above tables and cards
 * 
 * @example
 * <Dropdown
 *   label={selectedValue}
 *   options={[{ label: 'Option 1', value: 'opt1' }, ...]}
 *   onSelect={(value) => setSelectedValue(value)}
 *   placeholder="Select an option"
 * />
 */
interface DropdownOption {
  label: string;
  value: string;
  /** Optional flag emoji or icon for display (e.g., country flags) */
  icon?: string;
}

interface DropdownProps {
  /** The currently selected value text displayed on the trigger */
  label: string;
  /** Array of options to display in the dropdown */
  options: DropdownOption[];
  /** Callback fired when an option is selected */
  onSelect: (value: string) => void;
  /** Optional placeholder text when no option is selected */
  placeholder?: string;
  /** Optional disabled state */
  disabled?: boolean;
  /** Optional className for additional styling on the wrapper */
  className?: string;
  /** Optional custom width for the dropdown menu (defaults to trigger width) */
  menuWidth?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  onSelect,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  menuWidth
}) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number, width: string | number} | null>(null);
  
  // Refs
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Determine if scrolling should be enabled based on number of options
   * Rule: >= 5 options = scroll with max-height ~200px, < 5 options = no scroll
   */
  const shouldScroll = options.length >= 5;

  /**
   * Calculate dropdown position based on trigger position
   * Enhanced to handle all scrollable containers and edge cases
   */
  const calculateDropdownPosition = useCallback((rect: DOMRect) => {
    const dropdownHeight = shouldScroll ? 200 : Math.min(options.length * 40, 200);
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const headerHeight = 64; // Fixed header height (h-16 = 64px)
    
    // Use getBoundingClientRect() which gives us viewport coordinates
    // This is immune to any parent transforms, scroll containers, or CSS transforms
    const triggerTop = rect.top;
    const triggerLeft = rect.left;
    const triggerRight = rect.right;
    const triggerBottom = rect.bottom;
    const triggerWidth = rect.width;
    
    // Enhanced safety checks
    if (triggerWidth === 0 || triggerBottom === 0) {
      console.warn('Dropdown trigger has invalid dimensions, using fallback position');
      return {
        top: Math.max(headerHeight + 8, 100),
        left: Math.max(8, Math.min(triggerLeft, viewportWidth - 200)),
        width: Math.min(triggerWidth || 200, viewportWidth - 16)
      };
    }
    
    // Calculate available space in viewport coordinates
    const spaceBelow = viewportHeight - triggerBottom;
    const spaceAbove = triggerTop - headerHeight;
    
    // Determine vertical position (prefer below, fallback to above)
    let topPosition = triggerBottom + 8; // Default: below trigger
    
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      topPosition = triggerTop - dropdownHeight - 8; // Above trigger
    }
    
    // Enhanced viewport boundary checks
    const minTop = headerHeight + 8;
    const maxTop = viewportHeight - 8;
    topPosition = Math.max(minTop, Math.min(topPosition, maxTop));
    
    // If dropdown would still be cut off, try to fit it within viewport
    if (topPosition + dropdownHeight > viewportHeight) {
      topPosition = Math.max(minTop, viewportHeight - dropdownHeight - 8);
    }
    
    // Determine horizontal position (prefer left-aligned, handle overflow)
    let leftPosition = triggerLeft;
    const dropdownWidth = typeof menuWidth === 'string' ? parseInt(menuWidth) : (menuWidth || triggerWidth);
    
    // Enhanced horizontal positioning logic
    const minLeft = 8;
    const maxLeft = viewportWidth - 8;
    
    // If dropdown would overflow right edge, align to right edge of trigger
    if (leftPosition + dropdownWidth > maxLeft) {
      leftPosition = Math.max(minLeft, triggerRight - dropdownWidth);
    }
    
    // If dropdown would overflow left edge, align to left edge of viewport
    if (leftPosition < minLeft) {
      leftPosition = minLeft;
    }
    
    // Ensure dropdown doesn't exceed viewport width
    const maxWidth = viewportWidth - 16; // 8px margin on each side
    const finalWidth = Math.min(dropdownWidth, maxWidth);
    
    // Final safety check - ensure position is within viewport
    const finalLeft = Math.max(minLeft, Math.min(leftPosition, maxLeft - finalWidth));
    const finalTop = Math.max(minTop, Math.min(topPosition, maxTop));

    return {
      top: Math.round(finalTop), // Round to avoid subpixel issues
      left: Math.round(finalLeft),
      width: Math.round(finalWidth)
    };
  }, [shouldScroll, options.length, menuWidth]);

  /**
   * Handle closing the dropdown
   */
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setFocusedIndex(-1);
    triggerRef.current?.focus();
  }, []);


  /**
   * Handle opening the dropdown
   */
  const handleOpen = useCallback(() => {
    if (disabled) return;
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const position = calculateDropdownPosition(rect);
      setDropdownPosition(position);
    }
    setIsOpen(true);
    setFocusedIndex(-1);
  }, [disabled, calculateDropdownPosition]);

  /**
   * Handle option selection
   */
  const handleSelect = useCallback((value: string) => {
    onSelect(value);
    handleClose();
  }, [onSelect, handleClose]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isOpen && focusedIndex >= 0) {
          handleSelect(options[focusedIndex].value);
        } else {
          handleOpen();
        }
        break;
      
      case 'Escape':
        event.preventDefault();
        handleClose();
        break;
      
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          handleOpen();
        } else {
          setFocusedIndex(prev => 
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        if (!isOpen) {
          handleOpen();
        } else {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : options.length - 1
          );
        }
        break;
      
      case 'Tab':
        handleClose();
        break;
    }
  }, [disabled, isOpen, focusedIndex, options, handleSelect, handleOpen, handleClose]);

  /**
   * Handle outside click to close dropdown
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        triggerRef.current &&
        menuRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !menuRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, handleClose]);

  /**
   * Handle mouse wheel scrolling on dropdown menu
   * Optimized for smooth scrolling without delays
   */
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      if (isOpen && menuRef.current) {
        // Check if the mouse is over the dropdown menu
        const rect = menuRef.current.getBoundingClientRect();
        const isOverDropdown = (
          event.clientX >= rect.left &&
          event.clientX <= rect.right &&
          event.clientY >= rect.top &&
          event.clientY <= rect.bottom
        );

        if (isOverDropdown) {
          // Only prevent default if we have scrollable content
          if (shouldScroll && listRef.current) {
            // Let the browser handle the scrolling naturally for smoothness
            // Just prevent it from bubbling to the page
            event.stopPropagation();
            
            // Don't prevent default - let the browser handle smooth scrolling
            // The CSS scroll-behavior: smooth will handle the smoothness
          } else {
            // For non-scrollable dropdowns, prevent page scroll
            event.preventDefault();
            event.stopPropagation();
          }
        }
      }
    };

    if (isOpen) {
      // Use capture phase to ensure we catch the event before it bubbles
      document.addEventListener('wheel', handleWheel, { passive: false, capture: true });
      return () => document.removeEventListener('wheel', handleWheel, { capture: true });
    }
  }, [isOpen, shouldScroll]);

  /**
   * Update dropdown position immediately when it opens (synchronous)
   */
  useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const position = calculateDropdownPosition(rect);
      setDropdownPosition(position);
    }
  }, [isOpen, calculateDropdownPosition]);

  /**
   * Handle scroll events to automatically close dropdown
   * Enhanced to allow internal dropdown scrolling while preventing page scroll
   */
  useEffect(() => {
    if (isOpen) {
      // Optimized scroll handler that checks if scroll is inside dropdown
      const handleScroll = (event: Event) => {
        // Quick check if we have a menu reference
        if (!menuRef.current) {
          handleClose();
          return;
        }
        
        // Check if the scroll event originated from within the dropdown menu
        if (event.target) {
          const target = event.target as Node;
          if (menuRef.current.contains(target)) {
            // Scroll is happening inside the dropdown - don't close it
            return;
          }
        }
        
        // Scroll is happening outside the dropdown - close it
        handleClose();
      };
      
      // Add scroll and resize listeners to window and document
      window.addEventListener('scroll', handleScroll, { passive: true });
      document.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('resize', handleScroll, { passive: true });
      
      // Detect and listen to all scrollable containers
      const scrollableSelectors = [
        // Common overflow classes
        '.overflow-auto',
        '.overflow-scroll', 
        '.overflow-y-auto',
        '.overflow-y-scroll',
        '.overflow-x-auto',
        '.overflow-x-scroll',
        // Table-related containers
        'table',
        'tbody',
        'thead',
        '.table-container',
        // Card and content containers
        '.bg-white.rounded-lg.shadow-sm.overflow-hidden',
        '.max-w-7xl.mx-auto',
        // Any element with computed overflow scroll/auto
        '[style*="overflow"]'
      ];
      
      const scrollableElements: Element[] = [];
      
      // Method 1: Query selectors
      scrollableSelectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(element => {
            element.addEventListener('scroll', handleScroll, { passive: true });
            scrollableElements.push(element);
          });
        } catch (e) {
          // Ignore invalid selectors
        }
      });
      
      // Method 2: Dynamic detection of scrollable elements
      const detectScrollableElements = () => {
        const allElements = document.querySelectorAll('*');
        allElements.forEach(element => {
          const computedStyle = window.getComputedStyle(element);
          const overflowX = computedStyle.overflowX;
          const overflowY = computedStyle.overflowY;
          
          // Check if element is scrollable
          if (
            (overflowX === 'auto' || overflowX === 'scroll') ||
            (overflowY === 'auto' || overflowY === 'scroll')
          ) {
            // Avoid duplicates
            if (!scrollableElements.includes(element)) {
              element.addEventListener('scroll', handleScroll, { passive: true });
              scrollableElements.push(element);
            }
          }
        });
      };
      
      // Initial detection
      detectScrollableElements();
      
      // Re-detect on DOM changes (for dynamic content)
      const observer = new MutationObserver(() => {
        detectScrollableElements();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      
      return () => {
        // Remove all event listeners
        window.removeEventListener('scroll', handleScroll);
        document.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', handleScroll);
        
        scrollableElements.forEach(element => {
          element.removeEventListener('scroll', handleScroll);
        });
        
        // Disconnect mutation observer
        observer.disconnect();
      };
    }
  }, [isOpen, handleClose]);

  /**
   * Scroll focused option into view when keyboard navigating
   */
  useEffect(() => {
    if (isOpen && focusedIndex >= 0 && optionRefs.current[focusedIndex] && listRef.current) {
      optionRefs.current[focusedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [isOpen, focusedIndex]);

  /**
   * Update option refs array when options change
   */
  useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, options.length);
  }, [options.length]);

  /**
   * Render dropdown menu via portal to prevent clipping issues
   * Uses simple document.body portal container - no transforms or forced positioning
   */
  const renderMenu = () => {
    if (!isOpen || !dropdownPosition) return null;

    // Use the simple portal container in document.body
    const portalContainer = document.getElementById('dropdown-portal-container') || document.body;

    return createPortal(
      <div
        ref={menuRef}
        className="fixed bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          zIndex: 9999,
          position: 'fixed',
          // Enhanced styling to ensure proper positioning
          margin: 0,
          padding: 0,
          border: '1px solid #d1d5db',
          borderRadius: '8px',
          backgroundColor: 'white',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          pointerEvents: 'auto',
          visibility: 'visible',
          opacity: 1,
          // Ensure no CSS properties interfere with positioning
          transform: 'none',
          willChange: 'auto',
          contain: 'none',
          isolation: 'auto'
        }}
        data-dropdown="true"
        data-trigger-id={triggerRef.current?.id || 'unknown'}
        data-position={`${dropdownPosition.top},${dropdownPosition.left}`}
        data-viewport={`${window.innerWidth}x${window.innerHeight}`}
      >
        {/* Options list container - scrollable only if >= 5 options */}
        <div
          ref={listRef}
          className={shouldScroll ? 'dropdown-scrollable-list' : ''}
          style={{
            maxHeight: shouldScroll ? '200px' : 'auto',
            overflowY: shouldScroll ? 'scroll' : 'visible',
            overflowX: 'hidden',
            // Performance optimizations for smooth scrolling
            willChange: shouldScroll ? 'scroll-position' : 'auto',
            contain: shouldScroll ? 'layout style paint' : 'none'
          }}
        >
          {options.map((option, index) => (
            <button
              key={option.value}
              ref={el => { optionRefs.current[index] = el; }}
              className={`w-full text-left px-4 py-2 transition-colors duration-150 flex items-center ${
                focusedIndex === index
                  ? 'bg-teal-50 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              style={{ 
                fontFamily: 'Poppins',
                fontSize: '16px',
                fontWeight: 400
              }}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              {option.icon && <span className="mr-3 text-lg">{option.icon}</span>}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      </div>,
      portalContainer
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={isOpen ? handleClose : handleOpen}
        onKeyDown={handleKeyDown}
        className={`
          w-full flex items-center justify-between py-3 px-4 border border-gray-300 rounded-lg
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2
          ${disabled 
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed' 
            : 'bg-white text-gray-700 hover:border-gray-400 hover:shadow-md focus:border-transparent cursor-pointer'
          }
          ${isOpen ? 'ring-2 ring-offset-2' : ''}
        `}
        style={{ 
          fontFamily: 'Poppins',
          fontSize: '16px',
          fontWeight: 400,
          '--tw-ring-color': '#549F74'
        } as React.CSSProperties}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label || placeholder} dropdown`}
      >
        <span className={`${!label ? 'text-gray-500' : 'text-gray-900'}`}>
          {label || placeholder}
        </span>
        
        {/* Circled Arrow Icon that rotates */}
        <div 
          className={`flex-shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <svg
            className={`w-6 h-6 ${disabled ? 'text-gray-400' : 'text-[#0B5858]'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {/* Circle */}
            <circle
              cx="12"
              cy="12"
              r="10"
              strokeWidth="1.5"
            />
            {/* Arrow inside */}
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10l4 4 4-4"
            />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu Portal */}
      {renderMenu()}
    </div>
  );
};

export default Dropdown;