import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../../../types/user';
import { UserService } from '../../../services/userService';

type Props = {
  profile: UserProfile;
  formatPhoneNumber: (n?: number | null) => string;
  onProfileUpdate?: (updatedProfile: UserProfile) => void;
};

const ContactInfoCard: React.FC<Props> = ({ profile, formatPhoneNumber, onProfileUpdate }) => {
  // Get initial status from profile (default to true if not set)
  const [isActive, setIsActive] = useState<boolean>(profile.active_status ?? true);
  const [isToggling, setIsToggling] = useState(false);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const previousStatusRef = React.useRef<boolean>(profile.active_status ?? true);

  // Update local state when profile changes
  useEffect(() => {
    const newStatus = profile.active_status ?? true;
    setIsActive(newStatus);
    previousStatusRef.current = newStatus;
  }, [profile.active_status]);

  const handleToggle = async () => {
    if (isToggling) return; // Prevent multiple clicks during API call
    
    // Store previous status for potential revert
    const previousStatus = isActive;
    const newStatus = !previousStatus;
    
    // Update UI immediately for responsiveness (optimistic update)
    setIsActive(newStatus);
    setIsToggling(true);
    setToggleError(null);
    previousStatusRef.current = previousStatus;
    
    try {
      console.log('Toggling profile status:', {
        userId: profile.id,
        currentStatus: previousStatus,
        newStatus: newStatus,
        willBeStoredAs: newStatus ? 'TRUE' : 'FALSE'
      });
      
      // API call to update database
      const { error } = await UserService.updateUserProfile(profile.id, {
        active_status: Boolean(newStatus) // Explicitly convert to boolean
      });
      
      if (error) {
        console.error('Error updating profile status:', error);
        throw new Error('Failed to update profile status. Please try again.');
      }
      
      console.log('Profile status updated successfully to:', newStatus ? 'TRUE' : 'FALSE');
      
      // Refresh profile data to confirm database update
      const { data: updatedProfile } = await UserService.getUserProfile(profile.id);
      if (updatedProfile) {
        console.log('Updated profile from database:', {
          active_status: updatedProfile.active_status,
          type: typeof updatedProfile.active_status
        });
        
        // Update local state with confirmed database value
        setIsActive(updatedProfile.active_status ?? true);
        previousStatusRef.current = updatedProfile.active_status ?? true;
        
        // Notify parent component of update
        if (onProfileUpdate) {
          onProfileUpdate(updatedProfile);
        }
      }
    } catch (error) {
      console.error('Error in handleToggle:', error);
      
      // Revert to previous status on error
      setIsActive(previousStatus);
      previousStatusRef.current = previousStatus;
      
      // Show error message
      setToggleError(error instanceof Error ? error.message : 'Failed to update profile status.');
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setToggleError(null);
      }, 5000);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-5 py-3 sm:py-4 border-b border-gray-100">
        <h2 className="text-sm sm:text-base md:text-lg text-black" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Contact Information</h2>
      </div>
      
      {/* View Mode - Always Display Only */}
      <div className="px-3 sm:px-4 md:px-5 py-4 sm:py-5 md:py-6 space-y-3 sm:space-y-4 md:space-y-5">
        <div>
          <p className="text-xs sm:text-sm md:text-base text-black break-words" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            {profile.email || 'Not provided'}
          </p>
          <p className="text-[10px] sm:text-[11px] md:text-xs text-gray-500 mt-0.5" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>email address</p>
        </div>
        <div>
          <p className="text-xs sm:text-sm md:text-base text-black break-words" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            {formatPhoneNumber(profile.contact_number)}
          </p>
          <p className="text-[10px] sm:text-[11px] md:text-xs text-gray-500 mt-0.5" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>phone number</p>
        </div>
        <div>
          <p className="text-xs sm:text-sm md:text-base text-black break-words" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            {profile.fullname || 'Not provided'}
          </p>
          <p className="text-[10px] sm:text-[11px] md:text-xs text-gray-500 mt-0.5" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Full Name</p>
        </div>
        
        {/* Profile Status - Clickable Toggle - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-center pt-2 border-t border-gray-100">
          <div 
            onClick={handleToggle}
            className={`cursor-pointer transition-opacity touch-manipulation ${isToggling ? 'opacity-50' : 'active:opacity-70 hover:opacity-80'}`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <p className="text-xs sm:text-sm md:text-base text-black mb-1" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>Profile Status</p>
            <p 
              className={`text-[10px] sm:text-[11px] md:text-xs font-medium transition-colors duration-200 ${
                isActive ? 'text-emerald-600' : 'text-gray-500'
              }`} 
              style={{ fontFamily: 'Poppins', fontWeight: 500 }}
            >
              {isToggling ? 'Updating...' : (isActive ? 'Active' : 'Inactive')}
            </p>
            {toggleError && (
              <p className="text-[10px] sm:text-xs text-red-600 mt-1.5 animate-fadeIn break-words" style={{ fontFamily: 'Poppins' }}>{toggleError}</p>
            )}
          </div>
          <div 
            className={`flex items-center sm:justify-end gap-2 sm:gap-3 cursor-pointer touch-manipulation ${isToggling ? 'opacity-50' : ''}`}
            onClick={handleToggle}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <label className="relative inline-flex items-center cursor-pointer min-h-[44px] min-w-[44px] justify-center sm:min-h-0 sm:min-w-0">
              <input 
                type="checkbox" 
                checked={isActive}
                onChange={handleToggle}
                disabled={isToggling}
                className="sr-only peer"
                aria-label={isActive ? 'Active status' : 'Inactive status'}
              />
              {/* Toggle Switch Background - Mobile Responsive */}
              <div 
                className={`w-11 h-6 sm:w-9 sm:h-5 md:w-10 md:h-5 rounded-full transition-colors duration-200 relative ${
                  isActive ? 'bg-emerald-500' : 'bg-gray-300'
                } ${isToggling ? 'opacity-50' : ''}`}
              >
                {isToggling && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              {/* Toggle Switch Knob - Mobile Responsive */}
              {!isToggling && (
                <div 
                  className={`absolute left-0.5 sm:left-0.5 top-0.5 w-5 h-5 sm:w-4 sm:h-4 md:w-4 md:h-4 bg-white rounded-full shadow-md transition-transform duration-200 ${
                    isActive ? 'translate-x-5 sm:translate-x-4 md:translate-x-5' : 'translate-x-0'
                  }`}
                ></div>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoCard;
