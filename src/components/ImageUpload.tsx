import React, { useState, useRef, useCallback } from 'react';
import { ImageService, type UploadedImage } from '../services/imageService';

interface ImageUploadProps {
  onImagesUploaded: (images: UploadedImage[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

//igat ka ha! yaar chutiya ho!
const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onImagesUploaded, 
  maxFiles = 10, 
  disabled = false 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Validate file count
    if (files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} images at once.`);
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get current user ID (you might need to adjust this based on your auth setup)
      const { data: { user } } = await import('../lib/supabase').then(m => m.supabase.auth.getUser());
      
      if (!user) {
        throw new Error('You must be logged in to upload images.');
      }

      const uploadedImages: UploadedImage[] = [];
      
      // Upload files one by one to show progress
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const uploadedImage = await ImageService.uploadImage(file, user.id);
          uploadedImages.push(uploadedImage);
          setUploadProgress(((i + 1) / files.length) * 100);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          // Continue with other files even if one fails
        }
      }

      if (uploadedImages.length > 0) {
        onImagesUploaded(uploadedImages);
        setError(null);
      } else {
        setError('Failed to upload any images. Please try again.');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload images.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        {isUploading ? (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900" style={{fontFamily: 'Poppins'}}>
                Uploading images...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1" style={{fontFamily: 'Poppins'}}>
                {Math.round(uploadProgress)}% complete
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto text-gray-400">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900" style={{fontFamily: 'Poppins'}}>
                {isDragging ? 'Drop images here' : 'Upload Property Images'}
              </p>
              <p className="text-sm text-gray-500 mt-1" style={{fontFamily: 'Poppins'}}>
                Drag and drop images here, or click to select files
              </p>
              <p className="text-xs text-gray-400 mt-2" style={{fontFamily: 'Poppins'}}>
                Supports JPEG, PNG, WebP, AVIF up to 20MB each (max {maxFiles} files)
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600" style={{fontFamily: 'Poppins'}}>
            {error}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
