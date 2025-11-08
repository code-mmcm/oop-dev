import React, { useState, useRef, useEffect } from 'react';
import type { UserProfile } from '../../../types/user';
import { UserService } from '../../../services/userService';
import { ImageService } from '../../../services/imageService';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onProfileUpdate: (updatedProfile: UserProfile) => void;
};

const EditAccountModal: React.FC<Props> = ({ isOpen, onClose, profile, onProfileUpdate }) => {
  const [contactNumber, setContactNumber] = useState<string>('');
  const [bio, setBio] = useState<string>('Welcome to your profile! Here you can view and manage your personal information and booking history.');
  const [location, setLocation] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bioTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Initialize form with profile data
  useEffect(() => {
    if (isOpen && profile) {
      // Format phone number for display if it exists
      if (profile.contact_number) {
        const phoneStr = profile.contact_number.toString();
        if (phoneStr.startsWith('63') && phoneStr.length === 12) {
          setContactNumber(`+${phoneStr.slice(0, 2)} ${phoneStr.slice(2, 5)} ${phoneStr.slice(5, 8)} ${phoneStr.slice(8)}`);
        } else {
          setContactNumber(phoneStr);
        }
      } else {
        setContactNumber('');
      }
      setLocation(profile.address || '');
      setBio(profile.Bio || '');
      setPreviewUrl(null);
      setError(null);
    }
  }, [isOpen, profile]);

  // Parse phone number to number (remove +, spaces, etc.)
  const parsePhoneNumber = (phone: string): number => {
    const digits = phone.replace(/\D/g, '');
    return parseInt(digits, 10) || 0;
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, WebP, or AVIF image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB.');
      return;
    }

    setError(null);
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
          console.error('Failed to delete old photo:', err);
        }
      }

      // Upload new photo
      const photoUrl = await ImageService.uploadProfilePhoto(file, profile.id);
      setPreviewUrl(photoUrl);
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload photo. Please try again.');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const updates: Partial<UserProfile> = {
        contact_number: parsePhoneNumber(contactNumber),
        address: location,
        Bio: bio,
      };

      // Update profile photo if changed
      if (previewUrl && previewUrl !== profile.profile_photo) {
        updates.profile_photo = previewUrl;
      }

      const { error: updateError } = await UserService.updateUserProfile(profile.id, updates);

      if (updateError) {
        throw new Error('Failed to update profile. Please try again.');
      }

      // Update local profile state
      const updatedProfile: UserProfile = {
        ...profile,
        ...updates,
      };
      onProfileUpdate(updatedProfile);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    setPreviewUrl(null);
    onClose();
  };

  // Get user initials for default avatar
  const getInitials = () => {
    if (!profile.fullname) return 'U';
    const names = profile.fullname.trim().split(/\s+/);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0][0].toUpperCase();
  };

  const displayPhoto = previewUrl || profile.profile_photo;
  const showDefault = !displayPhoto || displayPhoto.trim() === '';

  // Enhance native scrolling for Bio textarea without blocking default behavior
  useEffect(() => {
    const textarea = bioTextareaRef.current;
    if (!textarea || !isOpen) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // This just tracks scroll position, doesn't interfere
          ticking = false;
        });
        ticking = true;
      }
    };

    // Use passive listener to not block native scrolling
    textarea.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      textarea.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  // Prevent body scroll when modal is open - save and restore scroll position
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY;
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.left = '0';
      document.body.style.right = '0';
    } else {
      // Restore scroll position
      const savedScrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.left = '';
      document.body.style.right = '';
      
      // Restore scroll position if it was saved
      if (savedScrollY) {
        const scrollValue = parseInt(savedScrollY.replace('px', '').replace('-', ''), 10) || 0;
        window.scrollTo({
          top: scrollValue,
          behavior: 'auto'
        });
      }
    }
    return () => {
      // Cleanup: ensure body scroll is restored
      if (isOpen) {
        const savedScrollY = document.body.style.top;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.left = '';
        document.body.style.right = '';
        
        if (savedScrollY) {
          const scrollValue = parseInt(savedScrollY.replace('px', '').replace('-', ''), 10) || 0;
          window.scrollTo({
            top: scrollValue,
            behavior: 'auto'
          });
        }
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50"
      style={{ 
        fontFamily: 'Poppins',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(2px)'
      }}
      onClick={handleCancel}
    >
      {/* Modal content - positioned absolutely with fixed top gap */}
      <div 
        className="bg-white rounded-xl shadow-2xl"
        style={{
          position: 'absolute',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: '512px',
          maxHeight: 'calc(100vh - 100px)',
          display: 'flex',
          flexDirection: 'column',
          margin: '0 16px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - fixed at top */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-black" style={{ fontFamily: 'Poppins', fontWeight: 700 }}>
            Edit Your Account
          </h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - scrollable */}
        <div 
          className="px-6 py-6 space-y-6 flex-1"
          style={{
            overflowY: 'auto',
            minHeight: '0',
            overscrollBehavior: 'contain'
          }}
        >
          {/* Profile Picture */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center overflow-hidden"
                style={{
                  background: showDefault
                    ? 'linear-gradient(to bottom right, #14b8a6, #0d9488)'
                    : 'transparent'
                }}
              >
                {showDefault ? (
                  <span
                    className="text-white text-xl font-bold"
                    style={{ fontFamily: 'Poppins', fontWeight: 700 }}
                  >
                    {getInitials()}
                  </span>
                ) : (
                  <img
                    src={displayPhoto as string}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-black mb-1" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
                Profile Picture
              </p>
              <button
                onClick={handlePhotoClick}
                disabled={isUploading}
                className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors disabled:opacity-50"
                style={{ fontFamily: 'Poppins', fontWeight: 600 }}
              >
                Change photo
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Contact Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
              Contact Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+63 932 304 7895"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                style={{ fontFamily: 'Poppins' }}
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
              Bio
            </label>
            <textarea
              ref={bioTextareaRef}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              className="bio-scroll-area w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none"
              style={{ 
                fontFamily: 'Poppins',
                overflowY: 'auto',
                overflowX: 'hidden'
              }}
              placeholder="Welcome to your profile! Here you can view and manage your personal information and booking history."
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins', fontWeight: 600 }}>
              Location
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="uwul/200"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                style={{ fontFamily: 'Poppins' }}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600" style={{ fontFamily: 'Poppins' }}>
                {error}
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Poppins', fontWeight: 600 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || isUploading}
              className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Poppins', fontWeight: 600 }}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditAccountModal;

