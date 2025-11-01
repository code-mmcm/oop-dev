import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { BookingService } from '../../services/bookingService';
import { ListingService } from '../../services/listingService';
import type { Listing } from '../../types/listing';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../lib/logger';

/**
 * Type for calendar booking representation
 * Used internally by the calendar component to display bookings in the calendar grid
 */
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

/**
 * Unit Calendar Page Component
 * 
 * Displays a calendar view specifically for a single listing/unit, showing all bookings
 * for that particular listing. Reuses the existing calendar component structure but
 * filters bookings by the specific listing ID from the URL parameters.
 * 
 * Features:
 * - Monthly and weekly calendar views
 * - Mobile-responsive design with daily/monthly toggles
 * - Click-to-view booking details in a slide-over panel
 * - Real-time current time indicator for weekly view
 * - Navigate between months with smooth animations
 */
const UnitCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  // default to today on load
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null); // for slide-over
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);
  const [listingLoading, setListingLoading] = useState(true);

  // focusedDate is the "selected" date used to determine which 7-day window to show and centering
  const [focusedDate, setFocusedDate] = useState<Date>(() => new Date()); // defaults to today

  // header height measurement (used to correctly position the current-time line)
  const [headerHeight, setHeaderHeight] = useState<number>(0);

  // scroll position for current-time line updates on horizontal scroll
  const [scrollPosition, setScrollPosition] = useState<number>(0);

  // refs
  const weeklyScrollRef = useRef<HTMLDivElement | null>(null); // scroll container for entire calendar grid
  const calendarGridRef = useRef<HTMLDivElement | null>(null); // the grid element inside scroll container

  // new: animation flags
  const [headerAnimating, setHeaderAnimating] = useState(false);
  const headerAnimTimer = useRef<number | null>(null);

  // constants
  const HOUR_ROW_PX = 48; // tailwind h-12 equivalent
  const DOT_SIZE = 12;

  // Mobile detection & mobile view mode
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileViewMode, setMobileViewMode] = useState<'monthly' | 'daily'>('monthly');

  // Touch swipe for mobile day navigation
  const touchStartX = useRef<number | null>(null);

  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  // hours array (typed)
  const hours: string[] = (() => {
    const arr: string[] = [];
    for (let i = 0; i < 24; i++) {
      const period = i < 12 ? 'AM' : 'PM';
      const h = i % 12 === 0 ? 12 : i % 12;
      arr.push(`${h} ${period}`);
    }
    return arr;
  })();

  // helpers
  const addDays = (d: Date, n: number) => {
    const c = new Date(d);
    c.setDate(c.getDate() + n);
    return c;
  };

  /**
   * Returns the hour (0-23) of a Date in a specified IANA timezone.
   */
  const getHourInTimeZone = (date: Date, timeZone: string): number => {
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      hour12: false,
      timeZone,
    }).formatToParts(date);
    const hourPart = parts.find(p => p.type === 'hour');
    return hourPart ? parseInt(hourPart.value, 10) : date.getHours();
  };

  // centered-week helper (7-day window with focusedDate in the middle)
  const getCenteredWeekDays = (d: Date) => {
    const arr: Date[] = [];
    for (let i = -3; i <= 3; i++) arr.push(addDays(d, i));
    return arr;
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
  const getBookingForDate = (date: Date) => bookings.find(b => isDateInStay(date, b));
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

  // Fetch listing details
  useEffect(() => {
    const fetchListing = async () => {
      if (!id) {
        setListingLoading(false);
        return;
      }

      try {
        setListingLoading(true);
        logger.info('Fetching listing details', { listingId: id });
        const listingData = await ListingService.getListingById(id);
        setListing(listingData);
        if (listingData) {
          logger.info('Listing details fetched successfully', { listingId: id, title: listingData.title });
        }
      } catch (error) {
        logger.error('Error fetching listing details', { error, listingId: id });
        console.error('Error fetching listing:', error);
      } finally {
        setListingLoading(false);
      }
    };

    fetchListing();
  }, [id]);

  // Fetch bookings from Supabase for specific listing
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user || !id) {
        setBookings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        logger.info('Fetching bookings for listing', { listingId: id });

        // Fetch bookings for this specific listing
        const fetchedBookings = await BookingService.getBookingsByListingId(id);

        logger.info('Bookings fetched successfully', { listingId: id, count: fetchedBookings.length });

        // Convert Supabase bookings to calendar format
        const calendarBookings: Booking[] = fetchedBookings.map((booking) => {
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
      } catch (error) {
        logger.error('Error fetching bookings', { error, listingId: id });
        console.error('Error fetching bookings:', error);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, id]);

  // initialize focusedDate on mount so weekly view centers on today by default
  useEffect(() => {
    setFocusedDate(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // measure header height whenever grid renders or focus/month changes so the current-time line doesn't overlap the header
  useEffect(() => {
    if (!calendarGridRef.current) return;
    // For new grid layout, header is the first day header (60px height)
    const headerEl = calendarGridRef.current.querySelector('[data-day-header-index="0"]') as HTMLElement | null;
    setHeaderHeight(headerEl ? headerEl.offsetHeight : 60); // Default to 60px if not found
  }, [focusedDate, currentDate, viewMode, isMobile, mobileViewMode]);

  // Update scroll position on horizontal scroll to trigger current-time line re-renders
  useEffect(() => {
    let mounted = true;
    const scrollerEl = weeklyScrollRef.current;
    
    const onScroll = () => {
      // Update scroll position to trigger re-render of current-time line
      if (scrollerEl && mounted) {
        setScrollPosition(scrollerEl.scrollLeft);
      }
    };
    
    const onResize = () => {
      // Update scroll position on resize as well
      if (scrollerEl && mounted) {
        setScrollPosition(scrollerEl.scrollLeft);
      }
    };

    if (scrollerEl) {
      scrollerEl.addEventListener('scroll', onScroll, { passive: true });
    }
    window.addEventListener('resize', onResize);

    return () => {
      mounted = false;
      if (scrollerEl) scrollerEl.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [focusedDate, viewMode, isMobile]);

  // Clean up header animation timer on unmount
  useEffect(() => {
    return () => {
      if (headerAnimTimer.current) {
        window.clearTimeout(headerAnimTimer.current);
      }
    };
  }, []);

  /**
   * Formats a week range for display, e.g., "Sep 29 – Oct 5, 2025" or "Sep 3 – 9, 2025"
   */
  const formatWeekRange = (focused: Date): string => {
    const weekDays = getCenteredWeekDays(focused);
    const startDay = weekDays[0]; // First day of the week (-3 days from focused)
    const endDay = weekDays[6];   // Last day of the week (+3 days from focused)
    
    const startMonth = startDay.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDay.toLocaleDateString('en-US', { month: 'short' });
    const startDate = startDay.getDate();
    const endDate = endDay.getDate();
    const year = endDay.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDate} – ${endDate}, ${year}`;
    } else {
      return `${startMonth} ${startDate} – ${endMonth} ${endDate}, ${year}`;
    }
  };

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

  /**
   * Navigate by week (7 days) instead of month when in week view
   */
  const navigateWeek = (direction: 'prev' | 'next') => {
    setHeaderAnimating(true);
    if (headerAnimTimer.current) window.clearTimeout(headerAnimTimer.current);
    headerAnimTimer.current = window.setTimeout(() => setHeaderAnimating(false), 280);

    // Move focusedDate by 7 days
    const daysToMove = direction === 'prev' ? -7 : 7;
    const newFocusedDate = addDays(focusedDate, daysToMove);
    setFocusedDate(newFocusedDate);
    
    // Update currentDate to match the new week's month (for consistency)
    setCurrentDate(new Date(newFocusedDate.getFullYear(), newFocusedDate.getMonth(), 1));
  };

  // Handler when clicking a day header in weekly view
  const handleHeaderClick = (day: Date) => {
    const isDifferentMonth = !(day.getMonth() === currentDate.getMonth() && day.getFullYear() === currentDate.getFullYear());
    if (isDifferentMonth) {
      setCurrentDate(new Date(day.getFullYear(), day.getMonth(), 1));
      requestAnimationFrame(() => setFocusedDate(day));
    } else {
      setFocusedDate(day);
    }
  };

  // center the focused date horizontally in the weekly scroll container whenever it changes
  useEffect(() => {
    if (viewMode !== 'weekly') return;
    const scroller = weeklyScrollRef.current;
    const grid = calendarGridRef.current;
    if (!scroller || !grid || !focusedDate) return;

    const targetDateStr = focusedDate.toDateString();

    requestAnimationFrame(() => {
      const headerEl = grid.querySelector(`[data-day-date="${targetDateStr}"]`) as HTMLElement | null;
      if (!headerEl) return;

      const headerLeft = headerEl.offsetLeft;
      const headerCenter = headerLeft + headerEl.offsetWidth / 2;
      const targetScrollLeft = Math.max(0, headerCenter - scroller.clientWidth / 2);

      scroller.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
    });
  }, [focusedDate, viewMode, currentDate]);

  // keep now updated every minute
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  // current time line math
  const minutesIntoDay = now.getHours() * 60 + now.getMinutes();
  const currentLineTop = (minutesIntoDay / 60) * HOUR_ROW_PX;

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

  // navigate to booking details page
  const handleViewBooking = (booking: Booking) => {
    if (!booking.bookingId) return;
    navigate(`/booking-details/${booking.bookingId}`);
  };

  // Keyboard support for the days scroll container
  const handleWeeklyKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const el = weeklyScrollRef.current;
    if (!el) return;
    const line = HOUR_ROW_PX;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      el.scrollBy({ top: line, behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      el.scrollBy({ top: -line, behavior: 'smooth' });
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      el.scrollBy({ top: el.clientHeight, behavior: 'smooth' });
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      el.scrollBy({ top: -el.clientHeight, behavior: 'smooth' });
    } else if (e.key === 'Home') {
      e.preventDefault();
      el.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (e.key === 'End') {
      e.preventDefault();
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault(); setFocusedDate(prev => prev ? addDays(prev, -1) : addDays(new Date(), -1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault(); setFocusedDate(prev => prev ? addDays(prev, 1) : addDays(new Date(), 1));
    }
  };

  // Mobile swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const threshold = 40;
    if (Math.abs(dx) > threshold) {
      setFocusedDate(prev => prev ? addDays(prev, dx < 0 ? 1 : -1) : addDays(new Date(), dx < 0 ? 1 : -1));
    }
    touchStartX.current = null;
  };

  // Month grid data (for monthly view)
  const days = getDaysInMonth(currentDate);

  /**
   * Maps booking status to CSS background helper class for unit calendar.
   */
  const getStatusBgClass = (status?: string): string => {
    const s = (status || '').toLowerCase();
    if (s === 'pending') return 'bg-pending';
    if (s === 'blocked') return 'bg-blocked';
    if (s === 'available') return 'bg-available';
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
   * Formats check-in time string, defaulting when time component is missing or is midnight/default.
   * Uses original date string to properly detect if time information exists and if it's a default value.
   */
  const formatCheckInTime = (checkInDateString: string, checkIn: Date): string => {
    const hasTime = checkInDateString.includes('T') && checkInDateString.includes(':');
    if (!hasTime) return '2:00 PM check-in';
    
    // Check if the time is effectively "default/midnight" time
    const hourInManila = getHourInTimeZone(checkIn, 'Asia/Manila');
    
    // Treat midnight (0) or UTC midnight converted to Manila (8 AM) as "no time specified"
    // Also check if it's exactly 00:00:00 in the original string
    const timeMatch = checkInDateString.match(/T(\d{2}):(\d{2}):(\d{2})/);
    const isMidnightTime = timeMatch && timeMatch[1] === '00' && timeMatch[2] === '00' && timeMatch[3] === '00';
    const isDefaultTime = isMidnightTime || hourInManila === 0 || hourInManila === 8;
    
    if (isDefaultTime) return '2:00 PM check-in';
    
    const label = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
    }).format(checkIn);
    return `${label} check-in`;
  };

  /**
   * CalendarLegend
   * Renders a compact legend indicating the meaning of calendar colors.
   * Placed within the page component for cohesive styling and minimal coupling.
   */
  const CalendarLegend: React.FC = () => {
    useEffect(() => {
      logger.info('Rendering UnitCalendar legend', {
        statuses: ['Booked', 'Pending', 'Available', 'Blocked'],
        listingId: id
      });
    }, []);

    const items: { label: string; className: string }[] = [
      { label: 'Booked', className: 'bg-booked' },
      { label: 'Pending', className: 'bg-pending' },
      { label: 'Available', className: 'bg-available' },
      { label: 'Blocked', className: 'bg-blocked' },
    ];

    return (
      <div className="px-4 py-3 border-top border-gray-200 bg-white" style={{ borderTopWidth: 1 }}>
        <div className="flex flex-wrap items-center gap-4" aria-label="Calendar legend">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span aria-hidden="true" className={`inline-block rounded ${item.className}`} style={{ width: 14, height: 14 }} />
              <span className="text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  //
  // Mobile subcomponents (inline for convenience)
  //
  const MobileDay: React.FC<{
    date: Date;
    bookingsForDay: Booking[];
  }> = ({ date, bookingsForDay }) => {
    // map per-day segments by their start hour to render continuous blocks
    const startsByHour = new Map<number, Array<{ booking: Booking; segStart: number; segEnd: number }>>();
    bookingsForDay.forEach(b => {
      const dayOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const startDay = new Date(b.checkInDate.getFullYear(), b.checkInDate.getMonth(), b.checkInDate.getDate());
      const endDay = new Date(b.checkOutDate.getFullYear(), b.checkOutDate.getMonth(), b.checkOutDate.getDate());
      // Mobile day view (time-grid): include checkout day (<= endDay)
      if (!(dayOnly >= startDay && dayOnly <= endDay)) return;
      const isStartDay = dayOnly.getTime() === startDay.getTime();
      const isSameDayCheckout = startDay.getTime() === endDay.getTime();
      const segStart = isStartDay ? b.startHour : 0;
      const segEnd = isSameDayCheckout ? b.endHour : 24;
      const arr = startsByHour.get(segStart) || [];
      arr.push({ booking: b, segStart, segEnd });
      startsByHour.set(segStart, arr);
    });

    // compute now position for mobile daily (position relative to content column)
    const nowTopMobile = currentLineTop;

    return (
      // Added safe padding (px-3) so icons and header controls don't get cut off on small screens.
      // This is the only mobile-specific change; it doesn't touch desktop weekly rendering.
      <div
        className="mobile-day px-3"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ userSelect: 'none' }}
      >
        <div className="flex w-full">
          {/* time column */}
          <div className="w-20 flex-shrink-0 border-r border-gray-200 bg-white">
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_ROW_PX }} className="flex items-center justify-center text-xs text-gray-500">
                {h}
              </div>
            ))}
          </div>

          {/* content column */}
          <div className="flex-1 relative bg-white">
            {hours.map((h, idx) => {
              const hour = idx;
              const starts = startsByHour.get(hour) || [];
              return (
                <div key={h} style={{ height: HOUR_ROW_PX }} className="border-b border-gray-100 relative">
                  {starts.map(({ booking: b, segStart, segEnd }, i) => {
                    const span = Math.max(1, segEnd - segStart);
                    return (
                      <button
                        key={`${b.title}-${i}`}
                        onClick={() => openSlideForDate(date)}
                        className={`absolute left-2 right-2 ${getStatusBgClass(b.status)} text-white rounded-md p-2 text-left shadow`}
                        style={{ top: 4, height: span * HOUR_ROW_PX - 8, zIndex: 10 }}
                        aria-label={`${b.title} ${b.time}`}
                      >
                        <div className="font-semibold text-sm">{b.clientFirstName || 'Guest'}</div>
                        <div className="text-xs opacity-90">{formatCheckInTime(b.checkInDateString, b.checkInDate)}</div>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* small now indicator for mobile daily (thin line across content and a dot overlapping into time column) */}
            {focusedDate.toDateString() === new Date().toDateString() && (
              <>
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 8,
                    top: nowTopMobile,
                    borderTop: '2px solid #7CC6B0',
                    zIndex: 40,
                    opacity: 0.95
                  }}
                />
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: -8, // overlaps into the time column slightly
                    top: nowTopMobile - DOT_SIZE / 2,
                    width: DOT_SIZE,
                    height: DOT_SIZE,
                    borderRadius: 9999,
                    background: '#0B5858',
                    border: '2px solid white',
                    transform: 'translateX(-50%)',
                    zIndex: 41
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const MobileMonth: React.FC<{
    days: ReturnType<typeof getDaysInMonth>;
    onDayPress: (d: Date) => void;
  }> = ({ days, onDayPress }) => {
    return (
      <div className="mobile-month px-1">
        <div className="grid grid-cols-7 gap-1 text-xs">
          {dayNames.map(d => (
            <div key={d} className="text-center py-1 text-gray-500">{d.slice(0, 3)}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {days.map((dayObj, idx) => {
            const b = getBookingForDate(dayObj.fullDate);
            return (
              <button
                key={idx}
                onClick={() => {
                  onDayPress(dayObj.fullDate);
                  setMobileViewMode('daily');
                }}
                className={`day-button p-2 rounded-md text-left ${dayObj.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}
                aria-label={`Day ${dayObj.date}${dayObj.isToday ? ' today' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`date-number ${b ? 'has-booking' : ''} text-xs font-medium`}>{dayObj.date}</div>
                  {dayObj.isToday && <div className="text-xs text-green-600">•</div>}
                </div>

                {/* booking indicator: colored dot + small guest name preview to match unit calendar spec */}
                <div className="mt-1 flex items-center gap-2">
                  {b && <span className={`${getStatusBgClass(b.status)} inline-block rounded-full`} style={{ width: 8, height: 8 }} aria-hidden="true" />}
                  {b && <div className="text-xs text-gray-600 truncate">• {(b.clientFirstName || 'Guest')}</div>}
                </div>
              </button>
            );
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
      <Navbar />

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

        /* Time grid event blocks - clean Google Calendar/Airbnb style */
        .event-block {
          overflow: hidden;
        }
        
        /* Remove any default browser outlines or borders (but preserve left border) */
        .event-block:focus,
        .event-block:focus-visible,
        .event-block:active {
          outline: none !important;
          border-top: none !important;
          border-right: none !important;
          border-bottom: none !important;
        }
        
        /* Hover state: match month view hover effect (opacity-95) */
        .event-block:hover {
          opacity: 0.95 !important;
          outline: none !important;
        }

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

        /* Toggle button animations */
        .toggle-button {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
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

      <div className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Back button and listing title */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>
                Unit Calendar
              </h1>
              <button
                onClick={() => navigate('/manage-listings')}
                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-1"
                style={{ fontFamily: 'Poppins' }}
                aria-label="Back to Manage Listings"
              >
                <span>←</span>
                <span>Back</span>
              </button>
            </div>
            {listingLoading ? (
              <div className="text-gray-600" style={{ fontFamily: 'Poppins' }}>Loading listing...</div>
            ) : listing ? (
              <div>
                <p className="text-gray-900 mb-1" style={{ fontFamily: 'Poppins' }}>
                  {listing.title}
                </p>
                <p className="text-gray-600" style={{ fontFamily: 'Poppins' }}>
                  {listing.location}
                </p>
              </div>
            ) : (
              <div className="text-red-600" style={{ fontFamily: 'Poppins' }}>Listing not found</div>
            )}
          </div>

          {/* header + controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => viewMode === 'weekly' ? navigateWeek('prev') : navigateMonth('prev')} 
                className="p-2 hover-soft-teal rounded-full transition-colors cursor-pointer" 
                aria-label={viewMode === 'weekly' ? 'Prev week' : 'Prev month'}
              >
                <svg className="w-7 h-7 text-[#0B5858]" fill="none" viewBox="0 0 24 24"><path stroke="#0B5858" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>

              <h1 className={`text-2xl font-bold text-black ${headerAnimating ? 'header-pop-enter' : ''}`} style={{ fontFamily: 'Poppins' }}>
                {viewMode === 'weekly' 
                  ? formatWeekRange(focusedDate)
                  : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                }
              </h1>

              <button 
                onClick={() => viewMode === 'weekly' ? navigateWeek('next') : navigateMonth('next')} 
                className="p-2 hover-soft-teal rounded-full transition-colors cursor-pointer" 
                aria-label={viewMode === 'weekly' ? 'Next week' : 'Next month'}
              >
                <svg className="w-7 h-7 text-[#0B5858]" fill="none" viewBox="0 0 24 24"><path stroke="#0B5858" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isMobile && (
                <div className="flex gap-2 items-center mr-2">
                  <button onClick={() => setMobileViewMode('monthly')} className={`toggle-button px-3 py-1 rounded ${mobileViewMode === 'monthly' ? 'bg-gray-200 font-semibold' : 'bg-white'}`}>Month</button>
                  <button onClick={() => setMobileViewMode('daily')} className={`toggle-button px-3 py-1 rounded ${mobileViewMode === 'daily' ? 'bg-gray-200 font-semibold' : 'bg-white'}`}>Day</button>
                </div>
              )}

              {/* View toggle button group for desktop */}
              {!isMobile && (
                <div className="flex gap-1 items-center bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('monthly')}
                    className={`toggle-button px-4 py-2 text-sm font-medium rounded-md ${
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
                      // When switching from Month → Week, use focusedDate if it's set, otherwise center on a day from the current month
                      if (viewMode === 'monthly') {
                        if (!focusedDate || 
                            focusedDate.getMonth() !== currentDate.getMonth() || 
                            focusedDate.getFullYear() !== currentDate.getFullYear()) {
                          // focusedDate not set or not in current month, use today or first of month
                          const today = new Date();
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
                    className={`toggle-button px-4 py-2 text-sm font-medium rounded-md ${
                      viewMode === 'weekly'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    style={{ fontFamily: 'Poppins' }}
                  >
                    Week
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden relative flex flex-col">
            {/* Show loading indicator */}
            {loading && (
              <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading bookings...</div>
              </div>
            )}
            
            {/* Mobile view takes precedence when isMobile */}
            {!loading && isMobile ? (
              mobileViewMode === 'monthly' ? (
                <div className="p-3">
                  <MobileMonth days={days} onDayPress={(d) => { setFocusedDate(d); setMobileViewMode('daily'); }} />
                </div>
              ) : (
                <div className="p-0">
                  <MobileDay 
                    date={focusedDate} 
                    bookingsForDay={bookings.filter(booking => {
                      // Mobile day view (time-grid): include checkout day (<= endDay)
                      const currentDay = new Date(focusedDate.getFullYear(), focusedDate.getMonth(), focusedDate.getDate());
                      const startDay = new Date(booking.checkInDate.getFullYear(), booking.checkInDate.getMonth(), booking.checkInDate.getDate());
                      const endDay = new Date(booking.checkOutDate.getFullYear(), booking.checkOutDate.getMonth(), booking.checkOutDate.getDate());
                      return currentDay >= startDay && currentDay <= endDay;
                    })}
                  />
                </div>
              )
            ) : !loading && (
              // Desktop: existing monthly / weekly experience
              <>
                {viewMode === 'monthly' ? (
                  <div className="p-6">
                    <div className="grid grid-cols-7 gap-3 mb-3">
                      {dayNames.map((d) => (
                        <div key={d} className="text-center text-sm font-medium text-gray-700 tracking-wide">{d}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-3">
                      {days.map((day, index) => {
                        const booking = getBookingForDate(day.fullDate);
                        const isCurrentMonth = day.isCurrentMonth;

                        const bgClass = booking ? getStatusBgClass(booking.status) : 'bg-available';
                        return (
                          <div 
                            key={index} 
                            className={`min-h-[140px] rounded-xl p-3 relative transition-all duration-200 flex flex-col ${
                              isCurrentMonth ? `${bgClass} cursor-pointer` : 'bg-gray-50/50'
                            } hover:opacity-95`}
                            onClick={() => {
                              if (isCurrentMonth) {
                                // Set focusedDate when clicking a day in month view (for week view centering)
                                setFocusedDate(day.fullDate);
                                // If there's a booking, also open the slide panel
                                if (booking) {
                                  openSlideForDate(day.fullDate);
                                }
                              }
                            }}
                          >
                            <div className={`text-sm font-semibold mb-2 ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                              {day.date}
                            </div>

                            {booking && isCurrentMonth && (
                              <div className="mt-2 flex flex-col flex-1 space-y-0.5">
                                <div>
                                  <div className="text-xs font-semibold text-gray-900 line-clamp-1">
                                    {booking.clientFirstName || 'Guest'}
                                  </div>
                                  <div className="text-xs text-gray-700 line-clamp-1">
                                    {formatStayRange(booking.checkInDate, booking.checkOutDate)}
                                  </div>
                                  <div className="text-xs text-gray-600 line-clamp-1">
                                    {formatCheckInTime(booking.checkInDateString, booking.checkInDate)}
                                  </div>
                                </div>
                                {/* Don't show price for booked days - day is not sellable */}
                              </div>
                            )}
                            {!booking && isCurrentMonth && listing && ((listing as any).base_price || listing.price) && (
                              <div className="mt-auto text-right">
                                <div className="text-xs text-black font-medium">
                                  ₱ {((listing as any).base_price || listing.price).toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Weekly view (desktop) - Time Grid Layout */}
                    {/* Scrollable week grid container */}
                    <div
                      ref={weeklyScrollRef}
                      tabIndex={0}
                      onKeyDown={handleWeeklyKeyDown}
                      className="week-grid-scroll scrollable bg-white flex-1"
                      style={{ 
                        minHeight: 0,
                        overflowY: 'auto',
                        overflowX: 'hidden',
                        scrollbarGutter: 'stable',
                        overscrollBehavior: 'contain'
                      }}
                      aria-label="Weekly schedule"
                    >
                        <div
                          ref={calendarGridRef}
                          className="calendar-grid bg-white"
                          style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '60px repeat(7, minmax(120px, 1fr))', 
                            gap: 0,
                            minWidth: '900px',
                            minHeight: `${24 * HOUR_ROW_PX}px`, // Ensure content is tall enough (24 hours * 48px)
                            backgroundColor: '#FFFFFF'
                          }}
                        >
                          {/* Empty corner cell for alignment - sticky at top-left */}
                          <div 
                            className="bg-white" 
                            style={{ 
                              height: '60px', 
                              borderRight: '1px solid #E5E7EB', 
                              borderBottom: '1px solid #E5E7EB',
                              position: 'sticky',
                              top: 0,
                              left: 0,
                              zIndex: 20,
                              backgroundColor: '#FFFFFF'
                            }} 
                          />

                          {/* Day headers - sticky at top while scrolling */}
                          {getCenteredWeekDays(focusedDate).map((day, idx) => {
                            const isLastHeader = idx === 6; // 7-day view
                            const isToday = day.toDateString() === new Date().toDateString();
                            const isInSelectedMonth = day.getMonth() === currentDate.getMonth() && day.getFullYear() === currentDate.getFullYear();

                            return (
                              <div
                                key={idx}
                                data-day-header-index={idx}
                                data-day-date={day.toDateString()}
                                className="text-center bg-white flex flex-col items-center justify-center"
                                onClick={() => handleHeaderClick(day)}
                                role="button"
                                style={{ 
                                  cursor: 'pointer', 
                                  height: '60px',
                                  borderRight: isLastHeader ? 'none' : '1px solid #E5E7EB',
                                  borderBottom: '1px solid #E5E7EB',
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 10,
                                  backgroundColor: '#FFFFFF'
                                }}
                              >
                                <div className="text-xs font-medium" style={{ color: isToday ? '#0B5858' : '#6B7280' }}>
                                  {dayNames[day.getDay()]}
                                </div>
                                <div className="text-lg font-semibold mt-0.5" style={{ color: isToday ? '#0B5858' : (isInSelectedMonth ? '#111827' : '#9CA3AF') }}>
                                  {day.getDate()}
                                </div>
                              </div>
                            );
                          })}

                          {/* Time grid rows - each hour spans all day columns */}
                          {hours.map((h, hourIdx) => {
                            const weekDays = getCenteredWeekDays(focusedDate);
                            const isCurrentHour = hourIdx === now.getHours();
                            const isLastHour = hourIdx === hours.length - 1;
                            
                            return (
                              <React.Fragment key={h}>
                                {/* Time label column - sticky on left while scrolling */}
                                <div 
                                  className="bg-white text-right pr-3 flex items-center justify-end"
                                  style={{ 
                                    height: `${HOUR_ROW_PX}px`,
                                    borderRight: '1px solid #E5E7EB',
                                    borderBottom: !isLastHour ? '1px solid #E5E7EB' : 'none',
                                    fontSize: '12px',
                                    color: isCurrentHour ? '#0B5858' : '#9CA3AF',
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 10,
                                    backgroundColor: '#FFFFFF',
                                    fontWeight: isCurrentHour ? 600 : 'normal'
                                  }}
                                >
                                  {isCurrentHour && (
                                    <span className="time-dot time-dot-pulse mr-2" aria-hidden="true" />
                                  )}
                                  <span>{h}</span>
                                </div>

                                {/* Day columns for this hour */}
                                {weekDays.map((day, dayIndex) => {
                                  const currentDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                                  const isInSelectedMonth = day.getMonth() === currentDate.getMonth() && day.getFullYear() === currentDate.getFullYear();
                                  const isLastDay = dayIndex === weekDays.length - 1;
                                  const isLastHour = hourIdx === hours.length - 1;

                                  // Find bookings that should render a segment starting at this hour
                                  // Week view includes checkout day (currentDay <= endDay) unlike month view
                                  const bookingsToRender = bookings
                                    .filter(booking => {
                                      const startDay = new Date(booking.checkInDate.getFullYear(), booking.checkInDate.getMonth(), booking.checkInDate.getDate());
                                      const endDay = new Date(booking.checkOutDate.getFullYear(), booking.checkOutDate.getMonth(), booking.checkOutDate.getDate());
                                      
                                      // Week view: include checkout day (<= endDay)
                                      const isInRange = currentDay >= startDay && currentDay <= endDay;
                                      if (!isInRange) return false;
                                      
                                      const isStartDay = currentDay.getTime() === startDay.getTime();
                                      const segStart = isStartDay ? booking.startHour : 0;
                                      
                                      return hourIdx === segStart;
                                    })
                                    .sort((a, b) => {
                                      // Sort by start hour, then by booking order
                                      const aStart = currentDay.getTime() === new Date(a.checkInDate.getFullYear(), a.checkInDate.getMonth(), a.checkInDate.getDate()).getTime() 
                                        ? a.startHour : 0;
                                      const bStart = currentDay.getTime() === new Date(b.checkInDate.getFullYear(), b.checkInDate.getMonth(), b.checkInDate.getDate()).getTime()
                                        ? b.startHour : 0;
                                      return aStart - bStart;
                                    });

                                  return (
                                    <div
                                      key={`${hourIdx}-${dayIndex}`}
                                      className="relative bg-white"
                                      style={{ 
                                        height: `${HOUR_ROW_PX}px`, 
                                        minHeight: `${HOUR_ROW_PX}px`,
                                        borderRight: !isLastDay ? '1px solid #E5E7EB' : 'none',
                                        borderBottom: !isLastHour ? '1px solid #E5E7EB' : 'none',
                                        backgroundColor: !isInSelectedMonth ? '#F9FAFB' : '#FFFFFF'
                                      }}
                                    >
                                      {bookingsToRender.map((booking, bIndex) => {
                                        const startDay = new Date(booking.checkInDate.getFullYear(), booking.checkInDate.getMonth(), booking.checkInDate.getDate());
                                        const endDay = new Date(booking.checkOutDate.getFullYear(), booking.checkOutDate.getMonth(), booking.checkOutDate.getDate());
                                        const isStartDay = currentDay.getTime() === startDay.getTime();
                                        const isCheckOutDay = currentDay.getTime() === endDay.getTime();
                                        
                                        const segStart = isStartDay ? booking.startHour : 0;
                                        const segEnd = isCheckOutDay ? booking.endHour : 24;
                                        const segmentHours = segEnd - segStart;
                                        
                                        // Calculate position and height with spacing
                                        const spacing = 4; // 4px spacing between events and borders
                                        const topOffset = spacing;
                                        const blockHeight = segmentHours * HOUR_ROW_PX - (spacing * 2);

                                        // Get status color for border (apply to all segments)
                                        const statusColorMap: Record<string, string> = {
                                          'bg-booked': '#B84C4C',
                                          'bg-pending': '#F6D658',
                                          'bg-available': '#558B8B',
                                          'bg-blocked': '#4D504E'
                                        };
                                        const statusClass = getStatusBgClass(booking.status);
                                        const borderColor = statusColorMap[statusClass] || '#B84C4C';

                                        return (
                                          <div
                                            key={`${booking.bookingId || booking.title}-${dayIndex}-${bIndex}`}
                                            className={`event-block ${statusClass}`}
                                            onClick={() => openSlideForDate(day)}
                                            onMouseDown={(e) => e.preventDefault()} // Prevent focus outline on click
                                            style={{
                                              position: 'absolute',
                                              left: `${spacing}px`,
                                              right: `${spacing}px`,
                                              top: `${topOffset}px`,
                                              height: `${blockHeight}px`,
                                              zIndex: 10 + bIndex,
                                              borderRadius: '8px',
                                              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                                              padding: '6px 8px',
                                              display: 'flex',
                                              flexDirection: 'column',
                                              justifyContent: 'center',
                                              alignItems: 'flex-start',
                                              textAlign: 'left',
                                              color: '#111827',
                                              borderLeft: `3px solid ${borderColor}`, // Show accent on all segments
                                              borderTop: 'none',
                                              borderRight: 'none',
                                              borderBottom: 'none',
                                              cursor: 'pointer',
                                              transition: 'all 150ms ease',
                                              outline: 'none', // Remove default focus outline
                                            }}
                                            tabIndex={-1} // Prevent keyboard focus
                                            aria-label={`${booking.clientFirstName || 'Guest'} - ${formatStayRange(booking.checkInDate, booking.checkOutDate)}`}
                                          >
                                            {/* Show booking info on all event segments */}
                                            <div className="space-y-0.5">
                                              <div className="text-xs font-semibold text-gray-900 line-clamp-1">
                                                {booking.clientFirstName || 'Guest'}
                                              </div>
                                              <div className="text-xs text-gray-700 line-clamp-1">
                                                {formatStayRange(booking.checkInDate, booking.checkOutDate)}
                                              </div>
                                              <div className="text-xs text-gray-600 line-clamp-1">
                                                {formatCheckInTime(booking.checkInDateString, booking.checkInDate)}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}

                          {/* Current time line - aligned with today's column and moves with horizontal scroll */}
                          {(() => {
                            // scrollPosition triggers re-renders on horizontal scroll
                            void scrollPosition;
                            
                            const today = new Date();
                            const weekDays = getCenteredWeekDays(focusedDate);
                            const todayIndex = weekDays.findIndex(day => day.toDateString() === today.toDateString());
                            if (todayIndex === -1) return null;

                            const grid = calendarGridRef.current;
                            const scroller = weeklyScrollRef.current;
                            if (!grid || !scroller) return null;

                            const todayHeader = grid.querySelector(
                              `[data-day-date="${today.toDateString()}"]`
                            ) as HTMLElement | null;
                            if (!todayHeader) return null;

                            const scrollLeft = scroller.scrollLeft;
                            const todayLeft = todayHeader.offsetLeft - scrollLeft;
                            const todayWidth = todayHeader.offsetWidth;

                            return (
                              <>
                                <div
                                  className="current-line"
                                  style={{
                                    top: `${headerHeight + currentLineTop}px`,
                                    left: `${todayLeft}px`,
                                    width: `${todayWidth}px`,
                                    zIndex: 100,
                                  }}
                                  aria-hidden="true"
                                />
                                <div
                                  className="current-dot time-dot-pulse"
                                  style={{
                                    top: `${headerHeight + currentLineTop - DOT_SIZE / 2}px`,
                                    left: `${todayLeft}px`,
                                    zIndex: 101,
                                  }}
                                  aria-hidden="true"
                                />
                              </>
                            );
                          })()}
                        </div>
                      </div>
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
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold" style={{ color: '#0B5858', fontFamily: 'Poppins' }}>This Day's Lineup</div>
                <div className="text-xs mt-1 text-gray-500 uppercase tracking-wide">{selectedDate?.toDateString()}</div>
              </div>
              <button onClick={closeSlide} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close panel">
                <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedDate && getBookingsForDate(selectedDate).map((b, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transform transition-transform duration-200 hover:-translate-y-1">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0"><img src={b.mainImageUrl || '/heroimage.png'} alt={b.title} className="w-40 h-28 object-cover rounded-lg" /></div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins' }}>{b.title}</h3>
                      <p className="text-gray-600 mb-3" style={{ fontFamily: 'Poppins' }}>
                        {b.checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {b.checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-500">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/></svg>
                          <span className="text-sm" style={{ fontFamily: 'Poppins' }}>Booked for Client</span>
                        </div>
                        {b.bookingId && (
                          <div className="flex items-center text-gray-500">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd"/></svg>
                            <span className="text-sm" style={{ fontFamily: 'Poppins' }}>Transaction No. {b.bookingId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <div className="mb-3">
                        <span className="font-medium text-orange-500" style={{ fontFamily: 'Poppins' }}>
                          {b.status === 'ongoing' ? 'On-going' : b.status === 'confirmed' ? 'Confirmed' : b.status || 'Pending'}
                        </span>
                      </div>
                      <div className="mb-4">
                        <p className="text-gray-500 text-sm mb-1" style={{ fontFamily: 'Poppins' }}>Total Bill</p>
                        <p className="text-xl font-bold text-gray-800" style={{ fontFamily: 'Poppins' }}>₱ {b.totalAmount?.toLocaleString() || '0'}</p>
                      </div>
                      <button onClick={() => handleViewBooking(b)} className="bg-teal-900 text-white px-6 py-2 rounded-lg font-medium hover:opacity-95 transition-colors" style={{ fontFamily: 'Poppins' }}>View</button>
                    </div>
                  </div>
                </div>
              ))}

              {selectedDate && getBookingsForDate(selectedDate).length === 0 && <div className="text-center text-gray-500 py-10">No bookings for this date.</div>}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UnitCalendar;

