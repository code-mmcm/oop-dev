import { supabase } from '../lib/supabase';
import type { Listing, ListingView } from '../types/listing';

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
    const { data, error } = await supabase
      .from('listings')
      .insert([listing])
      .select()
      .single();

    if (error) {
      console.error('Error creating listing:', error);
      throw error;
    }

    return data;
  }

  // Update a listing (for hosts)
  static async updateListing(id: string, updates: Partial<Listing>): Promise<Listing> {
    const { data, error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating listing:', error);
      throw error;
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
}
