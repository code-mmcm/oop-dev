import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../lib/logger';

// Floating input extracted to top-level to keep component identity stable across renders
const FloatingInput: React.FC<{
  id: string;
  label: string;
  type?: string;
  value: string;
  setValue: (v: string) => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  pattern?: string;
  floating?: boolean;
}> = ({ id, label, type = 'text', value, setValue, leftIcon, rightIcon, inputMode, pattern, floating = true }) => {
  const labelLeftClass = leftIcon ? 'left-12' : 'left-4';
  const inputPaddingLeft = leftIcon ? 'pl-12' : 'pl-4';
  const inputPaddingRight = rightIcon ? 'pr-12' : 'pr-4';
  if (!floating) {
    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center z-10" style={{backgroundColor: '#0B5858'}}>
            {leftIcon}
          </div>
        )}
        <label htmlFor={id} className="block mb-1 text-sm text-gray-600 text-left" style={{fontFamily: 'Poppins'}}>
          {label}
        </label>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode={inputMode}
          pattern={pattern}
          className={`w-full py-3 ${inputPaddingLeft} ${inputPaddingRight} text-left border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-md`}
          style={{
            fontFamily: 'Poppins', 
            fontWeight: 400,
            '--tw-ring-color': '#549F74',
          } as React.CSSProperties}
        />
      </div>
    );
  }
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || (value != null && String(value).length > 0);
  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center z-10" style={{backgroundColor: '#0B5858'}}>
          {leftIcon}
        </div>
      )}
      <label
        htmlFor={id}
        className={`absolute ${labelLeftClass} transition-all duration-200 pointer-events-none text-left ${
          isActive ? '-top-2 text-xs bg-white px-1 rounded' : 'top-1/2 -translate-y-1/2 text-gray-500'
        }`}
        style={{
          fontFamily: 'Poppins',
          color: isActive ? '#0B5858' : undefined
        }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => setValue(e.target.value)}
        inputMode={inputMode}
        pattern={pattern}
        className={`w-full py-3 ${inputPaddingLeft} ${inputPaddingRight} text-left border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-md`}
        style={{
          fontFamily: 'Poppins', 
          fontWeight: 400,
          '--tw-ring-color': '#549F74',
        } as React.CSSProperties}
      />
      {rightIcon && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          {rightIcon}
        </div>
      )}
    </div>
  );
};

/**
 * SignUp component renders a two-step registration form with floating labels.
 * Step 1 captures personal information; Step 2 handles account credentials.
 * We mirror the Login page layout and background for visual consistency.
 */
