import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { supabase } from '../../lib/supabase';
import type { UserProfile } from '../../types/user';

import ProfileHeader from './components/ProfileHeader';
import PersonalInfoCard from './components/PersonalInfoCard';
import PreviousBookings from './components/PreviousBookings';
import ContactInfoCard from './components/ContactInfoCard';
import ProfileSkeleton from './components/ProfileSkeleton';

//hi
const ProfileCard: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshUserData } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUserIdRef = useRef<string | null>(null);
  const hasFetchedProfile = useRef(false);

  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

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
        // Try UserService first
        const { data: profileData, error: profileError } = await UserService.getUserProfile(user.id);

        if (profileError || !profileData) {
          // Fallback: Direct Supabase query - select all fields including profile_photo
          const { data: directData, error: directError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          if (directError) {
            setError('Failed to load profile data. Please try again later.');
            return;
          }

          if (!directData) {
            setError('Profile not found. Please contact support.');
            return;
          }

          setProfile(directData as UserProfile);
        } else {
          setProfile(profileData as UserProfile);
        }
      } catch (err) {
        setError('Failed to load profile data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we haven't fetched yet or if the user has changed
    if (!authLoading && (!hasFetchedProfile.current || lastUserIdRef.current !== user?.id)) {
      hasFetchedProfile.current = true;
      if (user) {
        lastUserIdRef.current = user.id;
      }
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

  const handleProfileUpdate = async (updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
    // Refresh user data in AuthContext to update navbar
    if (refreshUserData) {
      await refreshUserData();
    }
  };

  const handleEditSection = () => {
    console.log('Edit section clicked');
  };

  const handleMostRecent = () => {
    console.log('Most recent clicked');
  };

  // Format date for displayy
  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Not provided';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setIsLargeScreen(e.matches);
    // set initial
    handler(mq);
    // listen for changes
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, []);


  // Format phone number for display
  const formatPhoneNumber = (phoneNumber: number | undefined | null) => {
    if (!phoneNumber) return 'Not provided';
    const phoneStr = phoneNumber.toString();
    if (phoneStr.length === 12 && phoneStr.startsWith('63')) {
      return `+${phoneStr.slice(0, 2)} ${phoneStr.slice(2, 5)} ${phoneStr.slice(5, 8)} ${phoneStr.slice(8)}`;
    }
    return phoneStr;
  };

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <div className="h-16" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <ProfileSkeleton />
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-800 mb-2" style={{ fontFamily: 'Poppins' }}>
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <svg className="w-16 h-16 text-yellow-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-yellow-800 mb-2" style={{ fontFamily: 'Poppins' }}>Profile Not Found</h2>
            <p className="text-yellow-600 mb-4" style={{ fontFamily: 'Poppins' }}>Your profile information is not available. Please contact support.</p>
          </div>
        ) : (
          <>
            <ProfileHeader 
              profile={profile} 
              onEditAccount={handleEditAccount}
              onProfileUpdate={handleProfileUpdate}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
              {isLargeScreen ? (
                // Large layout: keep Contact in right column (original location)
                <>
                  <div className="lg:col-span-2 space-y-4">
                    <PersonalInfoCard
                      profile={profile}
                      onEditSection={handleEditSection}
                      formatDate={formatDate}
                    />
                    <PreviousBookings
                      onMostRecent={handleMostRecent}
                    />
                  </div>
                  <div className="space-y-4">
                    <ContactInfoCard
                      profile={profile}
                      onEditSection={handleEditSection}
                      formatPhoneNumber={formatPhoneNumber}
                    />
                  </div>
                </>
              ) : (
                // Small layout: render PersonalInfo, then Contact, then PreviousBookings
                <>
                  <div className="space-y-4">
                    <PersonalInfoCard
                      profile={profile}
                      onEditSection={handleEditSection}
                      formatDate={formatDate}
                    />
                  </div>

                  <div className="space-y-4">
                    <ContactInfoCard
                      profile={profile}
                      onEditSection={handleEditSection}
                      formatPhoneNumber={formatPhoneNumber}
                    />
                  </div>

                  <div className="space-y-4">
                    <PreviousBookings
                      onMostRecent={handleMostRecent}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default ProfileCard;



