import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Custom scrollbar styles for dropdown lists
 * These styles ensure the scrollbar is always visible and functional
 */
const scrollbarStyles = `
  /* Dropdown list container */
  .dropdown-list,
  .dropdown-scrollable-list {
    overflow-y: auto !important;
    overflow-x: hidden !important;
    scroll-behavior: auto; /* prevent CSS smooth from fighting wheel */
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
  }

  /* WebKit scrollbar (only on dropdown list) */
  .dropdown-list::-webkit-scrollbar,
  .dropdown-scrollable-list::-webkit-scrollbar {
    width: 8px;
  }
  .dropdown-list::-webkit-scrollbar-track,
  .dropdown-scrollable-list::-webkit-scrollbar-track {
    background: rgba(11, 88, 88, 0.06);
    border-radius: 9999px;
  }
  .dropdown-list::-webkit-scrollbar-thumb,
  .dropdown-scrollable-list::-webkit-scrollbar-thumb {
    background: #0B5858;
    border-radius: 9999px;
  }
  .dropdown-list::-webkit-scrollbar-thumb:hover,
  .dropdown-scrollable-list::-webkit-scrollbar-thumb:hover {
    background: #0a4a4a;
  }

  /* Firefox */
  .dropdown-list,
  .dropdown-scrollable-list { scrollbar-width: thin; scrollbar-color: #0B5858 rgba(11, 88, 88, 0.06); }

  /* Menu animation */
  .dropdown-menu { opacity: 0; transform: translateY(4px); transition: opacity 150ms ease-out, transform 150ms ease-out; }
  .dropdown-enter { opacity: 1; transform: translateY(0); }
  .dropdown-exit { opacity: 0; transform: translateY(4px); }
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
  /** Maximum number of visible items before scrolling is enabled (default: 5) */
  maxVisibleItems?: number;
  /** Force scroll container and scrollbar even if options are fewer than maxVisibleItems */
  alwaysScrollable?: boolean;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  options,
  onSelect,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  menuWidth,
  maxVisibleItems = 5,
  alwaysScrollable = false
}) => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [dropdownPosition, setDropdownPosition] = useState<{top: number, left: number, width: string | number} | null>(null);
  
  // Refs
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const touchStartYRef = useRef<number | null>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  // Direct wheel handler binding to the list element for responsiveness

  /**
   * Determine if scrolling should be enabled based on number of options.
   * Rule: >= maxVisibleItems = scroll with max-height of optionHeight * maxVisibleItems
   */
  const optionRowHeight = 40; // px per option row
  const shouldScroll = alwaysScrollable || options.length >= maxVisibleItems;

  /**
   * Calculate dropdown position based on trigger position
   * Enhanced to handle all scrollable containers and edge cases
   */
  const calculateDropdownPosition = useCallback((rect: DOMRect) => {
    const targetMaxHeight = optionRowHeight * maxVisibleItems;
    const dropdownHeight = shouldScroll ? targetMaxHeight : Math.min(options.length * optionRowHeight, targetMaxHeight);
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
  }, [shouldScroll, options.length, menuWidth, maxVisibleItems]);

  /**
   * Handle closing the dropdown
   */
  const handleClose = useCallback(() => {
    if (!isOpen) return;
    setIsExiting(true);
    setFocusedIndex(-1);
    // Allow CSS exit animation to play before unmounting
    setTimeout(() => {
      setIsOpen(false);
      setIsExiting(false);
      triggerRef.current?.focus();
    }, 150);
  }, [isOpen]);


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
    setIsExiting(false);
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
    if (!isOpen) return;
    const el = listRef.current;
    if (!el || !shouldScroll) return;

    const onWheel = (e: WheelEvent) => {
      // Only act if the wheel is over the list element
      const rect = el.getBoundingClientRect();
      const over = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!over) return;

      const atTop = el.scrollTop <= 0;
      const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
      const goingDown = e.deltaY > 0;

      // Always block page scroll while hovering the dropdown
      e.preventDefault();
      e.stopPropagation();

      // Only adjust list scroll if there's room in the intended direction
      if ((goingDown && !atBottom) || (!goingDown && !atTop)) {
        el.scrollTop += e.deltaY;
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel as any);
    };
  }, [isOpen, shouldScroll]);

  // Touch scrolling trap for mobile devices
  useEffect(() => {
    if (!isOpen || !menuRef.current || !listRef.current) return;

    const onTouchStart = (e: TouchEvent) => {
      if (!menuRef.current) return;
      const rect = menuRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const isOverDropdown = touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom;
      if (!isOverDropdown) return;
      touchStartYRef.current = touch.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (touchStartYRef.current == null || !listRef.current || !menuRef.current) return;
      const rect = menuRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const isOverDropdown = touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom;
      if (!isOverDropdown) return;

      const delta = touchStartYRef.current - touch.clientY; // positive when moving up
      const el = listRef.current;
      const atTop = el.scrollTop <= 0;
      const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;

      // Prevent page scroll always while interacting with dropdown
      e.preventDefault();
      e.stopPropagation();

      if ((delta < 0 && atTop) || (delta > 0 && atBottom)) {
        return;
      }
      el.scrollTop += delta;
      touchStartYRef.current = touch.clientY;
    };

    const onTouchEnd = () => {
      touchStartYRef.current = null;
    };

    document.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true, capture: true });

    return () => {
      document.removeEventListener('touchstart', onTouchStart as any, { capture: true } as any);
      document.removeEventListener('touchmove', onTouchMove as any, { capture: true } as any);
      document.removeEventListener('touchend', onTouchEnd as any, { capture: true } as any);
    };
  }, [isOpen]);

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
   * Close dropdown when page or parent scrolls (but not when the list itself scrolls)
   */
  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (event: Event) => {
      // If scroll originated inside dropdown menu or list, ignore
      const target = event.target as Node | null;
      if (menuRef.current && target && menuRef.current.contains(target)) return;
      if (listRef.current && target && listRef.current.contains(target)) return;
      handleClose();
    };

    // Always listen to window scroll/resize
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Optionally listen on a main container if present
    const containerSelectors = ['.main-content', '.table-container', '.app-shell'];
    const containers: Element[] = [];
    containerSelectors.forEach(sel => {
      const el = document.querySelector(sel);
      if (el) {
        el.addEventListener('scroll', handleScroll, { passive: true });
        containers.push(el);
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      containers.forEach(el => el.removeEventListener('scroll', handleScroll));
    };
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
    if (!(isOpen || isExiting) || !dropdownPosition) return null;

    // Use the simple portal container in document.body
    const portalContainer = document.getElementById('dropdown-portal-container') || document.body;

    return createPortal(
      <div
        ref={menuRef}
        className={`fixed dropdown-menu ${isOpen && !isExiting ? 'dropdown-enter' : 'dropdown-exit'} overflow-hidden`}
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          zIndex: 9999,
          position: 'fixed',
          margin: 0,
          padding: '4px 0',
          border: '1px solid rgba(11, 88, 88, 0.12)',
          borderRadius: '12px',
          backgroundColor: '#ffffff',
          boxShadow: '0 18px 30px rgba(11, 88, 88, 0.08), 0 6px 12px rgba(15, 23, 42, 0.04)',
          pointerEvents: 'auto',
          visibility: 'visible',
          opacity: 1,
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
          className={`dropdown-list`}
          style={{
            maxHeight: shouldScroll ? `${optionRowHeight * maxVisibleItems}px` : 'auto',
            overflowY: shouldScroll ? 'auto' : 'visible',
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
              className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 h-10 text-[14px] transition ${
                focusedIndex === index
                  ? 'bg-[rgba(11,88,88,0.11)] text-[#0B5858]'
                  : 'text-[#111827] hover:bg-[rgba(11,88,88,0.06)]'
              }`}
              style={{ fontFamily: 'Poppins', fontWeight: 400 }}
              onClick={() => handleSelect(option.value)}
              onMouseEnter={() => setFocusedIndex(index)}
            >
              <span className="flex items-center gap-2">
                {option.icon && <span className="text-lg">{option.icon}</span>}
                {option.label}
              </span>
              {/* Optional check icon for selected option */}
              {label === option.label && (
                <svg className="w-4 h-4 text-[#0B5858]" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
              )}
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
          w-full flex items-center justify-between px-4 py-3 border rounded-lg
          transition-shadow duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2
          ${disabled
            ? 'bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200'
            : 'bg-white text-slate-800 border-[#d1d5db] hover:shadow-sm focus:border-transparent cursor-pointer'
          }
          ${isOpen ? 'ring-2 ring-offset-2' : ''}
        `}
        style={{ 
          fontFamily: 'Poppins',
          fontSize: '15px',
          fontWeight: 400,
          '--tw-ring-color': '#549F74'
        } as React.CSSProperties}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${label || placeholder} dropdown`}
      >
        <span className={`${!label ? 'text-gray-500' : 'text-slate-900'}`}>
          {label || placeholder}
        </span>
        
        {/* Circled Arrow Icon that rotates */}
        <span className={`ml-2 inline-flex items-center justify-center w-6 h-6 rounded-full border border-slate-200 text-[#0B5858] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}>
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z" clipRule="evenodd" />
          </svg>
        </span>
      </button>

      {/* Dropdown Menu Portal */}
      {renderMenu()}
    </div>
  );
};

export default Dropdown;