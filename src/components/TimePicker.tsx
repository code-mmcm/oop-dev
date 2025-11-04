import React, { useState, useRef, useEffect } from 'react';
import Dropdown from './Dropdown';

/**
 * TimePicker Component
 * 
 * Custom-styled time picker that matches the app's design theme.
 * Uses Dropdown component for hour, minute, and period selection.
 */
interface TimePickerProps {
  /** Selected time value (HH:mm format, e.g., "14:00") */
  value: string;
  /** Callback when time changes */
  onChange: (time: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Label for the input */
  label?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange
}) => {
  const [hour, setHour] = useState<string>('12');
  const [minute, setMinute] = useState<string>('00');
  const [period, setPeriod] = useState<'AM' | 'PM'>('PM');
  const pickerRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  const hasUserInteracted = useRef(false);
  // Track if we're updating from external value prop (to prevent onChange loops)
  const isUpdatingFromProp = useRef(false);
  const previousValue = useRef<string>(value || '');
  // Use refs to track current state values to avoid stale closures
  const hourRef = useRef<string>('12');
  const minuteRef = useRef<string>('00');
  const periodRef = useRef<'AM' | 'PM'>('PM');
  
  // Keep refs in sync with state
  hourRef.current = hour;
  minuteRef.current = minute;
  periodRef.current = period;

  // Convert 12-hour format to 24-hour format (HH:mm)
  const convertTo24Hour = (h: string, m: string, p: 'AM' | 'PM'): string => {
    let hourNum = parseInt(h, 10);
    const minuteNum = parseInt(m, 10);
    
    if (p === 'AM') {
      if (hourNum === 12) hourNum = 0;
    } else {
      if (hourNum !== 12) hourNum += 12;
    }
    
    return `${String(hourNum).padStart(2, '0')}:${String(minuteNum).padStart(2, '0')}`;
  };

  // Parse value to hour, minute, and period
  useEffect(() => {
    // Only update if the value prop actually changed (not just on every render)
    if (value === previousValue.current && !isInitialMount.current) {
      return;
    }
    
    // Calculate what the current state would produce using refs (to avoid stale closures)
    const currentStateTime = convertTo24Hour(hourRef.current, minuteRef.current, periodRef.current);
    
    // If the value prop matches what our state would produce, no need to update
    // This prevents unnecessary state updates when value prop changes but matches our state
    if (!isInitialMount.current && currentStateTime === value) {
      previousValue.current = value || '';
      return;
    }
    
    previousValue.current = value || '';
    
    // Mark that we're updating from prop to prevent onChange from firing
    isUpdatingFromProp.current = true;
    
    if (value) {
      const [h, m] = value.split(':');
      const hourNum = parseInt(h || '12', 10);
      const minuteNum = parseInt(m || '0', 10);
      
      // Only update state if the value prop is different from what our state would produce
      // This prevents unnecessary state updates and re-renders
      if (currentStateTime !== value) {
        let newHour: string;
        let newPeriod: 'AM' | 'PM';
        
        if (hourNum === 0) {
          newHour = '12';
          newPeriod = 'AM';
        } else if (hourNum < 12) {
          newHour = String(hourNum);
          newPeriod = 'AM';
        } else if (hourNum === 12) {
          newHour = '12';
          newPeriod = 'PM';
        } else {
          newHour = String(hourNum - 12);
          newPeriod = 'PM';
        }
        
        setHour(newHour);
        setMinute(String(minuteNum).padStart(2, '0'));
        setPeriod(newPeriod);
      }
    } else {
      // Only set defaults if value is empty and user hasn't interacted
      if (!hasUserInteracted.current) {
        setHour('12');
        setMinute('00');
        setPeriod('PM');
      }
    }
    
    // Reset the flag after state updates complete
    // Use a microtask to ensure state updates are processed before we allow onChange again
    Promise.resolve().then(() => {
      isUpdatingFromProp.current = false;
    });
    
    isInitialMount.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]); // Only depend on value - we use refs to access current state

  // Handle time change whenever hour, minute, or period changes (only after initial mount)
  useEffect(() => {
    // Skip on initial mount to avoid setting value when component first loads
    if (isInitialMount.current) return;
    
    // Don't call onChange if we're updating from the value prop (prevents feedback loops)
    if (isUpdatingFromProp.current) return;
    
    // Calculate current time from state
    const currentTime24 = convertTo24Hour(hour, minute, period);
    
    // Only update if the calculated time is different from the current value
    // This prevents loops while still updating when user changes selections
    if (currentTime24 !== value) {
      hasUserInteracted.current = true;
      onChange(currentTime24);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hour, minute, period]); // Intentionally omit value and onChange to avoid infinite loops

  // Generate hour options (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1)
  }));
  
  // Generate minute options (0, 15, 30, 45)
  const minuteOptions = [0, 15, 30, 45].map(m => ({
    value: String(m).padStart(2, '0'),
    label: String(m).padStart(2, '0')
  }));

  const periodOptions = [
    { value: 'AM', label: 'AM' },
    { value: 'PM', label: 'PM' }
  ];

  return (
    <div className="relative" ref={pickerRef}>
      {/* Time selector using Dropdown components in a grid - no input box wrapper */}
      <div className="grid grid-cols-3 gap-2">
        {/* Hour dropdown */}
        <Dropdown
          label={hour || '12'}
          options={hourOptions}
          onSelect={(value) => {
            hasUserInteracted.current = true;
            setHour(value);
          }}
          placeholder="Hour"
          className="w-full"
        />

        {/* Minute dropdown */}
        <Dropdown
          label={minute || '00'}
          options={minuteOptions}
          onSelect={(value) => {
            hasUserInteracted.current = true;
            setMinute(value);
          }}
          placeholder="Min"
          className="w-full"
        />

        {/* Period dropdown */}
        <Dropdown
          label={period || 'PM'}
          options={periodOptions}
          onSelect={(value) => {
            hasUserInteracted.current = true;
            setPeriod(value as 'AM' | 'PM');
          }}
          placeholder="AM/PM"
          className="w-full"
        />
      </div>
    </div>
  );
};

export default TimePicker;

