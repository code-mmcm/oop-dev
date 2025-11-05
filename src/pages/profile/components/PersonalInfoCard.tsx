import React from 'react';
import type { UserProfile } from '../../../types/user';

type Props = {
  profile: UserProfile;
  formatDate: (s?: string | null) => string;
};

const PersonalInfoCard: React.FC<Props> = ({ profile, formatDate }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
        <h2 className="text-base sm:text-lg text-black" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>All Personal Information</h2>
      </div>
      
      {/* View Mode - Always Display Only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-5 py-5 sm:py-6">
        <div className="space-y-0.5 sm:space-y-1">
          <p className="text-sm sm:text-base text-black" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            {profile.fullname || 'Not provided'}
          </p>
          <p className="text-[11px] sm:text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Full name</p>
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          <p className="text-sm sm:text-base text-black" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            {formatDate(profile.birth)}
          </p>
          <p className="text-[11px] sm:text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Birthday</p>
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          <p className="text-sm sm:text-base text-black" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            {profile.gender || 'Not provided'}
          </p>
          <p className="text-[11px] sm:text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Gender</p>
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          <p className="text-sm sm:text-base text-black" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
            {profile.address || 'Not provided'}
          </p>
          <p className="text-[11px] sm:text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Location</p>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoCard;
