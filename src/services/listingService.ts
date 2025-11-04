import { supabase } from '../lib/supabase';
import type { Listing, ListingView } from '../types/listing';

/**
 * Utility functions for handling check-in/check-out times
 * Works with both TEXT (HH:mm), TIME, and TIMESTAMP column types
 */

/**
 * Extract HH:mm time string from a timestamp or time value
 * Handles TIMESTAMP, TIME, and TEXT formats
 * @param dbValue - Value from database (could be timestamp, time, or HH:mm string)
 * @returns HH:mm format string or null
 */
const extractTimeFromDbValue = (dbValue: any): string | null => {
  // Handle null, undefined, or empty values
  if (!dbValue) return null;
  
  // Handle string values
  if (typeof dbValue === 'string') {
    const trimmed = dbValue.trim();
    
    // If empty string, return null
    if (trimmed === '') return null;
    
    // If it's already in HH:mm format (TEXT column)
    if (/^\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    
    // If it's a timestamp (TIMESTAMP column) - extract time portion
    if (trimmed.includes('T')) {
      try {
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) {
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${hours}:${minutes}`;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // If it's a time value (TIME column) - try to extract HH:mm from various time formats
    // Handles formats like "14:00:00", "14:00", etc.
    const timeMatch = trimmed.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      return `${timeMatch[1]}:${timeMatch[2]}`;
    }
    
  }
  
  return null;
};

export class ListingService {
  // Get all available listings
  static async getListings(): Promise<ListingView[]> {
    const { data, error } = await supabase
      .from('listings_view')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }

    return data || [];
  }

  // Get recently added listings
  static async getRecentlyAddedListings(): Promise<ListingView[]> {
    const { data, error } = await supabase
      .from('listings_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recently added listings:', error);
      throw error;
    }

    return data || [];
  }

  // Get featured listings
  static async getFeaturedListings(): Promise<ListingView[]> {
    const { data, error } = await supabase
      .from('listings_view')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured listings:', error);
      throw error;
    }

    return data || [];
  }

  // Get listing by ID
  static async getListingById(id: string): Promise<Listing | null> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching listing:', error);
      throw error;
    }

    // Normalize check-in/check-out times from database
    // Handle TIMESTAMP, TIME, and TEXT column types
    if (data) {
      // Extract time portion if columns exist and have values
      if ('check_in_time' in data) {
        data.check_in_time = extractTimeFromDbValue(data.check_in_time);
      }
      if ('check_out_time' in data) {
        data.check_out_time = extractTimeFromDbValue(data.check_out_time);
      }
      
    }

    return data;
  }

  // Search listings by city
  static async searchListingsByCity(city: string): Promise<ListingView[]> {
    const { data, error } = await supabase
      .from('listings_view')
      .select('*')
      .ilike('city', `%${city}%`)
      .order('is_featured', { ascending: false });

    if (error) {
      console.error('Error searching listings:', error);
      throw error;
    }

    return data || [];
  }

  // Filter listings by price range
  static async getListingsByPriceRange(minPrice: number, maxPrice: number): Promise<ListingView[]> {
    const { data, error } = await supabase
      .from('listings_view')
      .select('*')
      .gte('price', minPrice)
      .lte('price', maxPrice)
      .order('price', { ascending: true });

    if (error) {
      console.error('Error filtering listings by price:', error);
      throw error;
    }

    return data || [];
  }

  // Filter listings by property type
  static async getListingsByPropertyType(propertyType: string): Promise<ListingView[]> {
    const { data, error } = await supabase
      .from('listings_view')
      .select('*')
      .eq('property_type', propertyType)
      .order('is_featured', { ascending: false });

    if (error) {
      console.error('Error filtering listings by property type:', error);
      throw error;
    }

    return data || [];
  }

  // Create a new listing (for hosts)
  static async createListing(listing: Omit<Listing, 'id' | 'created_at' | 'updated_at'>): Promise<Listing> {
    // Clean up the listing object - remove undefined values
    const cleanedListing = Object.fromEntries(
      Object.entries(listing).filter(([key, value]) => {
        // Skip undefined values
        if (value === undefined) return false;
        // Skip check_in_time and check_out_time if they're empty strings
        if ((key === 'check_in_time' || key === 'check_out_time') && (!value || (typeof value === 'string' && value.trim() === ''))) {
          return false;
        }
        return true;
      })
    );
    
    // Prepare check-in/check-out times for database
    // Based on error logs, database columns are TIME type (not TIMESTAMP)
    // TIME columns accept HH:MM:SS or HH:MM format
    if (cleanedListing.check_in_time) {
      const timeValue = cleanedListing.check_in_time as string;
      // Validate and ensure it's in HH:mm format
      if (/^\d{2}:\d{2}$/.test(timeValue.trim())) {
        // For TIME columns, send as HH:MM:SS format (add seconds)
        cleanedListing.check_in_time = `${timeValue.trim()}:00` as any;
      } else {
        // Invalid format, remove it
        delete cleanedListing.check_in_time;
      }
    }
    
    if (cleanedListing.check_out_time) {
      const timeValue = cleanedListing.check_out_time as string;
      // Validate and ensure it's in HH:mm format
      if (/^\d{2}:\d{2}$/.test(timeValue.trim())) {
        // For TIME columns, send as HH:MM:SS format (add seconds)
        cleanedListing.check_out_time = `${timeValue.trim()}:00` as any;
      } else {
        // Invalid format, remove it
        delete cleanedListing.check_out_time;
      }
    }
    
    
    const { data, error } = await supabase
      .from('listings')
      .insert([cleanedListing])
      .select()
      .single();

    if (error) {
      console.error('Error creating listing:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Listing data attempted:', JSON.stringify(cleanedListing, null, 2));
      
      // If error is about column type mismatch (TIME type expects HH:MM:SS, not timestamp)
      // Error 22007 means invalid input syntax for type
      const isTypeMismatch = error.code === '22007' ||
                             error.message?.includes('invalid input syntax') || 
                             error.message?.includes('type') ||
                             error.code === 'PGRST204';
      
      if (isTypeMismatch && (cleanedListing.check_in_time || cleanedListing.check_out_time)) {
        const listingWithTimeFormat = { ...cleanedListing };
        
        // Restore original HH:mm values and convert to HH:MM:SS format
        if (listing.check_in_time && typeof listing.check_in_time === 'string' && /^\d{2}:\d{2}$/.test(listing.check_in_time.trim())) {
          listingWithTimeFormat.check_in_time = `${listing.check_in_time.trim()}:00` as any;
        } else {
          delete listingWithTimeFormat.check_in_time;
        }
        
        if (listing.check_out_time && typeof listing.check_out_time === 'string' && /^\d{2}:\d{2}$/.test(listing.check_out_time.trim())) {
          listingWithTimeFormat.check_out_time = `${listing.check_out_time.trim()}:00` as any;
        } else {
          delete listingWithTimeFormat.check_out_time;
        }
        
        
        const { data: retryData, error: retryError } = await supabase
          .from('listings')
          .insert([listingWithTimeFormat])
          .select()
          .single();
          
        if (retryError) {
          console.error('Error creating listing (retry with TIME format):', retryError);
          // If still failing, try without time fields
          const listingWithoutTimeFields = { ...listingWithTimeFormat };
          delete listingWithoutTimeFields.check_in_time;
          delete listingWithoutTimeFields.check_out_time;
          
          const { data: finalData, error: finalError } = await supabase
            .from('listings')
            .insert([listingWithoutTimeFields])
            .select()
            .single();
            
          if (finalError) {
            console.error('Error creating listing (final retry):', finalError);
            throw finalError;
          }
          
          return finalData;
        }
        
        // Normalize the returned data
        if (retryData) {
          retryData.check_in_time = extractTimeFromDbValue(retryData.check_in_time);
          retryData.check_out_time = extractTimeFromDbValue(retryData.check_out_time);
        }
        
        return retryData;
      }
      
      // If error is about missing columns, try again without check_in_time and check_out_time
      if (error.code === 'PGRST204' && (error.message?.includes('check_in_time') || error.message?.includes('check_out_time'))) {
        const listingWithoutTimeFields = { ...cleanedListing };
        delete listingWithoutTimeFields.check_in_time;
        delete listingWithoutTimeFields.check_out_time;
        
        const { data: retryData, error: retryError } = await supabase
          .from('listings')
          .insert([listingWithoutTimeFields])
          .select()
          .single();
          
        if (retryError) {
          console.error('Error creating listing (retry):', retryError);
          throw retryError;
        }
        
        return retryData;
      }
      
      throw error;
    }

    // Normalize the returned data (extract time from timestamp if needed)
    if (data) {
      data.check_in_time = extractTimeFromDbValue(data.check_in_time);
      data.check_out_time = extractTimeFromDbValue(data.check_out_time);
    }


    return data;
  }

  // Update a listing (for hosts)
  static async updateListing(id: string, updates: Partial<Listing>): Promise<Listing> {
    // CRITICAL: Preserve original time values BEFORE any filtering or conversion
    // This ensures we can restore them during retry even if they get filtered out
    // These are the HH:mm format strings from the form
    const originalCheckInTime = updates.check_in_time as string | undefined;
    const originalCheckOutTime = updates.check_out_time as string | undefined;

    // Clean up updates - remove undefined values
    const cleanedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key, value]) => {
        if (value === undefined) return false;
        // Skip check_in_time and check_out_time if they're empty strings
        // But we've already preserved the originals above, so this is safe
        if ((key === 'check_in_time' || key === 'check_out_time') && (!value || (typeof value === 'string' && value.trim() === ''))) {
          return false;
        }
        return true;
      })
    );
    
    // Prepare check-in/check-out times for database
    // For TIME columns, we need to send HH:MM:SS format (not timestamp)
    // Since we know the database uses TIME columns, we'll use HH:MM:SS format directly
    if (cleanedUpdates.check_in_time) {
      const timeValue = cleanedUpdates.check_in_time as string;
      const trimmed = timeValue.trim();
      // Validate and ensure it's in HH:mm format
      if (/^\d{2}:\d{2}$/.test(trimmed)) {
        // For TIME columns, send as HH:MM:SS format (add seconds)
        cleanedUpdates.check_in_time = `${trimmed}:00` as any;
      } else if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
        // Already in HH:MM:SS format, use as-is
        cleanedUpdates.check_in_time = trimmed as any;
      } else {
        // Invalid format, remove it but preserve original for retry
        delete cleanedUpdates.check_in_time;
      }
    }
    
    if (cleanedUpdates.check_out_time) {
      const timeValue = cleanedUpdates.check_out_time as string;
      const trimmed = timeValue.trim();
      // Validate and ensure it's in HH:mm format
      if (/^\d{2}:\d{2}$/.test(trimmed)) {
        // For TIME columns, send as HH:MM:SS format (add seconds)
        cleanedUpdates.check_out_time = `${trimmed}:00` as any;
      } else if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
        // Already in HH:MM:SS format, use as-is
        cleanedUpdates.check_out_time = trimmed as any;
      } else {
        // Invalid format, remove it but preserve original for retry
        delete cleanedUpdates.check_out_time;
      }
    }
    
    
    const { data, error } = await supabase
      .from('listings')
      .update(cleanedUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating listing:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // If error is about column type mismatch (TIME, TIMESTAMP, or TEXT)
      // Error 22007 means invalid input syntax for type (e.g., sending timestamp to TIME column)
      const isTypeMismatch = error.code === '22007' || 
                             error.message?.includes('invalid input syntax') || 
                             error.message?.includes('type') ||
                             (error.code === 'PGRST204' && !error.message?.includes('does not exist'));
      
      // Check if we have time fields in original updates (before any processing)
      const hadOriginalCheckIn = !!originalCheckInTime;
      const hadOriginalCheckOut = !!originalCheckOutTime;
      
      if (isTypeMismatch && (hadOriginalCheckIn || hadOriginalCheckOut)) {
        
        const updatesWithTextTime = { ...cleanedUpdates };
        
        // Remove any timestamp or incorrectly formatted values that might have been set
        if (updatesWithTextTime.check_in_time) {
          delete updatesWithTextTime.check_in_time;
        }
        if (updatesWithTextTime.check_out_time) {
          delete updatesWithTextTime.check_out_time;
        }
        
        // Restore original HH:mm values if they exist
        // TIME columns accept HH:MM or HH:MM:SS format
        // IMPORTANT: Always restore if original value existed, even if it was filtered out during validation
        if (originalCheckInTime && typeof originalCheckInTime === 'string') {
          const trimmed = originalCheckInTime.trim();
          if (/^\d{2}:\d{2}$/.test(trimmed)) {
            // For TIME columns, use HH:MM:SS format (add seconds)
            updatesWithTextTime.check_in_time = `${trimmed}:00` as any;
          } else if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
            // Already in HH:MM:SS format, use as-is
            updatesWithTextTime.check_in_time = trimmed as any;
          }
        }
        
        // CRITICAL: Always restore check_out_time if original value existed
        // This ensures check_out_time is never lost during retry
        if (originalCheckOutTime && typeof originalCheckOutTime === 'string') {
          const trimmed = originalCheckOutTime.trim();
          if (/^\d{2}:\d{2}$/.test(trimmed)) {
            // For TIME columns, use HH:MM:SS format (add seconds)
            updatesWithTextTime.check_out_time = `${trimmed}:00` as any;
          } else if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) {
            // Already in HH:MM:SS format, use as-is
            updatesWithTextTime.check_out_time = trimmed as any;
          }
        }
        
        
        const { data: retryData, error: retryError } = await supabase
          .from('listings')
          .update(updatesWithTextTime)
          .eq('id', id)
          .select()
          .single();
          
        if (retryError) {
          console.error('Error updating listing (retry with TEXT format):', retryError);
          // If still failing, try without time fields
          const updatesWithoutTimeFields = { ...updatesWithTextTime };
          delete updatesWithoutTimeFields.check_in_time;
          delete updatesWithoutTimeFields.check_out_time;
          
          const { data: finalData, error: finalError } = await supabase
            .from('listings')
            .update(updatesWithoutTimeFields)
            .eq('id', id)
            .select()
            .single();
            
          if (finalError) {
            console.error('Error updating listing (final retry):', finalError);
            throw finalError;
          }
          
          return finalData;
        }
        
        // Normalize returned data
        if (retryData) {
          retryData.check_in_time = extractTimeFromDbValue(retryData.check_in_time);
          retryData.check_out_time = extractTimeFromDbValue(retryData.check_out_time);
        }
        
        return retryData;
      }
      
      // If error is about missing columns, try again without check_in_time and check_out_time
      if (error.code === 'PGRST204' || error.message?.includes('check_in_time') || error.message?.includes('check_out_time') || error.message?.includes('column') || error.message?.includes('does not exist')) {
        const updatesWithoutTimeFields = { ...cleanedUpdates };
        delete updatesWithoutTimeFields.check_in_time;
        delete updatesWithoutTimeFields.check_out_time;
        
        const { data: retryData, error: retryError } = await supabase
          .from('listings')
          .update(updatesWithoutTimeFields)
          .eq('id', id)
          .select()
          .single();
          
        if (retryError) {
          console.error('Error updating listing (retry):', retryError);
          throw retryError;
        }
        
        return retryData;
      }
      
      throw error;
    }

    // Normalize the returned data (extract time from timestamp if needed)
    if (data) {
      data.check_in_time = extractTimeFromDbValue(data.check_in_time);
      data.check_out_time = extractTimeFromDbValue(data.check_out_time);
      
    }

    return data;
  }

  // Delete a listing (for hosts)
  static async deleteListing(id: string): Promise<void> {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting listing:', error);
      throw error;
    }
  }

  // Get listings by host
  static async getListingsByHost(hostId: string): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching host listings:', error);
      throw error;
    }

    return data || [];
  }

  // Get all listings for management (admin view)
  static async getAllListingsForManagement(): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching listings for management:', error);
      throw error;
    }

    return data || [];
  }

  // Get listings in the same area/city (excluding current listing)
  static async getListingsInSameArea(city: string, excludeId?: string): Promise<ListingView[]> {
    let query = supabase
      .from('listings_view')
      .select('*')
      .ilike('city', `%${city}%`)
      .eq('is_available', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(6);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching listings in same area:', error);
      throw error;
    }

    return data || [];
  }

  // Search listings by name/title
  static async searchListingsByName(searchQuery: string): Promise<ListingView[]> {
    const { data, error } = await supabase
      .from('listings_view')
      .select('*')
      .ilike('title', `%${searchQuery}%`)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching listings by name:', error);
      throw error;
    }

    return data || [];
  }

  // Search listings with multiple criteria
  static async searchListings(searchParams: {
    name?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
  }): Promise<ListingView[]> {
    let query = supabase
      .from('listings_view')
      .select('*');

    if (searchParams.name) {
      query = query.ilike('title', `%${searchParams.name}%`);
    }

    if (searchParams.city) {
      query = query.ilike('city', `%${searchParams.city}%`);
    }

    if (searchParams.minPrice !== undefined) {
      query = query.gte('price', searchParams.minPrice);
    }

    if (searchParams.maxPrice !== undefined) {
      query = query.lte('price', searchParams.maxPrice);
    }

    query = query
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error searching listings:', error);
      throw error;
    }

    return data || [];
  }
}
