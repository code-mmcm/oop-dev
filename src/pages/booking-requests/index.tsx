import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingService } from '../../services/bookingService';
import type { Booking } from '../../types/booking';
import { useAuth } from '../../contexts/AuthContext';
import { logger } from '../../lib/logger';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Dropdown from '../../components/Dropdown';

/**
 * BookingRequests Page Component
 * 
 * Admin interface for reviewing and managing pending booking requests.
 * Displays all bookings with status = "Pending" in an inbox-style list format.
 * Features:
 * - List of pending bookings sorted by newest first
 * - Click to view details in a drawer
 * - Approve/Decline functionality with instant status updates
 * - Toast notifications for actions
 */
const BookingRequests: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({ visible: false, message: '', type: 'success' });
  const toastRef = useRef<HTMLDivElement | null>(null);
  
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalActive, setConfirmModalActive] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<Booking | null>(null);
  
  // Summary stats
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  
  // Sort state
  const [sortBy, setSortBy] = useState('Newest first');
  const [statusFilter, setStatusFilter] = useState('All Status');
  
  // Track image errors for profile photos
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Track if we've already fetched bookings to avoid refetching on focus
  const hasFetchedAllBookings = useRef(false);

  // Get user initials for default avatar
  const getInitials = (firstName: string, lastName?: string) => {
    if (lastName) {
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    }
    return firstName.charAt(0).toUpperCase();
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

  /**
   * Check authentication and admin status
   */
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/login');
        return;
      }
      if (!isAdmin) {
        navigate('/');
        return;
      }
    }
  }, [authLoading, user, isAdmin, navigate]);

  /**
   * Fetch all bookings for summary stats
   */
  useEffect(() => {
    const fetchAllBookings = async () => {
      if (!user || !isAdmin) {
        hasFetchedAllBookings.current = false;
        return;
      }

      // Only fetch if we haven't already fetched for this user
      if (hasFetchedAllBookings.current) {
        return;
      }

      try {
        setSummaryLoading(true);
        logger.info('Fetching all bookings for summary', { userId: user.id });
        const allBookingsData = await BookingService.getAllBookings();
        setAllBookings(allBookingsData);
        hasFetchedAllBookings.current = true;
        logger.info('All bookings fetched successfully', { count: allBookingsData.length });
      } catch (error) {
        logger.error('Error fetching all bookings', { error });
        console.error('Error fetching all bookings:', error);
      } finally {
        setSummaryLoading(false);
      }
    };

    fetchAllBookings();
  }, [user, isAdmin]);


  /**
   * Show toast notification
   */
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
    // Double rAF to ensure DOM paint before adding the enter class
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = toastRef.current;
        if (!el) return;
        el.classList.remove('toast--exit');
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        el.offsetHeight;
        el.classList.add('toast--enter');
      });
    });
    // Slide out after ~2200ms
    window.setTimeout(() => {
      const el = toastRef.current;
      if (!el) return;
      el.classList.remove('toast--enter');
      el.classList.add('toast--exit');
    }, 2200);
  };

  /**
   * Handle booking click - open drawer with details
   * Uses the latest booking data from allBookings to ensure real-time updates
   */
  const handleBookingClick = (booking: Booking) => {
    // Find the latest version from allBookings to ensure we have the most up-to-date data
    const latestBooking = allBookings.find(b => b.id === booking.id) || booking;
    setSelectedBooking(latestBooking);
    setIsDrawerClosing(false); // Reset closing state when opening
    setIsDrawerOpen(true);
    logger.info('Opening booking details drawer', { bookingId: booking.id });
  };

  /**
   * Close drawer with slide-out animation
   */
  const closeDrawer = () => {
    setIsDrawerClosing(true);
    // Wait for animation to complete before actually closing
    setTimeout(() => {
      setIsDrawerOpen(false);
      setIsDrawerClosing(false);
      setTimeout(() => setSelectedBooking(null), 50);
    }, 300);
  };

  /**
   * Open confirmation modal
   */
  const openConfirmModal = (booking: Booking) => {
    setPendingBooking(booking);
    setShowConfirmModal(true);
    requestAnimationFrame(() => setConfirmModalActive(true));
  };

  /**
   * Close confirmation modal
   */
  const closeConfirmModal = () => {
    setConfirmModalActive(false);
    setTimeout(() => {
      setShowConfirmModal(false);
      setPendingBooking(null);
    }, 250);
  };

  /**
   * Handle approve action (direct, no confirmation)
   * Updates UI immediately for real-time feedback
   */
  const handleApprove = async (booking: Booking) => {
    try {
      setIsProcessing(true);
      logger.info('Approving booking', { bookingId: booking.id });
      
      // Show success toast immediately for instant feedback
      showToast('Booking request approved', 'success');
      
      // Create updated booking with new status for immediate UI update
      const updatedBooking = { ...booking, status: 'confirmed' as const };
      
      // Update UI immediately for real-time feedback
      setAllBookings(prev => prev.map(b => b.id === booking.id ? updatedBooking : b));
      
      // Update selectedBooking if drawer is open for this booking
      if (isDrawerOpen && selectedBooking?.id === booking.id) {
        setSelectedBooking(updatedBooking);
      }
      
      // Then perform the actual API call in background
      await BookingService.updateBookingStatus(booking.id, 'confirmed');
      
      // Decline all overlapping pending bookings for the same unit
      await BookingService.declineOverlappingPendingBookings(
        booking.id,
        booking.listing_id,
        booking.check_in_date,
        booking.check_out_date
      );
      
      // Refresh bookings list to show declined bookings removed
      const refreshBookings = async () => {
        try {
          const fetchedBookings = await BookingService.getAllBookings();
          const activeBookings = fetchedBookings.filter((b) => 
            b.status !== 'declined' && b.status !== 'cancelled'
          );
          setAllBookings(activeBookings);
          logger.info('Refreshed bookings after approval', { count: activeBookings.length });
        } catch (error) {
          logger.error('Error refreshing bookings after approval', { error });
        }
      };
      
      await refreshBookings();
      
      logger.info('Booking approved successfully', { bookingId: booking.id });
    } catch (error) {
      logger.error('Error approving booking', { error, bookingId: booking.id });
      console.error('Error approving booking:', error);
      // Revert UI update on error
      setAllBookings(prev => prev.map(b => b.id === booking.id ? booking : b));
      if (isDrawerOpen && selectedBooking?.id === booking.id) {
        setSelectedBooking(booking);
      }
      showToast('Unable to approve booking. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle decline action (called after confirmation)
   * Updates UI immediately for real-time feedback
   */
  const handleDecline = async () => {
    if (!pendingBooking) return;

    try {
      setIsProcessing(true);
      logger.info('Declining booking', { bookingId: pendingBooking.id });
      
      // Show success toast immediately for instant feedback
      showToast('Booking request declined', 'success');
      
      // Create updated booking with new status for immediate UI update
      const updatedBooking = { ...pendingBooking, status: 'declined' as const };
      
      // Update UI immediately for real-time feedback
      setAllBookings(prev => prev.map(b => b.id === pendingBooking.id ? updatedBooking : b));
      
      // Update selectedBooking if drawer is open for this booking
      if (isDrawerOpen && selectedBooking?.id === pendingBooking.id) {
        setSelectedBooking(updatedBooking);
      }
      
      // Close modal immediately
      closeConfirmModal();
      
      // Then perform the actual API call in background
      await BookingService.updateBookingStatus(pendingBooking.id, 'declined');
      
      logger.info('Booking declined successfully', { bookingId: pendingBooking.id });
    } catch (error) {
      logger.error('Error declining booking', { error, bookingId: pendingBooking.id });
      console.error('Error declining booking:', error);
      // Revert UI update on error
      setAllBookings(prev => prev.map(b => b.id === pendingBooking.id ? pendingBooking : b));
      if (isDrawerOpen && selectedBooking?.id === pendingBooking.id) {
        setSelectedBooking(pendingBooking);
      }
      showToast('Unable to decline booking. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Format date range for display
   */
  const formatDateRange = (checkIn: string, checkOut: string): string => {
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    return `${formatDate(startDate)} → ${formatDate(endDate)}`;
  };

  /**
   * Check if URL is an image
   */
  const isImageUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  };

  /**
   * Calculate summary stats from all bookings
   * Status breakdown:
   * - Pending: awaiting admin approval
   * - Awaiting Payment: admin approved, awaiting payment (confirmed status)
   * - Booked: payment confirmed, booking is official
   * - Declined: rejected or cancelled bookings
   */
  const getSummaryStats = () => {
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const awaitingPayment = allBookings.filter(b => b.status === 'confirmed').length;
    const booked = allBookings.filter(b => b.status === 'booked' || b.status === 'ongoing' || b.status === 'completed').length;
    const declined = allBookings.filter(b => b.status === 'declined' || b.status === 'cancelled').length;
    const total = allBookings.length;

    return { pending, awaitingPayment, booked, declined, total };
  };

  /**
   * Filter bookings based on status
   * Filter options:
   * - All Status: show all bookings
   * - Pending: awaiting admin approval
   * - Awaiting Payment: admin approved, awaiting payment (confirmed status)
   * - Booked: payment confirmed, booking is official
   * - Declined: rejected or cancelled bookings
   */
  const getFilteredBookings = (bookings: Booking[]): Booking[] => {
    if (statusFilter === 'All Status') {
      return bookings;
    }
    
    return bookings.filter(booking => {
      switch (statusFilter) {
        case 'Pending':
          return booking.status === 'pending';
        case 'Awaiting Payment':
          return booking.status === 'confirmed';
        case 'Booked':
          return booking.status === 'booked' || booking.status === 'ongoing' || booking.status === 'completed';
        case 'Declined':
          return booking.status === 'declined' || booking.status === 'cancelled';
        default:
          return true;
      }
    });
  };

  /**
   * Get status order priority for sorting
   * Pending = 1, Awaiting Payment = 2, Booked = 3, Declined = 4
   */
  const getStatusOrder = (status: string): number => {
    const statusOrder: Record<string, number> = {
      'pending': 1,
      'confirmed': 2,
      'booked': 3,
      'ongoing': 3,
      'completed': 3,
      'declined': 4,
      'cancelled': 4
    };
    return statusOrder[status] || 999;
  };

  /**
   * Sort bookings based on selected option
   * If preserveStatusOrder is true, status order is preserved first (pending → approved → declined)
   * Then secondary sorting is applied within each status group
   */
  const getSortedBookings = (bookings: Booking[], preserveStatusOrder: boolean = false): Booking[] => {
    const sorted = [...bookings];
    
    return sorted.sort((a, b) => {
      // If preserving status order, sort by status first
      if (preserveStatusOrder) {
        const statusA = getStatusOrder(a.status);
        const statusB = getStatusOrder(b.status);
        if (statusA !== statusB) {
          return statusA - statusB;
        }
        // If same status, continue to secondary sorting
      }
      
      // Apply secondary sorting based on selected option
      switch (sortBy) {
        case 'Newest first':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        
        case 'Oldest first':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        
        case 'Check-in (soonest)':
          return new Date(a.check_in_date).getTime() - new Date(b.check_in_date).getTime();
        
        case 'Amount (high to low)':
          return (b.total_amount || 0) - (a.total_amount || 0);
        
        case 'Amount (low to high)':
          return (a.total_amount || 0) - (b.total_amount || 0);
        
        default:
          return 0;
      }
    });
  };

  /**
   * Skeleton Loading Component for Booking Cards
   */
  const BookingCardSkeleton: React.FC = () => {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
        <div className="flex items-center gap-4">
          {/* Avatar Skeleton */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-200"></div>
          </div>

          {/* Content Skeleton */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Name Skeleton */}
                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                {/* Unit Name Skeleton */}
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>

            {/* Date & Amount Skeleton */}
            <div className="flex items-center gap-4 mt-2">
              <div className="h-4 bg-gray-200 rounded w-40"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>

            {/* Preview Skeleton */}
            <div className="h-4 bg-gray-200 rounded w-full mt-2"></div>
          </div>

          {/* Button Skeleton */}
          <div className="flex-shrink-0 ml-4 w-[100px]">
            <div className="h-9 bg-gray-200 rounded-lg mb-2"></div>
            <div className="h-9 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Loading state - show skeleton instead of spinner
   */
  if (authLoading || summaryLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 bg-gray-200 rounded w-64 animate-pulse"></div>
              <div className="h-8 bg-gray-200 rounded w-40 animate-pulse"></div>
            </div>
          </div>

          {/* Summary Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-5 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>

          {/* Sort Filters Skeleton */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>

          {/* Booking Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <BookingCardSkeleton key={i} />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  /**
   * Booking item component with hover glow effect
   */
  const BookingItem: React.FC<{ booking: Booking }> = ({ booking }) => {
    const [glowPosition, setGlowPosition] = React.useState({ x: 50, y: 50 });
    
    const guestName = booking.client ? `${booking.client.first_name} ${booking.client.last_name}` : 'Unknown Guest';
    const unitName = booking.listing?.title || 'Unknown Unit';
    const preview = booking.request_description 
      ? (booking.request_description.length > 60 
          ? booking.request_description.substring(0, 60) + '...' 
          : booking.request_description)
      : 'No special requests';

    // Determine status styling
    const isPending = booking.status === 'pending';
    const isAwaitingPayment = booking.status === 'confirmed';
    const isBooked = booking.status === 'booked' || booking.status === 'ongoing' || booking.status === 'completed';
    const isDeclined = booking.status === 'declined' || booking.status === 'cancelled';
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setGlowPosition({ x, y });
    };
    
    const handleMouseLeave = () => {
      setGlowPosition({ x: 50, y: 50 });
    };
    
    return (
      <div
        onClick={() => handleBookingClick(booking)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer overflow-hidden ${
          isPending ? 'bg-yellow-50/30 hover:border-[#F1C40F]/30' : 
          isAwaitingPayment ? 'bg-blue-50/30 hover:border-[#2A7F9E]/30' : 
          isBooked ? 'bg-teal-50/30 hover:border-[#0B5858]/30' : 
          isDeclined ? 'bg-red-50/30 hover:border-[#B84C4C]/30' : 
          'bg-white'
        }`}
      >
        {/* Diagonal accent stripe for pending/awaiting payment/booked/declined */}
        {(isPending || isAwaitingPayment || isBooked || isDeclined) && (
          <div
            className="absolute top-0 right-0 w-24 h-24 opacity-10 blur-xl"
            style={{
              backgroundColor: isPending ? '#F1C40F' : isAwaitingPayment ? '#2A7F9E' : isBooked ? '#0B5858' : '#B84C4C'
            }}
          />
        )}
        {/* Cursor-following glow effect */}
        {(isPending || isAwaitingPayment || isBooked || isDeclined) && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 250px at ${glowPosition.x}% ${glowPosition.y}%, ${
                isPending ? 'rgba(241, 196, 15, 0.08)' : isAwaitingPayment ? 'rgba(42, 127, 158, 0.08)' : isBooked ? 'rgba(11, 88, 88, 0.08)' : 'rgba(184, 76, 76, 0.08)'
              } 0%, transparent 70%)`,
              opacity: 1
            }}
          />
        )}
        <div className="flex items-center gap-4 relative z-10">
          {/* Guest Avatar */}
          <div className="flex-shrink-0">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden"
              style={{
                background: hasValidPhoto(booking.client?.profile_photo, `client-${booking.id}`)
                  ? 'transparent'
                  : 'linear-gradient(to bottom right, #14b8a6, #0d9488)'
              }}
            >
              {hasValidPhoto(booking.client?.profile_photo, `client-${booking.id}`) ? (
                <img
                  src={booking.client?.profile_photo}
                  alt={guestName}
                  className="w-full h-full object-cover"
                  onError={() => handleImageError(`client-${booking.id}`)}
                />
              ) : (
                <span 
                  className="text-white text-sm font-bold" 
                  style={{ fontFamily: 'Poppins', fontWeight: 700 }}
                >
                  {booking.client 
                    ? getInitials(booking.client.first_name, booking.client.last_name)
                    : guestName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* Booking Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-base" style={{ fontFamily: 'Poppins' }}>
                  {guestName}
                </h3>
                <p className="text-sm text-gray-600 mt-0.5" style={{ fontFamily: 'Poppins' }}>
                  {unitName}
                </p>
              </div>
            </div>

            {/* Date Range & Preview */}
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-0.5">
              <span style={{ fontFamily: 'Poppins' }}>{formatDateRange(booking.check_in_date, booking.check_out_date)}</span>
              <span className="text-gray-300" style={{ fontFamily: 'Poppins' }}>|</span>
              <span className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins' }}>
                ₱ {booking.total_amount?.toLocaleString() || '0'}
              </span>
            </div>

            {/* Message Preview */}
            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5" style={{ fontFamily: 'Poppins' }}>
              {preview}
            </p>
          </div>

          {/* Action Buttons - Show different buttons based on status */}
          {booking.status === 'pending' ? (
            <div className="flex-shrink-0 flex flex-col gap-2 ml-4 w-[100px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleApproveClick(booking);
                }}
                className="w-full px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                style={{ fontFamily: 'Poppins', backgroundColor: '#05807E' }}
              >
                Approve
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeclineClick(booking);
                }}
                className="w-full px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                style={{ fontFamily: 'Poppins', backgroundColor: '#B84C4C' }}
              >
                Decline
              </button>
            </div>
          ) : booking.status === 'confirmed' ? (
            // Show "Confirm Payment" button for bookings awaiting payment
            <div className="flex-shrink-0 ml-4 w-[100px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmPaymentClick(booking);
                }}
                className="w-full px-4 py-2 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
                style={{ fontFamily: 'Poppins', backgroundColor: '#2A7F9E' }}
              >
                Confirm Payment
              </button>
            </div>
          ) : (
            // Status badge for booked/declined bookings
            <div className="flex-shrink-0 ml-4 w-[100px]">
              <div
                className="w-full px-4 py-2 rounded-lg text-white text-sm font-medium shadow-lg backdrop-blur-sm text-center"
                style={{
                  fontFamily: 'Poppins',
                  background: isBooked 
                    ? 'linear-gradient(135deg, #0B5858 0%, #0d7070 100%)' 
                    : isDeclined 
                    ? 'linear-gradient(135deg, #B84C4C 0%, #c46666 100%)'
                    : 'linear-gradient(135deg, #9CA3AF 0%, #a8b3bf 100%)'
                }}
              >
                {isBooked && 'Booked'}
                {isDeclined && 'Declined'}
                {!isBooked && !isDeclined && booking.status}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  /**
   * Render booking list item (wrapper)
   */
  const renderBookingItem = (booking: Booking) => {
    return <BookingItem key={booking.id} booking={booking} />;
  };

  /**
   * Handle decline from list view - opens confirmation modal
   */
  const handleDeclineClick = (booking: Booking) => {
    openConfirmModal(booking);
  };

  /**
   * Handle approve from list view - direct action
   */
  const handleApproveClick = (booking: Booking) => {
    handleApprove(booking);
  };

  /**
   * Handle confirm payment action
   * Updates booking status from 'confirmed' to 'booked'
   * Updates UI immediately for real-time feedback
   */
  const handleConfirmPaymentClick = async (booking: Booking) => {
    try {
      setIsProcessing(true);
      logger.info('Confirming payment for booking', { bookingId: booking.id });
      
      // Show success toast immediately for instant feedback
      showToast('Payment confirmed — booking is now official', 'success');
      
      // Create updated booking with new status for immediate UI update
      const updatedBooking = { ...booking, status: 'booked' as const };
      
      // Update UI immediately for real-time feedback
      setAllBookings(prev => prev.map(b => b.id === booking.id ? updatedBooking : b));
      
      // Update selectedBooking if drawer is open for this booking
      if (isDrawerOpen && selectedBooking?.id === booking.id) {
        setSelectedBooking(updatedBooking);
      }
      
      // Then perform the actual API call in background
      await BookingService.confirmPayment(booking.id);
      
      logger.info('Payment confirmed successfully', { bookingId: booking.id });
    } catch (error) {
      logger.error('Error confirming payment', { error, bookingId: booking.id });
      console.error('Error confirming payment:', error);
      // Revert UI update on error
      setAllBookings(prev => prev.map(b => b.id === booking.id ? booking : b));
      if (isDrawerOpen && selectedBooking?.id === booking.id) {
        setSelectedBooking(booking);
      }
      showToast('Unable to confirm payment. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />

      {/* Toast Notification */}
      {toast.visible && (
        <div className="fixed right-0 top-24 pr-6 z-[2000] pointer-events-none">
          <div
            ref={toastRef}
            className="toast-base px-4 py-3 rounded-lg pointer-events-auto"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#1F2937',
              fontFamily: 'Poppins',
              boxShadow: '0 18px 44px rgba(0, 0, 0, 0.35)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderLeft: `6px solid ${toast.type === 'success' ? '#0B5858' : '#B84C4C'}`
            }}
            onTransitionEnd={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              if (el.classList.contains('toast--exit')) {
                setToast({ visible: false, message: '', type: 'success' });
                el.classList.remove('toast--exit');
              }
            }}
          >
            {toast.message}
          </div>
        </div>
      )}
      <style>{`
        .toast-base { transform: translateX(100%); opacity: 0; transition: transform .28s ease-out, opacity .28s ease-out; will-change: transform, opacity; }
        .toast--enter { transform: translateX(0); opacity: 1; }
        .toast--exit { transform: translateX(100%); opacity: 0; }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>
                Booking Requests
              </h1>
            </div>
            <button
              onClick={() => navigate('/admin')}
              className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer flex items-center gap-1"
              style={{ fontFamily: 'Poppins' }}
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>

        {/* Summary Bar */}
        {!summaryLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {(() => {
              const stats = getSummaryStats();
              return (
                <>
                  {/* Pending */}
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-[#F1C40F] rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-600 text-sm font-semibold" style={{ fontFamily: 'Poppins' }}>Pending</p>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#F1C40F' }}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>{stats.pending}</p>
                    </div>
                  </div>

                  {/* Awaiting Payment */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-[#2A7F9E] rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-600 text-sm font-semibold" style={{ fontFamily: 'Poppins' }}>Awaiting Payment</p>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2A7F9E' }}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>{stats.awaitingPayment}</p>
                    </div>
                  </div>

                  {/* Booked */}
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-l-4 border-[#0B5858] rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-600 text-sm font-semibold" style={{ fontFamily: 'Poppins' }}>Booked</p>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#0B5858' }}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>{stats.booked}</p>
                    </div>
                  </div>

                  {/* Declined */}
                  <div className="bg-gradient-to-br from-red-50 to-red-100 border-l-4 border-[#B84C4C] rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-600 text-sm font-semibold" style={{ fontFamily: 'Poppins' }}>Declined</p>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#B84C4C' }}>
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>{stats.declined}</p>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-l-4 border-gray-400 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-gray-600 text-sm font-semibold" style={{ fontFamily: 'Poppins' }}>Total</p>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-400">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>{stats.total}</p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Sort Dropdown */}
        {!summaryLoading && allBookings.length > 0 && (
          <div className="mb-6 flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins' }}>Status:</span>
            <div className="w-full md:w-auto min-w-[180px]">
              <Dropdown
                label={statusFilter}
                options={[
                  { value: 'All Status', label: 'All Status' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Awaiting Payment', label: 'Awaiting Payment' },
                  { value: 'Booked', label: 'Booked' },
                  { value: 'Declined', label: 'Declined' }
                ]}
                onSelect={(value) => setStatusFilter(value)}
                placeholder="All Status"
                className="min-w-[180px]"
              />
            </div>
            <span className="text-sm font-medium text-gray-700 ml-2" style={{ fontFamily: 'Poppins' }}>Sort by:</span>
            <div className="w-full md:w-auto min-w-[200px]">
              <Dropdown
                label={sortBy}
                options={[
                  { value: 'Newest first', label: 'Newest first' },
                  { value: 'Oldest first', label: 'Oldest first' },
                  { value: 'Check-in (soonest)', label: 'Check-in (soonest)' },
                  { value: 'Amount (high to low)', label: 'Amount (high to low)' },
                  { value: 'Amount (low to high)', label: 'Amount (low to high)' }
                ]}
                onSelect={(value) => setSortBy(value)}
                placeholder="Sort by"
                className="min-w-[200px]"
              />
            </div>
          </div>
        )}

        {/* Booking List */}
        {getFilteredBookings(allBookings).length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins' }}>
              No {statusFilter === 'All Status' ? 'Bookings' : statusFilter} Requests
            </h3>
            <p className="text-gray-600" style={{ fontFamily: 'Poppins' }}>
              {statusFilter === 'All Status' ? 'No bookings found' : `No ${statusFilter.toLowerCase()} booking requests`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(() => {
              const filtered = getFilteredBookings(allBookings);
              // If showing All Status, sort by status first (pending → approved → declined)
              // Then apply secondary sorting within each status group
              const preserveStatusOrder = statusFilter === 'All Status';
              return getSortedBookings(filtered, preserveStatusOrder).map(renderBookingItem);
            })()}
          </div>
        )}
      </div>

      {/* Details Drawer */}
      {isDrawerOpen && selectedBooking && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 cursor-pointer"
            style={{
              backdropFilter: 'blur(4px)',
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              transition: 'background-color 0.25s ease'
            }}
            onClick={closeDrawer}
          />

          {/* Drawer */}
          <div className={`fixed inset-y-0 right-0 w-full sm:w-[640px] bg-white shadow-xl z-50 flex flex-col ${isDrawerClosing ? 'animate-slide-out' : 'animate-slide-in'}`}>
            {/* Drawer Header */}
            <div className="px-6 py-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>
                  Booking Details
                </h2>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 cursor-pointer"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Booking Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>Status:</span>
                  <span className="text-base font-semibold text-gray-900" style={{ fontFamily: 'Poppins' }}>
                    {(() => {
                      const status = selectedBooking.status;
                      if (status === 'pending') return 'Pending';
                      if (status === 'confirmed') return 'Awaiting Payment';
                      if (status === 'booked' || status === 'ongoing' || status === 'completed') return 'Booked';
                      if (status === 'declined' || status === 'cancelled') return 'Declined';
                      // Fallback: capitalize first letter of status string
                      const statusStr = String(status);
                      return statusStr.charAt(0).toUpperCase() + statusStr.slice(1);
                    })()}
                  </span>
                </div>
                {selectedBooking.status === 'pending' && (
                  <button
                    onClick={() => {
                      if (selectedBooking) {
                        navigate(`/booking-details/${selectedBooking.id}`);
                      }
                    }}
                    className="text-sm font-semibold transition-all duration-200 cursor-pointer hover:scale-105 active:scale-100 relative group"
                    style={{ fontFamily: 'Poppins', color: '#0B5858' }}
                  >
                    <span className="relative inline-block">
                      [ View Full Details ]
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#0B5858] transition-all duration-300 group-hover:w-full"></span>
                    </span>
                  </button>
                )}
              </div>
            </div>
            {/* Divider */}
            <div className="border-b border-gray-200"></div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Client and Agent Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Client Details */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3" style={{ fontFamily: 'Poppins' }}>
                    Client Information
                  </h3>
                  {selectedBooking.client ? (
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{
                          background: hasValidPhoto(selectedBooking.client?.profile_photo, `drawer-client-${selectedBooking.id}`)
                            ? 'transparent'
                            : 'linear-gradient(to bottom right, #14b8a6, #0d9488)'
                        }}
                      >
                        {hasValidPhoto(selectedBooking.client?.profile_photo, `drawer-client-${selectedBooking.id}`) ? (
                          <img
                            src={selectedBooking.client.profile_photo}
                            alt={`${selectedBooking.client.first_name} ${selectedBooking.client.last_name}`}
                            className="w-full h-full object-cover"
                            onError={() => handleImageError(`drawer-client-${selectedBooking.id}`)}
                          />
                        ) : (
                          <span 
                            className="text-white text-lg font-bold" 
                            style={{ fontFamily: 'Poppins', fontWeight: 700 }}
                          >
                            {getInitials(selectedBooking.client.first_name, selectedBooking.client.last_name)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <h4 className="text-xs text-gray-900" style={{ fontFamily: 'Poppins' }}>
                            {`${selectedBooking.client.first_name} ${selectedBooking.client.last_name}`}
                          </h4>
                        </div>
                        {selectedBooking.client.email && (
                          <div className="flex items-center gap-2 mb-0.5">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-gray-900 truncate" style={{ fontFamily: 'Poppins' }}>
                              {selectedBooking.client.email}
                            </p>
                          </div>
                        )}
                        {selectedBooking.client.contact_number && (
                          <div className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins' }}>
                              {selectedBooking.client.contact_number}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>No client information available</p>
                    </div>
                  )}
                </div>

                {/* Assigned Agent */}
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3" style={{ fontFamily: 'Poppins' }}>
                    Assigned Agent
                  </h3>
                  {selectedBooking.agent ? (
                    <div className="flex items-start gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{
                          background: hasValidPhoto(selectedBooking.agent?.profile_photo, `drawer-agent-${selectedBooking.id}`)
                            ? 'transparent'
                            : 'linear-gradient(to bottom right, #14b8a6, #0d9488)'
                        }}
                      >
                        {hasValidPhoto(selectedBooking.agent?.profile_photo, `drawer-agent-${selectedBooking.id}`) ? (
                          <img
                            src={selectedBooking.agent.profile_photo}
                            alt={selectedBooking.agent.fullname || 'Agent'}
                            className="w-full h-full object-cover"
                            onError={() => handleImageError(`drawer-agent-${selectedBooking.id}`)}
                          />
                        ) : (
                          <span 
                            className="text-white text-lg font-bold" 
                            style={{ fontFamily: 'Poppins', fontWeight: 700 }}
                          >
                            {selectedBooking.agent.fullname 
                              ? (() => {
                                  const names = selectedBooking.agent.fullname.trim().split(/\s+/);
                                  if (names.length >= 2) {
                                    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
                                  }
                                  return names[0][0].toUpperCase();
                                })()
                              : 'A'}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <h4 className="text-xs text-gray-900" style={{ fontFamily: 'Poppins' }}>
                            {selectedBooking.agent.fullname || 'Unknown Agent'}
                          </h4>
                        </div>
                        {selectedBooking.agent.email && (
                          <div className="flex items-center gap-2 mb-0.5">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <p className="text-xs text-gray-900 truncate" style={{ fontFamily: 'Poppins' }}>
                              {selectedBooking.agent.email}
                            </p>
                          </div>
                        )}
                        {selectedBooking.agent.contact_number && (
                          <div className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <p className="text-xs text-gray-900" style={{ fontFamily: 'Poppins' }}>
                              {selectedBooking.agent.contact_number}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>No agent assigned</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Details */}
              <div className="mb-6">
                <h3 className="text-base font-bold text-gray-900 mb-3" style={{ fontFamily: 'Poppins' }}>
                  Booking Details
                </h3>
                <div className="space-y-0 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <div className="flex items-start py-1">
                    <span className="text-xs font-medium text-gray-600 w-[30%]" style={{ fontFamily: 'Poppins' }}>Unit</span>
                    <span className="text-xs text-gray-900 ml-4 flex-1" style={{ fontFamily: 'Poppins' }}>
                      {selectedBooking.listing?.title || 'Unknown Unit'}
                    </span>
                  </div>
                  <div className="flex items-start py-1">
                    <span className="text-xs font-medium text-gray-600 w-[30%]" style={{ fontFamily: 'Poppins' }}>Location</span>
                    <span className="text-xs text-gray-900 ml-4 flex-1" style={{ fontFamily: 'Poppins' }}>
                      {selectedBooking.listing?.location || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-start py-1">
                    <span className="text-xs font-medium text-gray-600 w-[30%]" style={{ fontFamily: 'Poppins' }}>Check-in</span>
                    <span className="text-xs text-gray-900 ml-4 flex-1" style={{ fontFamily: 'Poppins' }}>
                      {new Date(selectedBooking.check_in_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-start py-1">
                    <span className="text-xs font-medium text-gray-600 w-[30%]" style={{ fontFamily: 'Poppins' }}>Check-out</span>
                    <span className="text-xs text-gray-900 ml-4 flex-1" style={{ fontFamily: 'Poppins' }}>
                      {new Date(selectedBooking.check_out_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {((selectedBooking.num_guests && selectedBooking.num_guests > 0) || (selectedBooking.extra_guests && selectedBooking.extra_guests > 0)) && (
                    <div className="flex items-start py-1">
                      <span className="text-xs font-medium text-gray-600 w-[30%]" style={{ fontFamily: 'Poppins' }}>Guest count</span>
                      <span className="text-xs text-gray-900 ml-4 flex-1" style={{ fontFamily: 'Poppins' }}>
                        {(() => {
                          const adults = selectedBooking.num_guests || 0;
                          const children = selectedBooking.extra_guests || 0;
                          const parts = [];
                          if (adults > 0) parts.push(`${adults} ${adults === 1 ? 'adult' : 'adults'}`);
                          if (children > 0) parts.push(`${children} ${children === 1 ? 'child' : 'children'}`);
                          return parts.join(', ');
                        })()}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start py-1">
                    <span className="text-xs font-medium text-gray-600 w-[30%]" style={{ fontFamily: 'Poppins' }}>Total Price</span>
                    <span className="text-xs text-gray-900 ml-4 flex-1" style={{ fontFamily: 'Poppins' }}>
                      ₱ {selectedBooking.total_amount?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Special Request */}
              {selectedBooking.request_description && (
                <div className="mb-6">
                  <h3 className="text-base font-bold text-gray-900 mb-3" style={{ fontFamily: 'Poppins' }}>
                    Special Request
                  </h3>
                  <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                    <p className="text-xs leading-relaxed text-gray-700" style={{ fontFamily: 'Poppins' }}>
                      {selectedBooking.request_description}
                    </p>
                  </div>
                </div>
              )}

              {/* Proof of Payment */}
              {(selectedBooking as any).billing_document_url && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3" style={{ fontFamily: 'Poppins' }}>
                    Proof of Payment
                  </h3>
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                    {isImageUrl((selectedBooking as any).billing_document_url) ? (
                      <img
                        src={(selectedBooking as any).billing_document_url}
                        alt="Proof of payment"
                        className="w-full max-h-96 object-contain rounded-lg border border-gray-300 shadow-sm"
                      />
                    ) : (
                      <a
                        href={(selectedBooking as any).billing_document_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B5858] text-white rounded-lg hover:bg-[#0a4a4a] transition-colors font-medium text-sm"
                        style={{ fontFamily: 'Poppins' }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View Document
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Actions */}
            <div className="px-6 py-5 border-t border-gray-200 flex gap-3">
              <button
                onClick={closeDrawer}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                style={{ fontFamily: 'Poppins' }}
              >
                Close
              </button>
              {selectedBooking.status === 'pending' && (
                <>
                  <button
                    onClick={() => selectedBooking && openConfirmModal(selectedBooking)}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
                    style={{ fontFamily: 'Poppins', backgroundColor: '#B84C4C' }}
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => selectedBooking && handleApprove(selectedBooking)}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
                    style={{ fontFamily: 'Poppins', backgroundColor: '#05807E' }}
                  >
                    Approve
                  </button>
                </>
              )}
              {selectedBooking.status === 'confirmed' && (
                <>
                  <button
                    onClick={() => selectedBooking && handleConfirmPaymentClick(selectedBooking)}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100 whitespace-nowrap"
                    style={{ fontFamily: 'Poppins', backgroundColor: '#2A7F9E' }}
                  >
                    {isProcessing ? 'Processing...' : 'Confirm Payment'}
                  </button>
                  <button
                    onClick={() => {
                      if (selectedBooking) {
                        navigate(`/booking-details/${selectedBooking.id}`);
                      }
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer font-medium whitespace-nowrap"
                    style={{ fontFamily: 'Poppins' }}
                  >
                    View Full Details
                  </button>
                </>
              )}
              {selectedBooking.status !== 'pending' && selectedBooking.status !== 'confirmed' && (
                <button
                  onClick={() => {
                    if (selectedBooking) {
                      navigate(`/booking-details/${selectedBooking.id}`);
                    }
                  }}
                  className="flex-1 px-6 py-3 text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer font-medium"
                  style={{ fontFamily: 'Poppins', backgroundColor: '#0B5858' }}
                >
                  View Full Details
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            transition: 'background-color 0.25s ease'
          }}
          onClick={closeConfirmModal}
        >
          <div 
            className="max-w-md w-full mx-4"
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
              transform: confirmModalActive ? 'scale(1)' : 'scale(0.95)',
              opacity: confirmModalActive ? 1 : 0,
              transition: 'all 0.25s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2" style={{fontFamily: 'Poppins'}}>
                Decline Booking Request
              </h3>
              <p className="text-gray-700 mb-5" style={{fontFamily: 'Poppins'}}>
                Are you sure you want to decline this booking request? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeConfirmModal}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  style={{fontFamily: 'Poppins'}}
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecline}
                  disabled={isProcessing}
                  className="px-4 py-2 text-white rounded-lg transition-all duration-200 hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100"
                  style={{
                    backgroundColor: '#B84C4C',
                    fontFamily: 'Poppins'
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Decline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide-in and slide-out animations */}
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        @keyframes slide-out {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
        .animate-slide-out {
          animation: slide-out 0.3s ease-out;
        }
      `}</style>

      <Footer />
    </div>
  );
};

export default BookingRequests;

