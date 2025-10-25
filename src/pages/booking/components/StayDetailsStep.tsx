import React, { useEffect, useMemo, useState } from 'react';
import type { BookingFormData } from '../../../types/booking';

interface StayDetailsStepProps {
  formData: BookingFormData;
  onUpdate: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onCancel: () => void;
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * StayDetailsStep
 *
 * Notes / Fixes applied:
 * - The summary (subtotal / extra guest fees / total) is computed from the canonical formData values
 *   (formData.checkInDate, formData.checkOutDate, formData.pricePerNight, formData.extraGuestFeePerPerson),
 *   rather than only the local selectedDates. This prevents stale or out-of-sync totals.
 * - Date math is done with "date-only" local midnight values to avoid timezone shifts.
 * - All derived values (nights, subtotal, fees, total) use useMemo with correct dependency lists so they
 *   update when formData changes.
 * - Defensive guards: price and fee defaults, and extraGuests floored to integers.
 * - Kept existing calendar/guest UX but tightened useEffect deps and validation.
 */

const StayDetailsStep: React.FC<StayDetailsStepProps> = ({ formData, onUpdate, onNext, onCancel }) => {
  // Helpers for date-only (local) handling
  const parseYMD = (s?: string): Date | null => {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };
  const formatYMD = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const toDateOnly = (d: Date | null) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null);

  // "Now" local time
  const now = new Date();
  const cutoffHour = 18;
  const leadDays = now.getHours() >= cutoffHour ? 2 : 1;
  const minAllowedDate = toDateOnly(new Date(now.getFullYear(), now.getMonth(), now.getDate() + leadDays));

  // Dismissible lead notice
  const [showLeadNotice, setShowLeadNotice] = useState<boolean>(true);

  // Local selectedDates mirror formData for calendar interactions (date-only)
  const initialStart = toDateOnly(parseYMD(formData.checkInDate));
  const initialEnd = toDateOnly(parseYMD(formData.checkOutDate));
  const [selectedDates, setSelectedDates] = useState<{ start: Date | null; end: Date | null }>({
    start: initialStart,
    end: initialEnd
  });

  // Calendar month/year state (start or minAllowedDate)
  const initialDate = selectedDates.start ?? minAllowedDate ?? toDateOnly(new Date()) ?? new Date();
  const [calendarMonth, setCalendarMonth] = useState<number>(initialDate.getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(initialDate.getFullYear());

  // Sync incoming formData into selectedDates and validate against minAllowedDate
  useEffect(() => {
    const start = toDateOnly(parseYMD(formData.checkInDate));
    const end = toDateOnly(parseYMD(formData.checkOutDate));

    if (start && minAllowedDate && start.getTime() < minAllowedDate.getTime()) {
      // clear invalid start
      onUpdate({ checkInDate: '' });
      setSelectedDates(prev => ({ ...prev, start: null }));
    }

    if (end && minAllowedDate && end.getTime() < minAllowedDate.getTime()) {
      // clear invalid end
      onUpdate({ checkOutDate: '' });
      setSelectedDates(prev => ({ ...prev, end: null }));
    }

    if (start && end && end.getTime() < start.getTime()) {
      // invalid range -> clear end
      onUpdate({ checkOutDate: '' });
      setSelectedDates(prev => ({ ...prev, end: null }));
    }

    setSelectedDates({
      start,
      end
    });
    // include minAllowedDate and onUpdate because we call them above
  }, [formData.checkInDate, formData.checkOutDate, minAllowedDate, onUpdate]);

  // Handle direct input changes
  const handleDateChange = (field: 'checkInDate' | 'checkOutDate', value: string) => {
    const d = toDateOnly(parseYMD(value));
    // Prevent selecting earlier than minAllowedDate
    if (d && minAllowedDate && d.getTime() < minAllowedDate.getTime()) return;

    onUpdate({ [field]: value });

    if (field === 'checkInDate') {
      setSelectedDates(prev => ({ ...prev, start: d ?? null }));
      if (d) {
        setCalendarMonth(d.getMonth());
        setCalendarYear(d.getFullYear());
      }
      // If new check-in is after or equal to existing check-out, clear check-out
      const currentEnd = toDateOnly(parseYMD(formData.checkOutDate));
      if (currentEnd && d && currentEnd.getTime() <= d.getTime()) {
        onUpdate({ checkOutDate: '' });
        setSelectedDates(prev => ({ ...prev, end: null }));
      }
    } else {
      setSelectedDates(prev => ({ ...prev, end: d ?? null }));
      if (d) {
        setCalendarMonth(d.getMonth());
        setCalendarYear(d.getFullYear());
      }
    }
  };

  const handleTimeChange = (field: 'checkInTime' | 'checkOutTime', value: string) => {
    onUpdate({ [field]: value });
  };

  // Guest logic (baseGuests from formData or fallback)
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

  // Calendar utilities
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m, 1);
  const lastDayOfMonth = (y: number, m: number) => new Date(y, m + 1, 0);

