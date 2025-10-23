import React from 'react';
import type { Listing } from '../../../types/listing';

interface BookingCardProps {
  listing: Listing | null;
  isLoading: boolean;
  error?: string | null;
  onReserve: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ listing, isLoading, error, onReserve }) => {
  if (isLoading) {
    return (
      <div className="w-full xl:w-96">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 top-24 animate-pulse">
          <div className="mb-6">
            <div className="h-6 bg-gray-300 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
          </div>
          <div className="mb-6">
            <div className="h-8 bg-gray-300 rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="h-4 bg-gray-300 rounded w-16 mb-2 animate-pulse"></div>
                <div className="h-5 bg-gray-300 rounded w-20 animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 bg-gray-300 rounded w-16 mb-2 animate-pulse"></div>
                <div className="h-5 bg-gray-300 rounded w-20 animate-pulse"></div>
              </div>
            </div>
            <div>
              <div className="h-4 bg-gray-300 rounded w-20 mb-2 animate-pulse"></div>
              <div className="h-5 bg-gray-300 rounded w-24 animate-pulse"></div>
            </div>
          </div>
          <div className="mb-6">
            <div className="h-5 bg-gray-300 rounded w-32 mb-3 animate-pulse"></div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="h-4 bg-gray-300 rounded w-24 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-24 mb-3 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between items-center mb-6">
            <div className="h-5 bg-gray-300 rounded w-20 animate-pulse"></div>
            <div className="h-5 bg-gray-300 rounded w-16 animate-pulse"></div>
          </div>
          <div className="h-12 bg-gray-300 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 top-24">
        <div className="text-red-500 text-center py-12">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-lg font-semibold mb-2" style={{fontFamily: 'Poppins'}}>
            {error || 'Listing not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 top-24">
        <div className="mb-6">
          <h3 className="text-xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>
            {listing.title}
          </h3>
          <div className="mt-2">
            <span className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>
              {listing.is_featured ? 'Featured Property' : 'Available Property'}
            </span>
            <span className="text-sm text-gray-500 mx-1" style={{fontFamily: 'Poppins'}}>•</span>
            <span className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>
              {listing.property_type}
            </span>
          </div>
        </div>
        <div className="mb-6">
          <div className="flex items-baseline">
            <span className="text-3xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>
              {listing.currency} {listing.price?.toLocaleString()}
            </span>
            <span className="ml-2 text-base text-gray-500" style={{fontFamily: 'Poppins'}}>
              per {listing.price_unit}
            </span>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-2" style={{fontFamily: 'Poppins'}}>Check in</p>
              <p className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>12:00 PM</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-2" style={{fontFamily: 'Poppins'}}>Check out</p>
              <p className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>10:00 AM</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-2" style={{fontFamily: 'Poppins'}}>Guest Limit</p>
            <div className="flex items-center">
              <div className="flex -space-x-1 mr-3">
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
              </div>
              <span className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                {listing.bedrooms}-{listing.bedrooms + 1} Guests
              </span>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h4 className="text-base font-bold mb-3" style={{fontFamily: 'Poppins', fontWeight: 700}}>Cancellation Policies</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-2" style={{fontFamily: 'Poppins'}}>
              Non-Refundable {listing.currency} {listing.price?.toLocaleString()}
            </p>
            <p className="text-sm text-gray-500 mb-3" style={{fontFamily: 'Poppins'}}>
              Refundable {listing.currency} {listing.price?.toLocaleString()}
            </p>
            <p className="text-sm text-gray-400" style={{fontFamily: 'Poppins'}}>
              Free cancellation before check-in, after that, the reservation is non-refundable.
            </p>
          </div>
        </div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>Total Bill:</span>
          <span className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>
            {listing.currency} {listing.price?.toLocaleString()}
          </span>
        </div>
        <button onClick={onReserve} className="w-full bg-teal-700 text-white py-4 rounded-lg font-bold uppercase text-lg" style={{fontFamily: 'Poppins', fontWeight: 700}}>
          Reserve
        </button>
      </div>
    </>
  );
};

export default BookingCard;
