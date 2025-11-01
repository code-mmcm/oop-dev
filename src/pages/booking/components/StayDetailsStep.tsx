import React, { useEffect, useMemo, useState } from 'react';
import type { BookingFormData, BookingAvailability } from '../../../types/booking';
import { BookingService } from '../../../services/bookingService';

interface StayDetailsStepProps {
  formData: BookingFormData;
  listingId?: string;
  onUpdate: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onCancel: () => void;
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const StayDetailsStep: React.FC<StayDetailsStepProps> = ({ formData, listingId, onUpdate, onNext, onCancel }) => {
  const parseYMD = (s?: string): Date | null => {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };
  const formatYMD = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const toDateOnly = (d: Date | null) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null);

  const now = new Date();
  const cutoffHour = 18;
  const leadDays = now.getHours() >= cutoffHour ? 2 : 1;
  const minAllowedDate = toDateOnly(new Date(now.getFullYear(), now.getMonth(), now.getDate() + leadDays));

  const [showLeadNotice, setShowLeadNotice] = useState<boolean>(true);
  const [existingBookings, setExistingBookings] = useState<BookingAvailability[]>([]);

  const initialStart = toDateOnly(parseYMD(formData.checkInDate));
  const initialEnd = toDateOnly(parseYMD(formData.checkOutDate));
  const [selectedDates, setSelectedDates] = useState<{ start: Date | null; end: Date | null }>({
    start: initialStart,
    end: initialEnd
  });

