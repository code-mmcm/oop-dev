import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, signOut, userRole, userProfile, isAdmin, roleLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

          {/* Mobile Menu Button */}
          <div className="md:hidden ml-auto">
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
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  {/* Profile Picture Button */}
                  <button
                    onClick={toggleDropdown}
                    className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
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
                                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                    userRole.role === 'admin' 
                                      ? 'bg-red-100 text-red-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}>
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
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          style={{fontFamily: 'Poppins'}}
                        >
                          Settings
                        </a>
                        <a
                          href="#"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          style={{fontFamily: 'Poppins'}}
                        >
                          Help & Support
                        </a>
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
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                userRole.role === 'admin' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
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
                    <>
                      <Link
                        to="/admin"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left cursor-pointer"
                        style={{fontFamily: 'Poppins'}}
                      >
                        Admin Panel
                      </Link>
                      <Link
                        to="/manage"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left cursor-pointer"
                        style={{fontFamily: 'Poppins'}}
                      >
                        Manage Units
                      </Link>
                      <Link
                        to="/manageusers"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left cursor-pointer"
                        style={{fontFamily: 'Poppins'}}
                      >
                        Manage Users
                      </Link>
                    </>
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
                  <a
                    href="#"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors text-left cursor-pointer"
                    style={{fontFamily: 'Poppins'}}
                  >
                    Help & Support
                  </a>
                  
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
