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
        if (error) throw error;
        setBooking(data as any);

        // initialize some form fields from booking if available
        setFormData((prev) => ({
          ...prev,
          listingId: data.id,
          pricePerNight: data.unit_charge ? Number(data.unit_charge) : prev.pricePerNight,
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

