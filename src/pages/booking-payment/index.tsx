import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { supabase } from '../../lib/supabase';
import PaymentInfoStep from '../booking-temporary/components/PaymentInfoStep';
import type { BookingFormData } from '../../types/booking';

const BookingPayment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Shared formData shaped like BookingFormData so we can reuse PaymentInfoStep UI
  const [formData, setFormData] = useState<BookingFormData>({
    listingId: undefined,
    pricePerNight: undefined,
    priceUnit: undefined,
    extraGuestFeePerPerson: undefined,
    baseGuests: undefined,
    checkInDate: '',
    checkInTime: '12:00',
    checkOutDate: '',
    checkOutTime: '12:00',
    numberOfGuests: 1,
    extraGuests: 0,
    // client
    firstName: '',
    lastName: '',
    email: '',
    nickname: '',
    dateOfBirth: '',
    referredBy: '',
    gender: 'male',
    preferredContactNumber: '',
    contactType: 'mobile',
    // additional
    additionalServices: [],
    requestDescription: '',
    // payment
    paymentMethod: 'bank_transfer',
    cardNumber: '',
    nameOnCard: '',
    cvvCode: '',
    expirationDate: '',
    agreeToTerms: false,
    bankName: '',
    bankAccountNumber: '',
    depositorName: '',
    bankReceiptUploaded: false,
    bankReceiptFileName: '',
    companyName: '',
    billingContact: '',
    billingEmail: '',
    poNumber: '',
    billingDocumentUploaded: false,
    billingDocumentFileName: '',
    cashPayerName: '',
    cashPayerContact: '',
    cashPayBeforeArrival: false
  });

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('booking')
          .select('*, listing:listings(*)')
          .eq('id', id)
          .single();
        
        if (error) {
          // Check if it's a "not found" error
          if (error.code === 'PGRST116' || error.message.includes('JSON object')) {
            navigate('/404', { replace: true });
            return;
          }
          throw error;
        }
        
        if (!data) {
          navigate('/404', { replace: true });
          return;
        }
        
        setBooking(data as any);

        // initialize form fields from booking data
        const listing = Array.isArray(data.listing) ? data.listing[0] : data.listing;
        
        // Handle additional services/amenities
        let additionalServices: any[] = [];
        if (data.add_ons && Array.isArray(data.add_ons) && data.add_ons.length > 0) {
          // If add_ons is properly structured, use it
          additionalServices = data.add_ons;
        } else if (data.amenities_charge && data.amenities_charge > 0) {
          // If we only have amenities_charge value, create a synthetic entry for display
          additionalServices = [{
            id: 'amenities',
            name: 'Amenities & Additional Services',
            quantity: 1,
            charge: Number(data.amenities_charge)
          }];
        }
        
        // Calculate extra guest rate from booking data if available
        const extraGuestFee = data.extra_guest_fee || 0;
        const extraGuests = data.extra_guests || 0;
        const calculatedExtraGuestRate = extraGuests > 0 ? extraGuestFee / extraGuests : (listing?.extra_guest_fee_per_person || 0);
        
        setFormData((prev) => ({
          ...prev,
          listingId: data.listing_id,
          pricePerNight: Number(data.unit_charge || 0),
          checkInDate: data.check_in_date || '',
          checkOutDate: data.check_out_date || '',
          numberOfGuests: data.num_guests || 1,
          extraGuests: extraGuests,
          baseGuests: data.base_guest_included || listing?.base_guests || listing?.max_guests || 2,
          extraGuestRate: calculatedExtraGuestRate,
          extraGuestFeePerPerson: calculatedExtraGuestRate,
          serviceCharge: Number(data.service_charge || 0),
          discount: Number(data.discount || 0),
          additionalServices,
          paymentMethod: prev.paymentMethod || 'bank_transfer'
        }));
      } catch (err: any) {
        console.error('Failed to fetch booking', err);
        setError(err.message || 'Failed to load booking');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  const onUpdate = (data: Partial<BookingFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    if (!booking) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const amount = booking.total_amount || 0;

      const method = formData.paymentMethod || 'bank_transfer';

      const payment_status = method === 'credit_card' ? 'paid' : (formData.bankReceiptUploaded ? 'pending' : 'pending');

      const paymentData: any = {
        booking_id: booking.id,
        payment_method: method,
        amount_paid: amount,
        currency: booking.currency || 'PHP',
        payment_status,
        payer_name: formData.depositorName || formData.cashPayerName || null,
        bank_name: formData.bankName || null,
        proof_of_payment_url: null,
        reference_number: null
      };

      const { error: payError } = await supabase.from('payment').insert([paymentData]);
      if (payError) throw payError;

      if (payment_status === 'paid') {
        const { error: updErr } = await supabase.from('booking').update({ status: 'ongoing' }).eq('id', booking.id);
        if (updErr) throw updErr;
      }

      navigate(`/booking-details/${booking.id}`);
    } catch (err: any) {
      console.error('Payment submission failed', err);
      setError(err.message || 'Failed to submit payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 px-4 max-w-4xl mx-auto">
          <div className="h-24 bg-white rounded-md p-4 animate-pulse" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24 px-4 max-w-4xl mx-auto text-center">
          <p className="text-gray-600">Booking not found.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
  <div className="pt-24 px-4 max-w-6xl mx-auto mb-16">
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <h2 className="text-lg font-semibold text-[#0B5858] mb-2">Proceed to payment</h2>
          <p className="text-sm text-gray-600 mb-4">Booking ref: {booking.id.substring(0, 8)} — ₱ {booking.total_amount?.toLocaleString() || '0'}</p>

          <div className="space-y-4">
            <PaymentInfoStep
              formData={formData}
              onUpdate={onUpdate}
              onNext={handleSubmit}
              onBack={() => window.history.back()}
              onCancel={() => navigate(-1)}
              hideActions={true}
              bookingTotal={booking.total_amount}
              actualCharges={{
                nights: booking.nights,
                subtotal: booking.nights ? parseFloat(booking.unit_charge) * booking.nights : 0,
                amenitiesCharge: booking.amenities_charge || 0,
                extraGuestFees: booking.extra_guest_fee || 0,
                serviceCharge: booking.service_charge || 0,
                discount: booking.discount || 0
              }}
            />

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex items-center justify-end gap-3">
              <button onClick={() => navigate(-1)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-[#0B5858] text-white rounded">
                {isSubmitting ? 'Submitting...' : 'Submit Payment'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingPayment;

