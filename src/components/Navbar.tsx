import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  link?: string;
}

const Navbar: React.FC = () => {
  const { user, signOut, userRole, userProfile, isAdmin, isAgent, roleLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const mobileNotificationRef = useRef<HTMLDivElement>(null);

  // Get user initials for default avatar
  const getInitials = () => {
    // Try userProfile first, then userRole, then email as last resort
    const fullname = userProfile?.fullname || userRole?.fullname;
    
    if (fullname) {
      const names = fullname.trim().split(/\s+/);
      if (names.length >= 2) {
        return (names[0][0] + names[names.length - 1][0]).toUpperCase();
      }
      return names[0][0].toUpperCase();
    }
    
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  // Reset image error when profile photo changes
  useEffect(() => {
    setProfileImageError(false);
  }, [userProfile?.profile_photo]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      console.log('Starting logout process...');
      await signOut();
      console.log('Logout successful');
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error during logout:', error);
      // Still close the dropdown even if there's an error
      setIsDropdownOpen(false);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoadingNotifications(true);
      // Try to fetch from notifications table
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        // If table doesn't exist, use empty array
        console.log('Notifications table may not exist:', error);
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      setNotifications(data || []);
      const unread = (data || []).filter((n: Notification) => !n.is_read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (!error) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Fetch notifications when user is available
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Set up real-time subscription for notifications
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      // Check both desktop and mobile notification refs
      const clickedInsideDesktopNotification = notificationRef.current && notificationRef.current.contains(event.target as Node);
      const clickedInsideMobileNotification = mobileNotificationRef.current && mobileNotificationRef.current.contains(event.target as Node);
      
      if (!clickedInsideDesktopNotification && !clickedInsideMobileNotification) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format date to relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white z-[100] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-14 sm:h-16 relative">
          {/* Left side - Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="block cursor-pointer">
              <img 
                src="/logo-black.png" 
                alt="Logo" 
                className="h-14 w-auto hover:opacity-80 transition-opacity"
              />
            </Link>
          </div>

          {/* Mobile Menu Button and Notification */}
          <div className="md:hidden ml-auto flex items-center space-x-2">
            {/* Mobile Notification Bell */}
            {user && (
              <div className="relative" ref={mobileNotificationRef}>
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300 rounded-full transition-colors cursor-pointer"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Mobile Notification Dropdown */}
                {isNotificationOpen && (
                  <div className="fixed left-1/2 transform -translate-x-1/2 top-16 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900" style={{fontFamily: 'Poppins'}}>
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-teal-600 hover:text-teal-800 transition-colors"
                          style={{fontFamily: 'Poppins'}}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {loadingNotifications ? (
                        <div className="px-4 py-8 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2" style={{fontFamily: 'Poppins'}}>Loading...</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>No notifications</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                                !notification.is_read ? 'bg-blue-50' : ''
                              }`}
                              onClick={async () => {
                                if (!notification.is_read) {
                                  await markAsRead(notification.id);
                                }
                                setIsNotificationOpen(false);
                                if (notification.link) {
                                  setTimeout(() => {
                                    window.location.href = notification.link!;
                                  }, 100);
                                }
                              }}
                            >
                              <div className="flex items-start">
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`} style={{fontFamily: 'Poppins'}}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2" style={{fontFamily: 'Poppins'}}>
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1" style={{fontFamily: 'Poppins'}}>
                                    {formatDate(notification.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* View All Footer */}
                    {notifications.length > 0 && (
                      <div className="border-t border-gray-200 px-4 py-2">
                        <Link
                          to="/notifications"
                          onClick={() => setIsNotificationOpen(false)}
                          className="block text-center text-xs font-medium text-[#0B5858] hover:text-[#0a4a4a] transition-colors"
                          style={{fontFamily: 'Poppins'}}
                        >
                          View all
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900 p-2 cursor-pointer"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Center - Navigation Links */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 translate-x-[-137px]">
            <div className="flex items-baseline">
              <Link
                to="/"
                className="text-black font-sans font-medium uppercase text-sm hover:text-teal-900 transition-colors px-4 py-2 mx-1"
              >
                HOME
              </Link>
              <Link
                to="/listings"
                className="text-black font-sans font-medium uppercase text-sm hover:text-teal-900 transition-colors px-4 py-2 mx-1"
              >
                LISTINGS
              </Link>
              <Link
                to="/calendar"
                className="text-black font-sans font-medium uppercase text-sm hover:text-teal-900 transition-colors px-4 py-2 mx-1"
              >
                CALENDAR
              </Link>
            </div>
          </div>

          {/* Right side - User Menu */}
          <div className="hidden md:block flex-shrink-0 ml-auto">
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  {/* Notification Bell */}
                  <div className="relative" ref={notificationRef}>
                    <button
                      onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                      className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300 rounded-full transition-colors cursor-pointer"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center" style={{fontFamily: 'Poppins', fontSize: '10px'}}>
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {isNotificationOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900" style={{fontFamily: 'Poppins'}}>
                            Notifications
                          </h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllAsRead}
                              className="text-xs text-teal-600 hover:text-teal-800 transition-colors"
                              style={{fontFamily: 'Poppins'}}
                            >
                              Mark all as read
                            </button>
                          )}
                        </div>
                        <div className="overflow-y-auto flex-1">
                          {loadingNotifications ? (
                            <div className="px-4 py-8 text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto"></div>
                              <p className="text-sm text-gray-500 mt-2" style={{fontFamily: 'Poppins'}}>Loading...</p>
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                              <p className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>No notifications</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-gray-100">
                              {notifications.map((notification) => (
                                <div
                                  key={notification.id}
                                  className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                                    !notification.is_read ? 'bg-blue-50' : ''
                                  }`}
                                  onClick={async () => {
                                    if (!notification.is_read) {
                                      await markAsRead(notification.id);
                                    }
                                    setIsNotificationOpen(false);
                                    if (notification.link) {
                                      setTimeout(() => {
                                        window.location.href = notification.link!;
                                      }, 100);
                                    }
                                  }}
                                >
                                  <div className="flex items-start">
                                    {!notification.is_read && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`} style={{fontFamily: 'Poppins'}}>
                                        {notification.title}
                                      </p>
                                      <p className="text-xs text-gray-500 mt-1 line-clamp-2" style={{fontFamily: 'Poppins'}}>
                                        {notification.message}
                                      </p>
                                      <p className="text-xs text-gray-400 mt-1" style={{fontFamily: 'Poppins'}}>
                                        {formatDate(notification.created_at)}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {/* View All Footer */}
                        {notifications.length > 0 && (
                          <div className="border-t border-gray-200 px-4 py-2">
                            <Link
                              to="/notifications"
                              onClick={() => setIsNotificationOpen(false)}
                              className="block text-center text-xs font-medium text-[#0B5858] hover:text-[#0a4a4a] transition-colors"
                              style={{fontFamily: 'Poppins'}}
                            >
                              View all
                            </Link>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                  {/* Profile Picture Button */}
                  <button
                    onClick={toggleDropdown}
                    className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center hover:ring-2 hover:ring-teal-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    style={{
                      background: (userProfile?.profile_photo && !profileImageError)
                        ? 'transparent' 
                        : 'linear-gradient(to bottom right, #14b8a6, #0d9488)'
                    }}
                  >
                    {(userProfile?.profile_photo && !profileImageError) ? (
                      <img
                        src={userProfile.profile_photo}
                        alt={userProfile?.fullname || 'Profile'}
                        className="w-full h-full object-cover"
                        onError={() => setProfileImageError(true)}
                      />
                    ) : (
                      <span 
                        className="text-white text-sm font-bold"
                        style={{ fontFamily: 'Poppins', fontWeight: 700 }}
                      >
                        {getInitials()}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      {/* User Info - Clickable to Profile */}
                      <Link
                        to="/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                            {userProfile?.profile_photo ? (
                              <img
                                src={userProfile.profile_photo}
                                alt={userProfile.fullname}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium" style={{color: '#0B5858', fontFamily: 'Poppins'}}>
                              {roleLoading ? (
                                <span className="animate-pulse">Loading...</span>
                              ) : (
                                userProfile?.fullname || userRole?.fullname || user?.email?.split('@')[0] || 'User'
                              )}
                            </div>
                            {roleLoading ? (
                              <div className="text-xs text-gray-400 animate-pulse">Loading role...</div>
                            ) : (
                              <div className="text-xs text-gray-500" style={{fontFamily: 'Poppins'}}>
                                {userRole?.role ? (
                                  <span 
                                    className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                                    style={{
                                      backgroundColor: userRole.role === 'admin' ? '#B84C4C' : userRole.role === 'agent' ? '#FACC15' : '#558B8B',
                                      color: userRole.role === 'agent' ? '#0B5858' : 'white'
                                    }}
                                  >
                                    {userRole.role.toUpperCase()}
                                  </span>
                                ) : (
                                  'User'
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>

                      {/* Menu Items */}
                      <div className="py-1">
                        {isAdmin && (
                          <>
                            <Link
                              to="/admin"
                              onClick={() => setIsDropdownOpen(false)}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                              style={{fontFamily: 'Poppins'}}
                            >
                              <div className="flex items-center">
                                Admin Panel
                              </div>
                            </Link>
                          </>
                        )}
                        {(isAdmin || isAgent) && (
                          <Link
                            to="/booking"
                            onClick={() => setIsDropdownOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                            style={{fontFamily: 'Poppins'}}
                          >
                            My Bookings
                          </Link>
                        )}
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          style={{fontFamily: 'Poppins'}}
                        >
                          Settings
                        </a>
                        <Link
                          to="/help-and-support"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          style={{fontFamily: 'Poppins'}}
                        >
                          Help & Support
                        </Link>
                        <button
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center"
                          style={{fontFamily: 'Poppins'}}
                        >
                          {isLoggingOut ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                              Logging out...
                            </>
                          ) : (
                            'Log out'
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-black font-sans font-medium uppercase text-sm hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    LOGIN
                  </Link>
                  <Link
                    to="/signup"
                    className="text-white px-4 py-2 rounded-lg font-sans font-medium uppercase text-sm transition-colors hover:opacity-90 cursor-pointer"
                    style={{backgroundColor: '#0B5858'}}
                  >
                    SIGNUP
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <div className={`md:hidden border-t border-gray-200 mobile-menu-dropdown${isMobileMenuOpen ? ' open' : ''}`}> 
          <div className="px-4 py-3 space-y-1">
              {/* Navigation Links */}
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-black font-sans font-medium uppercase text-sm hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors text-left cursor-pointer"
              >
                HOME
              </Link>
              <Link
                to="/listings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-black font-sans font-medium uppercase text-sm hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors text-left cursor-pointer"
              >
                LISTINGS
              </Link>
              <Link
                to="/calendar"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-black font-sans font-medium uppercase text-sm hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors text-left cursor-pointer"
              >
                CALENDAR
              </Link>
              
              {/* Divider */}
              <div className="border-t border-gray-200 my-2"></div>
              
              {/* User Menu for Mobile */}
              {user ? (
                <>
                  {/* Profile Link */}
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left cursor-pointer"
                    style={{fontFamily: 'Poppins'}}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        {userProfile?.profile_photo ? (
                          <img
                            src={userProfile.profile_photo}
                            alt={userProfile.fullname}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium" style={{color: '#0B5858', fontFamily: 'Poppins'}}>
                          {roleLoading ? (
                            <span className="animate-pulse">Loading...</span>
                          ) : (
                            userProfile?.fullname || userRole?.fullname || user?.email?.split('@')[0] || 'User'
                          )}
                        </div>
                        {roleLoading ? (
                          <div className="text-xs text-gray-400 animate-pulse">Loading role...</div>
                        ) : (
                          <div className="text-xs text-gray-500" style={{fontFamily: 'Poppins'}}>
                            {userRole?.role ? (
                              <span 
                                className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  backgroundColor: userRole.role === 'admin' ? '#B84C4C' : userRole.role === 'agent' ? '#FACC15' : '#558B8B',
                                  color: userRole.role === 'agent' ? '#0B5858' : 'white'
                                }}
                              >
                                {userRole.role.toUpperCase()}
                              </span>
                            ) : (
                              'User'
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                  
                  {/* Admin Menu */}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left cursor-pointer"
                      style={{fontFamily: 'Poppins'}}
                    >
                      Admin Panel
                    </Link>
                  )}
                  
                  {/* My Bookings - Only for Admin and Agent */}
                  {(isAdmin || isAgent) && (
                    <Link
                      to="/booking"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left cursor-pointer"
                      style={{fontFamily: 'Poppins'}}
                    >
                      My Bookings
                    </Link>
                  )}
                  
                  {/* Other Menu Items */}
                  <a
                    href="#"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left cursor-pointer"
                    style={{fontFamily: 'Poppins'}}
                  >
                    Settings
                  </a>
                  <Link
                    to="/help-and-support"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left cursor-pointer"
                    style={{fontFamily: 'Poppins'}}
                  >
                    Help & Support
                  </Link>
                  
                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    disabled={isLoggingOut}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    style={{fontFamily: 'Poppins'}}
                  >
                    {isLoggingOut ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                        Logging out...
                      </>
                    ) : (
                      'Log out'
                    )}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-black font-sans font-medium uppercase text-sm hover:text-gray-600 hover:bg-gray-50 rounded-md transition-colors cursor-pointer"
                  >
                    LOGIN
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-white font-sans font-medium uppercase text-sm transition-colors hover:opacity-90 rounded-md cursor-pointer"
                    style={{backgroundColor: '#0B5858'}}
                  >
                    SIGNUP
                  </Link>
                </>
              )}
            </div>
          </div>
        
      </div>
    </nav>
  );
};

export default Navbar;
