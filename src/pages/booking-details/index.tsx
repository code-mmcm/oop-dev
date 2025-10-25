import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const BookingDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get booking data from navigation state or use default
  const bookingData = location.state?.bookingData || {
    transactionNumber: '#A221-092345-76',
    title: 'Kelsey Deluxe Condominium',
    location: 'Bajada, J.P. Laurel Ave, Poblacion District, Davao City, 8000 Davao del Sur',
    price: 2000,
    status: 'Confirmed Stay',
    checkIn: '2025-01-15 - 1:00 pm',
    checkOut: '2025-01-16 - 10:00 am',
    clientName: 'Micaela Ysabel Ganas',
    clientEmail: 'myganas10@gmail.com',
    clientPhone: '09154641874',
    agentName: 'Alyssa Argoncillo',
    agentPhoto: '/heroimage.png'
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 pb-8">
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
                    Transaction No. {bookingData.transactionNumber}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => navigate('/calendar')}
                  className="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
                  style={{fontFamily: 'Poppins'}}
                >
                  ← Back to Calendar
                </button>
                <a
                  href="#"
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  style={{fontFamily: 'Poppins'}}
                >
                  Experiencing an issue?
                </a>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - 5 Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* 1. Condominium Information Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex gap-6">
                  <div className="flex-shrink-0">
                    <img
                      src="/heroimage.png"
                      alt={bookingData.title}
                      className="w-48 h-32 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-500 mb-1" style={{fontFamily: 'Poppins'}}>
                      Condominium
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2" style={{fontFamily: 'Poppins'}}>
                      {bookingData.title}
                    </h2>
                    <p className="text-sm text-gray-500 mb-4" style={{fontFamily: 'Poppins'}}>
                      {bookingData.location}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl font-bold text-gray-900" style={{fontFamily: 'Poppins'}}>
                      ₱ {bookingData.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>
                      per night
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Charges Summary Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4" style={{fontFamily: 'Poppins'}}>
                  Charges Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700" style={{fontFamily: 'Poppins'}}>Unit Charge</span>
                    <span className="font-medium" style={{fontFamily: 'Poppins'}}>2,000.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700" style={{fontFamily: 'Poppins'}}>Amenities Charge</span>
                    <span className="font-medium" style={{fontFamily: 'Poppins'}}>300.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700" style={{fontFamily: 'Poppins'}}>Service Charges</span>
                    <span className="font-medium" style={{fontFamily: 'Poppins'}}>100.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700" style={{fontFamily: 'Poppins'}}>Discounts</span>
                    <span className="font-medium" style={{fontFamily: 'Poppins'}}>-0.00</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900" style={{fontFamily: 'Poppins'}}>Grand Total</span>
                    <span className="text-lg font-bold text-gray-900" style={{fontFamily: 'Poppins'}}>₱ 2,590.00</span>
                  </div>
                </div>
              </div>

              {/* 3. Client Information Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4" style={{fontFamily: 'Poppins'}}>
                  Client Information
                </h3>
                <div className="space-y-2">
                  <div className="text-gray-700" style={{fontFamily: 'Poppins'}}>
                    {bookingData.clientName}
                  </div>
                  <div className="text-blue-600 hover:text-blue-800" style={{fontFamily: 'Poppins'}}>
                    {bookingData.clientEmail}
                  </div>
                  <div className="text-gray-700" style={{fontFamily: 'Poppins'}}>
                    {bookingData.clientPhone}
                  </div>
                </div>
              </div>

              {/* 4. Payment Method Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4" style={{fontFamily: 'Poppins'}}>
                  Payment Method
                </h3>
                <div className="flex items-center">
                  <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-xs">VISA</span>
                  </div>
                  <div>
                    <div className="text-gray-700" style={{fontFamily: 'Poppins'}}>
                      {bookingData.clientName}
                    </div>
                    <div className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>
                      378282246310005
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Assigned Agent Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4" style={{fontFamily: 'Poppins'}}>
                  Assigned Agent
                </h3>
                <div className="flex items-center">
                  <img
                    src={bookingData.agentPhoto}
                    alt={bookingData.agentName}
                    className="w-12 h-12 rounded-full object-cover mr-3"
                  />
                  <div className="text-gray-700" style={{fontFamily: 'Poppins'}}>
                    {bookingData.agentName}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - 3 Cards */}
            <div className="space-y-6">
              {/* 1. Status Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4" style={{fontFamily: 'Poppins'}}>
                  Status
                </h3>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700" style={{fontFamily: 'Poppins'}}>
                    {bookingData.status}
                  </span>
                </div>
              </div>

              {/* 2. Duration Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4" style={{fontFamily: 'Poppins'}}>
                  Duration
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>Check-in:</span>
                    <div className="text-gray-700" style={{fontFamily: 'Poppins'}}>{bookingData.checkIn}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>Check-out:</span>
                    <div className="text-gray-700" style={{fontFamily: 'Poppins'}}>{bookingData.checkOut}</div>
                  </div>
                </div>
              </div>

              {/* 3. Location Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4" style={{fontFamily: 'Poppins'}}>
                  Location
                </h3>
                <div className="text-gray-500" style={{fontFamily: 'Poppins'}}>
                  {/* Empty location content as shown in design */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;
