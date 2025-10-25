import React from 'react';
import type { BookingFormData, BookingSummary } from '../../../types/booking';

interface PaymentInfoStepProps {
  formData: BookingFormData;
  onUpdate: (data: Partial<BookingFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
}

const PaymentInfoStep: React.FC<PaymentInfoStepProps> = ({
  formData,
  onUpdate,
  onNext,
  onBack,
  onCancel
}) => {
  // Initialize from formData so the selection persists when navigating away/back
  const [selectedMethod, setSelectedMethod] = React.useState<string>(formData.paymentMethod ?? '');
  const [hasInteracted, setHasInteracted] = React.useState<boolean>(!!formData.paymentMethod);

  const [bankReceiptPreview, setBankReceiptPreview] = React.useState<string | null>(null);
  const [billingDocPreview, setBillingDocPreview] = React.useState<string | null>(null);

  // Refs to store created object URLs so we can revoke them later
  const bankReceiptUrlRef = React.useRef<string | null>(null);
  const billingDocUrlRef = React.useRef<string | null>(null);

  // Keep local selection in sync if parent restores/updates paymentMethod in formData
  React.useEffect(() => {
    if (formData.paymentMethod) {
      // avoid unnecessary state updates
      if (formData.paymentMethod !== selectedMethod) {
        setSelectedMethod(formData.paymentMethod);
      }
      setHasInteracted(true);
    } else {
      setSelectedMethod('');
      setHasInteracted(false);
    }
  }, [formData.paymentMethod, selectedMethod]);

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      if (bankReceiptUrlRef.current) {
        try {
          URL.revokeObjectURL(bankReceiptUrlRef.current);
        } catch {
          // ignore
        }
        bankReceiptUrlRef.current = null;
      }
      if (billingDocUrlRef.current) {
        try {
          URL.revokeObjectURL(billingDocUrlRef.current);
        } catch {
          // ignore
        }
        billingDocUrlRef.current = null;
      }
    };
  }, []);

  // ------------------ sanitizers / helpers ------------------

  // Normalize spacing: trim ends and collapse multiple internal whitespace to a single space.
  // This ensures no leading whitespace and at most one internal whitespace sequence.
  const normalizeSpace = (s: string) => {
    if (typeof s !== 'string') return s;
    return s.trim().replace(/\s+/g, ' ');
  };

  const stripLeading = (s: string) => typeof s === 'string' ? s.replace(/^\s+/, '') : s;

  const sanitizeDigits = (value: string) => value.replace(/\D/g, '');
  const sanitizePhone = (value: string) => {
    let v = value.replace(/\s+/g, '');
    v = v.replace(/(?!^\+)\+/g, '');
    v = v.replace(/[^\d+]/g, '');
    return v;
  };
  const sanitizeAlpha = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z\s.'-]/g, '');
    return normalizeSpace(cleaned);
  };
  const sanitizeAlphanumericAndSpace = (value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9\s\-\/&.,]/g, '');
    return normalizeSpace(cleaned);
  };
  const sanitizeExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 6); // allow MMYY or MMYYYY
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    // if user provided MMYYYY, turn into MM/YYYY
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  // Luhn check for basic card number validation
  const luhnCheck = (cardNumber: string): boolean => {
    const digits = (cardNumber || '').replace(/\D/g, '');
    if (digits.length < 12) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = parseInt(digits.charAt(i), 10);
      if (Number.isNaN(d)) return false;
      if (shouldDouble) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Parse expiry and also detect expired vs invalid format
  const parseExpiryInfo = (expiry: string) => {
    if (!expiry) return { validFormat: false, expired: false };
    const cleaned = expiry.trim();
    const mmyy = /^(\d{2})\/(\d{2})$/;
    const mmyyyy = /^(\d{2})\/(\d{4})$/;
    let month = 0;
    let year = 0;
    if (mmyy.test(cleaned)) {
      const [, mm, yy] = cleaned.match(mmyy) as RegExpMatchArray;
      month = parseInt(mm, 10);
      year = 2000 + parseInt(yy, 10);
    } else if (mmyyyy.test(cleaned)) {
      const [, mm, yyyy] = cleaned.match(mmyyyy) as RegExpMatchArray;
      month = parseInt(mm, 10);
      year = parseInt(yyyy, 10);
    } else {
      return { validFormat: false, expired: false };
    }
    if (month < 1 || month > 12) return { validFormat: false, expired: false };
    const expiryDate = new Date(year, month, 0, 23, 59, 59, 999); // end of month
    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return { validFormat: true, expired: expiryDate.getTime() < todayOnly.getTime() };
  };

  const isValidEmail = (email?: string) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.trim());
  };

  // ------------------ input handlers ------------------

  const handlePaymentMethodChange = (method: 'bank_transfer' | 'credit_card' | 'company_account' | 'cash') => {
    // If user clicks the same method again after interacting, do nothing (prevents accidental clears)
    if (method === selectedMethod && hasInteracted) return;

    setSelectedMethod(method);
    setHasInteracted(true);

    const cleared = clearPaymentFieldsExcept(method);

    if (method !== 'bank_transfer') {
      // revoke any existing bank receipt preview URL held locally
      if (bankReceiptUrlRef.current) {
        try {
          URL.revokeObjectURL(bankReceiptUrlRef.current);
        } catch {
          // ignore
        }
        bankReceiptUrlRef.current = null;
      }
      setBankReceiptPreview(null);
    }
    if (method !== 'company_account') {
      if (billingDocUrlRef.current) {
        try {
          URL.revokeObjectURL(billingDocUrlRef.current);
        } catch {
          // ignore
        }
        billingDocUrlRef.current = null;
      }
      setBillingDocPreview(null);
    }

    // keep paymentMethod in formData and clear other method fields
    onUpdate({
      paymentMethod: method,
      ...cleared
    });
  };

  const clearPaymentFieldsExcept = (keep: 'bank_transfer' | 'credit_card' | 'company_account' | 'cash') => {
    const cleared: Partial<BookingFormData> = {
      cardNumber: '',
      nameOnCard: '',
      cvvCode: '',
      expirationDate: '',
      bankName: '',
      bankAccountNumber: '',
      depositorName: '',
      bankReceiptFileName: '',
      bankReceiptUploaded: false,
      companyName: '',
      billingContact: '',
      billingEmail: '',
      poNumber: '',
      billingDocumentFileName: '',
      billingDocumentUploaded: false,
      cashPayerName: '',
      cashPayerContact: '',
      cashPayBeforeArrival: false
    };

    switch (keep) {
      case 'credit_card':
        delete (cleared as any).cardNumber;
        delete (cleared as any).nameOnCard;
        delete (cleared as any).cvvCode;
        delete (cleared as any).expirationDate;
        break;
      case 'bank_transfer':
        delete (cleared as any).bankName;
        delete (cleared as any).bankAccountNumber;
        delete (cleared as any).depositorName;
        delete (cleared as any).bankReceiptFileName;
        delete (cleared as any).bankReceiptUploaded;
        break;
      case 'company_account':
        delete (cleared as any).companyName;
        delete (cleared as any).billingContact;
        delete (cleared as any).billingEmail;
        delete (cleared as any).poNumber;
        delete (cleared as any).billingDocumentFileName;
        delete (cleared as any).billingDocumentUploaded;
        break;
      case 'cash':
        delete (cleared as any).cashPayerName;
        delete (cleared as any).cashPayerContact;
        delete (cleared as any).cashPayBeforeArrival;
        break;
      default:
        break;
    }

    return cleared;
  };

  // Generic updater that strips leading whitespace and collapses multiple whitespaces into single spaces
  const handleGenericInput = (field: keyof BookingFormData | string, value: any) => {
    if (typeof value === 'string') {
      value = normalizeSpace(value);
    }
    onUpdate({ [field]: value } as Partial<BookingFormData>);
  };

  const handleCardInputChange = (field: 'cardNumber' | 'nameOnCard' | 'cvvCode' | 'expirationDate', value: string) => {
    if (field === 'cardNumber') {
      // only digits allowed
      onUpdate({ [field]: sanitizeDigits(value).slice(0, 19) } as Partial<BookingFormData>);
    } else if (field === 'cvvCode') {
      onUpdate({ [field]: sanitizeDigits(value).slice(0, 4) } as Partial<BookingFormData>);
    } else if (field === 'expirationDate') {
      onUpdate({ [field]: sanitizeExpiry(value) } as Partial<BookingFormData>);
    } else {
      // normalize spacing and remove invalid characters for name on card
      onUpdate({ [field]: sanitizeAlpha(value) } as Partial<BookingFormData>);
    }
  };

  const onBankReceiptChange = (e: React.ChangeEvent<HTMLInputElement> | File | null) => {
    // Support being called with the file directly or the input change event
    const file = e && 'target' in (e as any) ? (e as React.ChangeEvent<HTMLInputElement>).target.files?.[0] ?? null : (e as File | null);
    // Revoke previous preview url if present
    if (bankReceiptUrlRef.current) {
      try {
        URL.revokeObjectURL(bankReceiptUrlRef.current);
      } catch {
        // ignore
      }
      bankReceiptUrlRef.current = null;
    }

    if (file) {
      handleGenericInput('bankReceiptFileName', file.name);
      handleGenericInput('bankReceiptUploaded', true);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        bankReceiptUrlRef.current = url;
        setBankReceiptPreview(url);
      } else {
        setBankReceiptPreview(null);
      }
    } else {
      handleGenericInput('bankReceiptFileName', '');
      handleGenericInput('bankReceiptUploaded', false);
      setBankReceiptPreview(null);
    }
  };

  const onBillingDocChange = (e: React.ChangeEvent<HTMLInputElement> | File | null) => {
    const file = e && 'target' in (e as any) ? (e as React.ChangeEvent<HTMLInputElement>).target.files?.[0] ?? null : (e as File | null);
    if (billingDocUrlRef.current) {
      try {
        URL.revokeObjectURL(billingDocUrlRef.current);
      } catch {
        // ignore
      }
      billingDocUrlRef.current = null;
    }

    if (file) {
      handleGenericInput('billingDocumentFileName', file.name);
      handleGenericInput('billingDocumentUploaded', true);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        billingDocUrlRef.current = url;
        setBillingDocPreview(url);
      } else {
        setBillingDocPreview(null);
      }
    } else {
      handleGenericInput('billingDocumentFileName', '');
      handleGenericInput('billingDocumentUploaded', false);
      setBillingDocPreview(null);
    }
  };

  const handleTermsChange = (agree: boolean) => onUpdate({ agreeToTerms: agree });

  // Determine the active payment method to validate against (UI-interacted method preferred)
  const methodToValidate = hasInteracted ? selectedMethod : (formData.paymentMethod ?? '');

  // ------------------ validations ------------------

  // Helper: checks whether the selected payment method's required fields are complete (EXCLUDES agreeToTerms)
  const isPaymentMethodComplete = (method?: string) => {
    switch (method) {
      case 'credit_card':
        return !!(formData.cardNumber && formData.nameOnCard && formData.cvvCode && formData.expirationDate);
      case 'bank_transfer':
        return !!(formData.bankName && formData.bankAccountNumber && formData.depositorName && (formData.bankReceiptFileName || formData.bankReceiptUploaded === true));
      case 'company_account':
        return !!(formData.companyName && formData.billingContact && formData.billingEmail);
      case 'cash':
        return !!(formData.cashPayerName && formData.cashPayerContact);
      default:
        return false;
    }
  };

  // Credit card validations with explicit expired notification
  const cardNumber = formData.cardNumber ?? '';
  const nameOnCard = formData.nameOnCard ?? '';
  const cvvCode = formData.cvvCode ?? '';
  const expirationDate = formData.expirationDate ?? '';

  const cardNumberDigits = sanitizeDigits(cardNumber);
  const cardNumberError = (() => {
    if (!cardNumberDigits) return 'Card number required';
    if (cardNumberDigits.length < 12) return 'Card number too short';
    if (cardNumberDigits.length > 19) return 'Card number too long';
    if (!luhnCheck(cardNumberDigits)) return 'Card number appears invalid';
    return '';
  })();

  const expiryInfo = parseExpiryInfo(expirationDate);
  const expiryError = (() => {
    if (!expirationDate) return 'Expiration required';
    if (!expiryInfo.validFormat) return 'Expiration format invalid (MM/YY or MM/YYYY)';
    if (expiryInfo.expired) return 'Card expired';
    return '';
  })();

  const cvvError = (() => {
    if (!cvvCode) return 'CVV required';
    if (!/^\d{3,4}$/.test(cvvCode)) return 'CVV must be 3 or 4 digits';
    return '';
  })();

  // Bank transfer validations
  const bankName = formData.bankName ?? '';
  const bankAccountNumber = formData.bankAccountNumber ?? '';
  const depositorName = formData.depositorName ?? '';
  const bankAccountDigits = sanitizeDigits(bankAccountNumber);
  const bankAccountError = (() => {
    if (!bankName) return 'Select bank';
    if (!bankAccountDigits) return 'Account/reference number required';
    if (bankAccountDigits.length < 6) return 'Account number too short';
    if (bankAccountDigits.length > 30) return 'Account number too long';
    return '';
  })();
  const depositorError = (() => {
    if (!depositorName) return 'Depositor name required';
    return '';
  })();

  // Company account validations
  const companyName = formData.companyName ?? '';
  const billingContact = formData.billingContact ?? '';
  const billingEmail = formData.billingEmail ?? '';
  const companyError = (() => {
    if (!companyName) return 'Company name required';
    if (!billingContact) return 'Billing contact required';
    if (!billingEmail) return 'Billing email required';
    if (!isValidEmail(billingEmail)) return 'Enter a valid billing email';
    return '';
  })();

  // Cash payer validations
  const cashPayerName = formData.cashPayerName ?? '';
  const cashPayerContact = formData.cashPayerContact ?? '';
  const cashContactDigits = sanitizePhone(cashPayerContact).replace(/\D/g, '');
  const cashPayerError = (() => {
    if (!cashPayerName) return 'Payer name required';
    if (!cashPayerContact) return 'Payer contact required';
    if (!(cashContactDigits.length === 10 || cashContactDigits.length === 11 || (cashContactDigits.length >= 7 && cashContactDigits.length <= 15))) {
      return 'Payer contact must be 10 or 11 digits (or 7–15 digits for international)';
    }
    return '';
  })();

  const methodValidationError = (() => {
    switch (methodToValidate) {
      case 'credit_card':
        if (cardNumberError) return cardNumberError;
        if (cvvError) return cvvError;
        if (expiryError) return expiryError;
        return '';
      case 'bank_transfer':
        if (bankAccountError) return bankAccountError;
        if (depositorError) return depositorError;
        return '';
      case 'company_account':
        if (companyError) return companyError;
        return '';
      case 'cash':
        if (cashPayerError) return cashPayerError;
        return '';
      default:
        return 'Select a payment method';
    }
  })();

  const isFormValid = () => {
    if (!formData.agreeToTerms) return false;
    if (!isPaymentMethodComplete(methodToValidate)) return false;
    if (methodValidationError) return false;
    return true;
  };

  const handleNext = () => {
    if (!isFormValid()) return;
    onNext();
  };

  // ------------------ date & pricing helpers unchanged ------------------

  const parseYMD = (s?: string): Date | null => {
    if (!s) return null;
    const [y, m, d] = s.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  };
  const toDateOnly = (d: Date | null) => (d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null);

  const pricePerNight = formData.pricePerNight ?? (formData as any).unitCharge ?? 2000.0;
  const baseGuests = (formData as any).baseGuests ?? 2;
  const extraGuestRate = formData.extraGuestRate ?? (formData as any).extraGuestFeePerPerson ?? 250.0;
  const serviceCharge = formData.serviceCharge ?? 100.0;
  const discount = formData.discount ?? 0.0;

  const start = toDateOnly(parseYMD(formData.checkInDate));
  const end = toDateOnly(parseYMD(formData.checkOutDate));
  const nights =
    start && end
      ? Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

  const primaryGuests = formData.numberOfGuests ?? 1;
  const extraGuests = formData.extraGuests ?? 0;

  const subtotal = Math.max(1, nights) * pricePerNight;
  const extraGuestFees = extraGuests * extraGuestRate;

  const calculateSummary = (): BookingSummary => {
    const unitCharge = pricePerNight;
    const amenitiesCharge = (formData.additionalServices || []).reduce((total, svc) => total + svc.quantity * svc.charge, 0);

    const totalCharges = subtotal + amenitiesCharge + serviceCharge + extraGuestFees - discount;

    return {
      unitCharge,
      amenitiesCharge,
      serviceCharge,
      discount,
      totalCharges,
      nights,
      subtotal,
      extraGuestFees,
      primaryGuests,
      extraGuests,
      baseGuests
    } as unknown as BookingSummary;
  };

  const summary = calculateSummary();

  // Use the selected method from UI if the user has interacted; otherwise fall back to formData.paymentMethod
  const currentSelectedForUI = hasInteracted ? selectedMethod : (formData.paymentMethod ?? '');

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold text-[#0B5858] mb-3" style={{ fontFamily: 'Poppins' }}>
            Payment Method
          </h2>
          <p className="text-gray-600 mb-6 text-sm" style={{ fontFamily: 'Poppins', lineHeight: 1.5 }}>
            Choose a payment channel. After selecting, fill the fields specific to that method.
          </p>

          <div className="space-y-4 mb-6">
            {[
              { value: 'bank_transfer', label: 'Bank Transfer / Deposit' },
              { value: 'credit_card', label: 'Credit or Debit Card' },
              { value: 'company_account', label: 'Company Account / Billing' },
              { value: 'cash', label: 'Cash Payment' }
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.value}
                  checked={currentSelectedForUI === option.value}
                  onChange={() => handlePaymentMethodChange(option.value as any)}
                  className="w-4 h-4 text-[#0B5858] border-gray-300 focus:ring-[#0B5858]"
                />
                <span className="ml-1 text-gray-800 text-sm" style={{ fontFamily: 'Poppins' }}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>

          {/* Payment method detail panels (unchanged behaviour) */}
          {hasInteracted && selectedMethod === 'bank_transfer' && (
            <div className="mt-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                  Select Bank
                </label>
                <select
                  value={formData.bankName || ''}
                  onChange={(e) => handleGenericInput('bankName', sanitizeAlphanumericAndSpace(e.target.value))}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B5858] focus:border-transparent"
                  style={{ fontFamily: 'Poppins' }}
                >
                  <option value="">-- Select Bank --</option>
                  <option value="BDO">BDO</option>
                  <option value="BPI">BPI</option>
                  <option value="Metrobank">Metrobank</option>
                  <option value="UnionBank">UnionBank</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                    Account / Reference Number
                  </label>
                  <input
                    type="text"
                    value={formData.bankAccountNumber || ''}
                    onChange={(e) => handleGenericInput('bankAccountNumber', sanitizeDigits(e.target.value))}
                    placeholder="123456789012"
                    inputMode="numeric"
                    maxLength={30}
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B5858] focus:border-transparent"
                    style={{ fontFamily: 'Poppins' }}
                  />
                  {bankAccountError && <div className="mt-1 text-xs text-yellow-700">{bankAccountError}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                    Depositor / Account Name
                  </label>
                  <input
                    type="text"
                    value={formData.depositorName || ''}
                    onChange={(e) => handleGenericInput('depositorName', sanitizeAlpha(e.target.value))}
                    placeholder="Juan dela Cruz"
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B5858] focus:border-transparent"
                    style={{ fontFamily: 'Poppins' }}
                  />
                  {depositorError && <div className="mt-1 text-xs text-yellow-700">{depositorError}</div>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                  Upload Proof of Payment (Receipt)
                </label>

                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={() => {}}
                  className={
                    "w-full flex items-center gap-4 p-4 rounded-lg border-2 border-dashed " +
                    (formData.bankReceiptUploaded ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50") +
                    " cursor-pointer"
                  }
                  onClick={() => {
                    const el = document.getElementById('bankReceiptInput') as HTMLInputElement | null;
                    el?.click();
                  }}
                  aria-label="Upload bank transfer receipt"
                >
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M7 7v10M17 7v10M3 13h18M12 3v14" />
                    </svg>
                  </div>

                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Poppins' }}>
                      {formData.bankReceiptFileName ? formData.bankReceiptFileName : 'Click to upload or drag and drop a receipt'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins' }}>
                      Accepted: JPG, PNG, PDF. Max file size depends on backend.
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      className="px-3 py-1 text-xs bg-[#0B5858] text-white rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        const el = document.getElementById('bankReceiptInput') as HTMLInputElement | null;
                        el?.click();
                      }}
                    >
                      Browse
                    </button>
                  </div>

                  <input
                    id="bankReceiptInput"
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      onBankReceiptChange(e);
                    }}
                  />
                </div>

                <div className="mt-2 flex items-center gap-3">
                  {bankReceiptPreview ? (
                    <img src={bankReceiptPreview} alt="receipt preview" className="w-20 h-20 object-cover rounded border" />
                  ) : formData.bankReceiptUploaded ? (
                    <div className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded" style={{ fontFamily: 'Poppins' }}>
                      Receipt uploaded
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>
                      No file uploaded yet.
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-500 mt-2" style={{ fontFamily: 'Poppins' }}>
                  After transferring, upload the receipt so we can confirm your payment faster.
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-300 p-3 text-sm text-gray-700 rounded">
                <div style={{ fontFamily: 'Poppins' }}>Transfer instructions:</div>
                <div className="mt-1 text-xs text-gray-600" style={{ lineHeight: 1.4, fontFamily: 'Poppins' }}>
                  - Use the account number above as reference.<br />
                  - Enter exact amount shown in summary.<br />
                  - Upload receipt and allow up to 24 hours for confirmation.
                </div>
              </div>
            </div>
          )}

          {hasInteracted && selectedMethod === 'credit_card' && (
            <div className="mt-2 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-semibold text-sm" style={{ fontFamily: 'Poppins' }}>
                  Card (Credit / Debit)
                </span>
                <div className="flex space-x-2">
                  <img src="/Credit_Cards/Credit.png" alt="Credit Card" className="h-6" />
                </div>
              </div>

              {/* EXPIRED CARD ALERT */}
              {expiryInfo.validFormat && expiryInfo.expired && (
                <div className="mb-2 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-800" role="alert" style={{ fontFamily: 'Poppins' }}>
                  The expiration date you entered indicates the card is expired. Please update the expiration date or use another card.
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                  Card Number
                </label>
                <input
                  type="text"
                  value={formData.cardNumber || ''}
                  onChange={(e) => handleCardInputChange('cardNumber', e.target.value)}
                  placeholder="1234567890123456"
                  inputMode="numeric"
                  maxLength={19}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B5858]"
                  style={{ fontFamily: 'Poppins' }}
                />
                {cardNumberError && <div className="mt-1 text-xs text-yellow-700">{cardNumberError}</div>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                  Name on Card
                </label>
                <input
                  type="text"
                  value={formData.nameOnCard || ''}
                  onChange={(e) => handleCardInputChange('nameOnCard', e.target.value)}
                  placeholder="John Doe"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B5858]"
                  style={{ fontFamily: 'Poppins' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                    CVV
                  </label>
                  <input
                    type="text"
                    value={formData.cvvCode || ''}
                    onChange={(e) => handleCardInputChange('cvvCode', e.target.value)}
                    placeholder="123"
                    maxLength={4}
                    inputMode="numeric"
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B5858]"
                    style={{ fontFamily: 'Poppins' }}
                  />
                  {cvvError && <div className="mt-1 text-xs text-yellow-700">{cvvError}</div>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                    Expiration (MM/YY)
                  </label>
                  <input
                    type="text"
                    value={formData.expirationDate || ''}
                    onChange={(e) => handleCardInputChange('expirationDate', e.target.value)}
                    placeholder="12/25"
                    maxLength={7}
                    inputMode="numeric"
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B5858]"
                    style={{ fontFamily: 'Poppins' }}
                  />
                  {expiryError && <div className="mt-1 text-xs text-yellow-700">{expiryError}</div>}
                </div>
              </div>

              <div className="text-xs text-gray-600" style={{ fontFamily: 'Poppins' }}>
                We use a PCI-compliant processor — card details are tokenized and not stored on our servers.
              </div>
            </div>
          )}

          {hasInteracted && selectedMethod === 'company_account' && (
            <div className="mt-2 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                  Company Name
                </label>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={(e) => handleGenericInput('companyName', sanitizeAlphanumericAndSpace(e.target.value))}
                  placeholder="ACME Corporation"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B5858]"
                  style={{ fontFamily: 'Poppins' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                  Billing Contact Name
                </label>
                <input
                  type="text"
                  value={formData.billingContact || ''}
                  onChange={(e) => handleGenericInput('billingContact', sanitizeAlpha(e.target.value))}
                  placeholder="Jane Accountant"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B5858]"
                  style={{ fontFamily: 'Poppins' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                    Billing Email
                  </label>
                  <input
                    type="email"
                    value={formData.billingEmail || ''}
                    onChange={(e) => handleGenericInput('billingEmail', e.target.value.trim())}
                    placeholder="billing@company.com"
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B5858]"
                    style={{ fontFamily: 'Poppins' }}
                  />
                  {companyError && <div className="mt-1 text-xs text-yellow-700">{companyError}</div>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                    PO / Billing Reference (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.poNumber || ''}
                    onChange={(e) => handleGenericInput('poNumber', sanitizeAlphanumericAndSpace(e.target.value))}
                    placeholder="PO-12345"
                    className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B5858]"
                    style={{ fontFamily: 'Poppins' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                  Upload Billing Documents (optional)
                </label>

                <div
                  className={
                    "w-full flex items-center gap-4 p-4 rounded-lg border-2 border-dashed " +
                    (formData.billingDocumentUploaded ? "border-green-400 bg-green-50" : "border-gray-300 bg-gray-50") +
                    " cursor-pointer"
                  }
                  onClick={() => {
                    const el = document.getElementById('billingDocInput') as HTMLInputElement | null;
                    el?.click();
                  }}
                >
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" d="M12 3v12M3 12h18" />
                    </svg>
                  </div>

                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-800" style={{ fontFamily: 'Poppins' }}>
                      {formData.billingDocumentFileName ? formData.billingDocumentFileName : 'Click to upload a billing document (PDF or image)'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins' }}>
                      Optional: Upload PO, invoice or other billing documents.
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      className="px-3 py-1 text-xs bg-[#0B5858] text-white rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        const el = document.getElementById('billingDocInput') as HTMLInputElement | null;
                        el?.click();
                      }}
                    >
                      Browse
                    </button>
                  </div>

                  <input
                    id="billingDocInput"
                    type="file"
                    accept="application/pdf,image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      onBillingDocChange(e);
                    }}
                  />
                </div>

                <div className="mt-2">
                  {billingDocPreview ? (
                    <img src={billingDocPreview} alt="billing preview" className="w-20 h-20 object-cover rounded border" />
                  ) : formData.billingDocumentUploaded ? (
                    <div className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded" style={{ fontFamily: 'Poppins' }}>
                      Document uploaded
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>
                      No document uploaded.
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>
                For invoice/billing arrangements we will contact the billing contact. Please ensure PO/reference is provided if required by your accounts payable.
              </p>
            </div>
          )}

          {hasInteracted && selectedMethod === 'cash' && (
            <div className="mt-2 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                  Payer Name
                </label>
                <input
                  type="text"
                  value={formData.cashPayerName || ''}
                  onChange={(e) => handleGenericInput('cashPayerName', sanitizeAlpha(e.target.value))}
                  placeholder="Name of person who will pay on arrival"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B5858]"
                  style={{ fontFamily: 'Poppins' }}
                />
                {cashPayerError && <div className="mt-1 text-xs text-yellow-700">{cashPayerError}</div>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                  Payer Contact Number
                </label>
                <input
                  type="text"
                  value={formData.cashPayerContact || ''}
                  onChange={(e) => handleGenericInput('cashPayerContact', sanitizePhone(e.target.value))}
                  placeholder="+639123456789"
                  inputMode="tel"
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0B5858]"
                  style={{ fontFamily: 'Poppins' }}
                />
                <div className="text-xs text-gray-500 mt-1" style={{ fontFamily: 'Poppins' }}>
                  Only digits allowed (optionally a leading +). No spaces or letters.
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins' }}>
                  Payment Option
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="cashLocation"
                      checked={!formData.cashPayBeforeArrival}
                      onChange={() => handleGenericInput('cashPayBeforeArrival', false)}
                      className="w-4 h-4 text-[#0B5858] border-gray-300 focus:ring-[#0B5858]"
                    />
                    <span className="text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>Pay on arrival / on-site</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="cashLocation"
                      checked={!!formData.cashPayBeforeArrival}
                      onChange={() => handleGenericInput('cashPayBeforeArrival', true)}
                      className="w-4 h-4 text-[#0B5858] border-gray-300 focus:ring-[#0B5858]"
                    />
                    <span className="text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>Pay before arrival (arrange pickup)</span>
                  </label>
                </div>
              </div>

              <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>
                If paying on arrival, ensure the payer brings a valid ID and booking reference. If paying before arrival, we'll arrange pickup and confirm via contact number.
              </p>
            </div>
          )}

          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: 'Poppins' }}>
              Please review your booking and payment details before proceeding. By clicking 'Confirm Payment,' you agree to the terms and conditions of this transaction.
            </p>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={!!formData.agreeToTerms}
                onChange={(e) => handleTermsChange(e.target.checked)}
                className="w-4 h-4 text-[#0B5858] border-gray-300 rounded focus:ring-[#0B5858] disabled:opacity-50"
                disabled={!isPaymentMethodComplete(methodToValidate)}
                title={!isPaymentMethodComplete(methodToValidate) ? 'Complete payment method details first' : 'I agree to the payment terms and conditions'}
              />
              <span className={`ml-2 text-sm ${!isPaymentMethodComplete(methodToValidate) ? 'text-gray-400' : 'text-gray-700'}`} style={{ fontFamily: 'Poppins' }}>
                I agree to the payment terms and conditions
              </span>
            </label>
          </div>
        </div>

        {/* Right Panel - Summary */}
        <div>
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4" style={{ fontFamily: 'Poppins' }}>
              Summary Charges
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600" style={{ fontFamily: 'Poppins' }}>Unit Charge (per night)</span>
                <span className="text-gray-800" style={{ fontFamily: 'Poppins' }}>₱{summary.unitCharge.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600" style={{ fontFamily: 'Poppins' }}>Base guests included</span>
                <span className="text-gray-800" style={{ fontFamily: 'Poppins' }}>{summary.baseGuests ?? baseGuests}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600" style={{ fontFamily: 'Poppins' }}>Extra Guests (one-time)</span>
                <span className="text-gray-800" style={{ fontFamily: 'Poppins' }}>{summary.extraGuests ?? extraGuests}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600" style={{ fontFamily: 'Poppins' }}>Nights</span>
                <span className="text-gray-800" style={{ fontFamily: 'Poppins' }}>{summary.nights ?? nights}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600" style={{ fontFamily: 'Poppins' }}>Subtotal (base rate × nights)</span>
                <span className="text-gray-800" style={{ fontFamily: 'Poppins' }}>₱{((summary as any).subtotal ?? subtotal).toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600" style={{ fontFamily: 'Poppins' }}>Amenities Charge</span>
                <span className="text-gray-800" style={{ fontFamily: 'Poppins' }}>₱{summary.amenitiesCharge.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600" style={{ fontFamily: 'Poppins' }}>Extra guest fees (one-time)</span>
                <span className="text-gray-800" style={{ fontFamily: 'Poppins' }}>₱{((summary as any).extraGuestFees ?? extraGuestFees).toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600" style={{ fontFamily: 'Poppins' }}>Service Charges</span>
                <span className="text-gray-800" style={{ fontFamily: 'Poppins' }}>₱{summary.serviceCharge.toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600" style={{ fontFamily: 'Poppins' }}>Discounts</span>
                <span className="text-gray-800" style={{ fontFamily: 'Poppins' }}>-₱{summary.discount.toFixed(2)}</span>
              </div>

              <div className="border-t border-gray-300 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-800" style={{ fontFamily: 'Poppins' }}>Total Charges</span>
                  <span className="font-bold text-lg text-gray-800" style={{ fontFamily: 'Poppins' }}>₱{summary.totalCharges.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              {hasInteracted && selectedMethod === 'bank_transfer' && (
                <div className="text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
                  Bank transfer selected. Please transfer the exact amount and upload the receipt using the highlighted upload area.
                </div>
              )}
              {hasInteracted && selectedMethod === 'credit_card' && (
                <div className="text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
                  Secure card payment. You will be charged when you confirm.
                </div>
              )}
              {hasInteracted && selectedMethod === 'company_account' && (
                <div className="text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
                  We will issue an invoice to the billing email after confirmation.
                </div>
              )}
              {hasInteracted && selectedMethod === 'cash' && (
                <div className="text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
                  Cash payment selected. Please ensure the named payer presents valid ID and booking reference.
                </div>
              )}
              {!hasInteracted && (
                <div className="text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
                  No payment method selected yet.
                </div>
              )}

              <div className="mt-4">
                <div className="bg-white p-4 rounded-lg inline-block">
                  <div className="w-24 h-24 bg-gray-200 rounded flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zm2 2V5h1v1h-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500" style={{ fontFamily: 'Poppins' }}>
                  Payment Status: Pending
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          style={{ fontFamily: 'Poppins' }}
        >
          Cancel
        </button>
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          style={{ fontFamily: 'Poppins' }}
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!isFormValid()}
          className="px-6 py-2 bg-[#0B5858] text-white rounded-lg hover:bg-[#0a4a4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          style={{ fontFamily: 'Poppins' }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaymentInfoStep;