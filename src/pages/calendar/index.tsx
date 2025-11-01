import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { BookingService } from '../../services/bookingService';
import { useAuth } from '../../contexts/AuthContext';
import type { Booking as BookingType } from '../../types/booking';
import { logger } from '../../lib/logger';

type Booking = {
  date: Date;
  checkInDate: Date;
  checkOutDate: Date;
  title: string;
  time: string;
  startHour: number;
  endHour: number;
  bookingId?: string;
  status?: string;
  totalAmount?: number;
  mainImageUrl?: string;
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
  const [now, setNow] = useState<Date>(() => new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // focusedDate is the "selected" date used to determine which 7-day window to show and centering
  const [focusedDate, setFocusedDate] = useState<Date>(() => new Date()); // defaults to today

  // header height measurement (used to correctly position the current-time line)
  const [headerHeight, setHeaderHeight] = useState<number>(0);

  // current line left/top coordinates (so the line doesn't overlap the left time column)
  const [currentLineLeft, setCurrentLineLeft] = useState<number | null>(null);
  const [currentDotLeft, setCurrentDotLeft] = useState<number | null>(null);

  // refs
  const weeklyScrollRef = useRef<HTMLDivElement | null>(null); // scroll container for entire calendar grid
  const calendarGridRef = useRef<HTMLDivElement | null>(null); // the grid element inside scroll container

  // new: animation flags
  const [headerAnimating, setHeaderAnimating] = useState(false);
  const headerAnimTimer = useRef<number | null>(null);
  
  // Track if we've already fetched bookings to avoid refetching on focus
  const hasFetchedBookings = useRef(false);

  // constants
  const HOUR_ROW_PX = 48; // tailwind h-12 equivalent
  const TIME_COL_PX = 80; // width of the left time column in the grid (desktop)
  const DOT_SIZE = 12;

  // Mobile detection & mobile view mode
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [mobileViewMode, setMobileViewMode] = useState<'monthly' | 'daily'>('monthly');

  // Touch swipe for mobile day navigation
  const touchStartX = useRef<number | null>(null);

  const monthNames = [
    'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
    'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'
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

  // Returns hour (0-23) for a date in a specific timezone
  const getHourInTimeZone = (date: Date, timeZone: string): number => {
    const parts = new Intl.DateTimeFormat('en-US', { hour: '2-digit', hour12: false, timeZone }).formatToParts(date);
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

  const getBookingForDate = (date: Date) => bookings.find(b => b.date.toDateString() === date.toDateString());
  const getBookingsForDate = (date: Date) => bookings.filter(b => b.date.toDateString() === date.toDateString());

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

        // Filter upcoming bookings only (check-in date is today or in the future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingBookings = fetchedBookings.filter((booking) => {
          const checkInDate = new Date(booking.check_in_date);
          checkInDate.setHours(0, 0, 0, 0);
          return checkInDate >= today;
        });

        // Convert Supabase bookings to calendar format
        const calendarBookings: Booking[] = upcomingBookings.map((booking) => {
          // Parse dates from string format
          const checkInDate = new Date(booking.check_in_date);
          const checkOutDate = new Date(booking.check_out_date);
          
          // no-op: previous local formatter removed in favor of fixed timezone formatter

          const checkInTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }).format(checkInDate);
          const checkOutTime = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }).format(checkOutDate);
          const time = `${checkInTime} - ${checkOutTime}`;

          // Use listing title or fallback
          const title = booking.listing?.title || 'Unnamed Property';
          const mainImageUrl = booking.listing?.main_image_url;

          // Calculate end hour - default to 2 PM check-in and 12 PM check-out if no time info
          const hasTime = booking.check_in_date.includes('T') && booking.check_in_date.includes(':');
          const startHour = hasTime ? getHourInTimeZone(checkInDate, 'Asia/Manila') : 14; // 2 PM default
          const endHour = hasTime ? getHourInTimeZone(checkOutDate, 'Asia/Manila') : 12; // 12 PM default

          return {
            date: checkInDate,
            checkInDate,
            checkOutDate,
            title,
            time,
            startHour,
            endHour,
            bookingId: booking.id,
            status: booking.status,
            totalAmount: booking.total_amount,
            mainImageUrl
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

  // measure header height whenever grid renders or focus/month changes so the current-time line doesn't overlap the header
  useEffect(() => {
    if (!calendarGridRef.current) return;
    const headerEl = calendarGridRef.current.querySelector('.time-header') as HTMLElement | null;
    setHeaderHeight(headerEl ? headerEl.offsetHeight : 0);
  }, [focusedDate, currentDate, viewMode, isMobile, mobileViewMode]);

  // compute current-line left coordinate and dot coordinate for desktop weekly
  useEffect(() => {
    let mounted = true;
    const compute = () => {
      const grid = calendarGridRef.current;
      const scroller = weeklyScrollRef.current;
      if (!grid || !scroller) {
        if (mounted) {
          setCurrentLineLeft(null);
          setCurrentDotLeft(null);
        }
        return;
      }

      const today = new Date();
      // ONLY show when the focused date is exactly today and we're in weekly view (desktop)
      if (isMobile || viewMode !== 'weekly' || focusedDate.toDateString() !== today.toDateString()) {
        if (mounted) {
          setCurrentLineLeft(null);
          setCurrentDotLeft(null);
        }
        return;
      }

      requestAnimationFrame(() => {
        window.setTimeout(() => {
          // place the line just to the right of the time column and the dot flushed to the line:
          const lineLeft = TIME_COL_PX + 8;
          const dotLeft = lineLeft;         

          if (mounted) {
            setCurrentLineLeft(lineLeft);
            setCurrentDotLeft(dotLeft);
          }
        }, 60);
      });
    };

    compute();

    const scrollerEl = weeklyScrollRef.current;
    const onScroll = () => compute();
    const onResize = () => compute();

    if (scrollerEl) scrollerEl.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    return () => {
      mounted = false;
      if (scrollerEl) scrollerEl.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, [focusedDate, currentDate, viewMode, now, isMobile]);

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

  //dummy info for booking details
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
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
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
    // map bookings by startHour
    const startsByHour = new Map<number, Booking[]>();
    bookingsForDay.forEach(b => {
      const arr = startsByHour.get(b.startHour) || [];
      arr.push(b);
      startsByHour.set(b.startHour, arr);
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
                  {starts.map((b, i) => {
                    const span = Math.max(1, b.endHour - b.startHour);
                    return (
                      <button
                        key={`${b.title}-${i}`}
                        onClick={() => openSlideForDate(date)}
                        className={`absolute left-2 right-2 ${getStatusBgClass(b.status)} text-white rounded-md p-2 text-left shadow`}
                        style={{ top: 4, height: span * HOUR_ROW_PX - 8, zIndex: 10 }}
                        aria-label={`${b.title} ${b.time}`}
                      >
                        <div className="font-semibold text-sm">{b.title}</div>
                        <div className="text-xs opacity-90">{b.time}</div>
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

                {/* booking indicator: colored dot + small title preview when space allows */}
                <div className="mt-1 flex items-center gap-2">
                  {b && <span className={`${getStatusBgClass(b.status)} inline-block rounded-full`} style={{ width: 8, height: 8 }} aria-hidden="true" />}
                  {b && <div className="text-xs text-gray-600 truncate">• {b.title}</div>}
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
      `}</style>

      <div className={hideNavbar ? "pt-4" : "pt-16"}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* header + controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigateMonth('prev')} className="p-2 hover-soft-teal rounded-full transition-colors" aria-label="Prev month">
                <svg className="w-7 h-7 text-[#0B5858]" fill="none" viewBox="0 0 24 24"><path stroke="#0B5858" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>

              <h1 className={`text-2xl font-bold text-black uppercase ${headerAnimating ? 'header-pop-enter' : ''}`} style={{ fontFamily: 'Poppins' }}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h1>

              <button onClick={() => navigateMonth('next')} className="p-2 hover-soft-teal rounded-full transition-colors" aria-label="Next month">
                <svg className="w-7 h-7 text-[#0B5858]" fill="none" viewBox="0 0 24 24"><path stroke="#0B5858" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isMobile && (
                <div className="flex gap-2 items-center mr-2">
                  <button onClick={() => setMobileViewMode('monthly')} className={`px-3 py-1 rounded ${mobileViewMode === 'monthly' ? 'bg-gray-200 font-semibold' : 'bg-white'}`}>Month</button>
                  <button onClick={() => setMobileViewMode('daily')} className={`px-3 py-1 rounded ${mobileViewMode === 'daily' ? 'bg-gray-200 font-semibold' : 'bg-white'}`}>Day</button>
                </div>
              )}

              {/* View toggle button group for desktop */}
              {!isMobile && (
                <div className="flex gap-1 items-center bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setViewMode('monthly')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
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
                      setViewMode('weekly');
                      if (!focusedDate) setFocusedDate(new Date());
                    }}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
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

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden relative">
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
                  <MobileDay date={focusedDate} bookingsForDay={getBookingsForDate(focusedDate)} />
                </div>
              )
            ) : !loading && (
              // Desktop: existing monthly / weekly experience
              <>
                {viewMode === 'monthly' ? (
                  <div className="p-6">
                    <div className="grid grid-cols-7 gap-3 mb-3">
                      {dayNames.map((d) => (
                        <div key={d} className="text-center text-sm font-medium text-gray-700 uppercase tracking-wide">{d}</div>
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
                            className={`min-h-[140px] rounded-xl p-3 relative transition-all duration-200 ${
                              isCurrentMonth ? `${bgClass} ${booking ? 'cursor-pointer' : ''}` : 'bg-gray-50/50'
                            } hover:opacity-95`}
                            onClick={() => booking && isCurrentMonth && openSlideForDate(day.fullDate)}
                          >
                            <div className={`text-sm font-semibold mb-2 ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                              {day.date}
                            </div>

                            {booking && isCurrentMonth && (
                              <div className="mt-2 space-y-1">
                                <div className="text-xs font-medium text-gray-900 line-clamp-2">
                                  {booking.title}
                                </div>
                                <div className="text-xs text-gray-600">
                                  {booking.time}
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
                    {/* Weekly view (desktop) */}
                    <div className="relative p-6">
                      <div
                        ref={weeklyScrollRef}
                        tabIndex={0}
                        onKeyDown={handleWeeklyKeyDown}
                        className="scrollable overflow-auto max-h-[600px] min-w-[780px]"
                        aria-label="Weekly schedule"
                      >
                        <div
                          ref={calendarGridRef}
                          className="calendar-grid"
                          style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, minmax(0, 1fr))', gap: '12px' }}
                        >
                          {/* Header row */}
                          <div className="time-header p-4 text-center text-sm font-medium text-gray-900" aria-hidden="true" style={{ background: 'transparent' }} />

                          {/* day headers (7-day window centered on focusedDate). clicking a header centers that date */}
                          {getCenteredWeekDays(focusedDate).map((day, idx) => {
                            const isFocused = focusedDate && day.toDateString() === focusedDate.toDateString();
                            const isToday = day.toDateString() === new Date().toDateString();
                            const isInSelectedMonth = day.getMonth() === currentDate.getMonth() && day.getFullYear() === currentDate.getFullYear();

                            return (
                              <div
                                key={idx}
                                data-day-header-index={idx}
                                data-day-date={day.toDateString()}
                                className={`day-header p-4 rounded-t-xl bg-gray-50 text-center text-sm font-medium ${
                                  isFocused ? 'bg-blue-100' : ''
                                }`}
                                onClick={() => handleHeaderClick(day)}
                                role="button"
                                style={{ cursor: 'pointer' }}
                              >
                                <div className={isToday ? 'text-sm font-medium text-green-600' : (isInSelectedMonth ? 'text-sm font-medium text-gray-900' : 'text-sm font-medium muted')}>
                                  {dayNames[day.getDay()]}
                                </div>
                                <div className={`text-lg font-bold mt-1 ${isFocused ? 'text-green-700' : (isInSelectedMonth ? 'text-gray-900' : 'muted')}`}>{day.getDate()}</div>
                              </div>
                            );
                          })}

                          {/* Hour rows + day columns */}
                          {hours.map((h) => {
                            const hourIdx = hours.indexOf(h);
                            return (
                              <React.Fragment key={h}>
                                <div className={`hour-row ${hourIdx === now.getHours() ? 'bg-white' : 'bg-transparent'}`}>
                                  <span className={hourIdx === now.getHours() ? 'time-label time-label-current' : 'time-label'}>{h}</span>
                                  {hourIdx === now.getHours() && <span className="time-dot time-dot-pulse" aria-hidden="true" />}
                                </div>

                                {getCenteredWeekDays(focusedDate).map((day, dayIndex) => {
                                  const bookingsForDay = getBookingsForDate(day);
                                  const isBooked = bookingsForDay.some(b => hourIdx >= b.startHour && hourIdx < b.endHour);
                                  const isInSelectedMonth = day.getMonth() === currentDate.getMonth() && day.getFullYear() === currentDate.getFullYear();

                                  // only mute empty day columns that are out-of-month; keep booked blocks visible
                                  const mutedEmpty = !isBooked && !isInSelectedMonth;

                                  const sortedBookings = bookingsForDay.slice().sort((a, b) => {
                                    if (a.startHour !== b.startHour) return a.startHour - b.startHour;
                                    return a.endHour - b.endHour;
                                  });

                                  return (
                                    <div
                                      key={`${hourIdx}-${dayIndex}`}
                                      className={`col-cell ${isBooked ? '' : 'bg-available'} ${mutedEmpty ? 'muted' : ''}`}
                                      style={{ minHeight: `${HOUR_ROW_PX}px` }}
                                    >
                                      {sortedBookings.map((booking, bIndex) => {
                                        const isStart = booking.startHour === hourIdx;
                                        if (!isStart) return null;

                                        const leftOffset = 8 + bIndex * 6;
                                        const rightInset = 8 + bIndex * 6;
                                        const blockHeight = Math.max(0, (booking.endHour - booking.startHour) * HOUR_ROW_PX - 8);
                                        const zIndex = 6 + bIndex;

                                        return (
                                          <div
                                            key={`${booking.title}-${bIndex}`}
                                            className={`booking-block ${getStatusBgClass(booking.status)}`}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => openSlideForDate(day)}
                                            style={{
                                              top: 4,
                                              left: `${leftOffset}px`,
                                              right: `${rightInset}px`,
                                              height: `${blockHeight}px`,
                                              zIndex,
                                            }}
                                            aria-label={`${booking.title} ${booking.time}`}
                                          >
                                            <div className="bb-title">• {booking.title}</div>
                                            <div className="bb-time">{booking.time}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}

                          {/* Current time line (only when position computed) */}
                          {currentLineLeft !== null && currentDotLeft !== null && (
                            <>
                              {/* horizontal line */}
                              <div className="current-line" style={{ top: `${headerHeight + currentLineTop}px`, left: `${currentLineLeft}px`, right: 0 }} aria-hidden="true" />
                              {/* animated dot centered on the line (flushed to it) */}
                              <div className="current-dot time-dot-pulse" style={{ top: `${headerHeight + currentLineTop - DOT_SIZE / 2}px`, left: `${currentDotLeft}px` }} aria-hidden="true" />
                            </>
                          )}
                        </div>
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
                <div className="text-xl font-semibold" style={{ color: '#0B5858', fontFamily: 'Poppins' }}>This Day’s Lineup</div>
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

export default Calendar;