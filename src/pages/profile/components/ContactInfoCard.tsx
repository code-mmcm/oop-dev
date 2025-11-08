import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../../../types/user';
import { UserService } from '../../../services/userService';

//hi
type Props = {
  profile: UserProfile;
  onEditSection: () => void;
  formatPhoneNumber: (n?: number | null) => string;
  onProfileUpdate?: (updatedProfile: UserProfile) => void;
};

const ContactInfoCard: React.FC<Props> = ({ profile, onEditSection, formatPhoneNumber, onProfileUpdate }) => {
  const [isActive, setIsActive] = useState(profile.active_status ?? true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Update local state when profile changes
  useEffect(() => {
    setIsActive(profile.active_status ?? true);
  }, [profile.active_status]);

  const handleToggle = async () => {
    const newStatus = !isActive;
    setIsActive(newStatus);
    setIsUpdating(true);

    try {
      const { error } = await UserService.updateUserProfile(profile.id, {
        active_status: newStatus
      });

      if (error) {
        // Revert on error
        setIsActive(!newStatus);
        console.error('Failed to update active status:', error);
      } else {
        // Update local profile state
        if (onProfileUpdate) {
          onProfileUpdate({
            ...profile,
            active_status: newStatus
          });
        }
      }
    } catch (err) {
      // Revert on error
      setIsActive(!newStatus);
      console.error('Error updating active status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
        <h2 className="text-base sm:text-lg text-black" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Contact Information</h2>
      </div>
      <div className="px-4 sm:px-5 py-5 sm:py-6 space-y-4 sm:space-y-5">
        <div>
          <p className="text-sm sm:text-base text-black" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            {profile.email || 'Not provided'}
          </p>
          <p className="text-[11px] sm:text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>email address</p>
        </div>
        <div>
          <p className="text-sm sm:text-base text-black" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            {formatPhoneNumber(profile.contact_number)}
          </p>
          <p className="text-[11px] sm:text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>phone number</p>
        </div>
        <div>
          <p className="text-sm sm:text-base text-black" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            {profile.fullname || 'Not provided'}
          </p>
          <p className="text-[11px] sm:text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Full Name</p>
        </div>
        <div className="grid grid-cols-2 gap-4 items-center">
          <div>
            <p className="text-sm sm:text-base text-black" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>Profile Status</p>
            <p className="text-[11px] sm:text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
              {isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <span className="text-sm sm:text-base text-black" style={{ fontFamily: 'Poppins', fontWeight: 600 }}></span>
            <label className={`relative inline-flex items-center ${isUpdating ? 'cursor-wait' : 'cursor-pointer'}`}>
              <input 
                type="checkbox" 
                checked={isActive}
                onChange={handleToggle}
                disabled={isUpdating}
                className="sr-only peer" 
              />
              <div className={`w-9 h-5 sm:w-10 sm:h-5 rounded-full transition-colors ${
                isActive ? 'bg-emerald-500' : 'bg-gray-300'
              } ${isUpdating ? 'opacity-50' : ''}`}></div>
              <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                isActive ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
              }`}></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoCard;
