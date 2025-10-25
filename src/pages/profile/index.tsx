import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { supabase } from '../../lib/supabase';
import type { UserProfile } from '../../types/user';

const ProfileCard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        console.log('ProfileCard: Fetching profile for user ID:', user.id);
        
        // Try UserService first
        const { data: profileData, error: profileError } = await UserService.getUserProfile(user.id);
        
        if (profileError || !profileData) {
          console.log('ProfileCard: UserService failed, trying direct Supabase query');
          
          // Fallback: Direct Supabase query
          const { data: directData, error: directError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (directError) {
            console.error('ProfileCard: Direct query also failed:', directError);
            setError('Failed to load profile data. Please try again later.');
            return;
          }

          if (!directData) {
            console.error('ProfileCard: No profile data found for user:', user.id);
            setError('Profile not found. Please contact support.');
            return;
          }

          console.log('ProfileCard: Profile data loaded via direct query:', directData);
          setProfile(directData);
        } else {
          console.log('ProfileCard: Profile data loaded via UserService:', profileData);
          setProfile(profileData);
        }
      } catch (err) {
        console.error('ProfileCard: Unexpected error fetching profile:', err);
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchProfile();
    }
  }, [user, authLoading]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

  const handleEditAccount = () => {
    console.log('Edit account clicked');
  };

  const handleEditSection = () => {
    console.log('Edit section clicked');
  };

  const handleMostRecent = () => {
    console.log('Most recent clicked');
  };

  // Format date for display
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) {
      return 'Not provided';
    }
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  // Format phone number for display
  const formatPhoneNumber = (phoneNumber: number | undefined | null) => {
    if (!phoneNumber) {
      return 'Not provided';
    }
    
    const phoneStr = phoneNumber.toString();
    if (phoneStr.length === 12 && phoneStr.startsWith('63')) {
      return `+${phoneStr.slice(0, 2)} ${phoneStr.slice(2, 5)} ${phoneStr.slice(5, 8)} ${phoneStr.slice(8)}`;
    }
    return phoneStr;
  };

  // Skeleton component for loading states (content only, no navbar)
  const ProfileSkeleton = () => (
    <>
      {/* Top profile header skeleton */}
      <div className="bg-white rounded-xl shadow border border-gray-200 px-4 sm:px-5 py-6 sm:py-7 mb-4 sm:mb-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-300 animate-pulse"></div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="space-y-2">
                <div className="h-6 bg-gray-300 rounded animate-pulse w-48"></div>
                <div className="h-4 bg-gray-300 rounded animate-pulse w-32"></div>
              </div>
              <div className="h-8 bg-gray-300 rounded animate-pulse w-24"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded animate-pulse w-full"></div>
              <div className="h-4 bg-gray-300 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Left column skeleton */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal information card skeleton */}
          <div className="bg-white rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
              <div className="h-5 bg-gray-300 rounded animate-pulse w-48"></div>
              <div className="h-6 bg-gray-300 rounded animate-pulse w-16"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-5 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded animate-pulse w-32"></div>
                  <div className="h-3 bg-gray-300 rounded animate-pulse w-20"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Previous bookings card skeleton */}
          <div className="bg-white rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
              <div className="h-5 bg-gray-300 rounded animate-pulse w-40"></div>
              <div className="h-6 bg-gray-300 rounded animate-pulse w-24"></div>
            </div>
            <div className="divide-y divide-gray-100">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-3">
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                    <div className="w-20 h-14 sm:w-24 sm:h-16 bg-gray-300 rounded-md animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-300 rounded animate-pulse w-40"></div>
                      <div className="h-3 bg-gray-300 rounded animate-pulse w-32"></div>
                      <div className="h-4 bg-gray-300 rounded animate-pulse w-24"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-300 rounded animate-pulse w-16"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column skeleton */}
        <div className="space-y-4">
          {/* Contact information card skeleton */}
          <div className="bg-white rounded-xl shadow border border-gray-200">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
              <div className="h-5 bg-gray-300 rounded animate-pulse w-40"></div>
              <div className="h-6 bg-gray-300 rounded animate-pulse w-16"></div>
            </div>
            <div className="px-4 sm:px-5 py-4 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded animate-pulse w-48"></div>
                  <div className="h-3 bg-gray-300 rounded animate-pulse w-24"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Show loading while checking auth or redirecting
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="h-16" />
        <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header spacer for fixed navbar */}
      <div className="h-16" />

      {/* Page content container */}
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        {/* Loading State */}
        {isLoading ? (
          <ProfileSkeleton />
        ) : error ? (
          /* Error State */
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-800 mb-2" style={{fontFamily: 'Poppins'}}>
              Error Loading Profile
            </h2>
            <p className="text-red-600 mb-4" style={{fontFamily: 'Poppins'}}>
              {error}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              style={{fontFamily: 'Poppins'}}
            >
              Try Again
            </button>
          </div>
        ) : !profile ? (
          /* No Profile Data */
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-yellow-800 mb-2" style={{fontFamily: 'Poppins'}}>
              Profile Not Found
            </h2>
            <p className="text-yellow-600 mb-4" style={{fontFamily: 'Poppins'}}>
              Your profile information is not available. Please contact support.
            </p>
          </div>
        ) : (
          /* Profile Data */
          <>
            {/* Top profile header */}
            <div className="bg-white rounded-xl shadow border border-gray-200 px-4 sm:px-5 py-6 sm:py-7 mb-4 sm:mb-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {profile.profile_photo ? (
                    <img 
                      src={profile.profile_photo} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.761 0 5-2.462 5-5.5S14.761 1 12 1 7 3.462 7 6.5 9.239 12 12 12zm0 2c-4.418 0-8 2.91-8 6.5V22h16v-1.5c0-3.59-3.582-6.5-8-6.5z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-xl sm:text-2xl text-black" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                        {profile.fullname || 'User'}
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-500 -mt-0.5" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                        {profile.email || 'No email provided'}
                      </p>
                    </div>
                    <button onClick={handleEditAccount} className="px-3 sm:px-4 py-2 rounded-lg text-white text-xs sm:text-sm cursor-pointer" style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>Edit account</button>
                  </div>
                  <p className="mt-2 text-xs sm:text-sm text-gray-500 leading-snug" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                    Welcome to your profile! Here you can view and manage your personal information and booking history.
                  </p>
                </div>
              </div>
            </div>

        {/* Main two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Left column (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {/* All personal information card */}
            <div className="bg-white rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
                <h2 className="text-base sm:text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 700}}>All Personal Information</h2>
                <button onClick={handleEditSection} className="text-xs sm:text-sm px-3 py-1 rounded-md text-white cursor-pointer" style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>Edit</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-5 py-4">
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                    {profile.fullname || 'Not provided'}
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Full name</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                    {formatDate(profile.birth)}
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Birthday</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                    {profile.gender || 'Not provided'}
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Gender</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                    {profile.address || 'Not provided'}
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Location</p>
                </div>
              </div>
            </div>

            {/* Previous bookings card */}
            <div className="bg-white rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
                <h2 className="text-base sm:text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 700}}>Previous Bookings</h2>
                <button onClick={handleMostRecent} className="text-xs sm:text-sm px-3 py-1 rounded-md text-black bg-gray-100 cursor-pointer" style={{fontFamily: 'Poppins', fontWeight: 600}}>Most Recent</button>
              </div>
              <div className="divide-y divide-gray-100">
                {[1,2,3].map((i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-3">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      <img src="/avida.jpg" alt="listing" className="w-20 h-14 sm:w-24 sm:h-16 object-cover rounded-md" />
                      <div>
                        <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Apartment complex in Davao</p>
                        <p className="text-xs sm:text-[11px] text-gray-500 -mt-0.5" style={{fontFamily: 'Poppins', fontWeight: 400}}>Matina, Davao City</p>
                        <p className="text-sm sm:text-base text-black mt-1" style={{fontFamily: 'Poppins', fontWeight: 600}}>₱4,320 <span className="text-gray-500 text-xs sm:text-sm" style={{fontFamily: 'Poppins', fontWeight: 400}}>per night</span></p>
                      </div>
                    </div>
                    <button onClick={() => navigate('/unit')} className="px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base bg-gray-100 w-full sm:w-auto cursor-pointer" style={{fontFamily: 'Poppins', fontWeight: 600}}>View</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-4">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
                <h2 className="text-base sm:text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 700}}>Contact Information</h2>
                <button onClick={handleEditSection} className="text-xs sm:text-sm px-3 py-1 rounded-md text-white cursor-pointer" style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>Edit</button>
              </div>
              <div className="px-4 sm:px-5 py-4 space-y-4">
                <div>
                  <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                    {profile.email || 'Not provided'}
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>email address</p>
                </div>
                <div>
                  <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                    {formatPhoneNumber(profile.contact_number)}
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>phone number</p>
                </div>
                <div>
                  <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                    {profile.fullname || 'Not provided'}
                  </p>
                  <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Full Name</p>
                </div>
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Profile Status</p>
                    <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Active</p>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}></span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 sm:w-10 sm:h-5 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors"></div>
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4 sm:peer-checked:translate-x-5"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      {/* Footer Section - Outside container for full width */}
      <Footer />
    </div>
  );
};

export default ProfileCard;



