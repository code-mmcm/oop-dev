import React, { useMemo } from 'react';
import type { BookingSummary, AdditionalService } from '../../../types/booking';

interface BookingDetailsModalProps {
  booking: any; // accept the Booking object shape from list view (flexible to support snake_case or camelCase)
  onClose?: () => void;
  onEdit?: () => void;
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];

const isImageUrl = (url?: string) => {
  if (!url) return false;
  const lower = String(url).split('?')[0].toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
};

const IconUser = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 12a5 5 0 100-10 5 5 0 000 10z"></path>
    <path d="M4 20a8 8 0 0116 0H4z"></path>
  </svg>
);
const IconPhone = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92V21a1 1 0 01-1.11 1 19.86 19.86 0 01-8.63-3.07 19.89 19.89 0 01-6-6A19.86 19.86 0 013 3.11 1 1 0 014 2h4.09a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.24 1.02L9.7 9.7a12 12 0 006.6 6.6l1.4-1.4a1 1 0 011.02-.24l3.6 1.2c.43.14.71.56.68.99z"></path>
  </svg>
);
const IconMail = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8l8.5 6L20 8"></path>
    <rect x="3" y="4" width="18" height="16" rx="2"></rect>
  </svg>
);
const IconBank = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 10h18"></path>
    <path d="M12 3v6"></path>
  </svg>
);
const IconCard = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="2" y="5" width="20" height="14" rx="2"></rect>
    <path d="M2 10h20" fill="currentColor" />
  </svg>
);
const IconDocument = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
    <path d="M14 2v6h6"></path>
  </svg>
);
const IconReceipt = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 11.5V6a2 2 0 00-2-2H5a2 2 0 00-2 2v15l3-1 3 1 3-1 3 1 3-1 3 1V11.5"></path>
    <path d="M7 9h10M7 13h6"></path>
  </svg>
);
const IconCalendar = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2"></rect>
    <path d="M16 2v4M8 2v4M3 10h18"></path>
  </svg>
);

const FieldRow: React.FC<{ icon?: React.ReactNode; title: React.ReactNode; subtitle?: React.ReactNode }> = ({ icon, title, subtitle }) => (
  <div className="flex items-start gap-3 min-w-0">
    <div className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0 flex items-center justify-center">
      {icon}
    </div>
    <div className="min-w-0">
      <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>{title}</div>
      {subtitle && <div className="text-xs text-gray-500 truncate">{subtitle}</div>}
    </div>
  </div>
);

const MAX_NOTES_WORDS = 50;

const countWords = (text?: string) => {
  if (!text) return 0;
  return String(text).trim().split(/\s+/).filter(Boolean).length;
};

const limitToWords = (text: string | undefined, maxWords: number) => {
  if (!text) return '';
  const words = String(text).trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
};

