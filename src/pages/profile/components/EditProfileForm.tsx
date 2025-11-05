import React, { useState, useEffect } from 'react';
import type { UserProfile, UserProfileUpdate } from '../../../types/user';
import { UserService } from '../../../services/userService';

type Props = {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedProfile: UserProfile) => void;
};

const EditProfileForm: React.FC<Props> = ({ profile, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<UserProfileUpdate>({
    fullname: '',
    birth: '',
    gender: '',
    address: '',
    contact_number: undefined
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UserProfileUpdate, string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize form data when profile changes or modal opens
  useEffect(() => {
    if (isOpen && profile) {
      // Format birth date for input (YYYY-MM-DD)
      const birthDate = profile.birth ? new Date(profile.birth).toISOString().split('T')[0] : '';
      
      setFormData({
        fullname: profile.fullname || '',
        birth: birthDate,
        gender: profile.gender || '',
        address: profile.address || '',
        contact_number: profile.contact_number || undefined
      });
      setErrors({});
      setSaveError(null);
    }
  }, [isOpen, profile]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof UserProfileUpdate, string>> = {};

    if (!formData.fullname?.trim()) {
      newErrors.fullname = 'Full name is required.';
    }

    if (!formData.birth?.trim()) {
      newErrors.birth = 'Birth date is required.';
    } else {
      const birthDate = new Date(formData.birth);
      const today = new Date();
      if (birthDate > today) {
        newErrors.birth = 'Birth date cannot be in the future.';
      }
    }

    if (!formData.gender?.trim()) {
      newErrors.gender = 'Gender is required.';
    }

    if (!formData.address?.trim()) {
      newErrors.address = 'Address is required.';
    }

    if (!formData.contact_number) {
      newErrors.contact_number = 'Contact number is required.';
    } else {
      const phoneStr = formData.contact_number.toString();
      if (phoneStr.length < 10 || phoneStr.length > 15) {
        newErrors.contact_number = 'Contact number must be between 10 and 15 digits.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field changes
  const handleFieldChange = (field: keyof UserProfileUpdate, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setSaveError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // Prepare update data
      const updateData: UserProfileUpdate = {
        fullname: formData.fullname?.trim(),
        birth: formData.birth,
        gender: formData.gender?.trim(),
        address: formData.address?.trim(),
        contact_number: formData.contact_number ? Number(formData.contact_number) : undefined
      };

      // Update profile via UserService
      const { error } = await UserService.updateUserProfile(profile.id, updateData);

      if (error) {
        throw new Error('Failed to update profile. Please try again.');
      }

      // Fetch updated profile
      const { data: updatedProfile, error: fetchError } = await UserService.getUserProfile(profile.id);

      if (fetchError || !updatedProfile) {
        // If fetch fails, construct updated profile from form data
        const constructedProfile: UserProfile = {
          ...profile,
          ...updateData,
          birth: formData.birth || profile.birth,
          contact_number: formData.contact_number ? Number(formData.contact_number) : profile.contact_number
        };
        onSave(constructedProfile);
      } else {
        onSave(updatedProfile);
      }

      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSaving) {
      setErrors({});
      setSaveError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - covers entire screen but navbar is above it */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={handleClose}
        style={{ 
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }}
      />
      {/* Modal Content - positioned below navbar */}
      <div 
        className="fixed inset-x-0 top-16 bottom-0 z-40 flex items-start justify-center p-4 overflow-y-auto"
        onClick={handleClose}
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div 
          className="bg-white rounded-xl max-w-2xl w-full my-4 flex flex-col shadow-2xl"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          style={{ fontFamily: 'Poppins', maxHeight: 'calc(100vh - 5rem)' }}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Poppins' }}>
            Edit Profile Information
          </h2>
          <button 
            onClick={handleClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 transition-all duration-200 p-1 cursor-pointer hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div 
          className="overflow-y-auto flex-1 scroll-smooth pt-2" 
          style={{ 
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent',
            maxHeight: 'calc(100vh - 200px)' // Ensure content fits below navbar
          }}
        >
          <form onSubmit={handleSubmit} className="px-6 pb-8 pt-4 space-y-5">
          {/* Error Message */}
          {saveError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg animate-slideDown">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800" style={{ fontFamily: 'Poppins' }}>
                  {saveError}
                </p>
              </div>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="fullname" className="block text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins' }}>
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              id="fullname"
              type="text"
              value={formData.fullname || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('fullname', e.target.value)}
              required
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${
                errors.fullname ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              style={{
                fontFamily: 'Poppins',
                '--tw-ring-color': errors.fullname ? '#ef4444' : '#549F74',
              } as React.CSSProperties}
            />
            {errors.fullname && (
              <p className="mt-1 text-xs text-red-600" style={{ fontFamily: 'Poppins' }}>
                {errors.fullname}
              </p>
            )}
          </div>

          {/* Birth Date */}
          <div className="space-y-1.5">
            <label htmlFor="birth" className="block text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins' }}>
              Birth Date <span className="text-red-500">*</span>
            </label>
            <input
              id="birth"
              type="date"
              value={formData.birth || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('birth', e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${
                errors.birth ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              style={{
                fontFamily: 'Poppins',
                '--tw-ring-color': errors.birth ? '#ef4444' : '#549F74',
              } as React.CSSProperties}
            />
            {errors.birth && (
              <p className="mt-1 text-xs text-red-600" style={{ fontFamily: 'Poppins' }}>
                {errors.birth}
              </p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-1.5">
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins' }}>
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              id="gender"
              value={formData.gender || ''}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleFieldChange('gender', e.target.value)}
              required
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 appearance-none ${
                errors.gender ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              style={{
                fontFamily: 'Poppins',
                '--tw-ring-color': errors.gender ? '#ef4444' : '#549F74',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              } as React.CSSProperties}
            >
              <option value="">Select gender...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            {errors.gender && (
              <p className="mt-1 text-xs text-red-600" style={{ fontFamily: 'Poppins' }}>
                {errors.gender}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins' }}>
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              id="address"
              value={formData.address || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('address', e.target.value)}
              required
              rows={3}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 resize-y ${
                errors.address ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              style={{
                fontFamily: 'Poppins',
                '--tw-ring-color': errors.address ? '#ef4444' : '#549F74',
              } as React.CSSProperties}
              placeholder="Enter your full address"
            />
            {errors.address && (
              <p className="mt-1 text-xs text-red-600" style={{ fontFamily: 'Poppins' }}>
                {errors.address}
              </p>
            )}
          </div>

          {/* Contact Number */}
          <div className="space-y-1.5">
            <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins' }}>
              Contact Number <span className="text-red-500">*</span>
            </label>
            <input
              id="contact_number"
              type="tel"
              value={formData.contact_number || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value.replace(/\D/g, ''); // Only allow digits
                handleFieldChange('contact_number', value ? Number(value) : undefined);
              }}
              required
              placeholder="e.g., 639123456789"
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 ${
                errors.contact_number ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
              style={{
                fontFamily: 'Poppins',
                '--tw-ring-color': errors.contact_number ? '#ef4444' : '#549F74',
              } as React.CSSProperties}
            />
            {errors.contact_number && (
              <p className="mt-1 text-xs text-red-600" style={{ fontFamily: 'Poppins' }}>
                {errors.contact_number}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>
              Enter phone number without spaces or special characters (e.g., 639123456789)
            </p>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700" style={{ fontFamily: 'Poppins' }}>
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={profile.email || ''}
              disabled
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
              style={{ fontFamily: 'Poppins' }}
            />
            <p className="mt-1 text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>
              Email address cannot be changed. Contact support if you need to update your email.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 mt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm sm:text-base font-semibold transition-all duration-300 border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: 'Poppins' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`flex-1 px-4 py-2.5 rounded-lg text-sm sm:text-base text-white font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                isSaving ? 'opacity-75 cursor-not-allowed' : 'hover:opacity-90'
              }`}
              style={{ 
                backgroundColor: '#0B5858',
                fontFamily: 'Poppins' 
              }}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
          </form>
        </div>
        </div>
      </div>
    </>
  );
};

export default EditProfileForm;

