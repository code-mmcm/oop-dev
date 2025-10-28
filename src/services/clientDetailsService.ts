import { supabase } from '../lib/supabase';
import type { Booking } from '../types/booking';

/**
 * Client Details Service
 * 
 * Provides methods to query bookings with client_details using Supabase relationships.
 * The relationship: client_details.booking_id -> booking.id
 */

export interface ClientDetails {
  id: string;
  booking_id: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  email?: string;
  contact_number?: number;
  gender?: string;
  birth_date?: string;
  preferred_contact?: string;
  referred_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BookingWithClient extends Booking {
  client_details: ClientDetails[];
}

/**
 * Get a booking with client details joined
 * @param bookingId - The ID of the booking
 * @returns Booking with client details included
 */
export const getBookingWithClientDetails = async (bookingId: string): Promise<BookingWithClient | null> => {
  try {
    // Query booking with client_details using Supabase join
    const { data, error } = await supabase
      .from('booking')
      .select(`
        *,
        client_details (
          id,
          booking_id,
          first_name,
          last_name,
          nickname,
          email,
          contact_number,
          gender,
          birth_date,
          preferred_contact,
          referred_by,
          created_at,
          updated_at
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      console.error('Error fetching booking with client details:', error);
      throw error;
    }

    return data as BookingWithClient;
  } catch (error) {
    console.error('Error in getBookingWithClientDetails:', error);
    return null;
  }
};

/**
 * Get all bookings for a user with client details
 * @param userId - The user ID (agent) who created the bookings
 * @returns Array of bookings with client details
 */
export const getUserBookingsWithClientDetails = async (userId: string): Promise<BookingWithClient[]> => {
  try {
    const { data, error } = await supabase
      .from('booking')
      .select(`
        *,
        client_details (
          id,
          booking_id,
          first_name,
          last_name,
          nickname,
          email,
          contact_number,
          gender,
          birth_date,
          preferred_contact,
          referred_by,
          created_at,
          updated_at
        )
      `)
      .eq('assigned_agent', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings with client details:', error);
      throw error;
    }

    return data as BookingWithClient[];
  } catch (error) {
    console.error('Error in getUserBookingsWithClientDetails:', error);
    return [];
  }
};

/**
 * Get all bookings with client details (for admin)
 * @returns Array of all bookings with client details
 */
export const getAllBookingsWithClientDetails = async (): Promise<BookingWithClient[]> => {
  try {
    const { data, error } = await supabase
      .from('booking')
      .select(`
        *,
        client_details (
          id,
          booking_id,
          first_name,
          last_name,
          nickname,
          email,
          contact_number,
          gender,
          birth_date,
          preferred_contact,
          referred_by,
          created_at,
          updated_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all bookings with client details:', error);
      throw error;
    }

    return data as BookingWithClient[];
  } catch (error) {
    console.error('Error in getAllBookingsWithClientDetails:', error);
    return [];
  }
};

/**
 * Get bookings by status with client details
 * @param status - The booking status to filter by
 * @returns Array of bookings matching the status
 */
export const getBookingsByStatusWithClientDetails = async (status: string): Promise<BookingWithClient[]> => {
  try {
    const { data, error } = await supabase
      .from('booking')
      .select(`
        *,
        client_details (
          id,
          booking_id,
          first_name,
          last_name,
          nickname,
          email,
          contact_number,
          gender,
          birth_date,
          preferred_contact,
          referred_by,
          created_at,
          updated_at
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings by status with client details:', error);
      throw error;
    }

    return data as BookingWithClient[];
  } catch (error) {
    console.error('Error in getBookingsByStatusWithClientDetails:', error);
    return [];
  }
};

/**
 * Get client details for a specific booking
 * @param bookingId - The ID of the booking
 * @returns Client details or null if not found
 */
export const getClientDetailsByBookingId = async (bookingId: string): Promise<ClientDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('client_details')
      .select('*')
      .eq('booking_id', bookingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - this is okay, some bookings may not have client details
        return null;
      }
      console.error('Error fetching client details:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getClientDetailsByBookingId:', error);
    return null;
  }
};

/**
 * Create client details for a booking
 * @param bookingId - The ID of the booking
 * @param clientData - The client data to save
 * @returns Created client details
 */
export const createClientDetails = async (bookingId: string, clientData: Partial<ClientDetails>): Promise<ClientDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('client_details')
      .insert([{
        ...clientData,
        booking_id: bookingId
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating client details:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createClientDetails:', error);
    return null;
  }
};

/**
 * Update client details for a booking
 * @param bookingId - The ID of the booking
 * @param clientData - The client data to update
 * @returns Updated client details
 */
export const updateClientDetails = async (bookingId: string, clientData: Partial<ClientDetails>): Promise<ClientDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('client_details')
      .update(clientData)
      .eq('booking_id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating client details:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateClientDetails:', error);
    return null;
  }
};

/**
 * Get bookings with enriched data (listing, agent, and client details)
 * @param bookingId - The ID of the booking
 * @returns Booking with all related data
 */
export const getEnrichedBookingWithClient = async (bookingId: string) => {
  try {
    // Get booking with client details
    const booking = await getBookingWithClientDetails(bookingId);
    
    if (!booking) return null;

    // Fetch listing data
    const { data: listingData } = await supabase
      .from('listings')
      .select('id, title, location, main_image_url, property_type')
      .eq('id', booking.listing_id)
      .single();

    // Fetch agent data
    const { data: agentData } = await supabase
      .from('users')
      .select('id, fullname, email, contact_number')
      .eq('id', booking.assigned_agent)
      .single();

    return {
      ...booking,
      listing: listingData,
      agent: agentData,
      // client_details is already included from the join
    };
  } catch (error) {
    console.error('Error in getEnrichedBookingWithClient:', error);
    return null;
  }
};

