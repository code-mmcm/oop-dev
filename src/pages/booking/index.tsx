import React from 'react';
import BookingComponent from './components/Booking';

const BookingPage: React.FC = () => {
  return <BookingComponent />;
};

export default BookingPage;
export { default as Booking } from './components/Booking';
export { default as StayDetailsStep } from './components/StayDetailsStep';
export { default as ClientInfoStep } from './components/ClientInfoStep';
export { default as AdditionalServicesStep } from './components/AdditionalServicesStep';
export { default as PaymentInfoStep } from './components/PaymentInfoStep';
export { default as ConfirmationStep } from './components/ConfirmationStep';
