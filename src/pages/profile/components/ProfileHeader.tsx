import React from 'react';
import type { UserProfile } from '../../../types/user';

type Props = {
  profile: UserProfile;
  onEditAccount: () => void;
};

const ProfileHeader: React.FC<Props> = ({ profile, onEditAccount }) => {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 px-4 sm:px-5 py-6 sm:py-7 mb-4 sm:mb-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {profile.profile_photo ? (
            <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.761 0 5-2.462 5-5.5S14.761 1 12 1 7 3.462 7 6.5 9.239 12 12 12zm0 2c-4.418 0-8 2.91-8 6.5V22h16v-1.5c0-3.59-3.582-6.5-8-6.5z" />
            </svg>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl text-black" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
                {profile.fullname || 'User'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 -mt-0.5" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
                {profile.email || 'No email provided'}
              </p>
            </div>
            <button onClick={onEditAccount} className="px-3 sm:px-4 py-2 rounded-lg text-white text-xs sm:text-sm" style={{ backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600 }}>Edit account</button>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-gray-500 leading-snug" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            Welcome to your profile! Here you can view and manage your personal information and booking history.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
