import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { logger } from '../../../lib/logger';

/**
 * SingleDatePicker Component
 * 
 * Custom-styled single date picker that matches the app's design theme.
 * Opens a dropdown calendar panel with one month when clicked.
 */
interface SingleDatePickerProps {
  /** Selected date value (ISO string format) */
  value: string;
  /** Callback when date changes */
  onChange: (date: string) => void;
  /** Minimum selectable date */
  minDate?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Label for the input */
  label?: string;
}

const SingleDatePicker: React.FC<SingleDatePickerProps> = ({
  value,
  onChange,
  minDate,
  placeholder = 'Select date',
  label
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value) {
      const date = new Date(value);
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [opensUpward, setOpensUpward] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initialize temp date from value
  useEffect(() => {
    if (value) {
      setTempDate(new Date(value));
    } else {
      setTempDate(null);
    }
  }, [value]);

  // Update current month when value changes
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setCurrentMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  }, [value]);

  // Calculate dropdown position and adjust if needed
  useEffect(() => {
    if (isOpen && inputRef.current && dropdownRef.current) {
      const inputRect = inputRef.current.getBoundingClientRect();
      // Use estimate or measured height
      const dropdownHeight = dropdownRef.current.offsetHeight || 280;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - inputRect.bottom;
      const spaceAbove = inputRect.top;

      // Open upward if there's not enough space below but enough above
      const shouldOpenUpward = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
      setOpensUpward(shouldOpenUpward);

      // Position dropdown using fixed positioning (portal-like) - positions relative to viewport
      const rect = inputRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      
      if (shouldOpenUpward) {
        dropdownRef.current.style.top = 'auto';
        dropdownRef.current.style.bottom = `${window.innerHeight - rect.top + 8}px`;
        dropdownRef.current.style.left = `${centerX}px`;
      } else {
        dropdownRef.current.style.top = `${rect.bottom + 8}px`;
        dropdownRef.current.style.bottom = 'auto';
        dropdownRef.current.style.left = `${centerX}px`;
      }
    }
  }, [isOpen, currentMonth]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is inside the input wrapper (pickerRef)
      const isInsidePicker = pickerRef.current && pickerRef.current.contains(target);
      
      // Check if click is inside the dropdown (dropdownRef) - important for portal-rendered dropdown
      const isInsideDropdown = dropdownRef.current && dropdownRef.current.contains(target);
      
      // Only close if click is outside BOTH the picker AND the dropdown
      if (!isInsidePicker && !isInsideDropdown) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use 'mousedown' to capture before modal overlay's onClick fires
      document.addEventListener('mousedown', handleClickOutside, true); // Use capture phase
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen]);

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Helper functions
  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (date: Date | null): string => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days: Date[] = [];
    
    // Previous month filler
    const prevMonthLast = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthLast.getDate() - i));
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }

    // Next month filler to make 42 days (6 weeks)
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push(new Date(year, month + 1, d));
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentMonth(newMonth);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date): boolean => {
    if (!tempDate) return false;
    return formatDate(date) === formatDate(tempDate);
  };

  const isDisabled = (date: Date): boolean => {
    if (minDate) {
      const dateStr = formatDate(date);
      return dateStr < minDate;
    }
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (isDisabled(date)) return;

    setTempDate(date);
    onChange(formatDate(date));
    setIsOpen(false);
    logger.info('Date selected', { date: formatDate(date) });
  };

  const handleClear = () => {
    setTempDate(null);
    onChange('');
    logger.info('Date cleared');
  };

  const handleToday = () => {
    const today = new Date();
    if (minDate && formatDate(today) < minDate) {
      // If today is before minDate, select minDate instead
      const minDateObj = new Date(minDate);
      setTempDate(minDateObj);
      onChange(formatDate(minDateObj));
    } else {
      setTempDate(today);
      onChange(formatDate(today));
    }
    setIsOpen(false);
    logger.info('Today selected');
  };

  const days = getDaysInMonth(currentMonth);
  const displayMonth = currentMonth.getMonth();

  return (
    <div className="relative" ref={pickerRef}>
      {/* Input box */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={formatDisplayDate(value ? new Date(value) : null)}
          placeholder={placeholder}
          readOnly
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B5858] focus:border-transparent transition-all cursor-pointer"
          style={{ fontFamily: 'Poppins' }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>

      {/* Dropdown calendar panel - rendered via portal to escape scrollable container */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed bg-white rounded-xl shadow-lg border border-gray-200 p-2.5"
          onClick={(e) => e.stopPropagation()} // Prevent clicks from bubbling to modal overlay
          style={{ 
            width: '280px', 
            zIndex: 10000,
            transform: 'translateX(-50%)'
          }}
        >
          {/* Month header */}
          <div className="flex items-center justify-between mb-1.5 px-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateMonth('prev');
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
              aria-label="Previous month"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins' }}>
              {monthNames[displayMonth]} {currentMonth.getFullYear()}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateMonth('next');
              }}
              className="p-1 hover:bg-gray-100 rounded transition-colors cursor-pointer"
              aria-label="Next month"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {dayNames.map((day) => (
              <div
                key={day}
                className="text-[10px] font-medium text-gray-500 text-center py-0.5"
                style={{ fontFamily: 'Poppins' }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5 mb-2">
            {days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === displayMonth;
              const isSelectedDay = isSelected(day);
              const isTodayDay = isToday(day);
              const isDisabledDay = isDisabled(day);

              return (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDateClick(day);
                  }}
                  disabled={isDisabledDay}
                  className={`
                    h-6 w-6 rounded-lg text-xs transition-all
                    ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                    ${isSelectedDay ? 'bg-[#0B5858] text-white font-semibold' : ''}
                    ${isTodayDay && !isSelectedDay ? 'border-2 border-[#0B5858]' : ''}
                    ${isDisabledDay ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100 cursor-pointer'}
                    ${!isSelectedDay && !isDisabledDay && isCurrentMonth ? 'hover:bg-gray-100' : ''}
                  `}
                  style={{ fontFamily: 'Poppins' }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end pt-1.5 border-t border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToday();
                }}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                style={{ fontFamily: 'Poppins' }}
              >
                Today
              </button>
              {value && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClear();
                  }}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ fontFamily: 'Poppins' }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SingleDatePicker;