  const initialDate = selectedDates.start ?? minAllowedDate ?? toDateOnly(new Date()) ?? new Date();
  const [calendarMonth, setCalendarMonth] = useState<number>(initialDate.getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(initialDate.getFullYear());

  const [isDateModalOpen, setDateModalOpen] = useState(false);
  const [dateModalField, setDateModalField] = useState<'checkIn' | 'checkOut' | null>(null);

  const [activeTimeField, setActiveTimeField] = useState<'checkInTime' | 'checkOutTime' | null>(null);
  const [isTimeSheetOpen, setTimeSheetOpen] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!listingId) {
        setExistingBookings([]);
        return;
      }
      try {
        const bookings = await BookingService.getBookingsForListing(listingId);
        setExistingBookings(bookings || []);
      } catch (error) {
        console.error('Error fetching bookings:', error);
        setExistingBookings([]);
      }
    };
    fetchBookings();
  }, [listingId]);

  useEffect(() => {
    const start = toDateOnly(parseYMD(formData.checkInDate));
    const end = toDateOnly(parseYMD(formData.checkOutDate));

    if (start && minAllowedDate && start.getTime() < minAllowedDate.getTime()) {
      onUpdate({ checkInDate: '' });
      setSelectedDates(prev => ({ ...prev, start: null }));
    }

    if (end && minAllowedDate && end.getTime() < minAllowedDate.getTime()) {
      onUpdate({ checkOutDate: '' });
      setSelectedDates(prev => ({ ...prev, end: null }));
    }

    if (start && end && end.getTime() <= start.getTime()) {
      onUpdate({ checkOutDate: '' });
      setSelectedDates(prev => ({ ...prev, end: null }));
    }

    setSelectedDates({ start, end });
  }, [formData.checkInDate, formData.checkOutDate, minAllowedDate, onUpdate]);

  // Helper to format a given hour/minute into 12-hour clock with AM/PM
  const format12Hour = (hour24: number, minute: number) => {
    const period = hour24 >= 12 ? 'PM' : 'AM';
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    const mm = String(minute).padStart(2, '0');
    return `${hour12}:${mm} ${period}`;
  };

  // Generate time options in 12-hour format (e.g., "1:30 PM")
  const generateTimeOptions = (incrementMinutes = 30) => {
    const opts: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += incrementMinutes) {
        opts.push(format12Hour(h, m));
      }
    }
    return opts;
  };
  const timeOptions = useMemo(() => generateTimeOptions(30), []);
  const handleTimeChange = (field: 'checkInTime' | 'checkOutTime', value: string) => {
    onUpdate({ [field]: value });
  };

  const baseGuests: number = (formData as any).baseGuests ?? 2;
  const handleGuestChange = (field: 'numberOfGuests' | 'extraGuests', value: number) => {
    if (field === 'numberOfGuests') {
      const clamped = Math.min(Math.max(1, Math.floor(value)), baseGuests);
      onUpdate({ numberOfGuests: clamped });
    } else {
      const clamped = Math.max(0, Math.floor(value));
      onUpdate({ extraGuests: clamped });
    }
  };
  const incrementGuest = (field: 'numberOfGuests' | 'extraGuests') => {
    if (field === 'numberOfGuests') {
      const curr = formData.numberOfGuests ?? 1;
      if (curr >= baseGuests) return;
      handleGuestChange('numberOfGuests', curr + 1);
    } else {
      const currPrimary = formData.numberOfGuests ?? 1;
      if (currPrimary < baseGuests) {
        handleGuestChange('numberOfGuests', currPrimary + 1);
      } else {
        handleGuestChange('extraGuests', (formData.extraGuests ?? 0) + 1);
      }
    }
  };
  const decrementGuest = (field: 'numberOfGuests' | 'extraGuests') => {
    if (field === 'numberOfGuests') {
      const curr = formData.numberOfGuests ?? 1;
      handleGuestChange('numberOfGuests', curr - 1);
    } else {
      handleGuestChange('extraGuests', Math.max(0, (formData.extraGuests ?? 0) - 1));
    }
  };

  const isFormValid = () =>
    !!(
      formData.checkInDate &&
      formData.checkOutDate &&
      (formData.numberOfGuests ?? 0) > 0 &&
      formData.checkInTime &&
      formData.checkOutTime
    );

  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1);
  const lastDayOfMonth = (y: number, m: number) => new Date(y, m + 1, 0);

  const isDateBooked = (date: Date): boolean => {
    if (!existingBookings.length) return false;
    const checkDate = toDateOnly(date);
    if (!checkDate) return false;
    return existingBookings.some((booking) => {
      const bookingStart = toDateOnly(parseYMD(booking.check_in_date));
      const bookingEnd = toDateOnly(parseYMD(booking.check_out_date));
      if (!bookingStart || !bookingEnd) return false;
      return checkDate.getTime() >= bookingStart.getTime() && checkDate.getTime() < bookingEnd.getTime();
    });
  };

  const generateCalendarDays = () => {
    const first = firstDayOfMonth(calendarYear, calendarMonth);
    const last = lastDayOfMonth(calendarYear, calendarMonth);
    const daysInMonth = last.getDate();
    const startingDayOfWeek = (first.getDay() + 6) % 7;

    const days: Array<
      | null
      | {
          day: number;
          date: Date;
          isSelected: boolean;
          isStart: boolean;
          isEnd: boolean;
          isDisabled: boolean;
        }
    > = [];

    const startOnly = selectedDates.start ? toDateOnly(selectedDates.start) : null;
    const endOnly = selectedDates.end ? toDateOnly(selectedDates.end) : null;

    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(calendarYear, calendarMonth, d);
      const isBeforeMinDate = minAllowedDate ? date.getTime() < minAllowedDate.getTime() : false;
      const isBooked = isDateBooked(date);
      const isDisabled = isBeforeMinDate || isBooked;
      const isSelected = !!(startOnly && endOnly && date >= startOnly && date <= endOnly);
      const isStart = !!(startOnly && date.getTime() === startOnly.getTime());
      const isEnd = !!(endOnly && date.getTime() === endOnly.getTime());
      days.push({ day: d, date, isSelected, isStart, isEnd, isDisabled });
    }

    while (days.length % 7 !== 0) days.push(null);

    return days;
  };

  const days = useMemo(() => generateCalendarDays(), [
    calendarMonth,
    calendarYear,
    selectedDates.start,
    selectedDates.end,
    minAllowedDate,
    existingBookings.length
  ]);

  const onCalendarClick = (dayData: { day: number; date: Date; isDisabled?: boolean } | null) => {
    if (!dayData || dayData.isDisabled) return;
    const clickedDate = toDateOnly(dayData.date)!;
    const dateStr = formatYMD(clickedDate);

    const start = selectedDates.start ? toDateOnly(selectedDates.start) : null;
    const end = selectedDates.end ? toDateOnly(selectedDates.end) : null;

    if (!start || (start && end)) {
      setSelectedDates({ start: clickedDate, end: null });
      onUpdate({ checkInDate: dateStr });
      onUpdate({ checkOutDate: '' });
    } else if (start && !end) {
      if (clickedDate.getTime() > start.getTime()) {
        setSelectedDates(prev => ({ ...prev, end: clickedDate }));
        onUpdate({ checkOutDate: dateStr });
      } else {
        setSelectedDates({ start: clickedDate, end: null });
        onUpdate({ checkInDate: dateStr });
        onUpdate({ checkOutDate: '' });
      }
    }
  };

  const onModalCalendarClick = (dayData: { day: number; date: Date; isDisabled?: boolean } | null) => {
    if (!dayData || dayData.isDisabled || !dateModalField) return;
    const clickedDate = toDateOnly(dayData.date)!;
    const dateStr = formatYMD(clickedDate);

    if (dateModalField === 'checkIn') {
      onUpdate({ checkInDate: dateStr });
      setSelectedDates(prev => ({ ...prev, start: clickedDate }));
      const currentEnd = toDateOnly(parseYMD(formData.checkOutDate));
      if (currentEnd && currentEnd.getTime() <= clickedDate.getTime()) {
        onUpdate({ checkOutDate: '' });
        setSelectedDates(prev => ({ ...prev, end: null }));
      }
    } else {
      const currentStart = toDateOnly(parseYMD(formData.checkInDate));
      if (currentStart && clickedDate.getTime() <= currentStart.getTime()) {
        return;
      }
      onUpdate({ checkOutDate: dateStr });
      setSelectedDates(prev => ({ ...prev, end: clickedDate }));
    }

    setDateModalOpen(false);
    setDateModalField(null);
  };

  const prevMonth = () => {
    const m = calendarMonth - 1;
    if (m < 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(m);
    }
  };
  const nextMonth = () => {
    const m = calendarMonth + 1;
    if (m > 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(m);
    }
  };

  const pricePerNight = formData.pricePerNight ?? 2000;
  const extraGuestFeePerPerson = formData.extraGuestFeePerPerson ?? 250;
  const extraGuests = Math.max(0, Math.floor(formData.extraGuests ?? 0));

  const nights = useMemo(() => {
    const start = toDateOnly(parseYMD(formData.checkInDate));
    const end = toDateOnly(parseYMD(formData.checkOutDate));
    if (!start || !end) return 0;
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = Math.round((end.getTime() - start.getTime()) / msPerDay);
    return Math.max(0, diff);
  }, [formData.checkInDate, formData.checkOutDate]);

  const subtotal = useMemo(() => nights * pricePerNight, [nights, pricePerNight]);
  const extraGuestFees = useMemo(() => {
    if (!extraGuests || extraGuests <= 0 || nights <= 0) return 0;
    return extraGuests * extraGuestFeePerPerson * nights;
  }, [extraGuests, extraGuestFeePerPerson, nights]);
  const total = useMemo(() => subtotal + extraGuestFees, [subtotal, extraGuestFees]);

  const formattedRange =
    selectedDates.start && selectedDates.end
      ? `${selectedDates.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${selectedDates.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      : null;

  const currentPrimaryGuests = formData.numberOfGuests ?? 1;
  const reachedPrimaryMax = currentPrimaryGuests >= baseGuests;

  const formatCurrency = (v: number) =>
    v.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 });

  useEffect(() => {
    if (isDateModalOpen || isTimeSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDateModalOpen, isTimeSheetOpen]);

  const displayDateLabel = (d?: string) => {
    if (!d) return 'Select date';
    const parsed = parseYMD(d);
    if (!parsed) return 'Select date';
    return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };
  const displayTimeLabel = (t?: string) => t || 'Select time';

  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-4">
          <h1 className="text-lg sm:text-2xl font-semibold text-[#0B5858]" style={{ fontFamily: 'Poppins' }}>
            Stay Details
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1" style={{ fontFamily: 'Poppins' }}>
            Please fill in your stay details to continue
          </p>
        </div>

        {showLeadNotice && (
          <div className="mb-3">
            <div className="flex items-start justify-between bg-[#FEF9E6] border border-[#F5EECF] rounded-md px-3 py-2">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-[#A67C00] mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M8.257 3.099c.366-.89 1.603-.89 1.97 0l.908 2.204a1 1 0 00.95.69h2.32c.969 0 1.371 1.24.588 1.81l-1.88 1.364a1 1 0 00-.364 1.118l.718 2.204c.366.89-.755 1.63-1.54 1.06L10 12.347l-1.617 1.202c-.784.57-1.906-.17-1.54-1.06l.718-2.204a1 1 0 00-.364-1.118L5.317 7.803c-.783-.57-.38-1.81.588-1.81h2.32a1 1 0 00.95-.69l.082-.204z" />
                </svg>
                <div className="text-xs sm:text-sm text-[#664E00]" style={{ fontFamily: 'Poppins' }}>
                  Bookings must be made at least <span className="font-semibold">{leadDays} day{leadDays > 1 ? 's' : ''}</span> in advance (based on current local time).
                </div>
              </div>
              <button
                onClick={() => setShowLeadNotice(false)}
                aria-label="Dismiss lead time notice"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="border border-[#E6F5F4] rounded-lg p-3 sm:p-4 bg-white shadow-sm text-xs sm:text-sm">
              <div className="flex items-center gap-0 mb-2 justify-start pl-0">
                <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>Stay Duration</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs sm:text-sm text-gray-600 mb-2 block" style={{ fontFamily: 'Poppins' }}>
                    Check-in <span className="text-red-500">*</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setDateModalField('checkIn'); setDateModalOpen(true); setCalendarMonth(initialDate.getMonth()); setCalendarYear(initialDate.getFullYear()); }}
                      className="flex-1 border border-[#E6F5F4] rounded-md px-3 py-2 flex items-center justify-between bg-[#F8FFFE]"
                      aria-haspopup="dialog"
                      aria-expanded={isDateModalOpen && dateModalField === 'checkIn'}
                      aria-label="Open date picker for check in"
                    >
                      <div className="text-left">
                        <div className="text-[11px] sm:text-sm text-gray-600">Dates</div>
                        <div className="font-semibold text-[#0B5858]" style={{ fontFamily: 'Poppins' }}>
                          {formData.checkInDate ? displayDateLabel(formData.checkInDate) : 'Select date'}
                        </div>
                      </div>

                      <div className="ml-4 flex items-center gap-3">
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setActiveTimeField('checkInTime');
                            setTimeSheetOpen(true);
                          }}
                          className="w-36 md:w-36 h-10 rounded-md border border-[#E6F5F4] bg-white text-sm flex items-center justify-center gap-2"
                          aria-label="Open check-in time selector"
                        >
                          <span className="text-xs text-gray-600">{displayTimeLabel(formData.checkInTime)}</span>
                          <span className="text-gray-400">⏱</span>
                        </button>
                      </div>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm text-gray-600 mb-2 block" style={{ fontFamily: 'Poppins' }}>
                    Check-out <span className="text-red-500">*</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setDateModalField('checkOut'); setDateModalOpen(true); setCalendarMonth(initialDate.getMonth()); setCalendarYear(initialDate.getFullYear()); }}
                      className="flex-1 border border-[#E6F5F4] rounded-md px-3 py-2 flex items-center justify-between bg-[#F8FFFE]"
                      aria-haspopup="dialog"
                      aria-expanded={isDateModalOpen && dateModalField === 'checkOut'}
                      aria-label="Open date picker for check out"
                    >
                      <div className="text-left">
                        <div className="text-[11px] sm:text-sm text-gray-600">Dates</div>
                        <div className="font-semibold text-[#0B5858]" style={{ fontFamily: 'Poppins' }}>
                          {formData.checkOutDate ? displayDateLabel(formData.checkOutDate) : 'Select date'}
                        </div>
                      </div>

                      <div className="ml-4 flex items-center gap-3">
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setActiveTimeField('checkOutTime');
                            setTimeSheetOpen(true);
                          }}
                          className="w-36 md:w-36 h-10 rounded-md border border-[#E6F5F4] bg-white text-sm flex items-center justify-center gap-2"
                          aria-label="Open check-out time selector"
                        >
                          <span className="text-xs text-gray-600">{displayTimeLabel(formData.checkOutTime)}</span>
                          <span className="text-gray-400">⏱</span>
                        </button>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-[#E6F5F4] rounded-lg p-3 sm:p-4 bg-white shadow-sm text-xs sm:text-sm">
              <div className="flex items-center gap-0 mb-2 justify-start pl-0">
                <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>Guests</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                <div>
                  <label className="text-xs sm:text-sm text-gray-600 mb-3 flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
                    <span>Number of Guests</span>
                    <span className="relative inline-block group">
                      <button
                        type="button"
                        aria-describedby="primary-guests-tooltip"
                        className="w-5 h-5 rounded-full border border-[#E6F5F4] bg-white text-[#0B5858] text-xs flex items-center justify-center"
                        aria-label="Primary guests info"
                      >
                        ?
                      </button>
                      <div
                        role="tooltip"
                        id="primary-guests-tooltip"
                        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-10 z-10 hidden group-hover:block group-focus:block w-56 bg-white border border-[#E6F5F4] rounded-md px-3 py-2 text-xs text-gray-700 shadow"
                        style={{ fontFamily: 'Poppins' }}
                      >
                        Primary guests are included in the base rate.
                      </div>
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrementGuest('numberOfGuests')}
                      className="w-8 h-8 rounded-md border border-[#0B5858] text-[#0B5858] text-base flex items-center justify-center bg-white hover:bg-[#f1fefa]"
                      aria-label="Decrease guests"
                    >
                      −
                    </button>

                    <div className="flex-1 bg-[#F8FFFE] border border-[#E6F5F4] rounded-lg px-4 py-2 flex items-center justify-center min-h-[40px]">
                      <span className="text-base font-semibold text-[#0B5858]" style={{ fontFamily: 'Poppins' }}>
                        {currentPrimaryGuests}
                      </span>
                    </div>

                    <button
                      onClick={() => incrementGuest('numberOfGuests')}
                      className={`w-8 h-8 rounded-md border border-[#0B5858] text-[#0B5858] text-base flex items-center justify-center bg-white hover:bg-[#f1fefa] ${reachedPrimaryMax ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-label="Increase guests"
                      disabled={reachedPrimaryMax}
                      title={reachedPrimaryMax ? `Maximum ${baseGuests} primary guest(s). Add extra guests instead.` : 'Add guest'}
                    >
                      +
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: 'Poppins' }}>
                    Base rate covers up to <span className="font-medium">{baseGuests}</span> guest{baseGuests > 1 ? 's' : ''}
                  </p>
                </div>

                <div>
                  <label className="text-xs sm:text-sm text-gray-600 mb-3 flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
                    <span>Extra Guests</span>
                    <span className="relative inline-block group">
                      <button
                        type="button"
                        aria-describedby="extra-guests-tooltip"
                        className="w-5 h-5 rounded-full border border-[#E6F5F4] bg-white text-[#0B5858] text-xs flex items-center justify-center"
                        aria-label="Extra guests info"
                      >
                        ?
                      </button>
                      <div
                        role="tooltip"
                        id="extra-guests-tooltip"
                        className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-14 z-10 hidden group-hover:block group-focus:block w-72 bg-white border border-[#E6F5F4] rounded-md px-3 py-2 text-xs text-gray-700 shadow"
                        style={{ fontFamily: 'Poppins' }}
                      >
                        Additional fees apply for extra guests: <span className="font-medium">₱{extraGuestFeePerPerson}</span> per extra guest, per night. Clicking "+" here will first fill primary guest slots up to the base allowance, then start adding extra guests.
                      </div>
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => decrementGuest('extraGuests')}
                      className="w-8 h-8 rounded-md border border-[#0B5858] text-[#0B5858] text-base flex items-center justify-center bg-white hover:bg-[#f1fefa]"
                      aria-label="Decrease extra guests"
                    >
                      −
                    </button>

                    <div className="flex-1 bg-[#F8FFFE] border border-[#E6F5F4] rounded-lg px-4 py-2 flex items-center justify-center min-h-[40px]">
                      <span className="text-base font-semibold text-[#0B5858]" style={{ fontFamily: 'Poppins' }}>
                        {extraGuests}
                      </span>
                    </div>

                    <button
                      onClick={() => incrementGuest('extraGuests')}
                      className="w-8 h-8 rounded-md border border-[#0B5858] text-[#0B5858] text-base flex items-center justify-center bg-white hover:bg-[#f1fefa]"
                      aria-label="Increase extra guests"
                      title={currentPrimaryGuests < baseGuests ? `Will add to primary guests until reaching ${baseGuests}` : 'Add extra guest'}
                    >
                      +
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: 'Poppins' }}>
                    Extra guests incur additional fees (₱{extraGuestFeePerPerson})
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-[#E6F5F4] rounded-lg p-3 sm:p-4 bg-white shadow-sm text-xs sm:text-sm">
              <div className="mb-2">
                <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>
                  Quick Calendar
                </h3>
              </div>

              <div className="border rounded-md p-3 sm:p-4">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth} aria-label="Previous month" className="p-2 rounded hover:bg-gray-50">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 15.707a1 1 0 01-1.414 0L6.586 11l4.707-4.707a1 1 0 011.414 1.414L9.414 11l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  <div className="text-sm sm:text-base font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>
                    {new Date(calendarYear, calendarMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </div>

                  <button onClick={nextMonth} aria-label="Next month" className="p-2 rounded hover:bg-gray-50">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 4.293a1 1 0 011.414 0L13.414 9l-4.707 4.707a1 1 0 01-1.414-1.414L10.586 9 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-[10px] sm:text-xs text-center mb-3">
                  {WEEK_DAYS.map(d => (
                    <div key={d} className="text-gray-500 font-medium py-1" style={{ fontFamily: 'Poppins' }}>
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2 text-sm justify-items-center">
                  {days.map((cell, i) => {
                    if (!cell) return <div key={`empty-${i}`} className="w-9 h-9 sm:w-12 sm:h-12" />;

                    const base = 'flex items-center justify-center select-none';
                    const sizeClass = 'w-9 h-9 sm:w-12 sm:h-12 text-[11px] sm:text-sm';
                    const startOrEnd = cell.isStart || cell.isEnd;
                    const bgClass = startOrEnd
                      ? 'bg-[#0B5858] text-white'
                      : cell.isSelected
                        ? 'bg-[#DFF6F5] text-[#0B7A76]'
                        : 'text-gray-700 hover:bg-[#EAF9F8]';
                    const roundedClass = startOrEnd ? 'rounded-lg' : (cell.isSelected ? 'rounded-md' : 'rounded-none');
                    const disabledClass = cell.isDisabled ? 'text-gray-300 opacity-60 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer';
                    const interactiveProps = cell.isDisabled ? {} : { onClick: () => onCalendarClick(cell) };

                    return (
                      <div
                        key={`day-${cell.date.getTime()}`}
                        {...interactiveProps}
                        className={`${base} ${sizeClass} ${bgClass} ${roundedClass} ${disabledClass}`}
                        title={cell.date.toDateString()}
                        style={{ fontFamily: 'Poppins' }}
                      >
                        {cell.day}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <div className="mx-auto w-full bg-[#EAF9F8] rounded-xl py-3 px-4 text-center text-xs sm:text-sm">
                    <div className="text-xs text-gray-600" style={{ fontFamily: 'Poppins' }}>Selected Range</div>
                    <div className="text-sm font-semibold text-[#0B5858]" style={{ fontFamily: 'Poppins' }}>
                      {formattedRange ?? '—'}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-2" style={{ fontFamily: 'Poppins' }}>
                      Use the clock button next to each date input to open the time sheet and select times.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex justify-end space-x-4 mt-2">
              <button
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                style={{ fontFamily: 'Poppins' }}
              >
                Cancel
              </button>
              <button
                onClick={onNext}
                disabled={!isFormValid()}
                className="px-6 py-2 bg-[#0B5858] text-white rounded-lg hover:bg-[#0a4a4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                style={{ fontFamily: 'Poppins' }}
              >
                Next
              </button>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-20 lg:self-start space-y-3">
              <div className="border border-[#E6F5F4] rounded-lg p-3 sm:p-4 bg-white shadow-sm text-xs sm:text-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins' }}>Booking Summary</h4>

                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-1">
                  <div>Price / night</div>
                  <div className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>{formatCurrency(pricePerNight)}</div>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-1">
                  <div>Nights</div>
                  <div className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>{nights}</div>
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2">
                  <div>Extra guests</div>
                  <div className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>{extraGuests}</div>
                </div>

                <div className="border-t border-[#E6F5F4] mt-2 pt-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-1">
                    <div>Subtotal</div>
                    <div className="font-semibold text-gray-800">{formatCurrency(subtotal)}</div>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2">
                    <div>Extra guest fees</div>
                    <div className="font-semibold text-gray-800">{formatCurrency(extraGuestFees)}</div>
                  </div>

                  <div className="flex items-center justify-between text-sm font-semibold text-[#0B5858]">
                    <div>Total</div>
                    <div>{formatCurrency(total)}</div>
                  </div>
                </div>

                <div className="mt-3 text-[10px] sm:text-xs text-gray-500">
                  <div>• Price shown is an estimate. Final total calculated at checkout.</div>
                  <div className="mt-1">• Free cancellation up to 48 hours before check-in.</div>
                </div>
              </div>

              <div className="border border-[#E6F5F4] rounded-lg p-3 sm:p-4 bg-white shadow-sm text-xs sm:text-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-1" style={{ fontFamily: 'Poppins' }}>Need help?</h4>
                <p className="text-xs sm:text-sm text-gray-600 mb-2" style={{ fontFamily: 'Poppins' }}>
                  If you have questions about availability or special requests, contact us and we'll assist.
                </p>
                <button
                  className="w-full px-3 py-2 bg-[#E8F8F7] text-[#0B5858] rounded-md text-sm font-medium"
                  style={{ fontFamily: 'Poppins' }}
                  onClick={() => alert('Contact support (placeholder)')}
                >
                  Contact Support
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div
        className="fixed left-0 right-0 bottom-0 bg-white border-t border-gray-200 p-3 lg:hidden"
        role="region"
        aria-label="Stay details actions"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            style={{ fontFamily: 'Poppins' }}
          >
            Cancel
          </button>
          <button
            onClick={onNext}
            disabled={!isFormValid()}
            className="flex-1 px-3 py-2 bg-[#0B5858] text-white rounded-lg hover:bg-[#0a4a4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            style={{ fontFamily: 'Poppins' }}
            aria-disabled={!isFormValid()}
          >
            Next
          </button>
        </div>
      </div>

      {isDateModalOpen && dateModalField && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Pick ${dateModalField === 'checkIn' ? 'check-in' : 'check-out'} date`}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
        >
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => { setDateModalOpen(false); setDateModalField(null); }}
          />

          <div className="relative w-full md:max-w-2xl md:rounded-lg bg-white md:shadow-lg" style={{ maxHeight: '92vh', overflow: 'auto' }}>
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
              <div className="text-sm font-semibold" style={{ fontFamily: 'Poppins' }}>
                {dateModalField === 'checkIn' ? 'Select check‑in date' : 'Select check‑out date'}
              </div>
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-500">{minAllowedDate ? `From ${minAllowedDate.toLocaleDateString()}` : ''}</div>
                <button onClick={() => { setDateModalOpen(false); setDateModalField(null); }} className="text-gray-600 p-1 rounded" aria-label="Close date picker">✕</button>
              </div>
            </div>

            <div className="p-4 grid grid-cols-1 gap-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <button onClick={() => { prevMonth(); }} className="p-2 rounded hover:bg-gray-50">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 15.707a1 1 0 01-1.414 0L6.586 11l4.707-4.707a1 1 0 011.414 1.414L9.414 11l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <div className="font-semibold text-sm" style={{ fontFamily: 'Poppins' }}>
                    {new Date(calendarYear, calendarMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                  <button onClick={() => { nextMonth(); }} className="p-2 rounded hover:bg-gray-50">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 4.293a1 1 0 011.414 0L13.414 9l-4.707 4.707a1 1 0 01-1.414-1.414L10.586 9 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 text-[10px] sm:text-xs text-center mb-2">
                  {WEEK_DAYS.map(d => (
                    <div key={d} className="text-gray-500 font-medium py-1" style={{ fontFamily: 'Poppins' }}>
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2 text-sm justify-items-center">
                  {days.map((cell, i) => {
                    if (!cell) return <div key={`m-empty-${i}`} className="w-10 h-10 sm:w-12 sm:h-12" />;

                    const base = 'flex items-center justify-center select-none';
                    const sizeClass = 'w-10 h-10 sm:w-12 sm:h-12 text-[12px] sm:text-sm';
                    const startOrEnd = cell.isStart || cell.isEnd;
                    const bgClass = startOrEnd
                      ? 'bg-[#0B5858] text-white'
                      : cell.isSelected
                        ? 'bg-[#DFF6F5] text-[#0B7A76]'
                        : 'text-gray-700 hover:bg-[#EAF9F8]';
                    const roundedClass = startOrEnd ? 'rounded-lg' : (cell.isSelected ? 'rounded-md' : 'rounded-none');
                    const disabledClass = cell.isDisabled ? 'text-gray-300 opacity-60 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer';
                    const interactiveProps = cell.isDisabled ? {} : { onClick: () => onModalCalendarClick(cell) };

                    return (
                      <div
                        key={`m-day-${cell.date.getTime()}`}
                        {...interactiveProps}
                        className={`${base} ${sizeClass} ${bgClass} ${roundedClass} ${disabledClass}`}
                        title={cell.date.toDateString()}
                        style={{ fontFamily: 'Poppins' }}
                      >
                        {cell.day}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="bg-[#F8FFFE] border border-[#E6F5F4] rounded-lg p-3 flex flex-col gap-3">
                  <div>
                    <div className="text-xs text-gray-600">Selected</div>
                    <div className="text-base font-semibold text-[#0B5858]">
                      {dateModalField === 'checkIn'
                        ? (formData.checkInDate ? displayDateLabel(formData.checkInDate) : '—')
                        : (formData.checkOutDate ? displayDateLabel(formData.checkOutDate) : '—')}
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    This calendar selects only the date for the field you opened it from. Times are selected via the clock button next to each date input.
                  </div>

                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => { setDateModalOpen(false); setDateModalField(null); }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      Done
                    </button>
                    <button
                      onClick={() => {
                        if (dateModalField === 'checkIn') {
                          onUpdate({ checkInDate: '' });
                          setSelectedDates(prev => ({ ...prev, start: null }));
                        } else if (dateModalField === 'checkOut') {
                          onUpdate({ checkOutDate: '' });
                          setSelectedDates(prev => ({ ...prev, end: null }));
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-[#FFEFEF] text-[#B00000] rounded-md text-sm"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  Tip: Tap a date to set {dateModalField === 'checkIn' ? 'your check‑in' : 'your check‑out'} date. Dates before {minAllowedDate?.toLocaleDateString() || 'today'} are disabled.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTimeSheetOpen && activeTimeField && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeTimeField === 'checkInTime' ? 'Select check in time' : 'Select check out time'}
          className="fixed inset-0 z-50 flex items-end justify-center"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => { setTimeSheetOpen(false); setActiveTimeField(null); }} />
          <div className="relative w-full bg-white rounded-t-xl p-4 max-h-[70vh] overflow-auto" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold" style={{ fontFamily: 'Poppins' }}>
                {activeTimeField === 'checkInTime' ? 'Check-in time' : 'Check-out time'}
              </div>
              <button onClick={() => { setTimeSheetOpen(false); setActiveTimeField(null); }} className="text-gray-600">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {timeOptions.map(t => {
                const selected = (activeTimeField === 'checkInTime' ? formData.checkInTime : formData.checkOutTime) === t;
                return (
                  <button
                    key={t}
                    onClick={() => {
                      if (activeTimeField) handleTimeChange(activeTimeField, t);
                      setTimeSheetOpen(false);
                      setActiveTimeField(null);
                    }}
                    className={`py-2 px-3 rounded-md text-sm ${selected ? 'bg-[#0B5858] text-white' : 'bg-white border border-[#E6F5F4] text-gray-700'}`}
                    style={{ fontFamily: 'Poppins' }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StayDetailsStep;

