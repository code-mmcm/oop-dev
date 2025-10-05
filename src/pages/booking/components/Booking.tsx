import React, { useState, useEffect } from 'react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { BookingService } from '../../../services/bookingService';
import type { Booking, BookingStatus } from '../../../types/booking';

const BookingComponent: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<BookingStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, activeTab]);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      // For now, using mock data. Replace with actual API call when backend is ready
      const mockBookings = BookingService.getMockBookings();
      setBookings(mockBookings);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterBookings = () => {
    if (activeTab === 'all') {
      setFilteredBookings(bookings);
    } else {
      setFilteredBookings(bookings.filter(booking => booking.status === activeTab));
    }
  };

  const formatDateRange = (checkIn: string, checkOut: string) => {
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'cancelled':
        return 'text-red-600';
      case 'ongoing':
        return 'text-orange-500';
      case 'pending':
        return 'text-yellow-600';
      case 'confirmed':
        return 'text-blue-600';
      case 'declined':
        return 'text-red-500';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: BookingStatus) => {
    switch (status) {
      case 'ongoing':
        return 'On-going';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const tabs: Array<{ key: BookingStatus | 'all'; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'ongoing', label: 'On-going' },
    { key: 'cancelled', label: 'Cancelled' },
    { key: 'declined', label: 'Declined' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-20 pb-8 min-h-[calc(100vh-5rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6" style={{fontFamily: 'Poppins'}}>
              Booking
            </h1>
            
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-gray-200">
              <div className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`pb-4 px-1 text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? 'text-gray-800 border-b-2 border-gray-800'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    style={{fontFamily: 'Poppins'}}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Booking Cards */}
          <div className="space-y-6 min-h-[400px]">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="flex justify-center items-center py-12 min-h-[400px]">
                <div className="text-center">
                  <p className="text-gray-500 text-lg" style={{fontFamily: 'Poppins'}}>
                    No bookings found for the selected filter.
                  </p>
                </div>
              </div>
            ) : (
              filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  {/* Date Range */}
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-gray-800 font-medium" style={{fontFamily: 'Poppins'}}>
                      {formatDateRange(booking.check_in_date, booking.check_out_date)}
                    </p>
                    
                    {/* Toggle Switch */}
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2" style={{fontFamily: 'Poppins'}}>
                        Notifications
                      </span>
                      <button
                        onClick={() => {
                          setToggleStates(prev => ({
                            ...prev,
                            [booking.id]: !prev[booking.id]
                          }));
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          toggleStates[booking.id] ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            toggleStates[booking.id] ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Booking Details */}
                  <div className="flex gap-6">
                    {/* Left Column - Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={booking.listing?.main_image_url || '/heroimage.png'}
                        alt={booking.listing?.title}
                        className="w-40 h-28 object-cover rounded-lg"
                      />
                    </div>

                    {/* Center Column - Details */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1" style={{fontFamily: 'Poppins'}}>
                        {booking.listing?.title}
                      </h3>
                      <p className="text-gray-600 mb-3" style={{fontFamily: 'Poppins'}}>
                        {booking.listing?.location}
                      </p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-500">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm" style={{fontFamily: 'Poppins'}}>
                            Booked for Client - {booking.user?.fullname}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-gray-500">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm" style={{fontFamily: 'Poppins'}}>
                            Transaction No. #{booking.transaction_number}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Status and Bill */}
                    <div className="flex-shrink-0 text-right">
                      <div className="mb-3">
                        <span className={`font-medium ${getStatusColor(booking.status)}`} style={{fontFamily: 'Poppins'}}>
                          {getStatusText(booking.status)}
                        </span>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-500 text-sm mb-1" style={{fontFamily: 'Poppins'}}>
                          Total Bill
                        </p>
                        <p className="text-xl font-bold text-gray-800" style={{fontFamily: 'Poppins'}}>
                          ₱ {booking.total_amount.toLocaleString()}
                        </p>
                      </div>
                      
                      <button className="bg-[#0B5858] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#0a4a4a] transition-colors" style={{fontFamily: 'Poppins'}}>
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BookingComponent;