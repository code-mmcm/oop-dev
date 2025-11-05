import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Tooltip from '../../components/Tooltip';
import { BookingService } from '../../services/bookingService';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking as BookingType } from '../../types/booking';
import { logger } from '../../lib/logger';
import CalendarSettingsModal from '../unit-calendar/components/CalendarSettingsModal';
import { CalendarService, type BlockedDateRange } from '../../services/calendarService';

type Booking = {
  date: Date;
  checkInDate: Date;
  checkOutDate: Date;
  /** Original check_in_date string from database for detecting time presence */
  checkInDateString: string;
  /** Original check_out_date string from database for detecting time presence */
  checkOutDateString: string;
  title: string;
  time: string;
  startHour: number;
  endHour: number;
  bookingId?: string;
  status?: string;
  totalAmount?: number;
  mainImageUrl?: string;
  /** First name of guest for display in monthly day blocks */
  clientFirstName?: string;
};

interface CalendarProps {
  hideNavbar?: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ hideNavbar = false }) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // default to today on load
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // for slide-over
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Drawer state for timeline booking details
  const [selectedBooking, setSelectedBooking] = useState<BookingType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Confirmation modal state for decline action
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalActive, setConfirmModalActive] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<BookingType | null>(null);
  
  // Toast notification state
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });
  const toastRef = useRef<HTMLDivElement | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Calendar settings modal state (for global blocked dates)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Global blocked dates state
  const [globalBlockedRanges, setGlobalBlockedRanges] = useState<BlockedDateRange[]>([]);

  // focusedDate is the "selected" date used to determine which 7-day window to show and centering
  const [focusedDate, setFocusedDate] = useState<Date>(() => new Date()); // defaults to today
  
  // helpers - defined early so they can be used in state initializers
  const addDays = (d: Date, n: number) => {
    const c = new Date(d);
    c.setDate(c.getDate() + n);
    return c;
  };
  
  // Timeline date range state - starts at beginning of current month, ends at end of current month + 1 month ahead
  const [timelineStartDate, setTimelineStartDate] = useState<Date>(() => {
    const today = new Date();
    // Start at the beginning of the current month
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [timelineEndDate, setTimelineEndDate] = useState<Date>(() => {
    const today = new Date();
    // End 1 month after the end of current month
    return new Date(today.getFullYear(), today.getMonth() + 2, 0); // Last day of next month
  });
  
  // Ref for timeline scroll detection (moved to component level for React hooks rules)
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);
  
  // Track if we've auto-scrolled to today when switching to timeline view
  const hasAutoScrolledToToday = useRef(false);
  
  // State for visible month/year based on scroll position (for timeline view)
  const [visibleMonth, setVisibleMonth] = useState<Date>(() => new Date());

  // Auto-load more dates when scrolling near the edge (Airbnb-style)
  useEffect(() => {
    // Only attach scroll listener when in weekly/timeline view
    if (viewMode !== 'weekly') return;
    
    const scrollContainer = timelineScrollRef.current;
    if (!scrollContainer) return;
    
    const handleScroll = () => {
      const scrollLeft = scrollContainer.scrollLeft;
      const scrollWidth = scrollContainer.scrollWidth;
      const clientWidth = scrollContainer.clientWidth;
      
      // Calculate which date is visible in the center of the viewport
      const DAY_WIDTH = 120;
      const unitColumnWidth = 350;
      const visibleDayIndex = Math.floor((scrollLeft + clientWidth / 2 - unitColumnWidth) / DAY_WIDTH);
      
      // Calculate the visible date based on scroll position
      if (visibleDayIndex >= 0) {
        const visibleDate = addDays(timelineStartDate, visibleDayIndex);
        // Update visible month only if it changed
        setVisibleMonth(prev => {
          const prevMonth = prev.getMonth();
          const prevYear = prev.getFullYear();
          const newMonth = visibleDate.getMonth();
          const newYear = visibleDate.getFullYear();
          
          if (prevMonth !== newMonth || prevYear !== newYear) {
            return new Date(newYear, newMonth, 1);
          }
          return prev;
        });
      }
      
      // Load more dates when scrolling within 200px of the right edge
      const threshold = 200;
      const distanceFromEnd = scrollWidth - (scrollLeft + clientWidth);
      
      if (distanceFromEnd < threshold) {
        // Add 30 more days to the end
        setTimelineEndDate(prev => {
          const newEndDate = addDays(prev, 30);
          logger.info('Auto-loading more dates', { newEndDate });
          return newEndDate;
        });
      }
      
      // Optional: Load more dates when scrolling near the left edge (past dates)
      if (scrollLeft < threshold) {
        const today = new Date();
        const minPastDate = addDays(today, -90); // Don't load more than 90 days in the past
        setTimelineStartDate(prev => {
          if (prev > minPastDate) {
            const newStartDate = addDays(prev, -30);
            logger.info('Auto-loading past dates', { newStartDate });
            return newStartDate;
          }
          return prev;
        });
      }
    };
    
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial calculation of visible month
    handleScroll();
    
    // Auto-scroll to today when timeline view is first opened or when timelineStartDate changes
    // Use a small delay to ensure the DOM is fully rendered
    if (!hasAutoScrolledToToday.current) {
      const scrollToToday = () => {
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startDateStart = new Date(timelineStartDate.getFullYear(), timelineStartDate.getMonth(), timelineStartDate.getDate());
        
        // Calculate how many days from timelineStartDate to today
        const timeDiff = todayStart.getTime() - startDateStart.getTime();
        const daysFromStart = Math.round(timeDiff / (1000 * 60 * 60 * 24));
        
        const DAY_WIDTH = 120;
        
        // Position today as the first column after the unit column
        const scrollLeft = daysFromStart * DAY_WIDTH;
        
        scrollContainer.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
        hasAutoScrolledToToday.current = true;
        logger.info('Auto-scrolling to today in timeline view', { 
          daysFromStart, 
          scrollLeft,
          today: todayStart.toISOString().split('T')[0],
          startDate: startDateStart.toISOString().split('T')[0]
        });
      };
      
      // Delay scroll to ensure layout is complete
      const timeoutId = setTimeout(scrollToToday, 100);
      
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
        clearTimeout(timeoutId);
      };
    }
    
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [viewMode, timelineStartDate]);

  // new: animation flags
  const [headerAnimating, setHeaderAnimating] = useState(false);
  const headerAnimTimer = useRef<number | null>(null);
  
  // Track if we've already fetched bookings to avoid refetching on focus
  const hasFetchedBookings = useRef(false);
  
  // Load global blocked dates
  useEffect(() => {
    const loadGlobalBlockedDates = async () => {
      try {
        const globalBlocked = await CalendarService.getBlockedRanges('global');
        setGlobalBlockedRanges(globalBlocked);
        logger.info('Global blocked dates loaded in main calendar', { count: globalBlocked.length });
      } catch (error) {
        logger.error('Error loading global blocked dates in main calendar', { error });
        setGlobalBlockedRanges([]);
      }
    };
    
    loadGlobalBlockedDates();
    
    // Refresh when settings modal closes (in case admin added/removed blocked dates)
    if (!isSettingsModalOpen) {
      loadGlobalBlockedDates();
    }
  }, [isSettingsModalOpen]);
  
  /**
   * Check if a date is blocked (from global calendar settings)
   */
  const isDateBlocked = (date: Date): boolean => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    
    return globalBlockedRanges.some(range => {
      const startDate = new Date(range.start_date);
      const endDate = new Date(range.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      return checkDate >= startDate && checkDate <= endDate;
    });
  };
  
  /**
   * Get blocked date range for tooltip (for global calendar)
   * Returns the reason for the blocked date
   */
  const getBlockedDateTooltip = (date: Date): string => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    
    for (const range of globalBlockedRanges) {
      const startDate = new Date(range.start_date);
      const endDate = new Date(range.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      if (checkDate >= startDate && checkDate <= endDate) {
        return range.reason || 'No reason provided';
      }
    }
    
    return '';
  };

  // constants
  const HOUR_ROW_PX = 48; // tailwind h-12 equivalent
  const DOT_SIZE = 12;

  // Mobile detection & mobile view mode (keep same as desktop: monthly / weekly)
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  // helpers (addDays is already defined above for use in state initializers)

  /**
   * Generate array of dates for timeline
   */
  const generateDateRange = (startDate: Date, numDays: number): Date[] => {
    const dates: Date[] = [];
    for (let i = 0; i < numDays; i++) {
      dates.push(addDays(startDate, i));
    }
    return dates;
  };

  /**
   * Get unique units from bookings
   */
  const getUniqueUnits = (): string[] => {
    const unitSet = new Set<string>();
    bookings.forEach(booking => {
      if (booking.title) {
        unitSet.add(booking.title);
      }
    });
    return Array.from(unitSet).sort();
  };

  /**
   * Get bookings for a specific unit
   */
  const getBookingsForUnit = (unitTitle: string): Booking[] => {
    return bookings.filter(booking => booking.title === unitTitle);
  };

  /**
   * Calculate the position and width of a booking bar in the timeline
   */
  const getBookingBarPosition = (
    booking: Booking,
    dateRange: Date[],
    dayWidth: number
  ): { left: number; width: number; visible: boolean } => {
    if (dateRange.length === 0) return { left: 0, width: 0, visible: false };

    const rangeStart = dateRange[0];
    const rangeEnd = dateRange[dateRange.length - 1];
    
    const bookingStart = new Date(booking.checkInDate.getFullYear(), booking.checkInDate.getMonth(), booking.checkInDate.getDate());
    const bookingEnd = new Date(booking.checkOutDate.getFullYear(), booking.checkOutDate.getMonth(), booking.checkOutDate.getDate());

    // Check if booking overlaps with date range
    if (bookingEnd < rangeStart || bookingStart > rangeEnd) {
      return { left: 0, width: 0, visible: false };
    }

    // Calculate start position
    let startIndex = 0;
    for (let i = 0; i < dateRange.length; i++) {
      const day = new Date(dateRange[i].getFullYear(), dateRange[i].getMonth(), dateRange[i].getDate());
      if (day >= bookingStart) {
        startIndex = i;
        break;
      }
    }

    // Calculate end position (exclusive of checkout day, like month view)
    let endIndex = dateRange.length;
    for (let i = dateRange.length - 1; i >= 0; i--) {
      const day = new Date(dateRange[i].getFullYear(), dateRange[i].getMonth(), dateRange[i].getDate());
      if (day < bookingEnd) {
        endIndex = i + 1;
        break;
      }
    }

    // If booking starts before range, adjust start
    if (bookingStart < rangeStart) {
      startIndex = 0;
    }

    const left = startIndex * dayWidth;
    const width = Math.max((endIndex - startIndex) * dayWidth, dayWidth);

    return { left, width, visible: width > 0 };
  };

  // Returns hour (0-23) for a date in a specific timezone
  const getHourInTimeZone = (date: Date, timeZone: string): number => {
    const parts = new Intl.DateTimeFormat('en-US', { hour: '2-digit', hour12: false, timeZone }).formatToParts(date);
    const hourPart = parts.find(p => p.type === 'hour');
    return hourPart ? parseInt(hourPart.value, 10) : date.getHours();
  };


  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();

    const days: { date: number; isCurrentMonth: boolean; isToday: boolean; fullDate: Date }[] = [];

    // previous month filler
    const prevMonthLast = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLast.getDate() - i);
      days.push({ date: d.getDate(), isCurrentMonth: false, isToday: false, fullDate: d });
    }

    // current month
    for (let d = 1; d <= daysInMonth; d++) {
      const full = new Date(year, month, d);
      const isToday = full.toDateString() === new Date().toDateString();
      days.push({ date: d, isCurrentMonth: true, isToday, fullDate: full });
    }

    // next month filler
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const full = new Date(year, month + 1, d);
      days.push({ date: d, isCurrentMonth: false, isToday: false, fullDate: full });
    }

    return days;
  };

  // Include bookings spanning multiple days: [check-in, check-out) inclusive of check-in day and exclusive of check-out day
  // NOTE: This function is used for MONTH VIEW only. Week view uses its own date range check that includes checkout day.
  const isDateInStay = (date: Date, booking: Booking) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const start = new Date(booking.checkInDate.getFullYear(), booking.checkInDate.getMonth(), booking.checkInDate.getDate());
    const end = new Date(booking.checkOutDate.getFullYear(), booking.checkOutDate.getMonth(), booking.checkOutDate.getDate());
    // Exclude checkout day (Airbnb-style: bookings show only for nights stayed in month view)
    return d >= start && d < end;
  };
  
  const getBookingsForDate = (date: Date) => bookings.filter(b => isDateInStay(date, b));

  // Mobile detection
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const update = () => setIsMobile(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener('change', update);
    else mq.addListener(update);
    window.addEventListener('resize', update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', update);
      else mq.removeListener(update);
      window.removeEventListener('resize', update);
    };
  }, []);

  // Fetch bookings from Supabase
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) {
        setBookings([]);
        setLoading(false);
        hasFetchedBookings.current = false;
        return;
      }

      // Only fetch if we haven't already fetched for this user
      if (hasFetchedBookings.current) {
        return;
      }

      try {
        setLoading(true);
        let fetchedBookings: BookingType[];

        if (isAdmin) {
          // Admin gets all bookings
          fetchedBookings = await BookingService.getAllBookings();
        } else {
          // Regular users get their assigned bookings
          fetchedBookings = await BookingService.getUserBookings(user.id);
        }

        // Filter out declined and cancelled bookings
        const activeBookings = fetchedBookings.filter((booking) => 
          booking.status !== 'declined' && booking.status !== 'cancelled'
        );

        // Convert Supabase bookings to calendar format
        const calendarBookings: Booking[] = activeBookings.map((booking) => {
          // Parse dates from string format
          const checkInDate = new Date(booking.check_in_date);
          const checkOutDate = new Date(booking.check_out_date);
          
          // Check if the date string has time information before formatting
          const hasTimeInString = booking.check_in_date.includes('T') && booking.check_in_date.includes(':');
          const hasTimeOutString = booking.check_out_date.includes('T') && booking.check_out_date.includes(':');
          
          // Even if time exists in string, check if it's effectively "default/midnight" time
          // If UTC midnight (00:00:00Z) or local midnight, treat as "no time specified"
          const getHourInManila = (date: Date) => getHourInTimeZone(date, 'Asia/Manila');
          const checkInHour = hasTimeInString ? getHourInManila(checkInDate) : null;
          const checkOutHour = hasTimeOutString ? getHourInManila(checkOutDate) : null;
          
          // Treat midnight (0) or UTC midnight converted to Manila (8 AM) as "no time specified"
          // Also check if it's exactly 00:00:00 in the original string (likely a default value)
          const isDefaultTime = (dateString: string, hour: number | null) => {
            if (!hour) return true;
            // If hour is 0 (midnight) or 8 (UTC midnight converted), treat as default
            // Also if the time part is 00:00:00, it's likely a default value
            const timeMatch = dateString.match(/T(\d{2}):(\d{2}):(\d{2})/);
            if (timeMatch && timeMatch[1] === '00' && timeMatch[2] === '00' && timeMatch[3] === '00') {
              return true; // Exactly midnight time
            }
            return hour === 0 || hour === 8; // Midnight or UTC midnight converted
          };
          
          const useDefaultCheckIn = !hasTimeInString || isDefaultTime(booking.check_in_date, checkInHour);
          const useDefaultCheckOut = !hasTimeOutString || isDefaultTime(booking.check_out_date, checkOutHour);
          
          // Use default times if no time information is stored or if it's default/midnight time
          const checkInTime = useDefaultCheckIn 
            ? '2:00 PM'
            : new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }).format(checkInDate);
          const checkOutTime = useDefaultCheckOut
            ? '12:00 PM'
            : new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }).format(checkOutDate);
          const time = `${checkInTime} - ${checkOutTime}`;

          // Use listing title or fallback
          const title = booking.listing?.title || 'Unnamed Property';
          const mainImageUrl = booking.listing?.main_image_url;

          // Calculate end hour - default to 2 PM check-in and 12 PM check-out if no time info or default time
          const startHour = useDefaultCheckIn ? 14 : checkInHour!; // 2 PM default
          const endHour = useDefaultCheckOut ? 12 : checkOutHour!; // 12 PM default

          // Derive guest first name where available; fallback to user fullname first token or "Guest"
          const clientFirstName = (booking.client?.first_name || 'Guest');

          return {
            date: checkInDate,
            checkInDate,
            checkOutDate,
            checkInDateString: booking.check_in_date,
            checkOutDateString: booking.check_out_date,
            title,
            time,
            startHour,
            endHour,
            bookingId: booking.id,
            status: booking.status,
            totalAmount: booking.total_amount,
            mainImageUrl,
            clientFirstName
          };
        });

        setBookings(calendarBookings);
        hasFetchedBookings.current = true;
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, isAdmin]);

  // initialize focusedDate on mount so weekly view centers on today by default
  useEffect(() => {
    setFocusedDate(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Clean up header animation timer on unmount
  useEffect(() => {
    return () => {
      if (headerAnimTimer.current) {
        window.clearTimeout(headerAnimTimer.current);
      }
    };
  }, []);


  const navigateMonth = (direction: 'prev' | 'next') => {
    setHeaderAnimating(true);
    if (headerAnimTimer.current) window.clearTimeout(headerAnimTimer.current);
    headerAnimTimer.current = window.setTimeout(() => setHeaderAnimating(false), 280);

    // Create new date explicitly to avoid day overflow issues (e.g., Oct 31 -> Nov 31 becomes Dec 1)
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const newMonth = direction === 'prev' ? currentMonth - 1 : currentMonth + 1;
    const newDate = new Date(currentYear, newMonth, 1);
    setCurrentDate(newDate);

    // move focusedDate into the new month
    const daysInNewMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
    const desiredDay = Math.min(focusedDate.getDate(), daysInNewMonth);
    setFocusedDate(new Date(newDate.getFullYear(), newDate.getMonth(), desiredDay));
  };



  // slide-over and booking navigation
  const openSlideForDate = (date: Date) => {
    const has = getBookingsForDate(date).length > 0;
    if (!has) return;
    setSelectedDate(date);
    setIsSlideOpen(true);
  };
  const closeSlide = () => {
    setIsClosing(true);
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      setIsSlideOpen(false);
      setIsClosing(false);
      setSelectedDate(null);
    }, 300); // Match animation duration
  };

  /**
   * Handle booking card click in timeline - open drawer with full booking details
   */
  const handleTimelineBookingClick = async (booking: Booking) => {
    try {
      // Fetch full booking details using bookingId
      if (booking.bookingId) {
        logger.info('Fetching full booking details', { bookingId: booking.bookingId });
        const fullBooking = await BookingService.getBookingById(booking.bookingId);
        if (fullBooking) {
          setSelectedBooking(fullBooking);
          setIsDrawerClosing(false);
          setIsDrawerOpen(true);
          logger.info('Opening booking details drawer', { bookingId: fullBooking.id });
        }
      } else {
        logger.warn('Booking card clicked but no bookingId available', { booking });
      }
    } catch (error) {
      logger.error('Error fetching booking details', { error, bookingId: booking.bookingId });
      console.error('Error fetching booking details:', error);
    }
  };

  /**
   * Show toast notification
   */
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
    // Double rAF to ensure DOM paint before adding the enter class
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = toastRef.current;
        if (!el) return;
        el.classList.remove('toast--exit');
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        el.offsetHeight;
        el.classList.add('toast--enter');
      });
    });
    // Slide out after ~2200ms
    window.setTimeout(() => {
      const el = toastRef.current;
      if (!el) return;
      el.classList.remove('toast--enter');
      el.classList.add('toast--exit');
    }, 2200);
  };

  /**
   * Close drawer with slide-out animation
   */
  const closeDrawer = () => {
    setIsDrawerClosing(true);
    setTimeout(() => {
      setIsDrawerOpen(false);
      setIsDrawerClosing(false);
      setSelectedBooking(null);
    }, 300);
  };

  /**
   * Open confirmation modal for decline action
   */
  const openConfirmModal = (booking: BookingType) => {
    setPendingBooking(booking);
    setShowConfirmModal(true);
    requestAnimationFrame(() => setConfirmModalActive(true));
  };

  /**
   * Close confirmation modal
   */
  const closeConfirmModal = () => {
    setConfirmModalActive(false);
    setTimeout(() => {
      setShowConfirmModal(false);
      setPendingBooking(null);
    }, 250);
  };

  /**
   * Handle approve action (direct, no confirmation)
   */
  const handleApprove = async (booking: BookingType) => {
    try {
      setIsProcessing(true);
      logger.info('Approving booking', { bookingId: booking.id });
      await BookingService.updateBookingStatus(booking.id, 'confirmed');
      
      // Decline all overlapping pending bookings for the same unit
      await BookingService.declineOverlappingPendingBookings(
        booking.id,
        booking.listing_id,
        booking.check_in_date,
        booking.check_out_date
      );
      
      // Create updated booking with new status
      const updatedBooking = { ...booking, status: 'confirmed' as const };
      
      // Update selectedBooking if drawer is open for this booking
      if (isDrawerOpen && selectedBooking?.id === booking.id) {
        setSelectedBooking(updatedBooking);
      }
      
      // Refresh bookings list to reflect the change - re-fetch to update colors in real-time
      hasFetchedBookings.current = false;
      
      // Re-fetch bookings to update colors in real-time
      if (user) {
        try {
          setLoading(true);
          let fetchedBookings: BookingType[];

          if (isAdmin) {
            fetchedBookings = await BookingService.getAllBookings();
          } else {
            fetchedBookings = await BookingService.getUserBookings(user.id);
          }

          const activeBookings = fetchedBookings.filter((booking) => 
            booking.status !== 'declined' && booking.status !== 'cancelled'
          );

          const calendarBookings: Booking[] = activeBookings.map((booking) => {
            const checkInDate = new Date(booking.check_in_date);
            const checkOutDate = new Date(booking.check_out_date);
            
            const hasTimeInString = booking.check_in_date.includes('T') && booking.check_in_date.includes(':');
            const hasTimeOutString = booking.check_out_date.includes('T') && booking.check_out_date.includes(':');
            
            const getHourInManila = (date: Date) => getHourInTimeZone(date, 'Asia/Manila');
            const checkInHour = hasTimeInString ? getHourInManila(checkInDate) : null;
            const checkOutHour = hasTimeOutString ? getHourInManila(checkOutDate) : null;
            
            const isDefaultTime = (dateString: string, hour: number | null) => {
              if (!hour) return true;
              if (hour === 0 || hour === 8) return true;
              if (dateString.endsWith('00:00:00Z') || dateString.endsWith('T00:00:00')) return true;
              return false;
            };
            
            const useDefaultTimes = isDefaultTime(booking.check_in_date, checkInHour) && isDefaultTime(booking.check_out_date, checkOutHour);
            
            let startHour = 14;
            let endHour = 11;
            let time = '';
            
            if (!useDefaultTimes && checkInHour !== null && checkOutHour !== null) {
              startHour = checkInHour;
              endHour = checkOutHour;
              time = `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;
            } else {
              time = 'Check-in: 2:00 PM | Check-out: 11:00 AM';
            }
            
            return {
              date: checkInDate,
              checkInDate,
              checkOutDate,
              checkInDateString: booking.check_in_date,
              checkOutDateString: booking.check_out_date,
              title: booking.listing?.title || 'Unknown Unit',
              time,
              startHour,
              endHour,
              bookingId: booking.id,
              status: booking.status,
              totalAmount: booking.total_amount,
              mainImageUrl: booking.listing?.main_image_url,
              clientFirstName: booking.client?.first_name
            };
          });

          setBookings(calendarBookings);
          hasFetchedBookings.current = true;
          logger.info('Bookings refreshed after approve', { count: calendarBookings.length });
        } catch (error) {
          logger.error('Error refreshing bookings after approve', { error });
          console.error('Error refreshing bookings:', error);
        } finally {
          setLoading(false);
        }
      }
      
      logger.info('Booking approved successfully', { bookingId: booking.id });
      showToast('Booking request approved successfully', 'success');
    } catch (error) {
      logger.error('Error approving booking', { error, bookingId: booking.id });
      console.error('Error approving booking:', error);
      showToast('Failed to approve booking request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle decline action (called after confirmation)
   */
  const handleDecline = async () => {
    if (!pendingBooking) return;

    try {
      setIsProcessing(true);
      logger.info('Declining booking', { bookingId: pendingBooking.id });
      await BookingService.updateBookingStatus(pendingBooking.id, 'declined');
      
      // Close confirmation modal
      closeConfirmModal();
      
      // Close drawer if this is the selected booking
      if (isDrawerOpen && selectedBooking?.id === pendingBooking.id) {
        closeDrawer();
      }
      
      // Refresh bookings list to reflect the change (declined bookings are filtered out)
      hasFetchedBookings.current = false;
      
      // Re-fetch bookings to update colors in real-time (declined bookings will be filtered out)
      const fetchBookings = async () => {
        if (!user) {
          setBookings([]);
          setLoading(false);
          hasFetchedBookings.current = false;
          return;
        }

        try {
          setLoading(true);
          let fetchedBookings: BookingType[];

          if (isAdmin) {
            fetchedBookings = await BookingService.getAllBookings();
          } else {
            fetchedBookings = await BookingService.getUserBookings(user.id);
          }

          const activeBookings = fetchedBookings.filter((booking) => 
            booking.status !== 'declined' && booking.status !== 'cancelled'
          );

          const calendarBookings: Booking[] = activeBookings.map((booking) => {
            const checkInDate = new Date(booking.check_in_date);
            const checkOutDate = new Date(booking.check_out_date);
            
            const hasTimeInString = booking.check_in_date.includes('T') && booking.check_in_date.includes(':');
            const hasTimeOutString = booking.check_out_date.includes('T') && booking.check_out_date.includes(':');
            
            const getHourInManila = (date: Date) => getHourInTimeZone(date, 'Asia/Manila');
            const checkInHour = hasTimeInString ? getHourInManila(checkInDate) : null;
            const checkOutHour = hasTimeOutString ? getHourInManila(checkOutDate) : null;
            
            const isDefaultTime = (dateString: string, hour: number | null) => {
              if (!hour) return true;
              if (hour === 0 || hour === 8) return true;
              if (dateString.endsWith('00:00:00Z') || dateString.endsWith('T00:00:00')) return true;
              return false;
            };
            
            const useDefaultTimes = isDefaultTime(booking.check_in_date, checkInHour) && isDefaultTime(booking.check_out_date, checkOutHour);
            
            let startHour = 14;
            let endHour = 11;
            let time = '';
            
            if (!useDefaultTimes && checkInHour !== null && checkOutHour !== null) {
              startHour = checkInHour;
              endHour = checkOutHour;
              time = `${startHour.toString().padStart(2, '0')}:00 - ${endHour.toString().padStart(2, '0')}:00`;
            } else {
              time = 'Check-in: 2:00 PM | Check-out: 11:00 AM';
            }
            
            return {
              date: checkInDate,
              checkInDate,
              checkOutDate,
              checkInDateString: booking.check_in_date,
              checkOutDateString: booking.check_out_date,
              title: booking.listing?.title || 'Unknown Unit',
              time,
              startHour,
              endHour,
              bookingId: booking.id,
              status: booking.status,
              totalAmount: booking.total_amount,
              mainImageUrl: booking.listing?.main_image_url,
              clientFirstName: booking.client?.first_name
            };
          });

          setBookings(calendarBookings);
          hasFetchedBookings.current = true;
          logger.info('Bookings refreshed after decline', { count: calendarBookings.length });
        } catch (error) {
          logger.error('Error refreshing bookings after decline', { error });
          console.error('Error refreshing bookings:', error);
        } finally {
          setLoading(false);
        }
      };
      
      await fetchBookings();
      
      logger.info('Booking declined successfully', { bookingId: pendingBooking.id });
      showToast('Booking request declined', 'success');
    } catch (error) {
      logger.error('Error declining booking', { error, bookingId: pendingBooking.id });
      console.error('Error declining booking:', error);
      showToast('Failed to decline booking request', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  //dummy info for booking details
  const handleViewBooking = (booking: Booking) => {
    if (!booking.bookingId) return;
    navigate(`/booking-details/${booking.bookingId}`);
  };

  // Month grid data (for monthly view)
  const days = getDaysInMonth(currentDate);

  /**
   * Maps booking status to CSS background helper class.
   * Defaults to booked when unknown but a booking exists.
   */
  const getStatusBgClass = (status?: string): string => {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 'bg-pending';
    if (s === 'blocked') return 'bg-blocked';
    if (s === 'available') return 'bg-available';
    // Treat confirmed/ongoing/others with booking as booked
    return 'bg-booked';
  };

  /**
   * Formats stay dates as compact range, e.g., "Oct 29 – 31" or "Oct 29 – Nov 2".
   */
  const formatStayRange = (checkIn: Date, checkOut: Date): string => {
    const startMonth = checkIn.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = checkOut.toLocaleDateString('en-US', { month: 'short' });
    const startDay = checkIn.getDate();
    const endDay = checkOut.getDate();
    return startMonth === endMonth
      ? `${startMonth} ${startDay} – ${endDay}`
      : `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
  };

  /**
   * CalendarLegend
   * Renders a compact legend indicating the meaning of calendar colors.
   * Kept inline for locality with the calendar and to avoid cross-file coupling.
   */
  const CalendarLegend: React.FC = () => {
    // Log when legend is rendered to trace calendar UI composition
    useEffect(() => {
      logger.info('Rendering CalendarLegend', {
        statuses: ['Booked', 'Pending', 'Available', 'Blocked']
      });
    }, []);

    const items: { label: string; className: string }[] = [
      { label: 'Booked', className: 'bg-booked' },
      { label: 'Pending', className: 'bg-pending' },
      { label: 'Available', className: 'bg-available' },
      { label: 'Blocked', className: 'bg-blocked' },
    ];

    return (
      <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 bg-white">
        <div className="flex flex-nowrap items-center justify-center sm:justify-start gap-2 sm:gap-4 overflow-x-auto" aria-label="Calendar legend">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <span aria-hidden="true" className={`inline-block rounded ${item.className}`} style={{ width: isMobile ? 12 : 14, height: isMobile ? 12 : 14 }} />
              <span className={`${isMobile ? 'text-[11px]' : 'text-sm'} text-gray-700 whitespace-nowrap`} style={{ fontFamily: 'Poppins' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  //
  // Mobile subcomponents (inline for convenience)
  //
  const MobileMonth: React.FC<{
    days: ReturnType<typeof getDaysInMonth>;
    onDayPress: (d: Date) => void;
  }> = ({ days, onDayPress }) => {
    return (
      <div className="mobile-month">
        {/* Day names header - perfectly aligned with date grid below */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((d) => (
            <div 
              key={d} 
              className="w-full flex items-center justify-center font-medium text-gray-700"
              style={{
                fontSize: 'clamp(8px, 2.2vw, 10px)',
                letterSpacing: 'clamp(0px, 0.2vw, 0.05em)',
                lineHeight: '1.2',
                padding: 0,
                margin: 0
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid - perfectly square cells with 1:1 aspect ratio */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const bookingsForDay = getBookingsForDate(day.fullDate);
            const isCurrentMonth = day.isCurrentMonth;
            const isBlocked = isDateBlocked(day.fullDate);
            const blockedTooltip = isBlocked ? getBlockedDateTooltip(day.fullDate) : '';

            // Blocked dates override booking status - same logic as desktop
            const bgClass = isBlocked 
              ? 'bg-blocked' 
              : bookingsForDay.length > 0 
                ? getStatusBgClass(bookingsForDay[0].status) 
                : 'bg-available';
            const maxVisible = 2; // Show max 2 bookings by default - same as desktop
            const visibleBookings = bookingsForDay.slice(0, maxVisible);
            const remainingCount = bookingsForDay.length - maxVisible;
            
            const dayCard = (
              <div 
                key={index} 
                className={`w-full aspect-square rounded-lg p-1 relative transition-all duration-200 overflow-hidden flex flex-col flex-shrink-0 ${
                  isCurrentMonth ? `${bgClass} ${bookingsForDay.length > 0 && !isBlocked ? 'cursor-pointer' : ''}` : 'bg-gray-50/50'
                } hover:opacity-95`}
                onClick={() => bookingsForDay.length > 0 && isCurrentMonth && !isBlocked && onDayPress(day.fullDate)}
              >
                <div className={`text-[clamp(9px,2.5vw,11px)] font-semibold mb-0.5 flex-shrink-0 leading-tight ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                  {day.date}
                </div>

                {bookingsForDay.length > 0 && isCurrentMonth && (
                  <div className="flex flex-col gap-0.5 flex-1 overflow-hidden min-h-0">
                    {visibleBookings.map((booking, idx) => {
                      // Map status classes to solid colors (same as desktop)
                      const statusClass = getStatusBgClass(booking.status);
                      const statusColorMap: Record<string, string> = {
                        'bg-booked': '#B84C4C',
                        'bg-pending': '#F6D658',
                        'bg-available': '#558B8B',
                        'bg-blocked': '#4D504E'
                      };
                      const accentColor = statusColorMap[statusClass] || '#B84C4C';
                      
              return (
                        <div 
                          key={idx} 
                          className="rounded border border-white/40 backdrop-blur-sm relative flex-shrink-0"
                          style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
                        >
                          {/* Status color indicator bar on the left - using solid color */}
                          <div 
                            className="h-full w-1 absolute left-0 top-0 bottom-0 rounded-l"
                            style={{ backgroundColor: accentColor }}
                            aria-label={`${booking.status} booking`}
                          />
                          {/* Compact booking info with responsive typography */}
                          <div className="flex-1 min-w-0 pl-2 pr-1 py-0.5 flex flex-col gap-0 relative">
                            {/* Unit Name */}
                            <div className="text-[clamp(7px,2vw,9px)] font-semibold text-gray-900 truncate leading-tight">
                              {booking.title || 'Unit'}
          </div>
                            {/* Guest | Stay Range */}
                            <div className="text-[clamp(6px,1.8vw,8px)] font-medium text-gray-700 truncate leading-tight">
                              {booking.clientFirstName || 'Guest'} | {formatStayRange(booking.checkInDate, booking.checkOutDate)}
        </div>
      </div>
        </div>
                      );
                    })}
                    {/* Show indicator card if there are more bookings than displayed - same design as desktop */}
                    {remainingCount > 0 && (
                      <div 
                        className="rounded border border-white/40 backdrop-blur-sm relative flex-shrink-0"
                        style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
                      >
                        {/* Status color indicator bar on the left */}
                        <div 
                          className="h-full w-1 bg-gray-400 absolute left-0 top-0 bottom-0 rounded-l"
                          aria-label="More bookings indicator"
                        />
                        {/* Compact more bookings info with responsive typography */}
                        <div className="flex-1 min-w-0 pl-2 pr-1 py-0.5 flex flex-col gap-0 relative">
                          <div className="text-[clamp(6px,1.8vw,8px)] font-semibold text-gray-900 truncate leading-tight">
                            +{remainingCount} more
                </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
            );
            
            return blockedTooltip ? (
              <Tooltip key={index} content={blockedTooltip}>
                {dayCard}
              </Tooltip>
            ) : dayCard;
          })}
        </div>
      </div>
    );
  };

  //
  // Render
  //
  return (
    <div className="min-h-screen bg-white" style={{ ['--booking-color' as any]: '#E66E85' }}>
      {!hideNavbar && <Navbar />}

      <style>{`
        :root {
          --booking-color: #E66E85;
        }

        /* small in-file styles */
        @keyframes timePulse { 0% { transform: scale(1); opacity: .95 } 50% { transform: scale(1.4); opacity:.6 } 100% { transform: scale(1); opacity: .95 } }
        .time-dot-pulse { animation: timePulse 1400ms infinite cubic-bezier(.4,0,.2,1); }
        
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-panel-in {
          animation: slideInFromRight 0.3s ease-out forwards;
        }
        
        @keyframes slideOutToRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        .animate-panel-out {
          animation: slideOutToRight 0.3s ease-in forwards;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        .animate-fade-out {
          animation: fadeOut 0.2s ease-in forwards;
        }

        .scrollable::-webkit-scrollbar { height: 8px; width: 8px; }
        .scrollable::-webkit-scrollbar-thumb { background: rgba(107,114,128,.45); border-radius: 9999px; }
        .scrollable { scrollbar-width: thin; scrollbar-color: rgba(107,114,128,.45) transparent; }

        .calendar-grid { position: relative; }
        .col-cell { position: relative; }
        .hour-row { height: ${HOUR_ROW_PX}px; display:flex; align-items:center; justify-content:center; }
        .time-label { font-size: 12px; color: #6B7280; text-transform: uppercase; }
        .time-label-current { color: #0B5858; font-weight: 600; }

        .booking-block {
          position: absolute;
          left: 8px;
          border-radius: 8px;
          padding: 6px 8px;
          /* background is set per booking status via class/inline */
          background: transparent;
          color: #ffffff;
          display:flex;
          flex-direction:column;
          justify-content:flex-start;
          align-items:flex-start;
          box-shadow: 0 1px 0 rgba(0,0,0,0.04);
          transition: background-color 150ms ease, color 150ms ease, transform 150ms ease;
          cursor: pointer;
          overflow: hidden;
        }
        .booking-block:hover { color: #000000; transform: translateY(-2px); }
        .bb-title { font-size: 12px; font-weight: 600; line-height: 1; margin-bottom: 4px; }
        .bb-time { font-size: 11px; opacity: 0.95; }

        .current-line { position: absolute; border-top: 2px solid #7CC6B0; opacity: 0.95; z-index: 50; }
        .current-dot { position: absolute; width: ${DOT_SIZE}px; height: ${DOT_SIZE}px; border-radius: 9999px; background: #0B5858; border: 2px solid white; transform: translateX(-50%); z-index: 51; animation: timePulse 1400ms infinite cubic-bezier(.4,0,.2,1); }

        .muted { color: rgba(107,114,128,0.9); opacity: 0.64; }

        /* Mobile day/month booking indicator */
        .mobile-booking-indicator {
          width: 8px;
          height: 8px;
          background: var(--booking-color);
          border-radius: 9999px;
          display: inline-block;
          flex-shrink: 0;
        }

        /* mobile-friendly month buttons to avoid cut off */
        .day-button {
          min-height: 56px;
          padding-top: 6px;
          padding-bottom: 6px;
        }
        .date-number.has-booking {
          color: var(--booking-color);
        }

        /* responsive header/font adjustments so month/day don't get cut off on small screens */
        @media (max-width: 640px) {
          h1 {
            font-size: 1rem; /* reduce month title size slightly */
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          /* make sure header icons stay visible */
          .flex.items-center.space-x-4 > button {
            padding: 6px; /* reduce padding of prev/next on small screens */
          }
          /* small safe gutters for mobile daily view to avoid clipping */
          .mobile-day.px-3 { padding-left: 12px !important; padding-right: 12px !important; }
          .mobile-month.px-1 { padding-left: 8px !important; padding-right: 8px !important; }
          .day-button { padding-left: 8px; padding-right: 8px; }
          .mobile-month .text-xs { font-size: 11px; } /* ensure day names fit */
          .date-number { font-size: 13px; } /* slightly smaller date numbers */
        }

        /* extra small screens - tighten header controls more to avoid clipping */
        @media (max-width: 480px) {
          h1 { font-size: 0.95rem; }
          .flex.items-center.space-x-4 > button { padding: 5px; }
          .day-button { min-height: 52px; padding-top: 4px; padding-bottom: 4px; }
          .mobile-day.px-3 { padding-left: 10px !important; padding-right: 10px !important; }
        }

        /* Toggle button animations - smooth transitions for hover, click, and state changes */
        .toggle-button {
          transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
                      opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          transform: scale(1);
          cursor: pointer;
        }
        .toggle-button:hover {
          transform: scale(1.05);
          opacity: 0.9;
          cursor: pointer;
        }
        .toggle-button:active {
          transform: scale(0.95);
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      <div className={hideNavbar ? "pt-4" : "pt-16"}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          {/* header + controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
            {/* Mobile: Date and toggle on same row, Desktop: Date only */}
            <div className={`flex items-center ${isMobile ? 'justify-between w-full' : 'space-x-2 sm:space-x-4'}`}>
              <div className="flex items-center space-x-2 sm:space-x-4">
              {viewMode !== 'weekly' && (
                <>
                  <button 
                    onClick={() => navigateMonth('prev')} 
                      className="p-1.5 sm:p-2 hover-soft-teal rounded-full transition-colors cursor-pointer" 
                    aria-label="Prev month"
                  >
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#0B5858]" fill="none" viewBox="0 0 24 24"><path stroke="#0B5858" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                  </button>

                    <h1 className={`text-lg sm:text-xl md:text-2xl font-bold text-black ${headerAnimating ? 'header-pop-enter' : ''}`} style={{ fontFamily: 'Poppins' }}>
                    {`${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
                  </h1>

                  <button 
                    onClick={() => navigateMonth('next')} 
                      className="p-1.5 sm:p-2 hover-soft-teal rounded-full transition-colors cursor-pointer" 
                    aria-label="Next month"
                  >
                      <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#0B5858]" fill="none" viewBox="0 0 24 24"><path stroke="#0B5858" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </>
              )}

              {viewMode === 'weekly' && (
                <>
                  {/* Month label header - shows currently visible month */}
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-black" style={{ fontFamily: 'Poppins' }}>
                    {`${monthNames[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`}
                  </h1>
                  
                  <button
                    onClick={() => {
                      // Scroll to today's date in timeline view - position it as the first column after the unit column
                      const scrollContainer = timelineScrollRef.current;
                      if (scrollContainer) {
                        const today = new Date();
                        // Reset time to midnight for accurate day comparison
                        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                        const startDateStart = new Date(timelineStartDate.getFullYear(), timelineStartDate.getMonth(), timelineStartDate.getDate());
                        
                        // Calculate how many days from timelineStartDate to today
                        const timeDiff = todayStart.getTime() - startDateStart.getTime();
                        const daysFromStart = Math.round(timeDiff / (1000 * 60 * 60 * 24));
                        
                        const DAY_WIDTH = 120;
                        const unitColumnWidth = 350;
                        
                        // The timeline structure:
                        // - Unit column (sticky, 350px wide, at left: 0)
                        // - Date columns (scrollable, each 120px wide)
                        // When scrollLeft = 0: first date column is at x = 350
                        // Today's column absolute position = 350 + (daysFromStart * DAY_WIDTH)
                        // To position today at x = 350, we need: scrollLeft = daysFromStart * DAY_WIDTH
                        const scrollLeft = daysFromStart * DAY_WIDTH;
                        
                        scrollContainer.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
                        logger.info('Scrolling to today - positioning as first date column', { 
                          daysFromStart, 
                          scrollLeft,
                          unitColumnWidth,
                          DAY_WIDTH,
                          today: todayStart.toISOString().split('T')[0],
                          startDate: startDateStart.toISOString().split('T')[0],
                          timeDiffMs: timeDiff,
                          calculatedDays: timeDiff / (1000 * 60 * 60 * 24)
                        });
                      }
                    }}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-md text-white shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer"
                    style={{ 
                      fontFamily: 'Poppins',
                      backgroundColor: '#0B5858',
                      transition: 'background-color 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#0a4a4a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#0B5858';
                    }}
                  >
                    Today
                  </button>
                </>
              )}
            </div>

              {/* View toggle button group - same row as date on mobile only, right-aligned */}
              {isMobile && (
                <div className="flex gap-0.5 items-center bg-gray-100 p-0.5 rounded-lg ml-auto">
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`toggle-button px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md ${
                    viewMode === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{ fontFamily: 'Poppins' }}
                >
                  Month
                </button>
                <button
                  onClick={() => {
                    // Reset timeline to focus on current month when switching to timeline view
                    const today = new Date();
                    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0); // Last day of next month
                    setTimelineStartDate(monthStart);
                    setTimelineEndDate(monthEnd);
                    
                    // Reset auto-scroll flag so it scrolls to today when view opens
                    hasAutoScrolledToToday.current = false;
                    
                    // When switching from Month → Week, use focusedDate if it's set, otherwise center on a day from the current month
                    if (viewMode === 'monthly') {
                      if (!focusedDate || 
                          focusedDate.getMonth() !== currentDate.getMonth() || 
                          focusedDate.getFullYear() !== currentDate.getFullYear()) {
                        // focusedDate not set or not in current month, use today or first of month
                        const isTodayInMonth = today.getMonth() === currentDate.getMonth() && 
                                             today.getFullYear() === currentDate.getFullYear();
                        const dayToFocus = isTodayInMonth ? today : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                        setFocusedDate(dayToFocus);
                      }
                      // If focusedDate is already set and in current month, keep it
                    } else if (!focusedDate) {
                      setFocusedDate(new Date());
                    }
                    setViewMode('weekly');
                  }}
                  className={`toggle-button px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md ${
                    viewMode === 'weekly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{ fontFamily: 'Poppins' }}
                >
                  Timeline
                </button>
                </div>
              )}
            </div>

            {/* Desktop: Toggle and settings on separate row */}
              {!isMobile && (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* View toggle button group */}
                <div className="flex gap-0.5 sm:gap-1 items-center bg-gray-100 p-0.5 sm:p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('monthly')}
                    className={`toggle-button px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md ${
                      viewMode === 'monthly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={{ fontFamily: 'Poppins' }}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => {
                      // Reset timeline to focus on current month when switching to timeline view
                      const today = new Date();
                      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0); // Last day of next month
                      setTimelineStartDate(monthStart);
                      setTimelineEndDate(monthEnd);
                      
                      // Reset auto-scroll flag so it scrolls to today when view opens
                      hasAutoScrolledToToday.current = false;
                      
                      // When switching from Month → Week, use focusedDate if it's set, otherwise center on a day from the current month
                      if (viewMode === 'monthly') {
                        if (!focusedDate || 
                            focusedDate.getMonth() !== currentDate.getMonth() || 
                            focusedDate.getFullYear() !== currentDate.getFullYear()) {
                          // focusedDate not set or not in current month, use today or first of month
                          const isTodayInMonth = today.getMonth() === currentDate.getMonth() && 
                                               today.getFullYear() === currentDate.getFullYear();
                          const dayToFocus = isTodayInMonth ? today : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                          setFocusedDate(dayToFocus);
                        }
                        // If focusedDate is already set and in current month, keep it
                      } else if (!focusedDate) {
                        setFocusedDate(new Date());
                      }
                      setViewMode('weekly');
                    }}
                    className={`toggle-button px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md ${
                      viewMode === 'weekly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={{ fontFamily: 'Poppins' }}
                  >
                    Timeline
                  </button>
                </div>

              {isAdmin && (
              <button
                onClick={() => {
                  logger.info('Opening global calendar settings modal');
                  setIsSettingsModalOpen(true);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Calendar settings"
                title="Calendar settings"
              >
                <svg 
                  className="w-6 h-6 text-gray-600 hover:text-gray-900" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={2}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
                </svg>
              </button>
              )}
            </div>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden relative">
            {/* Show loading skeleton */}
            {loading ? (
              <div className="p-3 sm:p-4 md:p-6 animate-pulse">
                {/* Header with month/year and controls */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="h-6 sm:h-8 bg-gray-300 rounded w-32 sm:w-48"></div>
                  <div className="flex gap-1.5 sm:gap-2">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-300 rounded"></div>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-300 rounded"></div>
                  </div>
                </div>
                {/* Day names */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3 mb-2 sm:mb-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-3 sm:h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="min-h-[80px] sm:min-h-[100px] md:min-h-[140px] rounded-lg sm:rounded-xl bg-gray-100 p-1.5 sm:p-2 md:p-3">
                      <div className="h-4 sm:h-5 bg-gray-300 rounded w-6 sm:w-8 mb-1 sm:mb-2"></div>
                      <div className="space-y-1 sm:space-y-2">
                        <div className="h-4 sm:h-6 bg-gray-300 rounded"></div>
                        <div className="h-4 sm:h-6 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Use same viewMode for both mobile and desktop */}
                {viewMode === 'monthly' ? (
                  isMobile ? (
                    <div className="p-2 sm:p-3">
                      <MobileMonth days={days} onDayPress={(d) => { setFocusedDate(d); openSlideForDate(d); }} />
                    </div>
                  ) : (
                      <div className="p-3 sm:p-4 md:p-6">
                    <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3 mb-2 sm:mb-3">
                      {dayNames.map((d) => (
                        <div key={d} className="text-center text-xs sm:text-sm font-medium text-gray-700 tracking-wide">{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-3">
                      {days.map((day, index) => {
                        const bookingsForDay = getBookingsForDate(day.fullDate);
                        const isCurrentMonth = day.isCurrentMonth;
                        const isBlocked = isDateBlocked(day.fullDate);
                        const blockedTooltip = isBlocked ? getBlockedDateTooltip(day.fullDate) : '';

                        // Blocked dates override booking status
                        const bgClass = isBlocked 
                          ? 'bg-blocked' 
                          : bookingsForDay.length > 0 
                            ? getStatusBgClass(bookingsForDay[0].status) 
                            : 'bg-available';
                        const maxVisible = 2; // Show max 2 bookings by default
                        const visibleBookings = bookingsForDay.slice(0, maxVisible);
                        const remainingCount = bookingsForDay.length - maxVisible;
                        
                        const dayCard = (
                          <div 
                            key={index} 
                            className={`min-h-[80px] sm:min-h-[100px] md:min-h-[140px] max-h-[80px] sm:max-h-[100px] md:max-h-[140px] rounded-lg sm:rounded-xl p-1.5 sm:p-2 md:p-3 relative transition-all duration-200 overflow-hidden flex flex-col ${
                              isCurrentMonth ? `${bgClass} ${bookingsForDay.length > 0 && !isBlocked ? 'cursor-pointer' : ''}` : 'bg-gray-50/50'
                            } hover:opacity-95`}
                            onClick={() => bookingsForDay.length > 0 && isCurrentMonth && !isBlocked && openSlideForDate(day.fullDate)}
                          >
                            <div className={`text-xs sm:text-sm font-semibold mb-0.5 sm:mb-1 ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                              {day.date}
                            </div>

                            {bookingsForDay.length > 0 && isCurrentMonth && (
                              <div className="flex flex-col gap-0.5 flex-1 overflow-hidden">
                                {visibleBookings.map((booking, idx) => {
                                  // Map status classes to solid colors (same as timeline view)
                                  const statusClass = getStatusBgClass(booking.status);
                                  const statusColorMap: Record<string, string> = {
                                    'bg-booked': '#B84C4C',
                                    'bg-pending': '#F6D658',
                                    'bg-available': '#558B8B',
                                    'bg-blocked': '#4D504E'
                                  };
                                  const accentColor = statusColorMap[statusClass] || '#B84C4C';
                                  
                                  return (
                                  <div 
                                    key={idx} 
                                    className="rounded border border-white/40 backdrop-blur-sm relative"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
                                  >
                                    {/* Status color indicator bar on the left - using solid color */}
                                    <div 
                                      className="h-full w-1 absolute left-0 top-0 bottom-0 rounded-l"
                                      style={{ backgroundColor: accentColor }}
                                      aria-label={`${booking.status} booking`}
                                    />
                                    {/* Compact booking info with improved typography */}
                                    <div className="flex-1 min-w-0 pl-3 pr-2 py-1 flex flex-col gap-0 relative">
                                      {/* Unit Name */}
                                      <div className="text-[10px] font-semibold text-gray-900 truncate leading-tight">
                                        {booking.title || 'Unit'}
                                      </div>
                                      {/* Guest | Stay Range */}
                                      <div className="text-[9px] font-medium text-gray-700 truncate leading-tight">
                                        {booking.clientFirstName || 'Guest'} | {formatStayRange(booking.checkInDate, booking.checkOutDate)}
                                      </div>
                                    </div>
                                  </div>
                                  );
                                })}
                                {/* Show indicator card if there are more bookings than displayed - same design as booking cards */}
                                {remainingCount > 0 && (
                                  <div 
                                    className="rounded border border-white/40 backdrop-blur-sm relative"
                                    style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}
                                  >
                                    {/* Status color indicator bar on the left */}
                                    <div 
                                      className="h-full w-1 bg-gray-400 absolute left-0 top-0 bottom-0 rounded-l"
                                      aria-label="More bookings indicator"
                                    />
                                    {/* Compact more bookings info with same typography */}
                                    <div className="flex-1 min-w-0 pl-3 pr-2 py-1 flex flex-col gap-0 relative">
                                      <div className="text-[8px] font-semibold text-gray-900 truncate leading-tight">
                                        +{remainingCount} more
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                        
                        return blockedTooltip ? (
                          <Tooltip key={index} content={blockedTooltip}>
                            {dayCard}
                          </Tooltip>
                        ) : dayCard;
                      })}
                    </div>
                  </div>
                  )
                ) : (
                  // Weekly / Timeline view (same for mobile and desktop, with horizontal scroll on mobile)
                  <>
                    {/* Timeline view - Horizontal timeline with units as rows */}
                    {/* Generate date range: starts 1 week before today, ends 1 month ahead, expands on scroll */}
                    {(() => {
                      const units = getUniqueUnits();
                      const DAY_WIDTH = 120; // Width of each day column in pixels (increased for better spacing)
                      const ROW_HEIGHT = 60; // Height of each unit row
                      const UNIT_COL_WIDTH = isMobile ? 120 : 350; // Unit column width (responsive)
                      
                      // Use state-based date range (starts 1 week before today, ends 1 month ahead, expands on scroll)
                      const numDays = Math.ceil((timelineEndDate.getTime() - timelineStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      const dateRange = generateDateRange(timelineStartDate, numDays);
                      
                      return (
                        <div
                          ref={timelineScrollRef}
                          className="bg-white"
                          style={{
                            height: isMobile ? 'calc(100vh - 250px)' : 'calc(100vh - 300px)',
                            overflowX: 'auto',
                            overflowY: 'auto',
                            position: 'relative',
                            WebkitOverflowScrolling: 'touch',
                            overscrollBehavior: 'contain',
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#cbd5e1 transparent'
                          }}
                          aria-label="Timeline schedule"
                        >
                          <div style={{ position: 'relative', minWidth: `${dateRange.length * DAY_WIDTH + UNIT_COL_WIDTH}px` }}>
                            {/* Date headers row - sticky at top */}
                            <div style={{ 
                              display: 'flex',
                              position: 'sticky',
                              top: 0,
                              zIndex: 20,
                              backgroundColor: '#FFFFFF',
                              borderBottom: '2px solid #E5E7EB'
                            }}>
                              {/* Unit label header cell */}
                              <div style={{ 
                                width: isMobile ? '120px' : '350px',
                                minWidth: isMobile ? '120px' : '350px',
                                borderRight: '1px solid #E5E7EB',
                                backgroundColor: '#F9FAFB',
                                position: 'sticky',
                                left: 0,
                                zIndex: 21,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: isMobile ? '8px 2px' : '8px 4px'
                              }}>
                                <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold text-gray-700`} style={{ fontFamily: 'Poppins' }}>
                                  Unit
                                </div>
                              </div>
                              
                              {/* Date columns */}
                              {dateRange.map((date, idx) => {
                                const isToday = date.toDateString() === new Date().toDateString();
                                const isInCurrentMonth = date.getMonth() === currentDate.getMonth();
                                const isLastColumn = idx === dateRange.length - 1;
                                const isBlocked = isDateBlocked(date);
                                const blockedTooltip = isBlocked ? getBlockedDateTooltip(date) : '';
                                
                                const dateHeader = (
                                  <div
                                    key={idx}
                                    style={{
                                      width: `${DAY_WIDTH}px`,
                                      minWidth: `${DAY_WIDTH}px`,
                                      maxWidth: `${DAY_WIDTH}px`,
                                      padding: '8px 4px',
                                      borderRight: isLastColumn ? 'none' : '1px solid #E5E7EB',
                                      textAlign: 'center',
                                      backgroundColor: isBlocked 
                                        ? 'rgba(77, 80, 78, 0.12)' 
                                        : (isToday ? '#E0F2F1' : '#FFFFFF'),
                                      boxSizing: 'border-box',
                                      position: 'relative'
                                    }}
                                  >
                                    <div className="text-xs font-medium" style={{ 
                                      color: isToday ? '#0B5858' : '#6B7280',
                                      fontFamily: 'Poppins',
                                      marginBottom: '2px'
                                    }}>
                                      {dayNames[date.getDay()].slice(0, 3)}
                                    </div>
                                    <div className="text-sm font-semibold" style={{ 
                                      color: isToday ? '#0B5858' : (isInCurrentMonth ? '#111827' : '#9CA3AF'),
                                      fontFamily: 'Poppins'
                                    }}>
                                      {date.getDate()}
                                    </div>
                                    {isBlocked && (
                                      <div 
                                        className="absolute top-1 right-1"
                                        style={{
                                          width: '6px',
                                          height: '6px',
                                          borderRadius: '50%',
                                          backgroundColor: '#4D504E',
                                          opacity: 0.8
                                        }}
                                        title="Blocked"
                                      />
                                    )}
                                  </div>
                                );
                                
                                return blockedTooltip ? (
                                  <Tooltip key={idx} content={blockedTooltip}>
                                    {dateHeader}
                                  </Tooltip>
                                ) : dateHeader;
                              })}
                            </div>

                            {/* Unit rows */}
                            {units.length > 0 ? (
                              units.map((unitTitle, unitIdx) => {
                                const unitBookings = getBookingsForUnit(unitTitle);
                                
                                return (
                                  <div
                                    key={unitIdx}
                                    style={{
                                      display: 'flex',
                                      height: `${ROW_HEIGHT}px`,
                                      borderBottom: '1px solid #E5E7EB',
                                      position: 'relative'
                                    }}
                                  >
                                    {/* Unit name cell - sticky on left */}
                                    <div
                                      style={{
                                        width: isMobile ? '120px' : '350px',
                                        minWidth: isMobile ? '120px' : '350px',
                                        padding: isMobile ? '12px 8px' : '12px 16px',
                                        borderRight: '1px solid #E5E7EB',
                                        backgroundColor: '#F9FAFB',
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 10,
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                    >
                                      <div className={`${isMobile ? 'text-xs' : 'text-sm'} font-normal text-gray-900 truncate`} style={{ fontFamily: 'Poppins' }}>
                                        {unitTitle}
                                      </div>
                                    </div>

                                    {/* Timeline area with booking bars */}
                                    <div
                                      style={{
                                        position: 'relative',
                                        width: `${dateRange.length * DAY_WIDTH}px`,
                                        height: '100%',
                                        boxSizing: 'border-box'
                                      }}
                                    >
                                      {/* Blocked date background indicators - show for global blocked dates */}
                                      {dateRange.map((date, dayIdx) => {
                                        if (isDateBlocked(date)) {
                                          const blockedTooltip = getBlockedDateTooltip(date);
                                          const blockedIndicator = (
                                            <div
                                              className="bg-blocked"
                                              style={{
                                                position: 'absolute',
                                                left: `${dayIdx * DAY_WIDTH}px`,
                                                width: `${DAY_WIDTH}px`,
                                                height: '100%',
                                                opacity: 0.3,
                                                zIndex: 2,
                                                pointerEvents: 'auto'
                                              }}
                                            />
                                          );
                                          return (
                                            <Tooltip key={`blocked-${dayIdx}`} content={blockedTooltip}>
                                              {blockedIndicator}
                                            </Tooltip>
                                          );
                                        }
                                        return null;
                                      })}
                                      
                                      {/* Day dividers - align perfectly with header column borders */}
                                      {dateRange.map((_, dayIdx) => {
                                        // Position divider at the right edge of each column (matching header border position)
                                        // With box-sizing: border-box, each column is exactly DAY_WIDTH wide
                                        // The border is on the right edge, so divider should be at (dayIdx + 1) * DAY_WIDTH - 0.5px for perfect alignment
                                        const isLastColumn = dayIdx === dateRange.length - 1;
                                        if (isLastColumn) return null; // Don't render divider after last column
                                        
                                        return (
                                          <div
                                            key={dayIdx}
                                            style={{
                                              position: 'absolute',
                                              left: `${(dayIdx + 1) * DAY_WIDTH - 0.5}px`,
                                              width: '1px',
                                              height: '100%',
                                              backgroundColor: '#E5E7EB',
                                              zIndex: 1
                                            }}
                                          />
                                        );
                                      })}

                                      {/* Booking bars */}
                                      {unitBookings.map((booking, bookingIdx) => {
                                        const position = getBookingBarPosition(booking, dateRange, DAY_WIDTH);
                                        if (!position.visible) return null;

                                        const statusClass = getStatusBgClass(booking.status);
                                        const statusColorMap: Record<string, string> = {
                                          'bg-booked': '#B84C4C',
                                          'bg-pending': '#F6D658',
                                          'bg-available': '#558B8B',
                                          'bg-blocked': '#4D504E'
                                        };
                                        const borderColor = statusColorMap[statusClass] || '#B84C4C';
                                        
                                        const checkInFormatted = booking.checkInDate.toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric', 
                                          year: 'numeric' 
                                        });
                                        const checkOutFormatted = booking.checkOutDate.toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric', 
                                          year: 'numeric' 
                                        });

                                        return (
                                          <div
                                            key={bookingIdx}
                                            className={`${statusClass} rounded-md cursor-pointer transition-all hover:opacity-90 hover:shadow-md`}
                                            style={{
                                              position: 'absolute',
                                              left: `${position.left + 2}px`,
                                              top: '8px',
                                              width: `${position.width - 4}px`,
                                              height: `${ROW_HEIGHT - 16}px`,
                                              borderLeft: `3px solid ${borderColor}`,
                                              padding: '6px 10px',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              justifyContent: 'center',
                                              zIndex: 5
                                            }}
                                            onClick={() => handleTimelineBookingClick(booking)}
                                            title={`Check-in: ${checkInFormatted}\nCheck-out: ${checkOutFormatted}\nGuest: ${booking.clientFirstName || 'Guest'}`}
                                            aria-label={`${booking.clientFirstName || 'Guest'} - ${formatStayRange(booking.checkInDate, booking.checkOutDate)}`}
                                          >
                                            <div className="text-xs font-semibold text-gray-900 line-clamp-1" style={{ fontFamily: 'Poppins' }}>
                                              {booking.clientFirstName || 'Guest'}
                                            </div>
                                            <div className="text-[10px] text-gray-700 line-clamp-1" style={{ fontFamily: 'Poppins' }}>
                                              {formatStayRange(booking.checkInDate, booking.checkOutDate)}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>
                                No units found
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
              </>
            )}
              </>
            )}
            {/* Legend pinned to the bottom of the calendar panel */}
            {!loading && <CalendarLegend />}
          </div>
        </div>
      </div>

      {isSlideOpen && (
        <>
          <div className={`fixed inset-0 bg-black/30 z-[100] ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`} onClick={closeSlide} />
          <div className={`fixed inset-y-0 right-0 ${isMobile ? 'inset-x-0' : 'w-full sm:w-[640px]'} bg-white shadow-xl z-[110] flex flex-col ${isClosing ? 'animate-panel-out' : 'animate-panel-in'}`} role="dialog" aria-modal="true">
            <div className={`${isMobile ? 'px-4 py-4' : 'px-6 py-5'} border-b border-gray-200 flex items-center justify-between`}>
              <div className="flex-1 min-w-0 pr-2">
                <div className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`} style={{ color: '#0B5858', fontFamily: 'Poppins' }}>This Day's Lineup</div>
                <div className={`${isMobile ? 'text-[10px]' : 'text-xs'} mt-1 text-gray-500 uppercase tracking-wide truncate`}>{selectedDate?.toDateString()}</div>
              </div>
              <button onClick={closeSlide} className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-full hover:bg-gray-100 flex-shrink-0`} aria-label="Close panel">
                <svg className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-gray-600`} fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className={`flex-1 overflow-y-auto ${isMobile ? 'p-4' : 'p-6'} ${isMobile ? 'space-y-4' : 'space-y-6'}`}>
              {selectedDate && getBookingsForDate(selectedDate).map((b, idx) => (
                <div key={idx} className={`bg-white rounded-lg shadow-sm border border-gray-200 ${isMobile ? 'p-0' : 'p-6'} transform transition-transform duration-200 ${!isMobile ? 'hover:-translate-y-1' : ''}`}>
                  {isMobile ? (
                    // Mobile card format matching the booking card design
                    <div className="flex flex-col">
                      {/* Header: Date range at top left */}
                      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins' }}>
                          {b.checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {b.checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      
                      {/* Image section - full width */}
                      <div className="w-full">
                        <img src={b.mainImageUrl || '/heroimage.png'} alt={b.title} className="w-full h-48 object-cover rounded-lg" />
                      </div>
                      
                      {/* Content section */}
                      <div className="px-4 pt-4 pb-4">
                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins' }}>{b.title}</h3>
                        
                        {/* Booking details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                            </svg>
                            <span className="text-sm" style={{ fontFamily: 'Poppins' }}>
                              {b.clientFirstName ? `Booked by Client - ${b.clientFirstName}` : 'Booked by Client'}
                            </span>
                          </div>
                          {b.bookingId && (
                            <div className="flex items-center text-gray-600">
                              <svg className="w-4 h-4 mr-2 flex-shrink-0 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                              </svg>
                              <span className="text-sm" style={{ fontFamily: 'Poppins' }}>Transaction No. {b.bookingId}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Status badge */}
                        <div className="mb-4">
                          <span className="text-sm font-semibold" style={{ 
                            fontFamily: 'Poppins',
                            color: b.status === 'pending' ? '#F6D658' : b.status === 'ongoing' ? '#0B5858' : b.status === 'confirmed' ? '#0B5858' : '#9CA3AF'
                          }}>
                            {b.status === 'ongoing' ? 'On-going' : b.status === 'confirmed' ? 'Confirmed' : b.status === 'completed' ? 'Completed' : b.status || 'Pending'}
                          </span>
                        </div>
                        
                        {/* Footer: Total Bill and View button */}
                        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1" style={{ fontFamily: 'Poppins' }}>Total Bill</p>
                            <p className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>₱ {b.totalAmount?.toLocaleString() || '0'}</p>
                          </div>
                          <button 
                            onClick={() => handleViewBooking(b)} 
                            className="bg-teal-900 text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-95 transition-colors text-sm" 
                            style={{ fontFamily: 'Poppins' }}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Desktop layout (original horizontal layout)
                  <div className="flex gap-6">
                      <div className="flex-shrink-0">
                        <img src={b.mainImageUrl || '/heroimage.png'} alt={b.title} className="w-40 h-28 object-cover rounded-lg" />
                      </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins' }}>{b.title}</h3>
                        <p className="text-base text-gray-600 mb-3" style={{ fontFamily: 'Poppins' }}>
                        {b.checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {b.checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-500">
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                          <span className="text-sm" style={{ fontFamily: 'Poppins' }}>Booked for Client</span>
                        </div>
                        {b.bookingId && (
                          <div className="flex items-center text-gray-500">
                              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>
                            <span className="text-sm" style={{ fontFamily: 'Poppins' }}>Transaction No. {b.bookingId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="mb-3">
                          <span className="text-base font-medium text-orange-500" style={{ fontFamily: 'Poppins' }}>
                          {b.status === 'ongoing' ? 'On-going' : b.status === 'confirmed' ? 'Confirmed' : b.status || 'Pending'}
                        </span>
                      </div>
                      <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-1" style={{ fontFamily: 'Poppins' }}>Total Bill</p>
                        <p className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Poppins' }}>₱ {b.totalAmount?.toLocaleString() || '0'}</p>
                      </div>
                        <button onClick={() => handleViewBooking(b)} className="px-6 py-2 bg-teal-900 text-white rounded-lg font-medium hover:opacity-95 transition-colors" style={{ fontFamily: 'Poppins' }}>View</button>
                    </div>
                  </div>
                  )}
                </div>
              ))}

              {selectedDate && getBookingsForDate(selectedDate).length === 0 && <div className="text-center text-gray-500 py-10">No bookings for this date.</div>}
            </div>
          </div>
        </>
      )}

      {/* Timeline Booking Details Drawer */}
      {isDrawerOpen && selectedBooking && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 cursor-pointer"
            style={{
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              transition: 'background-color 0.25s ease'
            }}
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <div 
            className={`fixed inset-y-0 right-0 w-full sm:w-[640px] bg-white shadow-xl z-50 flex flex-col ${isDrawerClosing ? 'animate-slide-out' : 'animate-slide-in'}`}
            style={{ 
              height: '100vh',
              maxHeight: '100vh',
              top: 0,
              bottom: 0,
              overflow: 'hidden'
            }}
          >
            {/* Drawer Header */}
            <div className={`flex-shrink-0 ${isMobile ? 'px-4 py-4 pb-4' : 'px-6 py-6 pb-6'} border-b border-gray-200 bg-white`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`} style={{ fontFamily: 'Poppins' }}>
                  Booking Details
                </h2>
                <button
                  onClick={closeDrawer}
                  className={`${isMobile ? 'p-1.5' : 'p-2'} rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 cursor-pointer flex-shrink-0`}
                >
                  <svg className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-gray-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Booking Status */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-gray-900`} style={{ fontFamily: 'Poppins' }}>Status:</span>
                  <span className={`${isMobile ? 'text-sm' : 'text-base'} font-semibold text-gray-900`} style={{ fontFamily: 'Poppins' }}>
                    {(() => {
                      const status = selectedBooking.status;
                      if (status === 'pending') return 'Pending';
                      if (status === 'confirmed' || status === 'ongoing' || status === 'completed') return 'Approved';
                      if (status === 'declined' || status === 'cancelled') return 'Declined';
                      // Fallback: capitalize first letter of status string
                      const statusStr = String(status);
                      return statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
                    })()}
                  </span>
                </div>
                {selectedBooking.status === 'pending' && !isAdmin && (
                  <button
                    onClick={() => {
                      if (selectedBooking) {
                        navigate(`/booking-details/${selectedBooking.id}`);
                      }
                    }}
                    className={`${isMobile ? 'text-xs' : 'text-sm'} font-semibold transition-all duration-200 cursor-pointer hover:scale-105 active:scale-100 relative group`}
                    style={{ fontFamily: 'Poppins', color: '#0B5858' }}
                  >
                    <span className="relative inline-block">
                      [ View Full Details ]
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0B5858] transition-all duration-300 group-hover:w-full"></span>
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Drawer Content - Scrollable */}
            <div 
              className={`flex-1 overflow-y-auto overflow-x-hidden ${isMobile ? 'p-4' : 'p-6'}`}
              style={{ 
                minHeight: 0,
                height: 0, // Force flex child to respect parent constraints
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                scrollbarWidth: 'thin',
                scrollbarColor: '#cbd5e1 transparent'
              }}
            >
              {/* Client and Agent Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Client Details */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3" style={{ fontFamily: 'Poppins' }}>
                    Client Information
                  </h3>
                  {selectedBooking.client ? (
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B5858] to-[#0a4a4a] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {`${selectedBooking.client.first_name.charAt(0)}${selectedBooking.client.last_name.charAt(0)}`}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <h4 className="text-xs text-gray-900" style={{ fontFamily: 'Poppins' }}>
                            {`${selectedBooking.client.first_name} ${selectedBooking.client.last_name}`}
                          </h4>
                        </div>
                        {selectedBooking.client.email && (
                          <div className="flex items-center gap-2 mb-0.5">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-gray-900 truncate" style={{ fontFamily: 'Poppins' }}>
                              {selectedBooking.client.email}
                            </p>
                          </div>
                        )}
                        {selectedBooking.client.contact_number && (
                          <div className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins' }}>
                              {selectedBooking.client.contact_number}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>No client information available</p>
                    </div>
                  )}
                </div>

                {/* Assigned Agent */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3" style={{ fontFamily: 'Poppins' }}>
                    Assigned Agent
                  </h3>
                  {selectedBooking.agent ? (
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0B5858] to-[#0a4a4a] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {selectedBooking.agent.fullname ? selectedBooking.agent.fullname.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <h4 className="text-xs text-gray-900" style={{ fontFamily: 'Poppins' }}>
                            {selectedBooking.agent.fullname || 'Unknown Agent'}
                          </h4>
                        </div>
                        {selectedBooking.agent.email && (
                          <div className="flex items-center gap-2 mb-0.5">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-gray-900 truncate" style={{ fontFamily: 'Poppins' }}>
                              {selectedBooking.agent.email}
                            </p>
                          </div>
                        )}
                        {selectedBooking.agent.contact_number && (
                          <div className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins' }}>
                              {selectedBooking.agent.contact_number}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>No agent assigned</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Details */}
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-3" style={{ fontFamily: 'Poppins' }}>
                  Booking Details
                </h3>
                <div className="space-y-0 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <div className="flex items-start py-1">
                    <span className="text-xs font-medium text-gray-600 w-[30%]" style={{ fontFamily: 'Poppins' }}>Unit</span>
                    <span className="text-xs text-gray-900 ml-4 flex-1" style={{ fontFamily: 'Poppins' }}>
                      {selectedBooking.listing?.title || 'Unknown Unit'}
                    </span>
                  </div>
                  <div className="flex items-start py-1">
                    <span className="text-xs font-medium text-gray-600 w-[30%]" style={{ fontFamily: 'Poppins' }}>Location</span>
                    <span className="text-xs text-gray-900 ml-4 flex-1" style={{ fontFamily: 'Poppins' }}>
                      {selectedBooking.listing?.location || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-start py-1">
                    <span className="text-xs font-medium text-gray-600 w-[30%]" style={{ fontFamily: 'Poppins' }}>Check-in</span>
                    <span className="text-xs text-gray-900 ml-4 flex-1" style={{ fontFamily: 'Poppins' }}>
                      {new Date(selectedBooking.check_in_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-start py-1">
                    <span className="text-xs font-medium text-gray-600 w-[30%]" style={{ fontFamily: 'Poppins' }}>Check-out</span>
                    <span className="text-xs text-gray-900 ml-4 flex-1" style={{ fontFamily: 'Poppins' }}>
                      {new Date(selectedBooking.check_out_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {((selectedBooking.num_guests && selectedBooking.num_guests > 0) || (selectedBooking.extra_guests && selectedBooking.extra_guests > 0)) && (
                    <div className="flex items-start py-1">
                      <span className="text-xs font-medium text-gray-600 w-[30%]" style={{ fontFamily: 'Poppins' }}>Guest count</span>
                      <span className="text-xs text-gray-900 ml-4 flex-1" style={{ fontFamily: 'Poppins' }}>
                        {(() => {
                          const adults = selectedBooking.num_guests || 0;
                          const children = selectedBooking.extra_guests || 0;
                          const parts = [];
                          if (adults > 0) parts.push(`${adults} ${adults === 1 ? 'adult' : 'adults'}`);
                          if (children > 0) parts.push(`${children} ${children === 1 ? 'child' : 'children'}`);
                          return parts.join(', ');
                        })()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start py-1">
                    <span className="text-xs font-medium text-gray-600 w-[30%]" style={{ fontFamily: 'Poppins' }}>Total Price</span>
                    <span className="text-xs text-gray-900 ml-4 flex-1" style={{ fontFamily: 'Poppins' }}>
                      ₱ {selectedBooking.total_amount?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Request */}
              {selectedBooking.request_description && (
                <div className={`${isMobile ? 'mb-4' : 'mb-6'}`}>
                  <h3 className={`${isMobile ? 'text-sm' : 'text-base'} font-bold text-gray-900 ${isMobile ? 'mb-2' : 'mb-3'}`} style={{ fontFamily: 'Poppins' }}>
                    Special Request
                  </h3>
                  <div className={`${isMobile ? 'p-3' : 'p-4'} bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200`}>
                    <p className={`${isMobile ? 'text-xs' : 'text-xs'} leading-relaxed text-gray-700 break-words`} style={{ fontFamily: 'Poppins', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                      {selectedBooking.request_description}
                    </p>
                  </div>
                </div>
              )}

              {/* Proof of Payment */}
              {(selectedBooking as any).billing_document_url && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3" style={{ fontFamily: 'Poppins' }}>
                    Proof of Payment
                  </h3>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    {(() => {
                      const url = (selectedBooking as any).billing_document_url;
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                      return isImage ? (
                        <img
                          src={url}
                          alt="Proof of payment"
                          className="w-full max-h-96 object-contain rounded-lg border border-gray-300 shadow-sm"
                        />
                      ) : (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B5858] text-white rounded-lg hover:bg-[#0a4a4a] transition-colors font-medium text-sm"
                          style={{ fontFamily: 'Poppins' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          View Document
                        </a>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Actions */}
            <div className={`flex-shrink-0 ${isMobile ? 'px-4 py-4' : 'px-6 py-5'} border-t border-gray-200 bg-white flex gap-3`}>
              {isAdmin ? (
                // Admin view: Show approve/decline for pending, or view full details for others
                <>
              <button
                onClick={closeDrawer}
                disabled={isProcessing}
                    className={`flex-1 ${isMobile ? 'px-4 py-2.5 text-sm' : 'px-6 py-3'} border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`}
                style={{ fontFamily: 'Poppins' }}
              >
                Close
              </button>
              {selectedBooking.status === 'pending' && (
                <>
                  <button
                    onClick={() => selectedBooking && openConfirmModal(selectedBooking)}
                    disabled={isProcessing}
                        className={`flex-1 ${isMobile ? 'px-4 py-2.5 text-sm' : 'px-6 py-3'} text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100`}
                    style={{ fontFamily: 'Poppins', backgroundColor: '#B84C4C' }}
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => selectedBooking && handleApprove(selectedBooking)}
                    disabled={isProcessing}
                        className={`flex-1 ${isMobile ? 'px-4 py-2.5 text-sm' : 'px-6 py-3'} text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100`}
                    style={{ fontFamily: 'Poppins', backgroundColor: '#05807E' }}
                  >
                    Approve
                  </button>
                </>
              )}
              {selectedBooking.status !== 'pending' && (
                <button
                  onClick={() => {
                    if (selectedBooking) {
                      navigate(`/booking-details/${selectedBooking.id}`);
                    }
                  }}
                      className={`flex-1 ${isMobile ? 'px-4 py-2.5 text-sm' : 'px-6 py-3'} text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer font-medium`}
                  style={{ fontFamily: 'Poppins', backgroundColor: '#0B5858' }}
                >
                  View Full Details
                </button>
                  )}
                </>
              ) : (
                // Non-admin view: Always show Close and View Full Details
                <>
                  <button
                    onClick={closeDrawer}
                    disabled={isProcessing}
                    className={`flex-1 ${isMobile ? 'px-4 py-2.5 text-sm' : 'px-6 py-3'} border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`}
                    style={{ fontFamily: 'Poppins' }}
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      if (selectedBooking) {
                        navigate(`/booking-details/${selectedBooking.id}`);
                      }
                    }}
                    className={`flex-1 ${isMobile ? 'px-4 py-2.5 text-sm' : 'px-6 py-3'} text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer font-medium`}
                    style={{ fontFamily: 'Poppins', backgroundColor: '#0B5858' }}
                  >
                    View Full Details
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}

      {/* Toast Notification */}
      {toast.visible && (
        <div
          className="fixed bottom-6 right-6 z-[200] pointer-events-none"
          style={{ fontFamily: 'Poppins' }}
        >
          <div
            ref={toastRef}
            className="toast-base px-4 py-3 rounded-lg pointer-events-auto"
            style={{
              background: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              minWidth: '280px',
              maxWidth: '400px',
              borderLeft: `6px solid ${toast.type === 'success' ? '#0B5858' : '#B84C4C'}`
            }}
            onTransitionEnd={(e) => {
              const el = e.currentTarget;
              if (el.classList.contains('toast--exit')) {
                setToast({ visible: false, message: '', type: 'success' });
                el.classList.remove('toast--exit');
              }
            }}
          >
            {toast.message}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Decline */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[60]"
          style={{
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            transition: 'background-color 0.25s ease'
          }}
          onClick={closeConfirmModal}
        >
          <div 
            className="max-w-md w-full mx-4"
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
              transform: confirmModalActive ? 'scale(1)' : 'scale(0.95)',
              opacity: confirmModalActive ? 1 : 0,
              transition: 'all 0.25s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2" style={{fontFamily: 'Poppins'}}>
                Decline Booking Request
              </h3>
              <p className="text-gray-700 mb-5" style={{fontFamily: 'Poppins'}}>
                Are you sure you want to decline this booking request? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeConfirmModal}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  style={{fontFamily: 'Poppins'}}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecline}
                  disabled={isProcessing}
                  className="px-4 py-2 text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
                  style={{
                    backgroundColor: '#B84C4C',
                    fontFamily: 'Poppins'
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Decline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Styles */}
      <style>{`
        .toast-base { transform: translateX(100%); opacity: 0; transition: transform .28s ease-out, opacity .28s ease-out; will-change: transform, opacity; }
        .toast--enter { transform: translateX(0); opacity: 1; }
        .toast--exit { transform: translateX(100%); opacity: 0; }
      `}</style>

      {/* Slide-in and slide-out animations for drawer */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slide-out {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-slide-out {
          animation: slide-out 0.3s ease-out;
        }
      `}</style>

      {/* Global Calendar Settings Modal - Only for admin */}
      {isAdmin && (
        <CalendarSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          unitId={null}
          showSpecialPricing={false}
          isGlobal={true}
        />
      )}
    </div>
  );
};

export default Calendar;