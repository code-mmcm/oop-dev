import React from 'react';
import type { UserProfile } from '../../../types/user';

//hi
type Props = {
  profile: UserProfile;
  onEditSection: () => void;
  formatPhoneNumber: (n?: number | null) => string;
};

const ContactInfoCard: React.FC<Props> = ({ profile, onEditSection, formatPhoneNumber }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
        <h2 className="text-base sm:text-lg text-black" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>Contact Information</h2>
        <button 
          onClick={onEditSection} 
          className="text-xs sm:text-sm px-3 py-1.5 rounded-md text-white hover:opacity-90 transition-opacity shadow-sm" 
          style={{ backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600 }}
        >
          Edit
        </button>
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
            <p className="text-[11px] sm:text-xs text-gray-500" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>Active</p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <span className="text-sm sm:text-base text-black" style={{ fontFamily: 'Poppins', fontWeight: 600 }}></span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-9 h-5 sm:w-10 sm:h-5 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors"></div>
              <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4 sm:peer-checked:translate-x-5"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactInfoCard;
