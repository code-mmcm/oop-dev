import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { supabase } from '../../lib/supabase';
import Footer from '../../components/Footer';
import type { Listing } from '../../types/listing';
import { useAuth } from '../../contexts/AuthContext';

interface Booking {
  id: string;
  listing_id: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  num_guests: number;
  extra_guests: number;
  unit_charge: string;
  amenities_charge?: number;
  service_charge?: number;
  discount?: number;
  total_amount: number;
  currency: string;
  status: string;
  assigned_agent: string;
  landmark: string;
  parking_info: string;
  notes: string;
  add_ons: any;
  created_at: string;
  listing?: Listing;
  agent?: {
    id: string;
    fullname: string;
    email: string;
    profile_photo?: string;
  };
  client?: {
    first_name: string;
    last_name: string;
    email: string;
    contact_number: number;
    profile_photo?: string;
  };
  payment?: {
    payment_method?: string;
    proof_of_payment_url?: string;
    billing_document_url?: string;
    payment_status?: string;
    bank_name?: string;
    depositor_name?: string;
    bank_account_number?: string;
    company_name?: string;
    billing_contact?: string;
    billing_email?: string;
    po_number?: string;
    card_number_last4?: number;
    card_holder_name?: string;
    payer_name?: string;
    payer_contact?: string;
  };
}

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];

const isImageUrl = (url?: string) => {
  if (!url) return false;
  const lower = url.split('?')[0].toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext));
};

const BookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Get agent initials
  const getAgentInitials = (fullname?: string) => {
    if (!fullname) return 'AG';
    const names = fullname.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Check if we have a valid photo URL
  const hasValidPhoto = (photoUrl?: string, errorKey?: string) => {
    if (!photoUrl) return false;
    if (typeof photoUrl !== 'string') return false;
    const trimmed = photoUrl.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return false;
    if (errorKey && imageErrors[errorKey]) return false;
    return true;
  };

  // Handle image error
  const handleImageError = (errorKey: string) => {
    setImageErrors(prev => ({ ...prev, [errorKey]: true }));
  };

  // Payment method label helper
  const paymentMethodLabel = (method?: string) => {
    if (!method) return 'Not specified';
    const labels: Record<string, string> = {
      'credit_card': 'Credit Card',
      'bank_transfer': 'Bank Transfer',
      'company_account': 'Company Account',
      'cash': 'Cash'
    };
    return labels[method] || method;
  };

  // Format time from 24-hour format (HH:MM:SS or HH:MM) to 12-hour format (h:MM AM/PM)
  const formatTime = (time?: string) => {
    if (!time) return '';
    
    // Parse the time string (e.g., "14:00:00" or "14:00")
    const timeParts = time.split(':');
    if (timeParts.length < 2) return time;
    
    let hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    
    // Determine AM/PM
    const period = hours >= 12 ? 'PM' : 'AM';
    
    // Convert to 12-hour format
    if (hours === 0) {
      hours = 12; // Midnight
    } else if (hours > 12) {
      hours = hours - 12;
    }
    
    return `${hours}:${minutes} ${period}`;
  };

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) {
        setError('Booking ID is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        
        // Fetch booking with relations
        const { data: bookingData, error: bookingError } = await supabase
          .from('booking')
          .select(`
            *,
            listing:listings(*)
          `)
          .eq('id', id)
          .single();

        if (bookingError) {
          // Check if it's a "not found" error
          if (bookingError.code === 'PGRST116' || bookingError.message.includes('JSON object')) {
            navigate('/404', { replace: true });
            return;
          }
          throw new Error(bookingError.message);
        }
        
        if (!bookingData) {
          navigate('/404', { replace: true });
          return;
        }

        // Fetch agent details separately
        const { data: agentData } = await supabase
          .from('users')
          .select('fullname, email, profile_photo')
          .eq('id', bookingData.assigned_agent)
          .single();

        // Fetch client details
        const { data: clientData } = await supabase
          .from('client_details')
          .select('*')
          .eq('booking_id', id)
          .single();

        // Fetch payment details
        const { data: paymentData } = await supabase
          .from('payment')
          .select('*')
          .eq('booking_id', id)
          .single();

        setBooking({
          ...bookingData,
          listing: Array.isArray(bookingData.listing) ? bookingData.listing[0] : bookingData.listing,
          agent: agentData,
          client: clientData,
          payment: paymentData
        } as Booking);

      } catch (err: any) {
        console.error('Error fetching booking:', err);
        setError(err.message || 'Failed to load booking details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="pt-20 pb-8 flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Skeleton */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="h-9 w-40 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Property Header Skeleton */}
                <div className="flex items-center gap-4 border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="w-36 h-24 flex-shrink-0 bg-gray-200 rounded-md animate-pulse"></div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2"></div>
                  </div>
                  <div className="ml-2 w-44 flex-shrink-0">
                    <div className="border border-gray-100 rounded-lg p-3 bg-gray-50 space-y-3">
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="border-t border-gray-100 pt-3 space-y-2">
                        <div className="flex justify-between">
                          <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                        <div className="flex justify-between">
                          <div className="h-3 w-12 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charges Summary Skeleton */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 mt-4 pt-3">
                      <div className="flex justify-between items-center">
                        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client / Agent / Payment Info Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Client Info Skeleton */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse flex-shrink-0 mt-0.5"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse flex-shrink-0 mt-0.5"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse flex-shrink-0 mt-0.5"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info Skeleton */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="h-4 w-36 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse flex-shrink-0 mt-0.5"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-28 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse flex-shrink-0 mt-0.5"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Agent Info Skeleton */}
                  <div className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-3"></div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse flex-shrink-0"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 w-36 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-4">
                {/* Status Skeleton */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>

                {/* Duration Skeleton */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="space-y-2">
                    <div>
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div>
                      <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Location Skeleton */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="w-full h-48 bg-gray-200 rounded animate-pulse mb-4"></div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse mt-0.5"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse mt-0.5"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 bg-gray-200 rounded animate-pulse mt-0.5"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 w-36 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="pt-20 pb-8 flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-gray-500 text-lg" style={{fontFamily: 'Poppins'}}>
              {error || 'Booking not found'}
            </p>
            <button
              onClick={() => navigate('/booking')}
              className="mt-4 px-4 py-2 bg-[#0B5858] text-white rounded-lg hover:bg-[#0a4a4a]"
              style={{fontFamily: 'Poppins'}}
            >
              Back to Bookings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    value.toLocaleString('en-PH', { style: 'currency', currency: booking.currency, minimumFractionDigits: 2 });

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };


  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="pt-20 pb-8 flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold" style={{color: '#0B5858', fontFamily: 'Poppins'}}>
                  Booking Details
                </h1>
                <div className="flex items-center mt-2">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>
                    Booking ID: {id}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/booking')}
                  className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                  style={{fontFamily: 'Poppins'}}
                >
                  ← Back to Bookings
                </button>
              </div>
            </div>
          </div>

          {/* Proceed to payment CTA: shown when booking was approved by admin but payment not yet submitted, and only if assigned to current user */}
          {booking.status === 'pending-payment' && !booking.payment && booking.assigned_agent === user?.id && (
            <div className="mb-6">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-yellow-800" style={{ fontFamily: 'Poppins' }}>Proceed to payment</div>
                  <div className="text-xs text-yellow-700">This booking was approved by admin — please complete payment within 24 hours to keep the reservation.</div>
                </div>
                <div>
                  <button
                    onClick={() => navigate(`/booking/${booking.id}/payment`)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B5858] text-white rounded-md hover:bg-[#0a4a4a]"
                    style={{ fontFamily: 'Poppins' }}
                  >
                    Proceed to payment →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Property Header - Updated Design */}
              <div className="flex items-center gap-4 border border-gray-200 rounded-lg p-4 bg-white">
                <div className="w-36 h-24 flex-shrink-0 overflow-hidden rounded-md">
                  <img
                    src={booking.listing?.main_image_url || '/heroimage.png'}
                    alt={booking.listing?.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#0B5858] uppercase tracking-wide" style={{ fontFamily: 'Poppins' }}>
                      {booking.listing?.property_type || 'Property'}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800 truncate" style={{ fontFamily: 'Poppins' }}>
                    {booking.listing?.title || 'Property'}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1 truncate" style={{ fontFamily: 'Poppins' }}>
                    {booking.listing?.location || 'Location not specified'}
                  </p>

                  {/* Guest summary */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600" style={{ fontFamily: 'Poppins' }}>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M12 2v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M6 22v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                        <path d="M18 22v-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                      <span>{booking.num_guests || 0} guest{(booking.num_guests || 0) !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Booking meta card */}
                <div className="ml-2 w-44 flex-shrink-0">
                  <div className="border border-gray-100 rounded-lg p-3 bg-gray-50 text-sm" style={{ fontFamily: 'Poppins' }}>
                    <div className="text-xs text-gray-500">Booking Reference</div>
                    <div className="font-semibold text-gray-800 mt-1 break-words" style={{ wordBreak: 'break-word' }}>{booking.id.substring(0, 8)}</div>

                    <div className="border-t border-gray-100 mt-3 pt-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">Nights</div>
                        <div className="font-medium text-gray-800">{booking.nights}</div>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-gray-500">Rate</div>
                        <div className="font-medium text-gray-800">{formatCurrency(parseFloat(booking.unit_charge))}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charges Summary */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h4 className="text-base font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Poppins' }}>Charges Summary</h4>

                <div className="text-sm text-gray-700 space-y-3" style={{ fontFamily: 'Poppins' }}>
                  <div className="flex justify-between">
                    <span>Unit Charge ({booking.nights} night{booking.nights !== 1 ? 's' : ''})</span>
                    <span>{formatCurrency(parseFloat(booking.unit_charge) * booking.nights)}</span>
                  </div>

                  {booking.extra_guests > 0 && (
                    <div className="flex justify-between">
                      <span>
                        Extra guest charges ({booking.extra_guests})
                      </span>
                      <span>{formatCurrency(0)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Amenities / Additional Services</span>
                    <span>{formatCurrency((booking as any).amenities_charge || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Charges</span>
                    <span>{formatCurrency((booking as any).service_charge || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discounts</span>
                    <span className="text-gray-600">-{formatCurrency((booking as any).discount || 0)}</span>
                  </div>

                  <div className="border-t border-gray-200 mt-4 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Grand Total</span>
                      <span className="font-bold text-lg">{formatCurrency(booking.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Client / Agent / Payment Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Client Info */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h5 className="text-sm font-semibold text-gray-800 mb-3" style={{ fontFamily: 'Poppins' }}>Client Information</h5>

                  <div className="space-y-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path d="M12 12a5 5 0 100-10 5 5 0 000 10z"></path>
                        <path d="M4 20a8 8 0 0116 0H4z"></path>
                      </svg>
                      <div className="min-w-0">
                        <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>{booking.client ? `${booking.client.first_name} ${booking.client.last_name}` : 'N/A'}</div>
                        <div className="text-xs text-gray-500">Full name</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M3 8l8.5 6L20 8"></path>
                        <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                      </svg>
                      <div className="min-w-0">
                        <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>{booking.client?.email || 'N/A'}</div>
                        <div className="text-xs text-gray-500">Email</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 16.92V21a1 1 0 01-1.11 1 19.86 19.86 0 01-8.63-3.07 19.89 19.89 0 01-6-6A19.86 19.86 0 013 3.11 1 1 0 014 2h4.09a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.24 1.02L9.7 9.7a12 12 0 006.6 6.6l1.4-1.4a1 1 0 011.02-.24l3.6 1.2c.43.14.71.56.68.99z"></path>
                      </svg>
                      <div className="min-w-0">
                        <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>{booking.client?.contact_number ? `+${booking.client.contact_number}` : 'N/A'}</div>
                        <div className="text-xs text-gray-500">Phone</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Information */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h5 className="text-sm font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>Payment Information</h5>
                  <div className="space-y-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
                    {booking.status === 'pending' && !booking.payment ? (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                          <path d="M16 2v4M8 2v4M3 10h18"></path>
                        </svg>
                        <div className="min-w-0">
                          <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>
                            Temporary reservation — awaiting host confirmation
                          </div>
                          <div className="text-xs text-gray-500">Payment will open after host confirmation</div>
                        </div>
                      </div>
                    ) : booking.payment ? (
                      <>
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                          <path d="M2 10h20" fill="currentColor" />
                        </svg>
                        <div className="min-w-0">
                          <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>
                            {paymentMethodLabel(booking.payment.payment_method)}
                          </div>
                          <div className="text-xs text-gray-500">Payment method</div>
                        </div>
                      </div>

                      {booking.payment.payment_method === 'credit_card' && booking.payment.card_number_last4 && (
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                            <path d="M2 10h20" fill="currentColor" />
                          </svg>
                          <div className="min-w-0">
                            <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>
                              •••• •••• •••• {booking.payment.card_number_last4}
                            </div>
                            <div className="text-xs text-gray-500">Card number</div>
                          </div>
                        </div>
                      )}

                      {booking.payment.payment_method === 'bank_transfer' && (
                        <>
                          {booking.payment.bank_name && (
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M3 10h18"></path>
                                <path d="M12 3v6"></path>
                              </svg>
                              <div className="min-w-0">
                                <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>
                                  {booking.payment.bank_name}
                                </div>
                                <div className="text-xs text-gray-500">Bank</div>
                              </div>
                            </div>
                          )}

                          {booking.payment.depositor_name && (
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 12a5 5 0 100-10 5 5 0 000 10z"></path>
                                <path d="M4 20a8 8 0 0116 0H4z"></path>
                              </svg>
                              <div className="min-w-0">
                                <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>
                                  {booking.payment.depositor_name}
                                </div>
                                <div className="text-xs text-gray-500">Depositor name</div>
                              </div>
                            </div>
                          )}

                          {booking.payment.proof_of_payment_url && (
                            <div className="mt-2">
                              {isImageUrl(booking.payment.proof_of_payment_url) ? (
                                <a href={booking.payment.proof_of_payment_url} target="_blank" rel="noopener noreferrer" title="Open receipt">
                                  <img src={booking.payment.proof_of_payment_url} alt="Proof of payment" className="w-24 h-16 sm:w-28 sm:h-20 object-cover rounded border cursor-pointer" />
                                </a>
                              ) : (
                                <a
                                  href={booking.payment.proof_of_payment_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-[#0B5858] hover:underline"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                                    <path d="M14 3v5h5"></path>
                                  </svg>
                                  <span className="break-words" style={{ wordBreak: 'break-word' }}>View receipt</span>
                                </a>
                              )}
                            </div>
                          )}
                        </>
                      )}

                      {booking.payment.payment_method === 'company_account' && (
                        <>
                          {booking.payment.company_name && (
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M4 7h16v10H4z"></path>
                              </svg>
                              <div className="min-w-0">
                                <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>
                                  {booking.payment.company_name}
                                </div>
                                <div className="text-xs text-gray-500">Company</div>
                              </div>
                            </div>
                          )}

                          {booking.payment.billing_contact && (
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 12a5 5 0 100-10 5 5 0 000 10z"></path>
                                <path d="M4 20a8 8 0 0116 0H4z"></path>
                              </svg>
                              <div className="min-w-0">
                                <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>
                                  {booking.payment.billing_contact}
                                </div>
                                <div className="text-xs text-gray-500">Billing contact</div>
                              </div>
                            </div>
                          )}

                          {booking.payment.billing_email && (
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M3 8l8.5 6L20 8"></path>
                                <rect x="3" y="4" width="18" height="16" rx="2"></rect>
                              </svg>
                              <div className="min-w-0">
                                <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>
                                  {booking.payment.billing_email}
                                </div>
                                <div className="text-xs text-gray-500">Billing email</div>
                              </div>
                            </div>
                          )}

                          {booking.payment.billing_document_url && (
                            <div className="mt-2">
                              {isImageUrl(booking.payment.billing_document_url) ? (
                                <a href={booking.payment.billing_document_url} target="_blank" rel="noopener noreferrer" title="Open document">
                                  <img src={booking.payment.billing_document_url} alt="Billing document" className="w-24 h-16 sm:w-28 sm:h-20 object-cover rounded border cursor-pointer" />
                                </a>
                              ) : (
                                <a
                                  href={booking.payment.billing_document_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 text-sm text-[#0B5858] hover:underline"
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V8z"></path>
                                    <path d="M14 3v5h5"></path>
                                  </svg>
                                  <span className="break-words" style={{ wordBreak: 'break-word' }}>View document</span>
                                </a>
                              )}
                            </div>
                          )}

                          {booking.payment.po_number && (
                            <div className="text-xs text-gray-500 mt-1 break-words" style={{ wordBreak: 'break-word' }}>
                              PO / Ref: {booking.payment.po_number}
                            </div>
                          )}
                        </>
                      )}

                      {booking.payment.payment_method === 'cash' && (
                        <>
                          {booking.payment.payer_name && (
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                <path d="M12 12a5 5 0 100-10 5 5 0 000 10z"></path>
                                <path d="M4 20a8 8 0 0116 0H4z"></path>
                              </svg>
                              <div className="min-w-0">
                                <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>
                                  {booking.payment.payer_name}
                                </div>
                                <div className="text-xs text-gray-500">Payer name</div>
                              </div>
                            </div>
                          )}

                          {booking.payment.payer_contact && (
                            <div className="flex items-start gap-3">
                              <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M22 16.92V21a1 1 0 01-1.11 1 19.86 19.86 0 01-8.63-3.07 19.89 19.89 0 01-6-6A19.86 19.86 0 013 3.11 1 1 0 014 2h4.09a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.24 1.02L9.7 9.7a12 12 0 006.6 6.6l1.4-1.4a1 1 0 011.02-.24l3.6 1.2c.43.14.71.56.68.99z"></path>
                              </svg>
                              <div className="min-w-0">
                                <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>
                                  {booking.payment.payer_contact}
                                </div>
                                <div className="text-xs text-gray-500">Payer contact</div>
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {booking.payment.payment_status && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-500">Payment Status</div>
                          <div className="text-sm font-medium text-gray-800 capitalize">{booking.payment.payment_status}</div>
                        </div>
                      )}
                      </>
                    ) : (
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                          <path d="M2 10h20" fill="currentColor" />
                        </svg>
                        <div className="min-w-0">
                          <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>
                            Not specified
                          </div>
                          <div className="text-xs text-gray-500">Payment information not available</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Assigned Agent */}
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h5 className="text-sm font-semibold mb-3" style={{ fontFamily: 'Poppins' }}>Assigned Agent</h5>
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                      style={{
                        background: hasValidPhoto(booking.agent?.profile_photo, 'agent-main')
                          ? 'transparent'
                          : 'linear-gradient(to bottom right, #14b8a6, #0d9488)'
                      }}
                    >
                      {hasValidPhoto(booking.agent?.profile_photo, 'agent-main') ? (
                        <img
                          src={booking.agent?.profile_photo}
                          alt={booking.agent?.fullname || 'Agent'}
                          className="w-full h-full object-cover"
                          onError={() => handleImageError('agent-main')}
                        />
                      ) : (
                        <span 
                          className="text-white text-sm font-bold" 
                          style={{ fontFamily: 'Poppins', fontWeight: 700 }}
                        >
                          {getAgentInitials(booking.agent?.fullname)}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 text-sm" style={{ fontFamily: 'Poppins' }}>
                      <div className="font-medium break-words" style={{ wordBreak: 'break-word' }}>
                        {booking.agent?.fullname || 'Agent'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Booking Agent</div>
                      {booking.agent?.email && (
                        <div className="text-xs text-gray-500 mt-1 break-words" style={{ wordBreak: 'break-word' }}>
                          {booking.agent.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: side column with small cards */}
            <div className="space-y-4">
              {/* Status */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-semibold" style={{ fontFamily: 'Poppins' }}>Status</h5>
                  <div 
                    className="text-sm font-medium flex items-center gap-2"
                    style={{
                      color: booking.status === 'pending' 
                        ? '#F1C40F' 
                        : booking.status === 'pending-payment' 
                        ? '#2A7F9E' 
                        : booking.status === 'booked' || booking.status === 'ongoing' || booking.status === 'completed'
                        ? '#0B5858'
                        : booking.status === 'declined' || booking.status === 'cancelled'
                        ? '#B84C4C'
                        : '#10B981'
                    }}
                  >
                    {booking.status === 'pending' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {booking.status === 'pending-payment' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {(booking.status === 'booked' || booking.status === 'ongoing' || booking.status === 'completed') && (
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                      </svg>
                    )}
                    {(booking.status === 'declined' || booking.status === 'cancelled') && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {(() => {
                      const status = booking.status;
                      if (status === 'pending') return 'Pending';
                      if (status === 'pending-payment') {
                        // If payment record exists, show "Payment Under Review"
                        if (booking.payment) {
                          return 'Payment Under Review';
                        }
                        return 'Awaiting Payment';
                      }
                      if (status === 'booked') return 'Booked';
                      if (status === 'ongoing') return 'Ongoing';
                      if (status === 'completed') return 'Completed';
                      if (status === 'declined') return 'Declined';
                      if (status === 'cancelled') return 'Cancelled';
                      return status.charAt(0).toUpperCase() + status.slice(1);
                    })()}
                  </div>
                </div>
              </div>

              {/* Duration */}
              <div className="border border-gray-200 rounded-lg p-4 bg-white">
                <h5 className="text-sm font-semibold mb-2" style={{ fontFamily: 'Poppins' }}>Duration</h5>
                <div className="text-sm text-gray-700 space-y-2" style={{ fontFamily: 'Poppins' }}>
                  <div>
                    <div className="text-xs text-gray-500">Check-in</div>
                    <div className="break-words" style={{ wordBreak: 'break-word' }}>
                      {formatDate(booking.check_in_date)}
                      {booking.listing?.check_in_time && (
                        <span className="text-gray-500"> • {formatTime(booking.listing.check_in_time)}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Check-out</div>
                    <div className="break-words" style={{ wordBreak: 'break-word' }}>
                      {formatDate(booking.check_out_date)}
                      {booking.listing?.check_out_time && (
                        <span className="text-gray-500"> • {formatTime(booking.listing.check_out_time)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location: map + stacked details */}
              {booking.listing && (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h5 className="text-sm font-semibold mb-2" style={{ fontFamily: 'Poppins' }}>Location</h5>

                  <div>
                    {booking.listing.latitude && booking.listing.longitude ? (
                      <div className="w-full overflow-hidden rounded" style={{ borderRadius: 8 }}>
                        <iframe
                          title="Booking location map"
                          src={`https://www.google.com/maps?q=${booking.listing.latitude},${booking.listing.longitude}&output=embed`}
                          width="100%"
                          height={200}
                          style={{ border: 0 }}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">Map not available. Coordinates missing.</div>
                    )}

                    {/* Details stacked under the map */}
                    <div className="mt-4 space-y-3 text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-gray-400 mt-0.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                          <circle cx="12" cy="9" r="1.5" fill="currentColor"></circle>
                        </svg>
                        <div>
                          <div className="text-xs text-gray-500">Coordinates</div>
                          <div className="font-medium text-gray-800 break-words" style={{ wordBreak: 'break-word' }}>
                            {booking.listing.latitude && booking.listing.longitude 
                              ? `${booking.listing.latitude}, ${booking.listing.longitude}`
                              : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {booking.landmark && (
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-gray-400 mt-0.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M3 10h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                            <path d="M6 6h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                          </svg>
                          <div>
                            <div className="text-xs text-gray-500">Landmark</div>
                            <div className="font-medium text-gray-800 break-words" style={{ wordBreak: 'break-word' }}>{booking.landmark}</div>
                          </div>
                        </div>
                      )}

                      {booking.parking_info && (
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-gray-400 mt-0.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M3 7h18" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                            <path d="M6 11h12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"></path>
                          </svg>
                          <div>
                            <div className="text-xs text-gray-500">Parking</div>
                            <div className="font-medium text-gray-800 break-words" style={{ wordBreak: 'break-word' }}>{booking.parking_info}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {booking.listing.latitude && booking.listing.longitude && (
                    <div className="mt-3 text-sm">
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${booking.listing.latitude},${booking.listing.longitude}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block text-sm text-[#0B5858] hover:underline"
                      >
                        Open in Google Maps
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingDetails;