import React from 'react';
import BookingComponent from './components/Booking';

const BookingPage: React.FC = () => {
  return <BookingComponent />;
};

export default BookingPage;
export { default as Booking } from './components/Booking';
export { default as StayDetailsStep } from '../booking-temporary/components/StayDetailsStep';
export { default as ClientInfoStep } from '../booking-temporary/components/ClientInfoStep';
export { default as AdditionalServicesStep } from '../booking-temporary/components/AdditionalServicesStep';
export { default as PaymentInfoStep } from '../booking-temporary/components/PaymentInfoStep';
export { default as ConfirmationStep } from '../booking-temporary/components/ConfirmationStep';
