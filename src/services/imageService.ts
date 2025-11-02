import { supabase } from '../lib/supabase';

export interface UploadedImage {
  id: string;
  url: string;
  name: string;
  size: number;
  created_at: string;
}

export class ImageService {
  private static readonly BUCKET_NAME = 'property-images';
  private static readonly MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  private static readonly ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];

  // Upload a single image file
  static async uploadImage(file: File, userId: string): Promise<UploadedImage> {
    // Validate file
    if (!this.isValidFile(file)) {
      throw new Error('Invalid file type or size. Please upload a JPEG, PNG, WebP, or AVIF image under 20MB.');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    try {
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      return {
        id: data.path,
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
        created_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Upload multiple images
  static async uploadImages(files: File[], userId: string): Promise<UploadedImage[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, userId));
    return Promise.all(uploadPromises);
  }

  // Delete an image
  static async deleteImage(imageId: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([imageId]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  // Get all images for a user
  static async getUserImages(userId: string): Promise<UploadedImage[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw new Error(`Failed to fetch images: ${error.message}`);
      }

      return data.map(file => ({
        id: `${userId}/${file.name}`,
        url: supabase.storage.from(this.BUCKET_NAME).getPublicUrl(`${userId}/${file.name}`).data.publicUrl,
        name: file.name,
        size: file.metadata?.size || 0,
        created_at: file.created_at
      }));
    } catch (error) {
      console.error('Error fetching user images:', error);
      throw error;
    }
  }

  // Validate file
  private static isValidFile(file: File): boolean {
    return (
      this.ALLOWED_TYPES.includes(file.type) &&
      file.size <= this.MAX_FILE_SIZE
    );
  }

  // Format file size for display
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Upload profile photo
  static async uploadProfilePhoto(file: File, userId: string): Promise<string> {
    // Validate file
    if (!this.isValidFile(file)) {
      throw new Error('Invalid file type or size. Please upload a JPEG, PNG, WebP, or AVIF image under 20MB.');
    }

    // Generate unique filename for profile photo - use simpler path structure
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/profile-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to upload profile photos.');
      }

      // Upload to Supabase Storage with user context
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });

      if (error) {
        // Check if it's an RLS policy error
        if (error.message.includes('row-level security') || error.message.includes('policy')) {
          throw new Error('Upload failed due to permissions. Please contact support or check your storage bucket policies.');
        }
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  }

  // Delete old profile photo if it exists
  static async deleteProfilePhoto(photoUrl: string): Promise<void> {
    try {
      // Extract path from URL
      const urlParts = photoUrl.split('/');
      const pathIndex = urlParts.findIndex(part => part === this.BUCKET_NAME);
      if (pathIndex === -1) return;
      
      const filePath = urlParts.slice(pathIndex + 1).join('/');
      
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('Error deleting old profile photo:', error);
        // Don't throw - it's okay if old photo deletion fails
      }
    } catch (error) {
      console.error('Error deleting profile photo:', error);
      // Don't throw - it's okay if deletion fails
    }
  }
}