  const generateCalendarDays = () => {
    const first = firstDayOfMonth(calendarYear, calendarMonth);
    const last = lastDayOfMonth(calendarYear, calendarMonth);
    const daysInMonth = last.getDate();
    const startingDayOfWeek = (first.getDay() + 6) % 7; // Monday=0

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
      const isDisabled = minAllowedDate ? date.getTime() < minAllowedDate.getTime() : false;
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
    // minAllowedDate affects isDisabled flags in calendar rendering
    minAllowedDate
  ]);

  const onCalendarClick = (dayData: { day: number; date: Date; isDisabled?: boolean } | null) => {
    if (!dayData || dayData.isDisabled) return;
    const clickedDate = toDateOnly(dayData.date)!;
    const dateStr = formatYMD(clickedDate);

    const start = selectedDates.start ? toDateOnly(selectedDates.start) : null;
    const end = selectedDates.end ? toDateOnly(selectedDates.end) : null;

    if (!start || (start && end)) {
      // start new selection
      setSelectedDates({ start: clickedDate, end: null });
      onUpdate({ checkInDate: dateStr });
      onUpdate({ checkOutDate: '' });
    } else if (start && !end) {
      if (clickedDate.getTime() > start.getTime()) {
        setSelectedDates(prev => ({ ...prev, end: clickedDate }));
        onUpdate({ checkOutDate: dateStr });
      } else {
        // restart range
        setSelectedDates({ start: clickedDate, end: null });
        onUpdate({ checkInDate: dateStr });
        onUpdate({ checkOutDate: '' });
      }
    }
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

  // Summary calculations (use canonical formData values so result always reflects saved form data)
  const pricePerNight = formData.pricePerNight ?? 2000;
  const extraGuestFeePerPerson = formData.extraGuestFeePerPerson ?? 250;
  const extraGuests = Math.max(0, Math.floor(formData.extraGuests ?? 0));

  // compute nights from formData (date-only) to avoid relying on selectedDates which may be mid-edit
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

  const formatInputDate = (dateStr?: string) => (dateStr ? dateStr : '');
  const minDateStr = minAllowedDate ? formatYMD(minAllowedDate) : '';

  const currentPrimaryGuests = formData.numberOfGuests ?? 1;
  const reachedPrimaryMax = currentPrimaryGuests >= baseGuests;

  const formatCurrency = (v: number) =>
    v.toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0 });

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold text-[#0B5858]" style={{ fontFamily: 'Poppins' }}>
            Stay Details
          </h1>
          <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: 'Poppins' }}>
            Please fill in your stay details to continue
          </p>
        </div>

        {showLeadNotice && (
          <div className="max-w-6xl mx-auto mb-4">
            <div className="flex items-start justify-between bg-[#FEF9E6] border border-[#F5EECF] rounded-md px-4 py-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-[#A67C00] mt-0.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M8.257 3.099c.366-.89 1.603-.89 1.97 0l.908 2.204a1 1 0 00.95.69h2.32c.969 0 1.371 1.24.588 1.81l-1.88 1.364a1 1 0 00-.364 1.118l.718 2.204c.366.89-.755 1.63-1.54 1.06L10 12.347l-1.617 1.202c-.784.57-1.906-.17-1.54-1.06l.718-2.204a1 1 0 00-.364-1.118L5.317 7.803c-.783-.57-.38-1.81.588-1.81h2.32a1 1 0 00.95-.69l.082-.204z" />
                </svg>
                <div className="text-sm text-[#664E00]" style={{ fontFamily: 'Poppins' }}>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Stay Duration */}
            <div className="border border-[#E6F5F4] rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-5 h-5 text-[#0B5858]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.2" />
                  <path d="M16 2v4M8 2v4" strokeWidth="1.2" />
                </svg>
                <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>Stay Duration</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block" style={{ fontFamily: 'Poppins' }}>
                    Check-in <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border border-[#E6F5F4] rounded-md px-3 py-2 flex items-center justify-between bg-[#F8FFFE]">
                      <input
                        type="date"
                        min={minDateStr}
                        value={formatInputDate(formData.checkInDate)}
                        onChange={(e) => handleDateChange('checkInDate', e.target.value)}
                        className="flex-1 text-sm outline-none bg-transparent"
                        style={{ fontFamily: 'Poppins' }}
                      />
                      <div className="w-px h-6 bg-[#E0F0EE] mx-3" />
                      <input
                        type="time"
                        value={formData.checkInTime || ''}
                        onChange={(e) => handleTimeChange('checkInTime', e.target.value)}
                        className="w-28 text-sm outline-none bg-transparent"
                        style={{ fontFamily: 'Poppins' }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-2 block" style={{ fontFamily: 'Poppins' }}>
                    Check-out <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 border border-[#E6F5F4] rounded-md px-3 py-2 flex items-center justify-between bg-[#F8FFFE]">
                      <input
                        type="date"
                        min={minDateStr}
                        value={formatInputDate(formData.checkOutDate)}
                        onChange={(e) => handleDateChange('checkOutDate', e.target.value)}
                        className="flex-1 text-sm outline-none bg-transparent"
                        style={{ fontFamily: 'Poppins' }}
                      />
                      <div className="w-px h-6 bg-[#E0F0EE] mx-3" />
                      <input
                        type="time"
                        value={formData.checkOutTime || ''}
                        onChange={(e) => handleTimeChange('checkOutTime', e.target.value)}
                        className="w-28 text-sm outline-none bg-transparent"
                        style={{ fontFamily: 'Poppins' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Guests */}
            <div className="border border-[#E6F5F4] rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-5 h-5 text-[#0B5858]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" strokeWidth="1.2" />
                  <path d="M3 20a9 9 0 0118 0" strokeWidth="1.2" />
                </svg>
                <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>Guests</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div>
                  <label className="text-sm text-gray-600 mb-3 flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
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

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => decrementGuest('numberOfGuests')}
                      className="w-8 h-8 rounded-md border border-[#0B5858] text-[#0B5858] text-base flex items-center justify-center bg-white hover:bg-[#f1fefa]"
                      aria-label="Decrease guests"
                    >
                      −
                    </button>

                    <div className="flex-1 bg-[#F8FFFE] border border-[#E6F5F4] rounded-lg px-6 py-3 flex items-center justify-center min-h-[44px]">
                      <span className="text-lg font-semibold text-[#0B5858]" style={{ fontFamily: 'Poppins' }}>
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

                  <p className="text-xs text-gray-400 mt-3" style={{ fontFamily: 'Poppins' }}>
                    Base rate covers up to <span className="font-medium">{baseGuests}</span> guest{baseGuests > 1 ? 's' : ''}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-gray-600 mb-3 flex items-center gap-2" style={{ fontFamily: 'Poppins' }}>
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

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => decrementGuest('extraGuests')}
                      className="w-8 h-8 rounded-md border border-[#0B5858] text-[#0B5858] text-base flex items-center justify-center bg-white hover:bg-[#f1fefa]"
                      aria-label="Decrease extra guests"
                    >
                      −
                    </button>

                    <div className="flex-1 bg-[#F8FFFE] border border-[#E6F5F4] rounded-lg px-6 py-3 flex items-center justify-center min-h-[44px]">
                      <span className="text-lg font-semibold text-[#0B5858]" style={{ fontFamily: 'Poppins' }}>
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

                  <p className="text-xs text-gray-400 mt-3" style={{ fontFamily: 'Poppins' }}>
                    Extra guests incur additional fees (₱{extraGuestFeePerPerson} / guest / night)
                  </p>
                </div>
              </div>
            </div>

            {/* Calendar */}
            <div className="border border-[#E6F5F4] rounded-lg p-6 bg-white shadow-sm">
              <div className="mb-3">
                <h3 className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>
                  Select Dates
                </h3>
              </div>

              <div className="border rounded-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <button onClick={prevMonth} aria-label="Previous month" className="p-2 rounded hover:bg-gray-50">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M12.707 15.707a1 1 0 01-1.414 0L6.586 11l4.707-4.707a1 1 0 011.414 1.414L9.414 11l3.293 3.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  <div className="text-base font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>
                    {new Date(calendarYear, calendarMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </div>

                  <button onClick={nextMonth} aria-label="Next month" className="p-2 rounded hover:bg-gray-50">
                    <svg className="w-4 h-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 4.293a1 1 0 011.414 0L13.414 9l-4.707 4.707a1 1 0 01-1.414-1.414L10.586 9 7.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-6 text-xs text-center mb-4">
                  {WEEK_DAYS.map(d => (
                    <div key={d} className="text-gray-500 font-medium py-1" style={{ fontFamily: 'Poppins' }}>
                      {d}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-4 text-sm justify-items-center">
                  {days.map((cell, i) => {
                    if (!cell) return <div key={`empty-${i}`} className="w-12 h-12" />;

                    const base = 'w-12 h-12 flex items-center justify-center text-sm select-none';
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
                        className={`${base} ${bgClass} ${roundedClass} ${disabledClass}`}
                        title={cell.date.toDateString()}
                        style={{ fontFamily: 'Poppins' }}
                      >
                        {cell.day}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <div className="mx-auto w-full bg-[#EAF9F8] rounded-xl py-4 px-6 text-center">
                    <div className="text-xs text-gray-600" style={{ fontFamily: 'Poppins' }}>Selected Range</div>
                    <div className="text-sm font-semibold text-[#0B5858]" style={{ fontFamily: 'Poppins' }}>
                      {formattedRange ?? '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 mt-2">
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

          {/* Sidebar summary */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-28 lg:self-start lg:mt-6 space-y-4">
              <div className="border border-[#E6F5F4] rounded-lg p-4 bg-white shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Poppins' }}>Booking Summary</h4>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <div>Price / night</div>
                  <div className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>{formatCurrency(pricePerNight)}</div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <div>Nights</div>
                  <div className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>{nights}</div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <div>Extra guests</div>
                  <div className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>{extraGuests}</div>
                </div>

                <div className="border-t border-[#E6F5F4] mt-3 pt-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <div>Subtotal</div>
                    <div className="font-semibold text-gray-800">{formatCurrency(subtotal)}</div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                    <div>Extra guest fees</div>
                    <div className="font-semibold text-gray-800">{formatCurrency(extraGuestFees)}</div>
                  </div>

                  <div className="flex items-center justify-between text-sm font-semibold text-[#0B5858]">
                    <div>Total</div>
                    <div>{formatCurrency(total)}</div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-500">
                  <div>• Price shown is an estimate. Final total calculated at checkout.</div>
                  <div className="mt-2">• Free cancellation up to 48 hours before check-in.</div>
                </div>
              </div>

              <div className="border border-[#E6F5F4] rounded-lg p-4 bg-white shadow-sm">
                <h4 className="text-sm font-semibold text-gray-800 mb-2" style={{ fontFamily: 'Poppins' }}>Need help?</h4>
                <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Poppins' }}>
                  If you have questions about availability or special requests, contact us and we'll assist.
                </p>
                <button
                  className="w-full px-4 py-2 bg-[#E8F8F7] text-[#0B5858] rounded-md text-sm font-medium"
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
    </div>
  );
};

export default StayDetailsStep;