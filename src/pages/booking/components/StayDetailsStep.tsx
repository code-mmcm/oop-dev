import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { BookingFormData } from '../../../types/booking';

interface ClientInfoStepProps {
  formData: BookingFormData;
  onUpdate: (data: Partial<BookingFormData>) => void;
  onUpdateField?: (key: keyof BookingFormData, value: any) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const collapseSpacesTrim = (s: string) => s.replace(/ {2,}/g, ' ').replace(/^\s+/, '').replace(/\s+$/, '');
const collapseSpacesKeepTrailing = (s: string) => {
  const hadTrailing = /\s$/.test(s);
  let tmp = s.replace(/ {2,}/g, ' ').replace(/^\s+/, '');
  if (hadTrailing) tmp = tmp + ' ';
  return tmp;
};

const FloatingInput: React.FC<{
  id: string;
  label: string;
  type?: string;
  value: string;
  setValue: (v: string) => void;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  preventLeadingSpace?: boolean;
  sanitizeOnBlur?: (v: string) => string;
}> = ({ id, label, type = 'text', value, setValue, inputMode, inputProps, preventLeadingSpace, sanitizeOnBlur }) => {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || (value != null && String(value).length > 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (preventLeadingSpace) val = val.replace(/^\s+/, '');
    val = collapseSpacesKeepTrailing(val);
    setValue(val);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text') || '';
    let cleaned = text;
    if (preventLeadingSpace) cleaned = cleaned.replace(/^\s+/, '');
    cleaned = collapseSpacesKeepTrailing(cleaned);
    setValue((value || '') + cleaned);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (typeof sanitizeOnBlur === 'function') {
      const final = sanitizeOnBlur(value || '');
      if (final !== (value || '')) setValue(final);
    } else {
      const final = collapseSpacesTrim(value || '');
      if (final !== (value || '')) setValue(final);
    }
  };

  return (
    <div className="relative">
      <label
        htmlFor={id}
        className={`absolute left-4 transition-all duration-150 pointer-events-none ${
          isActive ? '-top-2 text-xs bg-white px-1 rounded' : 'top-1/2 -translate-y-1/2 text-gray-400'
        }`}
        style={{ fontFamily: 'Poppins', color: isActive ? '#0B5858' : undefined }}
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onChange={handleChange}
        onPaste={handlePaste}
        inputMode={inputMode}
        onKeyDown={(e) => {
          if (preventLeadingSpace && e.key === ' ' && (!value || value.length === 0)) {
            e.preventDefault();
            return;
          }
          if (inputProps?.onKeyDown) inputProps.onKeyDown(e as any);
        }}
        {...inputProps}
        className={`w-full py-3 pl-4 pr-4 border rounded-xl transition-all duration-150 ${
          isActive ? 'border-transparent ring-2 ring-[#549F74]' : 'border-gray-300'
        } focus:outline-none`}
        style={{ fontFamily: 'Poppins', fontWeight: 400 }}
      />
    </div>
  );
};

const FloatingDateParts: React.FC<{
  id: string;
  label: string;
  valueYMD?: string;
  onChange: (ymd: string) => void;
  allowFuture?: boolean;
}> = ({ id, label, valueYMD = '', onChange, allowFuture = false }) => {
  const [month, setMonth] = useState<string>('');
  const [day, setDay] = useState<string>('');
  const [year, setYear] = useState<string>('');

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 120;
  const years = useMemo(() => {
    const a: string[] = [];
    for (let y = currentYear; y >= minYear; y--) a.push(String(y).padStart(4, '0'));
    return a;
  }, [currentYear]);

  const months = useMemo(() => ['01','02','03','04','05','06','07','08','09','10','11','12'], []);

  const maxDayForMonthYear = useMemo(() => {
    const yNum = parseInt(year || String(currentYear), 10);
    const mNum = parseInt(month || '1', 10);
    if (!Number.isFinite(yNum) || !Number.isFinite(mNum) || mNum < 1 || mNum > 12) return 31;
    return new Date(yNum, mNum, 0).getDate();
  }, [month, year, currentYear]);

  const days = useMemo(() => {
    const arr: string[] = [];
    for (let d = 1; d <= maxDayForMonthYear; d++) arr.push(String(d).padStart(2, '0'));
    return arr;
  }, [maxDayForMonthYear]);

  const lastAppliedPropRef = useRef<string>('');

  useEffect(() => {
    if (valueYMD && /^\d{4}-\d{2}-\d{2}$/.test(valueYMD)) {
      if (valueYMD === lastAppliedPropRef.current) return;
      const [y, m, d] = valueYMD.split('-');
      setYear((prev) => (prev === y ? prev : y));
      setMonth((prev) => (prev === m ? prev : m));
      setDay((prev) => (prev === d ? prev : d));
      lastAppliedPropRef.current = valueYMD;
      return;
    }

    if (!valueYMD) {
      if (year || month || day) {
        setYear('');
        setMonth('');
        setDay('');
      }
      lastAppliedPropRef.current = '';
    }
  }, [valueYMD]);

  useEffect(() => {
    if (!month || !day || !year) return;

    const yNum = parseInt(year, 10);
    const mNum = parseInt(month, 10);
    const dNum = parseInt(day, 10);
    if (!Number.isFinite(yNum) || !Number.isFinite(mNum) || !Number.isFinite(dNum)) return;
    if (mNum < 1 || mNum > 12) return;

    const maxDay = new Date(yNum, mNum, 0).getDate();
    if (dNum < 1 || dNum > maxDay) return;

    const candidate = new Date(yNum, mNum - 1, dNum);
    if (!allowFuture) {
      const today = new Date();
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      if (candidate.getTime() > todayOnly.getTime()) return;
    }

    const ymd = `${String(yNum).padStart(4, '0')}-${String(mNum).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;

    if (valueYMD !== ymd) {
      lastAppliedPropRef.current = ymd;
      onChange(ymd);
    }
  }, [month, day, year, allowFuture, onChange, valueYMD]);

  const onYearChange = (newYear: string) => {
    setYear(newYear);
    if (month) {
      const yNum = parseInt(newYear || String(currentYear), 10);
      const mNum = parseInt(month || '1', 10);
      if (Number.isFinite(yNum) && Number.isFinite(mNum)) {
        const maxDay = new Date(yNum, mNum, 0).getDate();
        if (day && parseInt(day, 10) > maxDay) setDay(String(maxDay).padStart(2, '0'));
      }
    }
  };

  return (
    <div>
      <div className="rounded-xl bg-white flex items-center border px-1 border-gray-300">
        <div className="w-1/3 px-2">
          <label className="sr-only" htmlFor={`${id}-month`}>Month</label>
          <select
            id={`${id}-month`}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full py-3 pl-2 pr-2 bg-transparent"
            aria-label={`${label} month`}
            style={{ fontFamily: 'Poppins' }}
          >
            <option value="">{'MM'}</option>
            {months.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div className="h-7 w-px bg-gray-200 mx-2" />

        <div className="w-1/4 px-2">
          <label className="sr-only" htmlFor={`${id}-day`}>Day</label>
          <select
            id={`${id}-day`}
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-full py-3 pl-2 pr-2 bg-transparent"
            aria-label={`${label} day`}
            style={{ fontFamily: 'Poppins' }}
          >
            <option value="">{'DD'}</option>
            {days.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="h-7 w-px bg-gray-200 mx-2" />

        <div className="w-5/12 px-2">
          <label className="sr-only" htmlFor={`${id}-year`}>Year</label>
          <select
            id={`${id}-year`}
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full py-3 pl-2 pr-2 bg-transparent"
            aria-label={`${label} year`}
            style={{ fontFamily: 'Poppins' }}
          >
            <option value="">{'YYYY'}</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

const PhoneInput: React.FC<{
  id: string;
  label: string;
  value: string;
  setValue: (v: string) => void;
  maxDigits?: number;
}> = ({ id, label, value, setValue, maxDigits }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);

  const countries = [
    { code: '+63', name: 'Philippines', flag: '🇵🇭' },
    { code: '+1', name: 'United States', flag: '🇺🇸' },
    { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
    { code: '+81', name: 'Japan', flag: '🇯🇵' },
    { code: '+86', name: 'China', flag: '🇨🇳' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+39', name: 'Italy', flag: '🇮🇹' },
  ];

  const formatPhoneNumber = (digits: string, countryCode: string) => {
    const d = digits.replace(/\D/g, '');
    if (countryCode === '+63' || countryCode === '+1') {
      return d.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3').trim();
    } else if (countryCode === '+44') {
      return d.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3').trim();
    } else if (countryCode === '+81' || countryCode === '+86') {
      return d.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3').trim();
    } else if (countryCode === '+91') {
      return d.replace(/(\d{5})(\d{5})/, '$1 $2').trim();
    } else if (countryCode === '+61') {
      return d.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3').trim();
    } else if (countryCode === '+49') {
      return d.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3').trim();
    } else if (countryCode === '+33') {
      return d.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5').trim();
    } else if (countryCode === '+39') {
      return d.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3').trim();
    }
    return d;
  };

  const parseStored = (stored: string) => {
    if (!stored) return { code: '+63', rest: '' };
    const m = stored.match(/^(\+\d{1,3})\s*(.*)$/);
    if (m) return { code: m[1], rest: m[2].replace(/\D/g, '') };
    return { code: '+63', rest: stored.replace(/\D/g, '') };
  };

  const initial = parseStored(value);
  const [countryCode, setCountryCode] = useState<string>(initial.code);
  const [rawDigits, setRawDigits] = useState<string>(initial.rest.slice(0, maxDigits ?? initial.rest.length));

  useEffect(() => {
    const digits = maxDigits ? rawDigits.slice(0, maxDigits) : rawDigits;
    const formatted = formatPhoneNumber(digits, countryCode);
    const combined = formatted ? `${countryCode} ${formatted}` : '';
    if (combined !== value) setValue(combined);
  }, [countryCode, rawDigits, maxDigits, setValue, value]);

  useEffect(() => {
    const parsed = parseStored(value);
    if (parsed.code !== countryCode) setCountryCode(parsed.code);
    const trimmed = parsed.rest.slice(0, maxDigits ?? parsed.rest.length);
    if (trimmed !== rawDigits) setRawDigits(trimmed);
  }, [value, maxDigits]);

  useEffect(() => {
    if (typeof maxDigits === 'number' && rawDigits.length > maxDigits) {
      const trimmed = rawDigits.slice(0, maxDigits);
      setRawDigits(trimmed);
      const formatted = formatPhoneNumber(trimmed, countryCode);
      const combined = formatted ? `${countryCode} ${formatted}` : '';
      if (combined !== value) setValue(combined);
    }
  }, [maxDigits]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setShowCountryDropdown(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const labelActive = isFocused || rawDigits.length > 0;

  return (
    <div ref={wrapperRef} className="relative">
      {labelActive && (
        <label className="absolute left-4 -top-2 text-xs bg-white px-1 rounded" style={{ fontFamily: 'Poppins', color: '#0B5858' }}>
          {label}
        </label>
      )}

      <div className={`rounded-xl bg-white flex items-center border px-1 ${labelActive ? 'border-transparent ring-2 ring-[#549F74]' : 'border-gray-300'}`}>
        <div className="relative country-dropdown">
          <button
            type="button"
            onClick={() => setShowCountryDropdown(s => !s)}
            className="flex items-center gap-2 py-3 pl-3 pr-3 rounded-l-xl text-gray-700"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 100)}
            aria-haspopup="listbox"
            aria-expanded={showCountryDropdown}
            style={{ fontFamily: 'Poppins' }}
          >
            <span className="text-sm">{countryCode}</span>
            <svg className="w-3 h-3 opacity-80" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.354a.75.75 0 111.14.976l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z" />
            </svg>
          </button>

          {showCountryDropdown && (
            <div className="absolute z-50 top-full left-0 mt-1 w-64 max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg">
              {countries.map(c => (
                <div
                  key={c.code}
                  className="flex items-center gap-3 px-3 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCountryCode(c.code);
                    setShowCountryDropdown(false);
                    const digits = maxDigits ? rawDigits.slice(0, maxDigits) : rawDigits;
                    const formatted = formatPhoneNumber(digits, c.code);
                    const combined = formatted ? `${c.code} ${formatted}` : '';
                    if (combined !== value) setValue(combined);
                  }}
                  style={{ fontFamily: 'Poppins' }}
                >
                  <span className="text-lg">{c.flag}</span>
                  <div className="text-sm">
                    <div style={{ fontFamily: 'Poppins', fontWeight: 500 }}>{c.name}</div>
                    <div className="text-xs text-gray-500">{c.code}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-7 w-px bg-gray-200 mx-2" />

        <input
          id={id}
          type="text"
          value={formatPhoneNumber(rawDigits, countryCode)}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '');
            const limited = typeof maxDigits === 'number' ? digits.slice(0, maxDigits) : digits;
            setRawDigits(limited);
            const formatted = formatPhoneNumber(limited, countryCode);
            const combined = formatted ? `${countryCode} ${formatted}` : '';
            if (combined !== value) setValue(combined);
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 100)}
          placeholder={labelActive ? '' : 'Enter phone number'}
          className="flex-1 py-3 pl-2 pr-4 focus:outline-none"
          inputMode="tel"
          style={{ fontFamily: 'Poppins' }}
          aria-label="Phone number"
        />
      </div>
    </div>
  );
};

const ClientInfoStep: React.FC<ClientInfoStepProps> = ({ formData, onUpdate, onUpdateField, onNext, onBack, onCancel }) => {
  const updateField = (k: keyof BookingFormData, v: any) => {
    if (typeof onUpdateField === 'function') {
      try {
        onUpdateField(k, v);
      } catch {
        onUpdate({ [k]: v });
      }
    } else {
      onUpdate({ [k]: v });
    }
  };

  const sanitizeName = (input: string) => {
    const cleaned = input.replace(/[^\p{L}\s'-]/gu, '');
    return collapseSpacesTrim(cleaned);
  };

  const sanitizeGeneric = (input: string) => {
    const cleaned = input.replace(/[^\p{L}\p{N}\s\.'-]/gu, '');
    return collapseSpacesTrim(cleaned);
  };

  const isValidEmail = (email: string) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  };

  const dob = formData.dateOfBirth ?? '';
  const handleDobChange = (ymd: string) => updateField('dateOfBirth', ymd);

  const age = useMemo<number | null>(() => {
    if (!dob || !/^\d{4}-\d{2}-\d{2}$/.test(dob)) return null;
    const [y, m, d] = dob.split('-').map((s) => parseInt(s, 10));
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    const birth = new Date(y, m - 1, d);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let computedAge = today.getFullYear() - birth.getFullYear();
    const thisYearBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (today < thisYearBirthday) computedAge--;
    return computedAge;
  }, [dob]);

  const isUnder18 = age !== null && age < 18;

  const [under18NotifDismissed, setUnder18NotifDismissed] = useState(false);
  useEffect(() => {
    setUnder18NotifDismissed(false);
  }, [dob]);

  const emailInvalid = (formData.email ?? '').trim().length > 0 && !isValidEmail(formData.email ?? '');

  const isFormValid = useMemo(() => {
    return !!(
      (formData.firstName ?? '').trim() &&
      (formData.lastName ?? '').trim() &&
      (formData.email ?? '').trim() &&
      (formData.preferredContactNumber ?? '').trim() &&
      (formData.gender ?? '').trim() &&
      (dob ? age !== null && age >= 18 : true)
    );
  }, [formData, dob, age]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" style={{ fontFamily: 'Poppins' }}>
      <h2 className="text-2xl font-bold text-[#0B5858] mb-1">Client Information</h2>
      <p className="text-sm text-gray-500 mb-4">Please fill in your client details to continue</p>

      {isUnder18 && !under18NotifDismissed && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 flex items-start justify-between" role="alert">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.68-1.36 3.445 0l5.518 9.814c.75 1.334-.213 2.987-1.722 2.987H4.462c-1.51 0-2.472-1.653-1.722-2.987L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-9a1 1 0 00-.993.883L9 6v4a1 1 0 001.993.117L11 10V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <div className="font-medium text-red-800">Booking not allowed</div>
              <div className="text-xs text-red-700">Client must be at least 18 years old to book.</div>
            </div>
          </div>

          <button type="button" onClick={() => setUnder18NotifDismissed(true)} aria-label="Dismiss notification" className="text-red-600 hover:text-red-800 p-1" style={{ fontFamily: 'Poppins' }}>
            ✕
          </button>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FloatingInput
            id="firstName"
            label="First Name *"
            value={formData.firstName ?? ''}
            setValue={(v) => updateField('firstName', v)}
            preventLeadingSpace
            sanitizeOnBlur={(v) => (v === '' ? '' : sanitizeName(v))}
          />
          <FloatingInput
            id="lastName"
            label="Last Name *"
            value={formData.lastName ?? ''}
            setValue={(v) => updateField('lastName', v)}
            preventLeadingSpace
            sanitizeOnBlur={(v) => (v === '' ? '' : sanitizeName(v))}
          />
          <div>
            <FloatingInput
              id="email"
              label="Email *"
              type="email"
              value={formData.email ?? ''}
              setValue={(v) => updateField('email', v)}
              preventLeadingSpace
              sanitizeOnBlur={(v) => v.replace(/\s+/g, '')}
            />
            {emailInvalid && (
              <div className="mt-1 text-xs text-yellow-700" style={{ fontFamily: 'Poppins' }}>
                Please enter a valid email (e.g., name@gmail.com). This is a notification only.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          <FloatingInput
            id="nickname"
            label="Nickname"
            value={formData.nickname ?? ''}
            setValue={(v) => updateField('nickname', v)}
            preventLeadingSpace
            sanitizeOnBlur={(v) => (v === '' ? '' : sanitizeGeneric(v))}
          />

          <div className="flex flex-col">
            <FloatingDateParts id="dateOfBirth" label="Date of Birth" valueYMD={dob} onChange={handleDobChange} allowFuture={false} />
            <div className="mt-2 text-sm">
              {dob && age === null && <div className="text-yellow-700" style={{ fontFamily: 'Poppins' }}>Please provide a valid date.</div>}
            </div>
          </div>

          <FloatingInput
            id="referredBy"
            label="Referred by"
            value={formData.referredBy ?? ''}
            setValue={(v) => updateField('referredBy', v)}
            preventLeadingSpace
            sanitizeOnBlur={(v) => (v === '' ? '' : sanitizeGeneric(v))}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm text-gray-700 mb-3">Gender *</label>
            <div className="flex space-x-3">
              {[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' }
              ].map((option) => (
                <button key={option.value} onClick={() => updateField('gender', option.value)} className={`px-4 py-2 rounded-full border transition-colors ${(formData.gender === option.value) ? 'border-[#0B5858] bg-[#0B5858] text-white' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`} style={{ fontFamily: 'Poppins' }}>
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <PhoneInput
              id="preferredContactNumber"
              label="Preferred Contact Number"
              value={formData.preferredContactNumber ?? ''}
              setValue={(v) => updateField('preferredContactNumber', v)}
              maxDigits={formData.contactType === 'mobile' ? 10 : undefined}
            />

            <div className="flex space-x-4 mt-3">
              {[
                { value: 'home', label: 'Home' },
                { value: 'mobile', label: 'Mobile' },
                { value: 'work', label: 'Work' }
              ].map((option) => (
                <label key={option.value} className="flex items-center">
                  <input type="radio" name="contactType" value={option.value} checked={formData.contactType === option.value} onChange={() => updateField('contactType', option.value)} className="w-4 h-4 text-[#0B5858] border-gray-300 focus:ring-[#0B5858]" />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
        <button onClick={onCancel} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontFamily: 'Poppins' }}>Cancel</button>
        <button onClick={onBack} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors" style={{ fontFamily: 'Poppins' }}>Back</button>
        <button onClick={onNext} disabled={!isFormValid || isUnder18} className="px-6 py-2 bg-[#0B5858] text-white rounded-lg hover:bg-[#0a4a4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontFamily: 'Poppins' }}>Next</button>
      </div>
    </div>
  );
};

export default ClientInfoStep;