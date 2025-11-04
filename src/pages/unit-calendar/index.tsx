import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Tooltip from '../../components/Tooltip';
import { BookingService } from '../../services/bookingService';
import { ListingService } from '../../services/listingService';
import { CalendarService } from '../../services/calendarService';
import type { Listing } from '../../types/listing';
import type { Booking as BookingType } from '../../types/booking';
import type { BlockedDateRange, SpecialPricingRule } from '../../services/calendarService';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../lib/logger';
import CalendarSettingsModal from './components/CalendarSettingsModal';

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
  
  // Calendar settings state (blocked dates and special pricing)
  const [blockedRanges, setBlockedRanges] = useState<BlockedDateRange[]>([]);
  const [pricingRules, setPricingRules] = useState<SpecialPricingRule[]>([]);
  
  // Settings modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
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
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' as 'success' | 'error' });
  const toastRef = useRef<HTMLDivElement>(null);

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

  /**
   * Check if a date is blocked (from calendar settings)
   * Includes both unit-specific and global blocked dates
   */
  const [globalBlockedRanges, setGlobalBlockedRanges] = useState<BlockedDateRange[]>([]);
  
  // Load global blocked dates
  useEffect(() => {
    const loadGlobalBlockedDates = async () => {
      try {
        const globalBlocked = await CalendarService.getBlockedRanges('global');
        setGlobalBlockedRanges(globalBlocked);
        logger.info('Global blocked dates loaded', { count: globalBlocked.length });
      } catch (error) {
        logger.error('Error loading global blocked dates', { error });
        setGlobalBlockedRanges([]);
      }
    };
    
    if (id) {
      loadGlobalBlockedDates();
    }
  }, [id]);
  
  const isDateBlocked = (date: Date): boolean => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    
    // Check both unit-specific and global blocked dates
    const allBlockedRanges = [...blockedRanges, ...globalBlockedRanges];
    
    return allBlockedRanges.some(range => {
      const startDate = new Date(range.start_date);
      const endDate = new Date(range.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      return checkDate >= startDate && checkDate <= endDate;
    });
  };
  
  /**
   * Get blocked date range info for tooltip (for unit calendar)
   * Returns the range and whether it's from global calendar
   */
  const getBlockedDateInfo = (date: Date): { range: BlockedDateRange | null; isGlobal: boolean } => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    
    // Check unit-specific blocked dates first
    for (const range of blockedRanges) {
      const startDate = new Date(range.start_date);
      const endDate = new Date(range.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      if (checkDate >= startDate && checkDate <= endDate) {
        return { range, isGlobal: false };
      }
    }
    
    // Check global blocked dates
    for (const range of globalBlockedRanges) {
      const startDate = new Date(range.start_date);
      const endDate = new Date(range.end_date);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      if (checkDate >= startDate && checkDate <= endDate) {
        return { range, isGlobal: true };
      }
    }
    
    return { range: null, isGlobal: false };
  };
  
  /**
   * Get tooltip text for blocked date (for unit calendar)
   */
  const getBlockedDateTooltip = (date: Date): string => {
    const { range, isGlobal } = getBlockedDateInfo(date);
    if (!range) return '';
    
    const reason = range.reason || 'No reason provided';
    
    if (isGlobal) {
      return `${reason}\n\n(Set from global calendar)`;
    } else {
      return reason;
    }
  };

  /**
   * Get special pricing for a specific date (if any)
   */
  const getPriceForDate = (date: Date): number | null => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const checkDate = new Date(dateStr);
    checkDate.setHours(0, 0, 0, 0);
    
    // Find pricing rules that apply to this date, sorted by created_at (most recent first)
    const applicableRules = pricingRules
      .filter(pr => {
        const ruleStart = new Date(pr.start_date);
        const ruleEnd = new Date(pr.end_date);
        ruleStart.setHours(0, 0, 0, 0);
        ruleEnd.setHours(0, 0, 0, 0);
        
        return checkDate >= ruleStart && checkDate <= ruleEnd;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    // Return the price from the most recent applicable rule
    return applicableRules.length > 0 ? applicableRules[0].price : null;
  };

  /**
   * Get unique bookings for a day (grouped by booking ID to avoid duplicates)
   */
  const getUniqueBookingsForDay = (day: Date, allBookings: Booking[]): Booking[] => {
    const currentDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const seenIds = new Set<string>();
    const uniqueBookings: Booking[] = [];
    
    allBookings.forEach(booking => {
      const startDay = new Date(booking.checkInDate.getFullYear(), booking.checkInDate.getMonth(), booking.checkInDate.getDate());
      const endDay = new Date(booking.checkOutDate.getFullYear(), booking.checkOutDate.getMonth(), booking.checkOutDate.getDate());
      
      // Include if this day is within the booking range
      if (currentDay >= startDay && currentDay <= endDay) {
        const bookingKey = booking.bookingId || `${booking.checkInDate.getTime()}-${booking.checkOutDate.getTime()}`;
        if (!seenIds.has(bookingKey)) {
          seenIds.add(bookingKey);
          uniqueBookings.push(booking);
        }
      }
    });
    
    return uniqueBookings;
  };

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

  /**
   * Converts 24-hour time (HH:mm) to 12-hour format with AM/PM
   */
  const formatTime12Hour = (time24?: string | null): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours || '0', 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  };

  /**
   * Gets default check-in time from listing or falls back to hardcoded default
   */
  const getDefaultCheckInTime = (): string => {
    if (listing?.check_in_time) {
      return formatTime12Hour(listing.check_in_time);
    }
    return '2:00 PM';
  };

  /**
   * Gets default check-out time from listing or falls back to hardcoded default
   */
  const getDefaultCheckOutTime = (): string => {
    if (listing?.check_out_time) {
      return formatTime12Hour(listing.check_out_time);
    }
    return '11:00 AM';
  };

  /**
   * Gets default check-in hour (0-23) from listing or falls back to hardcoded default
   */
  const getDefaultCheckInHour = (): number => {
    if (listing?.check_in_time) {
      const [hours] = listing.check_in_time.split(':');
      return parseInt(hours || '14', 10);
    }
    return 14; // 2 PM default
  };

  /**
   * Gets default check-out hour (0-23) from listing or falls back to hardcoded default
   */
  const getDefaultCheckOutHour = (): number => {
    if (listing?.check_out_time) {
      const [hours] = listing.check_out_time.split(':');
      return parseInt(hours || '11', 10);
    }
    return 11; // 11 AM default
  };

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

  // Fetch calendar settings (blocked dates and special pricing)
  useEffect(() => {
    const fetchCalendarSettings = async () => {
      if (!id) {
        setBlockedRanges([]);
        setPricingRules([]);
        return;
      }

      try {
        logger.info('Fetching calendar settings', { listingId: id });
        
        // Fetch blocked dates and special pricing
        const [blockedData, pricingData] = await Promise.all([
          CalendarService.getBlockedRanges(id),
          CalendarService.getPricingRules(id)
        ]);
        
        setBlockedRanges(blockedData);
        setPricingRules(pricingData);
        
        logger.info('Calendar settings loaded', { 
          listingId: id, 
          blockedCount: blockedData.length, 
          pricingCount: pricingData.length 
        });
      } catch (error) {
        logger.error('Error fetching calendar settings', { error, listingId: id });
        // Set empty arrays on error
        setBlockedRanges([]);
        setPricingRules([]);
      }
    };

    fetchCalendarSettings();
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
        let fetchedBookings = await BookingService.getBookingsByListingId(id);

        logger.info('Bookings fetched successfully', { listingId: id, count: fetchedBookings.length });

        // Automatically decline overlapping pending bookings if there are confirmed bookings
        // This ensures only confirmed bookings are shown for overlapping date ranges
        const confirmedBookings = fetchedBookings.filter(b => 
          b.status === 'confirmed' || b.status === 'ongoing' || b.status === 'completed'
        );
        
        if (confirmedBookings.length > 0) {
          for (const confirmedBooking of confirmedBookings) {
            try {
              await BookingService.declineOverlappingPendingBookings(
                confirmedBooking.id,
                confirmedBooking.listing_id,
                confirmedBooking.check_in_date,
                confirmedBooking.check_out_date
              );
            } catch (error) {
              logger.error('Error declining overlapping bookings', { error, confirmedBookingId: confirmedBooking.id });
              // Continue processing even if decline fails
            }
          }
          
          // Re-fetch bookings after declining overlaps to get updated statuses
          fetchedBookings = await BookingService.getBookingsByListingId(id);
          logger.info('Re-fetched bookings after declining overlaps', { count: fetchedBookings.length });
        }

        // Convert Supabase bookings to calendar format
        const calendarBookings: Booking[] = fetchedBookings.map((booking) => {
          // Parse dates from string format
          const checkInDate = new Date(booking.check_in_date);
          const checkOutDate = new Date(booking.check_out_date);
          
          // Always use listing default times for display in booking blocks
          // This ensures consistency across all bookings for a listing
          const checkInTime = getDefaultCheckInTime();
          const checkOutTime = getDefaultCheckOutTime();
          const time = `${checkInTime} to ${checkOutTime}`;

          // Use listing title or fallback
          const title = booking.listing?.title || 'Unnamed Property';
          const mainImageUrl = booking.listing?.main_image_url;

          // Always use listing defaults for positioning on the time grid
          // This ensures all booking blocks are positioned consistently according to listing defaults
          const startHour = getDefaultCheckInHour();
          const endHour = getDefaultCheckOutHour();

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

        // Filter out overlapping bookings - prefer confirmed/ongoing/completed over pending
        // Status priority: confirmed/ongoing/completed > pending
        const filteredBookings = calendarBookings.filter((booking, index) => {
          // Keep all confirmed/ongoing/completed bookings
          if (booking.status === 'confirmed' || booking.status === 'ongoing' || booking.status === 'completed') {
            return true;
          }
          
          // For pending bookings, check if they overlap with any confirmed booking
          const overlapsWithConfirmed = calendarBookings.some((otherBooking, otherIndex) => {
            if (index === otherIndex) return false;
            if (otherBooking.status !== 'confirmed' && otherBooking.status !== 'ongoing' && otherBooking.status !== 'completed') {
              return false; // Only check against confirmed bookings
            }
            
            // Check date overlap (normalize to date only, ignore time)
            const normalizeDate = (date: Date) => {
              const d = new Date(date);
              d.setHours(0, 0, 0, 0);
              return d;
            };
            
            const checkIn1 = normalizeDate(booking.checkInDate);
            const checkOut1 = normalizeDate(booking.checkOutDate);
            const checkIn2 = normalizeDate(otherBooking.checkInDate);
            const checkOut2 = normalizeDate(otherBooking.checkOutDate);
            
            // Check if dates overlap: start1 < end2 AND end1 > start2
            return checkIn1 < checkOut2 && checkOut1 > checkIn2;
          });
          
          // If pending booking overlaps with confirmed, filter it out
          return !overlapsWithConfirmed;
        });

        // Also filter out overlapping confirmed bookings - keep the first one (by check-in date)
        const finalBookings: Booking[] = [];
        
        filteredBookings
          .sort((a, b) => {
            // Sort by status priority first (confirmed before pending), then by check-in date
            const statusPriority = (status?: string) => {
              if (status === 'confirmed' || status === 'ongoing' || status === 'completed') return 0;
              if (status === 'pending') return 1;
              return 2;
            };
            
            const priorityDiff = statusPriority(a.status) - statusPriority(b.status);
            if (priorityDiff !== 0) return priorityDiff;
            
            return a.checkInDate.getTime() - b.checkInDate.getTime();
          })
          .forEach(booking => {
            // Create a unique key for the date range
            const normalizeDate = (date: Date) => {
              const d = new Date(date);
              d.setHours(0, 0, 0, 0);
              return d.toISOString().split('T')[0];
            };
            
            const rangeKey = `${normalizeDate(booking.checkInDate)}-${normalizeDate(booking.checkOutDate)}`;
            
            // Check if this booking overlaps with any already added booking
            const overlapsWithAdded = finalBookings.some(addedBooking => {
              const checkIn1 = normalizeDate(booking.checkInDate);
              const checkOut1 = normalizeDate(booking.checkOutDate);
              const checkIn2 = normalizeDate(addedBooking.checkInDate);
              const checkOut2 = normalizeDate(addedBooking.checkOutDate);
              
              // Check if dates overlap: start1 < end2 AND end1 > start2
              return checkIn1 < checkOut2 && checkOut1 > checkIn2;
            });
            
            if (!overlapsWithAdded) {
              finalBookings.push(booking);
            } else {
              logger.info('Filtered out overlapping booking', { 
                bookingId: booking.bookingId, 
                status: booking.status,
                dateRange: rangeKey 
              });
            }
          });

        setBookings(finalBookings);
        logger.info('Bookings filtered for overlaps', { 
          originalCount: calendarBookings.length, 
          filteredCount: finalBookings.length 
        });
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
      
      // Refresh bookings list
      const fetchBookings = async () => {
        if (!user || !id) {
          setBookings([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          let fetchedBookings = await BookingService.getBookingsByListingId(id!);
          
          // Convert Supabase bookings to calendar format
          const calendarBookings: Booking[] = fetchedBookings.map((b) => {
            const checkInDate = new Date(b.check_in_date);
            const checkOutDate = new Date(b.check_out_date);
            
            // Always use listing defaults for positioning and display
            const startHour = getDefaultCheckInHour();
            const endHour = getDefaultCheckOutHour();
            const time = `${getDefaultCheckInTime()} to ${getDefaultCheckOutTime()}`;
            
            return {
              date: checkInDate,
              checkInDate,
              checkOutDate,
              checkInDateString: b.check_in_date,
              checkOutDateString: b.check_out_date,
              title: b.listing?.title || 'Unknown Unit',
              time,
              startHour,
              endHour,
              bookingId: b.id,
              status: b.status,
              totalAmount: b.total_amount,
              mainImageUrl: b.listing?.main_image_url,
              clientFirstName: b.client?.first_name
            };
          });

          setBookings(calendarBookings);
        } catch (error) {
          logger.error('Error refreshing bookings after approve', { error });
          console.error('Error refreshing bookings:', error);
        } finally {
          setLoading(false);
        }
      };
      
      await fetchBookings();
      
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
      
      // Refresh bookings list
      const fetchBookings = async () => {
        if (!user || !id) {
          setBookings([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);
          let fetchedBookings = await BookingService.getBookingsByListingId(id!);
          
          // Convert Supabase bookings to calendar format
          const calendarBookings: Booking[] = fetchedBookings.map((b) => {
            const checkInDate = new Date(b.check_in_date);
            const checkOutDate = new Date(b.check_out_date);
            
            // Always use listing defaults for positioning and display
            const startHour = getDefaultCheckInHour();
            const endHour = getDefaultCheckOutHour();
            const time = `${getDefaultCheckInTime()} to ${getDefaultCheckOutTime()}`;
            
            return {
              date: checkInDate,
              checkInDate,
              checkOutDate,
              checkInDateString: b.check_in_date,
              checkOutDateString: b.check_out_date,
              title: b.listing?.title || 'Unknown Unit',
              time,
              startHour,
              endHour,
              bookingId: b.id,
              status: b.status,
              totalAmount: b.total_amount,
              mainImageUrl: b.listing?.main_image_url,
              clientFirstName: b.client?.first_name
            };
          });

          setBookings(calendarBookings);
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

  // navigate to booking details page (for slide panel "View" button - kept for backward compatibility)
  const handleViewBooking = (booking: Booking) => {
    if (!booking.bookingId) return;
    handleTimelineBookingClick(booking);
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
      const isEndDay = dayOnly.getTime() === endDay.getTime();
      const segStart = isStartDay ? b.startHour : 0;
      // On checkout day, extend only to checkout time; otherwise extend to end of day
      const segEnd = isEndDay ? b.endHour : 24;
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
                    
                    // Status color mapping for left border (darker solid colors)
                    const statusColorMap: Record<string, string> = {
                      'bg-booked': '#B84C4C',
                      'bg-pending': '#F6D658',
                      'bg-available': '#558B8B',
                      'bg-blocked': '#4D504E'
                    };
                    const statusClass = getStatusBgClass(b.status);
                    const borderColor = statusColorMap[statusClass] || '#B84C4C';
                    
                    // Format date range for display
                    const checkInFormatted = b.checkInDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric'
                    });
                    const checkOutFormatted = b.checkOutDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric'
                    });
                    const dateRange = checkInFormatted === checkOutFormatted 
                      ? checkInFormatted 
                      : `${checkInFormatted} - ${checkOutFormatted}`;
                    
                    return (
                      <button
                        key={`${b.title}-${i}`}
                        onClick={() => handleTimelineBookingClick(b)}
                        className={`absolute left-2 right-2 ${statusClass} rounded-md p-3 text-left shadow cursor-pointer hover:shadow-md transition-shadow`}
                        style={{ 
                          top: 8, 
                          height: span * HOUR_ROW_PX - 16, 
                          zIndex: 10,
                          borderLeft: `4px solid ${borderColor}`, // Status-colored left border
                          fontFamily: 'Poppins'
                        }}
                        aria-label={`${b.title} ${b.time}`}
                      >
                        {/* Guest name - black, increased font weight */}
                        <div className="font-bold text-sm text-black" style={{ fontFamily: 'Poppins' }}>
                          {b.clientFirstName || 'Guest'}
                        </div>
                        {/* Date range - grey */}
                        <div className="text-xs text-gray-600 mt-0.5" style={{ fontFamily: 'Poppins' }}>
                          {dateRange}
                        </div>
                        {/* Time - grey - shows listing default check-in and check-out times */}
                        <div className="text-xs text-gray-600 mt-0.5" style={{ fontFamily: 'Poppins' }}>
                          {b.time}
                        </div>
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
            const isBlocked = isDateBlocked(dayObj.fullDate);
            const specialPrice = getPriceForDate(dayObj.fullDate);
            const blockedTooltip = isBlocked ? getBlockedDateTooltip(dayObj.fullDate) : '';
            const dayButton = (
              <button
                key={idx}
                onClick={() => {
                  if (!isBlocked) {
                    onDayPress(dayObj.fullDate);
                    setMobileViewMode('daily');
                  }
                }}
                className={`day-button p-2 rounded-md text-left ${dayObj.isCurrentMonth ? 'bg-white' : 'bg-gray-50'} ${isBlocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                aria-label={`Day ${dayObj.date}${dayObj.isToday ? ' today' : ''}${isBlocked ? ' blocked' : ''}`}
                disabled={isBlocked}
              >
                <div className="flex items-center justify-between">
                  <div className={`date-number ${b ? 'has-booking' : ''} text-xs font-medium`}>{dayObj.date}</div>
                  <div className="flex items-center gap-1">
                    {dayObj.isToday && <div className="text-xs text-green-600">•</div>}
                  </div>
                </div>

                {/* booking indicator: colored dot + small guest name preview to match unit calendar spec */}
                <div className="mt-1 flex items-center gap-2">
                  {b && <span className={`${getStatusBgClass(b.status)} inline-block rounded-full`} style={{ width: 8, height: 8 }} aria-hidden="true" />}
                  {b && <div className="text-xs text-gray-600 truncate">• {(b.clientFirstName || 'Guest')}</div>}
                  {!b && listing && (
                    <div className="text-xs text-black font-medium truncate">
                      {specialPrice ? (
                        `₱ ${specialPrice.toLocaleString()}`
                      ) : ((listing as any).base_price || listing.price) ? (
                        `₱ ${((listing as any).base_price || listing.price).toLocaleString()}`
                      ) : null}
                    </div>
                  )}
                </div>
              </button>
            );
            
            return blockedTooltip ? (
              <Tooltip key={idx} content={blockedTooltip}>
                {dayButton}
              </Tooltip>
            ) : dayButton;
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

              {/* Settings button */}
              <button
                onClick={() => {
                  logger.info('Opening calendar settings modal');
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
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden relative flex flex-col">
            {/* Show loading skeleton */}
            {loading ? (
              <div className="p-6 animate-pulse">
                {/* Header with month/year and controls */}
                <div className="flex items-center justify-between mb-6">
                  <div className="h-8 bg-gray-300 rounded w-48"></div>
                  <div className="flex gap-2">
                    <div className="h-10 w-10 bg-gray-300 rounded"></div>
                    <div className="h-10 w-10 bg-gray-300 rounded"></div>
                  </div>
                </div>
                {/* Day names */}
                <div className="grid grid-cols-7 gap-3 mb-3">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-3">
                  {Array.from({ length: 35 }).map((_, i) => (
                    <div key={i} className="min-h-[140px] rounded-xl bg-gray-100 p-3">
                      <div className="h-5 bg-gray-300 rounded w-8 mb-2"></div>
                      <div className="space-y-2">
                        <div className="h-6 bg-gray-300 rounded"></div>
                        <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Mobile view takes precedence when isMobile */}
                {isMobile ? (
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
                ) : (
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
                        const isBlocked = isDateBlocked(day.fullDate);
                        const specialPrice = getPriceForDate(day.fullDate);

                        // Blocked dates override booking status
                        const bgClass = isBlocked 
                          ? 'bg-blocked' 
                          : booking 
                            ? getStatusBgClass(booking.status) 
                            : 'bg-available';
                        const blockedTooltip = isBlocked ? getBlockedDateTooltip(day.fullDate) : '';
                        
                        const dayCard = (
                          <div 
                            key={index} 
                            className={`min-h-[140px] rounded-xl p-3 relative transition-all duration-200 flex flex-col ${
                              isCurrentMonth ? `${bgClass} cursor-pointer` : 'bg-gray-50/50'
                            } hover:opacity-95`}
                            onClick={() => {
                              if (isCurrentMonth && !isBlocked) {
                                // Set focusedDate when clicking a day in month view (for week view centering)
                                setFocusedDate(day.fullDate);
                                // If there's a booking, open the drawer with booking details
                                if (booking) {
                                  handleTimelineBookingClick(booking);
                                }
                              }
                            }}
                          >
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-sm font-semibold ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                    {day.date}
                  </div>
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
                                    {getDefaultCheckInTime()} check-in
                                  </div>
                                </div>
                                {/* Don't show price for booked days - day is not sellable */}
                              </div>
                            )}
                            {!booking && isCurrentMonth && listing && (
                              <div className="mt-auto text-right">
                                {specialPrice ? (
                                  <div className="text-xs text-black font-medium">
                                    ₱ {specialPrice.toLocaleString()}
                                  </div>
                                ) : ((listing as any).base_price || listing.price) ? (
                                  <div className="text-xs text-black font-medium">
                                    ₱ {((listing as any).base_price || listing.price).toLocaleString()}
                                  </div>
                                ) : null}
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

                                {/* Day columns for this hour - with full-height booking blocks */}
                                {weekDays.map((day, dayIndex) => {
                                  const isInSelectedMonth = day.getMonth() === currentDate.getMonth() && day.getFullYear() === currentDate.getFullYear();
                                  const isLastDay = dayIndex === weekDays.length - 1;
                                  const isLastHour = hourIdx === hours.length - 1;

                                  // Get all bookings for this day (including multi-day bookings)
                                  const dayBookings = getUniqueBookingsForDay(day, bookings);
                                  
                                  // Map bookings by their start hour for this day
                                  const startsByHour = new Map<number, Array<{ booking: Booking; segStart: number; segEnd: number }>>();
                                  dayBookings.forEach(booking => {
                                    const dayOnly = new Date(day.getFullYear(), day.getMonth(), day.getDate());
                                    const startDay = new Date(booking.checkInDate.getFullYear(), booking.checkInDate.getMonth(), booking.checkInDate.getDate());
                                    const endDay = new Date(booking.checkOutDate.getFullYear(), booking.checkOutDate.getMonth(), booking.checkOutDate.getDate());
                                    
                                    // Check if booking overlaps with this day (include checkout day)
                                    if (!(dayOnly >= startDay && dayOnly <= endDay)) return;
                                    
                                    const isStartDay = dayOnly.getTime() === startDay.getTime();
                                    const isEndDay = dayOnly.getTime() === endDay.getTime();
                                    const segStart = isStartDay ? booking.startHour : 0;
                                    // On checkout day, extend only to checkout time; otherwise extend to end of day
                                    const segEnd = isEndDay ? booking.endHour : 24;
                                    
                                    const arr = startsByHour.get(segStart) || [];
                                    arr.push({ booking, segStart, segEnd });
                                    startsByHour.set(segStart, arr);
                                  });

                                  // Get bookings that start at this hour
                                  const starts = startsByHour.get(hourIdx) || [];

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
                                      {/* Full-height booking blocks - positioned absolutely based on start/end times */}
                                      {starts.map(({ booking, segStart, segEnd }, i) => {
                                        const span = Math.max(1, segEnd - segStart);
                                        
                                        // Status color mapping for left border (darker solid colors)
                                        const statusColorMap: Record<string, string> = {
                                          'bg-booked': '#B84C4C',
                                          'bg-pending': '#F6D658',
                                          'bg-available': '#558B8B',
                                          'bg-blocked': '#4D504E'
                                        };
                                        const statusClass = getStatusBgClass(booking.status);
                                        const borderColor = statusColorMap[statusClass] || '#B84C4C';
                                        
                                        // Format date range for display
                                        const checkInFormatted = booking.checkInDate.toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric'
                                        });
                                        const checkOutFormatted = booking.checkOutDate.toLocaleDateString('en-US', { 
                                          month: 'short', 
                                          day: 'numeric'
                                        });
                                        const dateRange = checkInFormatted === checkOutFormatted 
                                          ? checkInFormatted 
                                          : `${checkInFormatted} - ${checkOutFormatted}`;
                                        
                                        return (
                                          <button
                                            key={`${booking.bookingId || booking.title}-${hourIdx}-${dayIndex}-${i}`}
                                            onClick={() => handleTimelineBookingClick(booking)}
                                            className={`absolute left-2 right-2 ${statusClass} rounded-md p-3 text-left shadow cursor-pointer hover:shadow-md transition-shadow`}
                                            style={{ 
                                              top: 8, 
                                              height: span * HOUR_ROW_PX - 16, 
                                              zIndex: 10,
                                              borderLeft: `4px solid ${borderColor}`, // Status-colored left border
                                              fontFamily: 'Poppins'
                                            }}
                                            aria-label={`${booking.title} ${booking.time}`}
                                          >
                                            {/* Guest name - black, increased font weight */}
                                            <div className="font-bold text-sm text-black" style={{ fontFamily: 'Poppins' }}>
                                              {booking.clientFirstName || 'Guest'}
                                            </div>
                                            {/* Date range - grey */}
                                            <div className="text-xs text-gray-600 mt-0.5" style={{ fontFamily: 'Poppins' }}>
                                              {dateRange}
                                            </div>
                                            {/* Time - grey - shows listing default check-in and check-out times */}
                                            <div className="text-xs text-gray-600 mt-0.5" style={{ fontFamily: 'Poppins' }}>
                                              {booking.time}
                                            </div>
                                          </button>
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
            </>
            )}
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
          <div className={`fixed inset-y-0 right-0 w-full sm:w-[640px] bg-white shadow-xl z-50 flex flex-col ${isDrawerClosing ? 'animate-slide-out' : 'animate-slide-in'}`}>
            {/* Drawer Header */}
            <div className="px-6 py-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>
                  Booking Details
                </h2>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 cursor-pointer"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Booking Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>Status:</span>
                  <span className="text-base font-semibold text-gray-900" style={{ fontFamily: 'Poppins' }}>
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
                {selectedBooking.status === 'pending' && (
                  <button
                    onClick={() => {
                      if (selectedBooking) {
                        navigate(`/booking-details/${selectedBooking.id}`);
                      }
                    }}
                    className="text-sm font-semibold transition-all duration-200 cursor-pointer hover:scale-105 active:scale-100 relative group"
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
            {/* Divider */}
            <div className="border-b border-gray-200"></div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6">
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
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-900 mb-3" style={{ fontFamily: 'Poppins' }}>
                    Special Request
                  </h3>
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <p className="text-xs leading-relaxed text-gray-700" style={{ fontFamily: 'Poppins' }}>
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
            <div className="px-6 py-5 border-t border-gray-200 flex gap-3">
              <button
                onClick={closeDrawer}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                style={{ fontFamily: 'Poppins' }}
              >
                Close
              </button>
              {selectedBooking.status === 'pending' && (
                <>
                  <button
                    onClick={() => selectedBooking && openConfirmModal(selectedBooking)}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
                    style={{ fontFamily: 'Poppins', backgroundColor: '#B84C4C' }}
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => selectedBooking && handleApprove(selectedBooking)}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
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
                  className="flex-1 px-6 py-3 text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer font-medium"
                  style={{ fontFamily: 'Poppins', backgroundColor: '#0B5858' }}
                >
                  View Full Details
                </button>
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

      {/* Calendar Settings Modal */}
      <CalendarSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        unitId={id}
      />
    </div>
  );
};

export default UnitCalendar;

