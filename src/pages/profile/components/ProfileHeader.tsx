import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile } from '../../../types/user';
import { ImageService } from '../../../services/imageService';
import { UserService } from '../../../services/userService';

type Props = {
  profile: UserProfile;
  onEditAccount: () => void;
  onProfileUpdate?: (updatedProfile: UserProfile) => void;
};

const ProfileHeader: React.FC<Props> = ({ profile, onEditAccount, onProfileUpdate }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset image error when profile photo changes or when it's empty
  useEffect(() => {
    setImageError(false);
  }, [profile.profile_photo, previewUrl]);

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
              onClick={handlePhotoClick}
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
              {/* Hover overlay - only show when not uploading */}
              {!isUploading && (
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
            <button
              onClick={handlePhotoClick}
              disabled={isUploading}
              className="mt-2 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors disabled:opacity-50 text-center w-full"
              style={{ fontFamily: 'Poppins', fontWeight: 600 }}
            >
              {isUploading ? 'Uploading...' : 'Change photo'}
            </button>
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
              <h1 className="text-2xl sm:text-3xl text-black mb-1" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
                {profile.fullname || 'User'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600" style={{ fontFamily: 'Poppins', fontWeight: 500 }}>
                {profile.email || 'No email provided'}
              </p>
            </div>
            <button 
              onClick={onEditAccount} 
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg text-white text-sm sm:text-base hover:opacity-90 transition-opacity shadow-md"
              style={{ backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600 }}
            >
              Edit account
            </button>
          </div>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed" style={{ fontFamily: 'Poppins', fontWeight: 400 }}>
            Welcome to your profile! Here you can view and manage your personal information and booking history.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