const SignUp: React.FC = () => {
  // Step control state
  const [step, setStep] = useState<1 | 2>(1);

  // Personal Info state
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [birthMonth, setBirthMonth] = useState<string>('');
  const [birthDay, setBirthDay] = useState<string>('');
  const [birthYear, setBirthYear] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [street, setStreet] = useState<string>('');
  const [barangay, setBarangay] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');

  // Account Setup state
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countryCode, setCountryCode] = useState('+63');
  const [isFocused, setIsFocused] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);

  // Country data with formatting patterns
  const countries = [
    { code: '+63', name: 'Philippines', flag: '🇵🇭', pattern: /^(\d{3})(\d{3})(\d{4})$/ },
    { code: '+1', name: 'United States', flag: '🇺🇸', pattern: /^(\d{3})(\d{3})(\d{4})$/ },
    { code: '+44', name: 'United Kingdom', flag: '🇬🇧', pattern: /^(\d{4})(\d{3})(\d{3})$/ },
    { code: '+81', name: 'Japan', flag: '🇯🇵', pattern: /^(\d{3})(\d{4})(\d{4})$/ },
    { code: '+86', name: 'China', flag: '🇨🇳', pattern: /^(\d{3})(\d{4})(\d{4})$/ },
    { code: '+91', name: 'India', flag: '🇮🇳', pattern: /^(\d{5})(\d{5})$/ },
    { code: '+61', name: 'Australia', flag: '🇦🇺', pattern: /^(\d{4})(\d{3})(\d{3})$/ },
    { code: '+49', name: 'Germany', flag: '🇩🇪', pattern: /^(\d{3})(\d{3})(\d{4})$/ },
    { code: '+33', name: 'France', flag: '🇫🇷', pattern: /^(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})$/ },
    { code: '+39', name: 'Italy', flag: '🇮🇹', pattern: /^(\d{3})(\d{3})(\d{4})$/ },
  ];

  // Format phone number based on country pattern
  const formatPhoneNumber = (value: string, countryCode: string) => {
    const country = countries.find(c => c.code === countryCode);
    if (!country) return value;
    
    const digits = value.replace(/\D/g, '');
    
    if (countryCode === '+63' || countryCode === '+1') {
      // Format: XXX XXX XXXX
      return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    } else if (countryCode === '+44') {
      // Format: XXXX XXX XXX
      return digits.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    } else if (countryCode === '+81' || countryCode === '+86') {
      // Format: XXX XXXX XXXX
      return digits.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
    } else if (countryCode === '+91') {
      // Format: XXXXX XXXXX
      return digits.replace(/(\d{5})(\d{5})/, '$1 $2');
    } else if (countryCode === '+61') {
      // Format: XXXX XXX XXX
      return digits.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    } else if (countryCode === '+49') {
      // Format: XXX XXX XXXX
      return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    } else if (countryCode === '+33') {
      // Format: X XX XX XX XX
      return digits.replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
    } else if (countryCode === '+39') {
      // Format: XXX XXX XXXX
      return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    }
    
    return digits;
  };

  const { signUp } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength(password);
  const isPasswordMatch = password === confirmPassword && confirmPassword.length > 0;

  // Reformat phone number when country code changes
  React.useEffect(() => {
    if (phone) {
      const formatted = formatPhoneNumber(phone, countryCode);
      setPhone(formatted);
    }
  }, [countryCode]);


  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showCountryDropdown && !target.closest('.country-dropdown')) {
        setShowCountryDropdown(false);
      }
      if (showMonthDropdown && !target.closest('.month-dropdown')) {
        setShowMonthDropdown(false);
      }
      if (showGenderDropdown && !target.closest('.gender-dropdown')) {
        setShowGenderDropdown(false);
      }
    };

    if (showCountryDropdown || showMonthDropdown || showGenderDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCountryDropdown, showMonthDropdown, showGenderDropdown]);

  // Computed flags for validation control
  const isStep1Valid = useMemo(() => {
    const dayNum = Number(birthDay);
    const yearNum = Number(birthYear);
    const currentYear = new Date().getFullYear();
    const monthOk = !!birthMonth;
    const dayOk = Number.isFinite(dayNum) && dayNum >= 1 && dayNum <= 31;
    const yearOk = Number.isFinite(yearNum) && yearNum >= 1900 && yearNum <= currentYear;
    return (
      firstName.trim().length > 0 &&
      lastName.trim().length > 0 &&
      monthOk && dayOk && yearOk &&
      gender.trim().length > 0 &&
      street.trim().length > 0 &&
      barangay.trim().length > 0 &&
      city.trim().length > 0 &&
      /^\d{4,}$/.test(zipCode.trim())
    );
  }, [firstName, lastName, birthMonth, birthDay, birthYear, gender, street, barangay, city, zipCode]);

  const isStep2Valid = useMemo(() => {
    const emailOk = /.+@.+\..+/.test(email.trim());
    const phoneOk = phone.trim().length >= 7; // simple guard; future: use lib for locality
    const pwdOk = password.length >= 6;
    const matchOk = password === confirmPassword;
    return emailOk && phoneOk && pwdOk && matchOk;
  }, [email, phone, password, confirmPassword]);

  // Handlers
  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep1Valid) {
      setError('Please complete all required fields in Personal Info.');
      logger.warn('Step 1 validation failed');
      return;
    }
    setError('');
    logger.info('Step 1 saved, proceeding to Step 2');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep2Valid) {
      setError('Please fix errors in Account Setup before submitting.');
      logger.warn('Step 2 validation failed');
      return;
    }

    // Prevent double submission
    if (loading) {
      console.log('SignUp Component: Already processing, ignoring duplicate submission');
      return;
    }

    setLoading(true);
    setError('');
    logger.info('Attempting user sign up', { email });

    try {
      // Prepare user profile data
      const fullname = `${firstName.trim()} ${lastName.trim()}`;
      const birthDate = `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`;
      const address = `${street.trim()}, ${barangay.trim()}, ${city.trim()}, ${zipCode.trim()}`;
      
      // Convert phone number to numeric (remove spaces and country code for storage)
      const phoneDigits = phone.replace(/\D/g, '');
      const contactNumber = parseInt(phoneDigits, 10);

      const userProfile = {
        fullname,
        birth: birthDate,
        contact_number: contactNumber,
        gender,
        address,
      };

      console.log('SignUp Component: Calling signUp with profile:', userProfile);

      const { error } = await signUp(email, password, userProfile);
      if (error) {
        console.error('SignUp Component: Sign up error', error);
        logger.error('Sign up error', error);
        setError(error.message || 'Sign up failed');
        return;
      }

      console.log('SignUp Component: Sign up success, redirecting to home');
      logger.info('Sign up success, redirecting to home');
      navigate('/');
    } catch (err) {
      console.error('SignUp Component: Unexpected sign up exception', err);
      logger.error('Unexpected sign up exception', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // (Removed inner FloatingInput definition; using the top-level one above to keep identity stable)

  // Note: Birth date uses standard labeled controls (no floating labels) per spec

  return (
    <div className="min-h-screen flex relative" style={{backgroundColor: '#0B5858'}}>
      {/* Background design image - full page */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: "url('./bg.svg')"
        }}
      />

      {/* Left Section - Welcome Panel */}
      <div className="flex-1 relative overflow-hidden z-10">
        <div className="relative z-10 p-12 h-full flex flex-col">
          {/* Logo */}
          <div className="pt-8 mb-16 ml-13">
            <Link to="/" className="block">
              <img src="/logo.svg" alt="kelsey's homestay" className="h-24 w-auto hover:opacity-80 transition-opacity" />
            </Link>
          </div>

          {/* Greeting */}
          <div className="mb-6 ml-16 mt-16">
            <h1 className="text-white text-6xl mb-2" style={{fontFamily: 'Poppins', fontWeight: 400}}>
              Hello,<br />
              <span className="text-yellow-400" style={{fontFamily: 'Poppins', fontWeight: 600}}>welcome!</span>
            </h1>
          </div>

          {/* Tagline */}
          <div className="ml-16">
            <p className="text-white text-3xl" style={{fontFamily: 'Poppins', fontWeight: 400}}>
              A welcoming stay, the Kelsey's way
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Sign Up Form */}
      <div className="flex-1 flex items-center justify-center p-12 relative z-10">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-3xl shadow-xl p-10">
            {/* Title */}
            <h2 className="text-black text-center text-3xl mb-2 animate-fade-in" style={{fontFamily: 'Poppins', fontWeight: 700}}>
              Create an Account
            </h2>

            {/* Login Link */}
            <p className="text-gray-600 text-center text-sm mb-8 animate-fade-in" style={{fontFamily: 'Poppins', fontWeight: 400}}>
              Already have an account? <Link to="/login" className="underline cursor-pointer" style={{color: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>Log In</Link>
            </p>

            {/* Enhanced Step Indicator - Circles with connecting line */}
            <div className="flex items-center justify-center mb-8 animate-fade-in">
              <div className="flex items-center relative">
                {/* Step 1 Circle */}
                <div className="flex flex-col items-center relative z-10 mr-8">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    step === 1 
                      ? 'border-teal-600 bg-teal-50' 
                      : step > 1 
                        ? 'border-teal-600 bg-teal-600' 
                        : 'border-gray-300 bg-white'
                  }`}>
                    {step > 1 ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`text-xs font-semibold ${
                        step === 1 ? 'text-teal-600' : 'text-gray-400'
                      }`}>1</span>
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium whitespace-nowrap ${
                    step === 1 ? 'text-teal-600' : step > 1 ? 'text-teal-600' : 'text-gray-400'
                  }`}>Personal Info</span>
                </div>
                
                {/* Connecting Line - positioned at center of circles */}
                <div className={`absolute h-0.5 w-16 transition-all duration-300 ${
                  step > 1 ? 'bg-teal-600' : 'bg-gray-300'
                }`} style={{
                  left: '50%',
                  top: 'calc(50% - 12px)',
                  transform: 'translate(-50%, -50%)'
                }}></div>
                
                {/* Step 2 Circle */}
                <div className="flex flex-col items-center relative z-10 ml-8">
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                    step === 2 
                      ? 'border-teal-600 bg-teal-50' 
                      : step > 2 
                        ? 'border-teal-600 bg-teal-600' 
                        : 'border-gray-300 bg-white'
                  }`}>
                    {step > 2 ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`text-xs font-semibold ${
                        step === 2 ? 'text-teal-600' : 'text-gray-400'
                      }`}>2</span>
                    )}
                  </div>
                  <span className={`text-xs mt-2 font-medium whitespace-nowrap ${
                    step === 2 ? 'text-teal-600' : step > 2 ? 'text-teal-600' : 'text-gray-400'
                  }`}>Account Setup</span>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm" style={{fontFamily: 'Poppins'}}>
                {error}
              </div>
            )}

            {/* Step Content */}
            <div className="relative">
              {step === 1 ? (
                <form onSubmit={handleContinue} className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
                  <FloatingInput id="firstName" label="First Name" value={firstName} setValue={setFirstName} />
                  <FloatingInput id="lastName" label="Last Name" value={lastName} setValue={setLastName} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
                  {/* Birth Date unified container: MM | DD | YYYY */}
                  <div 
                    className="relative border border-gray-300 rounded-xl hover:border-gray-400 hover:shadow-md transition-all duration-300 focus-within:ring-2"
                    style={{ 
                      borderColor: 'rgb(209 213 219)', // gray-300
                      '--tw-ring-color': '#549F74',
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.boxShadow = '0 0 0 2px #549F74';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgb(209 213 219)'; // gray-300
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div className="grid items-center px-1" style={{ gridTemplateColumns: '41.6667% 25% 41.6667%' }}>
                      {/* Month dropdown */}
                      <div className="relative month-dropdown">
                        <div 
                          className="flex items-center justify-between py-3 pl-4 pr-3 cursor-pointer rounded-l-xl"
                          onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                        >
                          <span className={`${birthMonth ? 'text-black' : 'text-gray-500'}`} style={{fontFamily: 'Poppins', fontWeight: 400}}>
                            {birthMonth || 'MM'}
                          </span>
                          <img src="/dropdown_icon.svg" alt="dropdown" className="h-5 w-5 opacity-90" />
                        </div>
                        
                        {/* Month Dropdown Options */}
                        {showMonthDropdown && (
                          <div className="absolute top-full left-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-full max-h-48 overflow-y-auto">
                            {[
                              { value: '01', label: '01' },
                              { value: '02', label: '02' },
                              { value: '03', label: '03' },
                              { value: '04', label: '04' },
                              { value: '05', label: '05' },
                              { value: '06', label: '06' },
                              { value: '07', label: '07' },
                              { value: '08', label: '08' },
                              { value: '09', label: '09' },
                              { value: '10', label: '10' },
                              { value: '11', label: '11' },
                              { value: '12', label: '12' }
                            ].map((month) => (
                              <div
                                key={month.value}
                                className="flex items-center py-3 px-4 hover:bg-gray-50 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBirthMonth(month.value);
                                  setShowMonthDropdown(false);
                                }}
                              >
                                <span className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                                  {month.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Separator after MM (moved slightly right) */}
                      <div className="absolute top-1/2 -translate-y-1/2 h-7 w-px bg-gray-300" style={{ left: '44%' }} />
                      {/* Day input */}
                      <div>
                        <input
                          id="birthDay"
                          value={birthDay}
                          onChange={(e) => setBirthDay(e.target.value.replace(/\D/g, '').slice(0, 2))}
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="DD"
                          autoComplete="off"
                          className="w-full py-3 pl-4 pr-2 text-left focus:outline-none"
                          style={{fontFamily: 'Poppins', fontWeight: 400}}
                        />
                      </div>
                      {/* Separator after DD (5/12 + 3/12 = 8/12 = 66.6667%) */}
                      <div className="absolute top-1/2 -translate-y-1/2 h-7 w-px bg-gray-300" style={{ left: '66.6667%' }} />
                      {/* Year input */}
                      <div>
                        <input
                          id="birthYear"
                          value={birthYear}
                          onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="YYYY"
                          autoComplete="off"
                          className="w-full py-3 pl-4 pr-4 text-left rounded-r-xl focus:outline-none"
                          style={{fontFamily: 'Poppins', fontWeight: 400}}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <label htmlFor="gender" className={`absolute left-4 transition-all duration-200 pointer-events-none ${gender ? '-top-2 text-xs bg-white px-1 rounded' : 'top-1/2 -translate-y-1/2 text-gray-500'}`} style={{
                      fontFamily: 'Poppins',
                      color: gender ? '#0B5858' : undefined
                    }}>Gender</label>
                    <div 
                      className="flex border border-gray-300 rounded-xl hover:border-gray-400 hover:shadow-md transition-all duration-300 focus-within:ring-2"
                      style={{ 
                        '--tw-ring-color': '#549F74',
                        borderColor: 'rgb(209 213 219)', // gray-300
                      } as React.CSSProperties}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.boxShadow = '0 0 0 2px #549F74';
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = 'rgb(209 213 219)'; // gray-300
                        e.currentTarget.style.boxShadow = '';
                      }}
                    >
                      {/* Gender Selector - Custom Dropdown */}
                      <div className="relative gender-dropdown w-full">
                        <div 
                          className="flex items-center justify-between py-3 pl-4 pr-3 cursor-pointer rounded-xl"
                          onClick={() => setShowGenderDropdown(!showGenderDropdown)}
                        >
                          <span className={`${gender ? 'text-black' : 'text-gray-500'}`} style={{fontFamily: 'Poppins', fontWeight: 400}}>
                            {gender || ''}
                          </span>
                          <img src="/dropdown_icon.svg" alt="dropdown" className="h-5 w-5 opacity-90" />
                        </div>
                        
                        {/* Gender Dropdown Options */}
                        {showGenderDropdown && (
                          <div className="absolute top-full left-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-full max-h-48 overflow-y-auto">
                            {[
                              { value: 'Male', label: 'Male' },
                              { value: 'Female', label: 'Female' },
                              { value: 'Non-binary', label: 'Non-binary' },
                              { value: 'Prefer not to say', label: 'Prefer not to say' }
                            ].map((genderOption) => (
                              <div
                                key={genderOption.value}
                                className="flex items-center py-3 px-4 hover:bg-gray-50 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setGender(genderOption.value);
                                  setShowGenderDropdown(false);
                                }}
                              >
                                <span className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                                  {genderOption.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
                  <FloatingInput id="street" label="Street" value={street} setValue={setStreet} />
                  <FloatingInput id="barangay" label="Barangay" value={barangay} setValue={setBarangay} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
                  <FloatingInput id="city" label="City" value={city} setValue={setCity} />
                  <FloatingInput id="zip" label="ZIP Code" value={zipCode} setValue={(v) => setZipCode(v.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" />
                </div>
                <button
                  type="submit"
                  disabled={!isStep1Valid}
                  className="w-full py-3 px-4 rounded-3xl text-white text-lg transition-all duration-300 hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}
                >
                  Save and Continue
                </button>
              </form>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                <FloatingInput id="email" label="Email" type="email" value={email} setValue={setEmail} />
                {/* Phone Number with Country Code */}
                <div className="relative">
                  <div 
                    className="flex border border-gray-300 rounded-xl hover:border-gray-400 hover:shadow-md transition-all duration-300 focus-within:ring-2"
                    style={{ 
                      '--tw-ring-color': '#549F74',
                      borderColor: 'rgb(209 213 219)', // gray-300
                    } as React.CSSProperties}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.boxShadow = '0 0 0 2px #549F74';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgb(209 213 219)'; // gray-300
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    {/* Country Code Selector - Custom Dropdown */}
                    <div className="relative border-r border-gray-300 rounded-l-xl country-dropdown">
                      <div 
                        className="flex items-center justify-between py-3 pl-4 pr-3 cursor-pointer rounded-l-xl"
                        onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                        style={{minWidth: '80px'}}
                      >
                        <span className="text-gray-700" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                          {countryCode}
                        </span>
                        <img src="/dropdown_icon.svg" alt="dropdown" className="h-5 w-5 opacity-90" />
                      </div>
                      
                      {/* Dropdown Options */}
                      {showCountryDropdown && (
                        <div className="absolute top-full left-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-64 max-h-48 overflow-y-auto">
                          {countries.map((country) => (
                            <div
                              key={country.code}
                              className="flex items-center py-3 px-4 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCountryCode(country.code);
                                setShowCountryDropdown(false);
                              }}
                            >
                              <span className="mr-3 text-lg">{country.flag}</span>
                              <span className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                                {country.name} {country.code}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Phone Number Input */}
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const formatted = formatPhoneNumber(e.target.value, countryCode);
                        setPhone(formatted);
                      }}
                      placeholder="Enter phone number"
                      className="flex-1 py-3 pl-4 pr-4 rounded-r-xl focus:outline-none"
                      style={{fontFamily: 'Poppins', fontWeight: 400}}
                    />
                  </div>
                </div>
                {/* Password with Strength Indicator */}
                <div className="space-y-2">
                  <FloatingInput id="password" label="Password" type="password" value={password} setValue={setPassword} />
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-1">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5, 6].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              level <= passwordStrength
                                ? passwordStrength <= 2
                                  ? 'bg-red-500'
                                  : passwordStrength <= 4
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-500" style={{fontFamily: 'Poppins'}}>
                        {passwordStrength <= 2 && 'Weak'}
                        {passwordStrength > 2 && passwordStrength <= 4 && 'Medium'}
                        {passwordStrength > 4 && 'Strong'}
                      </p>
                    </div>
                  )}
                </div>
                {/* Confirm Password with Validation Icon */}
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full py-3 pl-4 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-md"
                    style={{
                      fontFamily: 'Poppins', 
                      fontWeight: 400,
                      '--tw-ring-color': '#549F74',
                    } as React.CSSProperties}
                  />
                  <label 
                    htmlFor="confirmPassword" 
                    className={`absolute left-4 transition-all duration-200 pointer-events-none ${
                      (confirmPassword || isFocused) ? '-top-2 text-xs bg-white px-1 rounded' : 'top-1/2 -translate-y-1/2 text-gray-500'
                    }`}
                    style={{fontFamily: 'Poppins'}}
                  >
                    Confirm Password
                  </label>
                  {/* Validation Icon */}
                  {confirmPassword && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isPasswordMatch ? (
                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>

                {/* Simple guidance text */}
                <p className="text-xs text-gray-500" style={{fontFamily: 'Poppins'}}>
                  Password must be at least 6 characters and match the confirmation.
                </p>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl text-gray-700 border border-gray-300 hover:bg-gray-50 cursor-pointer"
                    style={{fontFamily: 'Poppins', fontWeight: 500}}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !isStep2Valid}
                    className="py-3 px-6 rounded-3xl text-white text-lg transition-all duration-300 hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}
                  >
                    {loading ? 'Creating...' : 'Create Account'}
                  </button>
                </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;