const get = (obj: any, camel: string, snake: string) => {
  if (!obj) return undefined;
  return obj[camel] ?? obj[snake] ?? undefined;
};

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({ booking, onClose, onEdit }) => {
  // booking may use snake_case (from API) or camelCase (from forms). helpers use both.
  const b = booking || {};

  // normalize a few commonly used fields (flexible)
  const checkInDate = get(b, 'checkInDate', 'check_in_date') as string | undefined;
  const checkOutDate = get(b, 'checkOutDate', 'check_out_date') as string | undefined;
  const checkInTime = get(b, 'checkInTime', 'check_in_time') as string | undefined;
  const checkOutTime = get(b, 'checkOutTime', 'check_out_time') as string | undefined;

  const firstName = get(b, 'firstName', 'first_name') ?? '';
  const lastName = get(b, 'lastName', 'last_name') ?? '';
  const email = get(b, 'email', 'email') ?? get(b, 'user?.email', 'user?.email') ?? '';
  const phone = get(b, 'preferredContactNumber', 'preferred_contact_number') ?? get(b, 'user?.phone', 'user?.phone') ?? '';

  const propertyTitle = get(b, 'propertyTitle', 'propertyTitle') ?? get(b, 'listing?.title', 'listing?.title') ?? get(b, 'listing.title', 'listing.title') ?? 'Property';
  const propertyLocationShort = get(b, 'propertyLocationShort', 'propertyLocationShort') ?? get(b, 'listing?.location', 'listing?.location') ?? '';
  const heroImageUrl = get(b, 'heroImageUrl', 'hero_image_url') ?? get(b, 'listing?.main_image_url', 'listing?.main_image_url') ?? '/heroimage.png';

  const services: AdditionalService[] = Array.isArray(get(b, 'additionalServices', 'additional_services')) ? get(b, 'additionalServices', 'additional_services') : [];

  const formatCurrency = (value: number | undefined) =>
    (typeof value === 'number' ? value : 0).toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 });

  const nights = useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [checkInDate, checkOutDate]);

  const primaryGuests = (get(b, 'numberOfGuests', 'number_of_guests') ?? get(b, 'guests', 'guests') ?? 0) as number;
  const extraGuests = (get(b, 'extraGuests', 'extra_guests') ?? 0) as number;
  const totalGuests = primaryGuests + extraGuests;
  const extraGuestRate = (get(b, 'extraGuestRate', 'extra_guest_rate') ?? 250) as number;

  const extraGuestChargeTotal = useMemo(() => {
    if (!extraGuests || extraGuests <= 0 || nights <= 0) return 0;
    return extraGuests * extraGuestRate * nights;
  }, [extraGuests, extraGuestRate, nights]);

  const summary = useMemo<BookingSummary>(() => {
    const unitCharge = (get(b, 'unitCharge', 'unit_amount') ?? get(b, 'unit_amount', 'unit_amount') ?? 2000) as number;
    const amenitiesCharge = services.reduce((total, service) => total + (service.quantity * service.charge), 0);
    const serviceCharge = (get(b, 'serviceCharge', 'service_charge') ?? 100) as number;
    const discount = (get(b, 'discount', 'discount') ?? 0) as number;
    const totalCharges = (unitCharge * Math.max(1, nights)) + amenitiesCharge + extraGuestChargeTotal + serviceCharge - discount;

    // ensure object satisfies BookingSummary shape (include nights/extraGuests/baseGuests)
    return {
      unitCharge,
      amenitiesCharge,
      serviceCharge,
      discount,
      totalCharges,
      nights,
      extraGuests,
      baseGuests: primaryGuests
    } as BookingSummary;
  }, [b, services, nights, extraGuestChargeTotal, primaryGuests, extraGuests]);

  const safeString = (v?: string) => (v ? v : '—');

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '—';
    const [hours, minutes] = (timeString || '00:00').split(':');
    const h = parseInt(hours || '0', 10);
    const ampm = h >= 12 ? 'pm' : 'am';
    const displayHour = h % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const bookingRef = get(b, 'bookingReference', 'transaction_number') ?? `BK-${String(Date.now()).slice(-6)}`;

  const location = {
    coords: get(b, 'locationCoords', 'location_coords') ?? get(b, 'listing?.coords', 'listing?.coords') ?? '',
    landmark: get(b, 'locationLandmark', 'location_landmark') ?? '',
    parking: get(b, 'locationParking', 'location_parking') ?? '',
    checkInInstructions: get(b, 'checkInInstructions', 'check_in_instructions') ?? '',
    additionalNotes: get(b, 'locationNotes', 'location_notes') ?? ''
  };

  const addedServices = Array.isArray(services) ? services.filter((s) => s.quantity > 0) : [];
  const mapSrc = location.coords ? `https://www.google.com/maps?q=${encodeURIComponent(location.coords)}&output=embed` : '';

  const maskedCard = (card?: string) => {
    if (!card) return 'No card on file';
    const digits = String(card).replace(/\s+/g, '');
    const last4 = digits.slice(-4);
    if (digits.length >= 4) return `•••• ${last4}`;
    return last4;
  };

  const rawNotes = get(b, 'requestDescription', 'request_description') ?? get(b, 'notes', 'notes') ?? '';
  const notesLimited = useMemo(() => limitToWords(rawNotes, MAX_NOTES_WORDS), [rawNotes]);
  const notesTruncated = useMemo(() => countWords(rawNotes) > MAX_NOTES_WORDS, [rawNotes]);

  const paymentMethod = get(b, 'paymentMethod', 'payment_method') as string | undefined;

  const paymentMethodLabel = (method?: string) => {
    switch (method) {
      case 'credit_card':
        return 'Card (Credit / Debit)';
      case 'bank_transfer':
        return 'Bank Transfer / Deposit';
      case 'company_account':
        return 'Company Account / Billing';
      case 'cash':
        return 'Cash';
      default:
        return '—';
    }
  };

  // compute cardholder display safely (avoid mixing ?? and || in one expression)
  const rawCardholder = get(b, 'nameOnCard', 'name_on_card');
  const computedCardholder = (rawCardholder ?? `${firstName} ${lastName}`).toString().trim();
  const cardholderDisplay = computedCardholder ? computedCardholder : '—';

  // ensure agent name fallback uses nullish coalescing (avoid mixing ?? and ||)
  const agentName = get(b, 'assignedAgentName', 'assigned_agent_name') ?? get(b, 'agent?.name', 'agent?.name') ?? '—';

  return (
    <div className="w-full max-w-[1200px] mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-1.5 h-8 bg-[#0B5858] rounded" />
            <div>
              <h2 className="text-xl font-semibold text-[#0B5858]" style={{ fontFamily: 'Poppins' }}>
                Booking Details
              </h2>
              <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: 'Poppins' }}>
                View-only details for this booking.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
                style={{ fontFamily: 'Poppins' }}
                aria-label="Edit booking"
              >
                Edit
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="px-3 py-1 bg-[#0B5858] text-white rounded text-sm"
                style={{ fontFamily: 'Poppins' }}
                aria-label="Close details"
              >
                Close
              </button>
            )}
          </div>
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Property header */}
            <div className="flex items-center gap-4 border border-gray-200 rounded-lg p-4">
              <div className="w-36 h-24 flex-shrink-0 overflow-hidden rounded-md">
                <img src={heroImageUrl} alt={String(propertyTitle)} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-800 truncate" style={{ fontFamily: 'Poppins' }}>
                  {propertyTitle}
                </h3>

                <p className="text-sm text-gray-500 mt-1 truncate" style={{ fontFamily: 'Poppins' }}>
                  {propertyLocationShort}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600" style={{ fontFamily: 'Poppins' }}>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M6 22v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M18 22v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <span>{totalGuests} guest{totalGuests !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              <div className="ml-2 w-44 flex-shrink-0">
                <div className="border border-gray-100 rounded-lg p-3 bg-gray-50 text-sm" style={{ fontFamily: 'Poppins' }}>
                  <div className="text-xs text-gray-500">Booking Reference</div>
                  <div className="font-semibold text-gray-800 mt-1 break-words" style={{ wordBreak: 'break-word' }}>{bookingRef}</div>

                  <div className="border-t border-gray-100 mt-3 pt-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">Nights</div>
                      <div className="font-medium text-gray-800">{nights}</div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-500">Rate</div>
                      <div className="font-medium text-gray-800">{formatCurrency(summary.unitCharge)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charges */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-base font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Poppins' }}>Charges Summary</h4>

              <div className="text-sm text-gray-700 space-y-3" style={{ fontFamily: 'Poppins' }}>
                <div className="flex justify-between">
                  <span>Unit Charge ({nights} night{nights !== 1 ? 's' : ''})</span>
                  <span>{formatCurrency(summary.unitCharge * Math.max(1, nights))}</span>
                </div>

                {extraGuestChargeTotal > 0 && (
                  <div className="flex justify-between">
                    <span>
                      Extra guest charges ({extraGuests} × {formatCurrency(extraGuestRate)} × {nights} night{nights !== 1 ? 's' : ''})
                    </span>
                    <span>{formatCurrency(extraGuestChargeTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Amenities / Additional Services</span>
                  <span>{formatCurrency(summary.amenitiesCharge)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Charges</span>
                  <span>{formatCurrency(summary.serviceCharge)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discounts</span>
                  <span className="text-gray-600">-{formatCurrency(summary.discount)}</span>
                </div>

                <div className="border-t border-gray-200 mt-4 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Grand Total</span>
                    <span className="font-bold text-lg">{formatCurrency(summary.totalCharges)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            {addedServices.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold mb-2" style={{ fontFamily: 'Poppins' }}>Service details</h5>
                <ul className="text-sm text-gray-700 space-y-1" style={{ fontFamily: 'Poppins' }}>
                  {addedServices.map((s: any) => (
                    <li key={s.id} className="flex justify-between">
                      <span className="break-words" style={{ wordBreak: 'break-word' }}>{s.name} × {s.quantity}</span>
                      <span>{formatCurrency(s.quantity * s.charge)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Client / Payment / Agent */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Poppins' }}>Client Information</h5>

                <div className="space-y-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0">
                      <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>{safeString(firstName)} {safeString(lastName)}</div>
                      <div className="text-xs text-gray-500">Full name</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="min-w-0">
                      <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>{safeString(email)}</div>
                      <div className="text-xs text-gray-500">Email</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="min-w-0">
                      <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>{safeString(phone)}</div>
                      <div className="text-xs text-gray-500">Phone</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>
                  Payment Method
                </h5>

                <div className="space-y-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
                  <FieldRow
                    icon={<IconCard />}
                    title={<>{paymentMethodLabel(paymentMethod)}</>}
                    subtitle="Payment type"
                  />

                  {paymentMethod === 'credit_card' && (
                    <>
                      <FieldRow
                        icon={<IconCard />}
                        title={maskedCard(get(b, 'cardNumber', 'card_number'))}
                        subtitle="Card number"
                      />

                      <FieldRow
                        icon={<IconUser />}
                        title={cardholderDisplay}
                        subtitle={get(b, 'expirationDate', 'expiration_date') ? `Exp: ${safeString(get(b, 'expirationDate', 'expiration_date'))}` : 'Cardholder name'}
                      />
                    </>
                  )}

                  {paymentMethod === 'bank_transfer' && (
                    <>
                      <FieldRow
                        icon={<IconBank />}
                        title={get(b, 'bankName', 'bank_name') ?? '—'}
                        subtitle="Bank"
                      />

                      <FieldRow
                        icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 7h18"></path><path d="M6 11h12"></path></svg>}
                        title={get(b, 'bankAccountNumber', 'bank_account_number') ?? '—'}
                        subtitle="Account / Reference No."
                      />

                      <FieldRow
                        icon={<IconUser />}
                        title={get(b, 'depositorName', 'depositor_name') ?? '—'}
                        subtitle="Depositor / Account Name"
                      />

                      <div className="mt-2 text-xs">
                        <div className={get(b, 'bankReceiptUploaded', 'bank_receipt_uploaded') ? "px-3 py-1 bg-green-100 text-green-800 inline-flex items-center gap-2 rounded" : "text-gray-500 inline-flex items-center gap-2"}>
                          <span className="flex-shrink-0">{<IconReceipt />}</span>
                          <span className="break-words" style={{ wordBreak: 'break-word' }}>{get(b, 'bankReceiptFileName', 'bank_receipt_file_name') ?? 'No receipt uploaded'}</span>
                        </div>

                        {get(b, 'bankReceiptUrl', 'bank_receipt_url') && (
                          <div className="mt-2">
                            {isImageUrl(get(b, 'bankReceiptUrl', 'bank_receipt_url')) ? (
                              <a href={get(b, 'bankReceiptUrl', 'bank_receipt_url')} target="_blank" rel="noopener noreferrer" title="Open receipt">
                                <img src={get(b, 'bankReceiptUrl', 'bank_receipt_url')} alt={get(b, 'bankReceiptFileName', 'bank_receipt_file_name') || 'Receipt'} className="w-28 h-20 object-cover rounded border cursor-pointer" />
                              </a>
                            ) : (
                              <a
                                href={get(b, 'bankReceiptUrl', 'bank_receipt_url')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-[#0B5858] hover:underline"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                                  <path d="M14 3v5h5"></path>
                                </svg>
                                <span className="break-words" style={{ wordBreak: 'break-word' }}>{get(b, 'bankReceiptFileName', 'bank_receipt_file_name') || 'View receipt'}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {paymentMethod === 'company_account' && (
                    <>
                      <FieldRow
                        icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 7h16v10H4z"></path></svg>}
                        title={get(b, 'companyName', 'company_name') ?? '—'}
                        subtitle="Company"
                      />

                      <FieldRow
                        icon={<IconUser />}
                        title={get(b, 'billingContact', 'billing_contact') ?? '—'}
                        subtitle="Billing contact"
                      />

                      <FieldRow
                        icon={<IconMail />}
                        title={get(b, 'billingEmail', 'billing_email') ?? '—'}
                        subtitle="Billing email"
                      />

                      <div className="mt-2 text-xs">
                        <div className={get(b, 'billingDocumentUploaded', 'billing_document_uploaded') ? "px-3 py-1 bg-green-100 text-green-800 inline-flex items-center gap-2 rounded" : "text-gray-500 inline-flex items-center gap-2"}>
                          <span className="flex-shrink-0">{<IconDocument />}</span>
                          <span className="break-words" style={{ wordBreak: 'break-word' }}>{get(b, 'billingDocumentFileName', 'billing_document_file_name') ?? 'No document uploaded'}</span>
                        </div>

                        {get(b, 'billingDocumentUrl', 'billing_document_url') && (
                          <div className="mt-2">
                            {isImageUrl(get(b, 'billingDocumentUrl', 'billing_document_url')) ? (
                              <a href={get(b, 'billingDocumentUrl', 'billing_document_url')} target="_blank" rel="noopener noreferrer" title="Open document">
                                <img src={get(b, 'billingDocumentUrl', 'billing_document_url')} alt={get(b, 'billingDocumentFileName', 'billing_document_file_name') || 'Document'} className="w-28 h-20 object-cover rounded border cursor-pointer" />
                              </a>
                            ) : (
                              <a
                                href={get(b, 'billingDocumentUrl', 'billing_document_url')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm text-[#0B5858] hover:underline"
                              >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                                  <path d="M14 3v5h5"></path>
                                </svg>
                                <span className="break-words" style={{ wordBreak: 'break-word' }}>{get(b, 'billingDocumentFileName', 'billing_document_file_name') || 'View document'}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {get(b, 'poNumber', 'po_number') && <div className="text-xs text-gray-500 mt-1 break-words" style={{ wordBreak: 'break-word' }}>PO / Ref: {get(b, 'poNumber', 'po_number')}</div>}
                    </>
                  )}

                  {paymentMethod === 'cash' && (
                    <>
                      <FieldRow
                        icon={<IconUser />}
                        title={get(b, 'cashPayerName', 'cash_payer_name') ?? '—'}
                        subtitle="Payer name"
                      />

                      <FieldRow
                        icon={<IconPhone />}
                        title={get(b, 'cashPayerContact', 'cash_payer_contact') ?? '—'}
                        subtitle="Payer contact"
                      />

                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                        <span className="flex-shrink-0">{<IconCalendar />}</span>
                        <span className="break-words" style={{ wordBreak: 'break-word' }}>{get(b, 'cashPayBeforeArrival', 'cash_pay_before_arrival') ? 'Will pay before arrival' : 'Will pay on arrival / on-site'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>Assigned Agent</h5>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#E8F8F7] text-[#0B5858] flex items-center justify-center font-semibold" style={{ fontFamily: 'Poppins' }}>
                    {(() => {
                      const parts = String(agentName).split(' ').filter(Boolean);
                      const initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]) : (parts[0] ? parts[0].slice(0,2) : '—');
                      return initials.toUpperCase();
                    })()}
                  </div>

                  <div className="flex-1 text-sm" style={{ fontFamily: 'Poppins' }}>
                    <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>{agentName}</div>
                    <div className="text-xs text-gray-500 mt-1">{get(b, 'assignedAgentRole', 'assigned_agent_role') ?? get(b, 'agent?.role', 'agent?.role') ?? '—'}</div>
                    {get(b, 'assignedAgentContact', 'assigned_agent_contact') && (
                      <div className="text-xs text-gray-500 mt-1 break-words" style={{ wordBreak: 'break-word' }}>{get(b, 'assignedAgentContact', 'assigned_agent_contact')}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-semibold" style={{ fontFamily: 'Poppins' }}>Status</h5>
                <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  {String(get(b, 'status', 'status') ?? 'Confirmed')}
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold mb-2" style={{ fontFamily: 'Poppins' }}>Duration</h5>
              <div className="text-sm text-gray-700 space-y-2" style={{ fontFamily: 'Poppins' }}>
                <div>
                  <div className="text-xs text-gray-500">Check-in</div>
                  <div className="break-words" style={{ wordBreak: 'break-word' }}>{formatDate(checkInDate)} • {formatTime(checkInTime)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Check-out</div>
                  <div className="break-words" style={{ wordBreak: 'break-word' }}>{formatDate(checkOutDate)} • {formatTime(checkOutTime)}</div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold mb-2" style={{ fontFamily: 'Poppins' }}>Location</h5>

              <div>
                {mapSrc ? (
                  <div className="w-full overflow-hidden rounded" style={{ borderRadius: 8 }}>
                    <iframe title="Booking location map" src={mapSrc} width="100%" height={200} style={{ border: 0 }} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                  </div>
                ) : (
                  <div className="text-xs text-gray-500">Map not available. Coordinates missing.</div>
                )}

                <div className="mt-4 space-y-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                      <circle cx="12" cy="9" r="1.5" fill="currentColor"></circle>
                    </svg>
                    <div>
                      <div className="text-xs text-gray-500">Coordinates</div>
                      <div className="font-medium text-gray-800 break-words" style={{ wordBreak: 'break-word' }}>{location.coords || '—'}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M3 10h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M6 6h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <div>
                      <div className="text-xs text-gray-500">Landmark</div>
                      <div className="font-medium text-gray-800 break-words" style={{ wordBreak: 'break-word' }}>{location.landmark || '—'}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-gray-400 mt-0.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M3 7h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                      <path d="M6 11h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                    <div>
                      <div className="text-xs text-gray-500">Parking</div>
                      <div className="font-medium text-gray-800 break-words" style={{ wordBreak: 'break-word' }}>{location.parking || '—'}</div>
                    </div>
                  </div>

                  {location.additionalNotes && (
                    <div className="text-xs text-gray-500 mt-1 break-words" style={{ wordBreak: 'break-word' }}>{location.additionalNotes}</div>
                  )}
                </div>
              </div>

              <div className="mt-3 text-sm">
                <div className="text-xs text-gray-500">Check-in instructions</div>
                <div className="text-sm text-gray-700 break-words" style={{ wordBreak: 'break-word' }}>{location.checkInInstructions || '—'}</div>
                {location.coords && (
                  <div className="mt-2">
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.coords)}`} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-[#0B5858] hover:underline">
                      Open in Google Maps
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold mb-2" style={{ fontFamily: 'Poppins' }}>Booking Notes</h5>
              <div className="text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
                {rawNotes ? (
                  <div className="whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word' }}>
                    {notesLimited}
                    {notesTruncated && '…'}
                  </div>
                ) : (
                  <div className="text-gray-500">No special requests provided.</div>
                )}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4">
              <h5 className="text-sm font-semibold mb-2" style={{ fontFamily: 'Poppins' }}>Important</h5>
              <ul className="text-xs text-gray-600 space-y-1" style={{ fontFamily: 'Poppins' }}>
                <li>• Free cancellation up to 48 hours before check-in.</li>
                <li>• Check-in time: {checkInTime ?? '—'}. Check-out time: {checkOutTime ?? '—'}.</li>
                <li>• Photo ID required at check-in.</li>
                <li>• For special requests, contact support.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsModal;