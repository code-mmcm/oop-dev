import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile } from '../../../types/user';
import { ImageService } from '../../../services/imageService';
import { UserService } from '../../../services/userService';

type Props = {
  profile: UserProfile;
  onProfileUpdate?: (updatedProfile: UserProfile) => void;
};

const ProfileHeader: React.FC<Props> = ({ profile, onProfileUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState<{ 
    bio: string;
    location: string;
    phoneNumber: string;
  }>({ 
    bio: '',
    location: '',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState<{ 
    bio?: string;
    location?: string;
    phoneNumber?: string;
  }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format phone number for display: +63 9XX XXX XXXX
  const formatPhoneForDisplay = (phoneNumber: number | undefined | null): string => {
    if (!phoneNumber) return '';
    const phoneStr = phoneNumber.toString();
    // Handle different formats: 639123456789 (12 digits) or 9123456789 (10 digits)
    let clean = phoneStr;
    if (phoneStr.length === 12 && phoneStr.startsWith('63')) {
      clean = phoneStr.slice(2); // Remove '63' prefix
    }
    // Ensure it starts with 9 and has 10 digits
    if (clean.startsWith('9') && clean.length === 10) {
      return `+63 ${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`;
    }
    // If format is not recognized, return as-is
    return phoneStr;
  };

  // Parse phone input to number (remove +63, spaces, and keep only digits)
  const parsePhoneToNumber = (phoneInput: string): number | null => {
    // Remove +63, spaces, and any non-digit characters
    const cleaned = phoneInput.replace(/\+63|\s+/g, '').replace(/\D/g, '');
    if (cleaned.length === 10 && cleaned.startsWith('9')) {
      // Prepend 63 to make it 12 digits total
      return parseInt(`63${cleaned}`, 10);
    }
    return null;
  };

  // Initialize form data when entering edit mode
  useEffect(() => {
    if (isEditing && profile) {
      setFormData({ 
        bio: profile.Bio || '',
        location: profile.address || '',
        phoneNumber: formatPhoneForDisplay(profile.contact_number)
      });
      setErrors({});
      setSaveError(null);
    }
  }, [isEditing, profile]);

  // Reset image error when profile photo changes or when it's empty
  useEffect(() => {
    setImageError(false);
  }, [profile.profile_photo, previewUrl]);

  const handleFieldChange = (field: 'bio' | 'location' | 'phoneNumber', value: string) => {
    setFormData((prev: { bio: string; location: string; phoneNumber: string }) => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors((prev: { bio?: string; location?: string; phoneNumber?: string }) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setSaveError(null);
  };

  // Format phone number as user types (Philippines format: +63 9XX XXX XXXX)
  const handlePhoneChange = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // If starts with +63, remove it
    let clean = value.startsWith('+63') ? digits.slice(2) : digits;
    
    // Only allow digits that start with 9
    if (clean.length > 0 && !clean.startsWith('9')) {
      return; // Don't update if it doesn't start with 9
    }
    
    // Limit to 10 digits (after +63)
    if (clean.length > 10) {
      clean = clean.slice(0, 10);
    }
    
    // Format: +63 9XX XXX XXXX
    let formatted = '';
    if (clean.length > 0) {
      formatted = '+63';
      if (clean.length > 0) {
        formatted += ` ${clean.slice(0, 3)}`;
      }
      if (clean.length > 3) {
        formatted += ` ${clean.slice(3, 6)}`;
      }
      if (clean.length > 6) {
        formatted += ` ${clean.slice(6)}`;
      }
    }
    
    handleFieldChange('phoneNumber', formatted);
  };

  const validateForm = (): boolean => {
    const newErrors: { bio?: string; location?: string; phoneNumber?: string } = {};
    
    // Phone number validation (Philippines: +63 9XX XXX XXXX)
    if (formData.phoneNumber) {
      const cleaned = formData.phoneNumber.replace(/\+63|\s+/g, '').replace(/\D/g, '');
      if (cleaned.length !== 10 || !cleaned.startsWith('9')) {
        newErrors.phoneNumber = 'Phone number must be in format +63 9XX XXX XXXX (11 digits starting with +63 9)';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const updateData: {
        Bio?: string;
        address?: string;
        contact_number?: number;
      } = {};
      
      if (formData.bio !== (profile.Bio || '')) {
        updateData.Bio = formData.bio.trim() || undefined;
      }
      
      if (formData.location !== (profile.address || '')) {
        updateData.address = formData.location.trim();
      }
      
      if (formData.phoneNumber) {
        const phoneNum = parsePhoneToNumber(formData.phoneNumber);
        if (phoneNum && phoneNum !== profile.contact_number) {
          updateData.contact_number = phoneNum;
        }
      }
      
      const { error } = await UserService.updateUserProfile(profile.id, updateData);
      if (error) throw new Error('Failed to update profile.');
      
      const { data: updatedProfile } = await UserService.getUserProfile(profile.id);
      if (updatedProfile && onProfileUpdate) {
        onProfileUpdate(updatedProfile);
      }
      setIsEditing(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setSaveError(null);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a JPEG, PNG, WebP, or AVIF image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit for profile photos
      setUploadError('Image must be less than 5MB.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      // Delete old profile photo if it exists
      if (profile.profile_photo) {
        try {
          await ImageService.deleteProfilePhoto(profile.profile_photo);
        } catch (err) {
          // Continue even if deletion fails
          console.error('Failed to delete old photo:', err);
        }
      }

      // Upload new photo
      const photoUrl = await ImageService.uploadProfilePhoto(file, profile.id);

      // Update profile in database
      const { error } = await UserService.updateUserProfile(profile.id, {
        profile_photo: photoUrl
      });

      if (error) {
        throw new Error('Failed to update profile. Please try again.');
      }

      // Update local state
      if (onProfileUpdate) {
        onProfileUpdate({ ...profile, profile_photo: photoUrl });
      }
      // Reset image error when new photo is uploaded
      setImageError(false);
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload photo. Please try again.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const displayPhoto = previewUrl || profile.profile_photo;

  // Get user initials for default avatar
  const getInitials = () => {
    if (!profile.fullname) return 'U';
    const names = profile.fullname.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  // Check if we have a valid photo URL - be very explicit about empty values
  const hasValidPhoto = () => {
    if (!displayPhoto) return false;
    if (typeof displayPhoto !== 'string') return false;
    const trimmed = displayPhoto.trim();
    if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined' || trimmed === 'undefined') return false;
    if (imageError) return false;
    return true;
  };

  const showDefault = !hasValidPhoto();

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 px-4 sm:px-5 py-6 sm:py-7 mb-4 sm:mb-6" style={{ fontFamily: 'Poppins' }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
        {/* Profile Picture Section */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div 
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-200 hover:ring-4 hover:ring-teal-200 shadow-md relative isolate"
              onClick={isEditing ? handlePhotoClick : undefined}
              style={{ 
                fontFamily: 'Poppins',
                background: showDefault 
                  ? 'linear-gradient(to bottom right, #14b8a6, #0d9488)' 
                  : 'transparent'
              }}
            >
              {showDefault ? (
                <span 
                  className="text-white text-2xl sm:text-3xl font-bold select-none z-10 relative"
                  style={{ fontFamily: 'Poppins', fontWeight: 700 }}
                >
                  {getInitials()}
                </span>
              ) : (
                <img 
                  src={displayPhoto as string} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={() => {
                    console.log('Image failed to load, showing default');
                    setImageError(true);
                  }}
                  onLoad={() => setImageError(false)}
                  style={{ display: 'block' }}
                />
              )}
              {isUploading && (
                <div 
                  className="absolute top-0 left-0 w-full h-full flex items-center justify-center z-20"
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '50%'
                  }}
                >
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
              {/* Hover overlay - only show when not uploading and in edit mode */}
              {!isUploading && isEditing && (
                <div 
                  className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center z-10"
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '50%'
                  }}
                >
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              )}
            </div>
            {isEditing && (
              <button
                onClick={handlePhotoClick}
                disabled={isUploading}
                className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors disabled:opacity-50 text-center w-full"
                style={{ fontFamily: 'Poppins', fontWeight: 600 }}
              >
                {isUploading ? 'Uploading...' : 'Change photo'}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
            onChange={handleFileChange}
            className="hidden"
          />
          {uploadError && (
            <p className="mt-1 text-xs text-red-600 max-w-[200px] text-center" style={{ fontFamily: 'Poppins' }}>
              {uploadError}
            </p>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3">
            <div className="flex-1">
              {/* Full Name - Always Display Only */}
              <h1 className="text-2xl sm:text-3xl text-black mb-1" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
                {profile.fullname || 'User'}
              </h1>
              {/* Email - Always Display Only */}
              <p className="text-sm sm:text-base text-gray-600 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                {profile.email || 'No email provided'}
              </p>
              {saveError && (
                <p className="text-xs text-red-600 mt-1" style={{ fontFamily: 'Poppins' }}>{saveError}</p>
              )}
            </div>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)} 
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-white text-sm sm:text-base hover:opacity-90 transition-opacity shadow-md"
                style={{ backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600 }}
              >
                Edit account
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm sm:text-base hover:bg-gray-50 transition-opacity disabled:opacity-50 shadow-md"
                  style={{ fontFamily: 'Poppins', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-white text-sm sm:text-base hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
                  style={{ backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600 }}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
          
          {/* Bio Field */}
          {!isEditing ? (
            // View Mode - Bio
            profile.Bio ? (
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed mb-3" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
                {profile.Bio}
              </p>
            ) : null
          ) : (
            // Edit Mode - Bio Textarea
            <div className="mb-4">
              <label htmlFor="bio" className="block text-xs sm:text-sm text-gray-700 mb-1.5" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                Bio/Description
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFieldChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
                className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 transition-all resize-y ${
                  errors.bio ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-[#549F74]'
                }`}
                style={{ fontFamily: 'Poppins' }}
              />
              {errors.bio && (
                <p className="mt-1 text-xs text-red-600" style={{ fontFamily: 'Poppins' }}>{errors.bio}</p>
              )}
            </div>
          )}
          
          {/* Location and Phone Number Fields - Only in Edit Mode */}
          {isEditing && (
            <div className="space-y-4">
              {/* Location Field */}
              <div>
                <label htmlFor="location" className="block text-xs sm:text-sm text-gray-700 mb-1.5" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('location', e.target.value)}
                  placeholder="Enter your location"
                  className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.location ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-[#549F74]'
                  }`}
                  style={{ fontFamily: 'Poppins' }}
                />
                {errors.location && (
                  <p className="mt-1 text-xs text-red-600" style={{ fontFamily: 'Poppins' }}>{errors.location}</p>
                )}
              </div>
              
              {/* Phone Number Field */}
              <div>
                <label htmlFor="phoneNumber" className="block text-xs sm:text-sm text-gray-700 mb-1.5" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                  Phone Number <span className="text-gray-500 text-xs">(Philippines)</span>
                </label>
                <input
                  id="phoneNumber"
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePhoneChange(e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    errors.phoneNumber ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-[#549F74]'
                  }`}
                  style={{ fontFamily: 'Poppins' }}
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-600" style={{ fontFamily: 'Poppins' }}>{errors.phoneNumber}</p>
                )}
                <p className="mt-1 text-xs text-gray-500" style={{ fontFamily: 'Poppins' }}>
                  Format: +63 9XX XXX XXXX (11 digits starting with +63 9)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
