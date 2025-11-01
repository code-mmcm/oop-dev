import { supabase } from '../lib/supabase';
import type { Booking, BookingStatus } from '../types/booking';

export class BookingService {
  // Get all bookings for the logged-in user (agent)
  static async getUserBookings(userId: string): Promise<Booking[]> {
    const { data: bookings, error } = await supabase
      .from('booking')
      .select('*')
      .eq('assigned_agent', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }

    if (!bookings) return [];

    // Fetch listing and agent data for each booking
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const [listingData, agentData] = await Promise.all([
          supabase.from('listings').select('id, title, location, main_image_url').eq('id', booking.listing_id).single(),
          supabase.from('users').select('fullname, email').eq('id', booking.assigned_agent).single()
        ]);

        return {
          ...booking,
          listing: listingData.data,
          agent: agentData.data
        } as Booking;
      })
    );

    return enrichedBookings;
  }

  // Get all bookings (for admin)
  static async getAllBookings(): Promise<Booking[]> {
    const { data: bookings, error } = await supabase
      .from('booking')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all bookings:', error);
      throw error;
    }

    if (!bookings) return [];

    // Debug: Log raw booking data from database
    console.log('🔍 Raw booking data from database (all bookings):');
    bookings.forEach((booking, idx) => {
      console.log(`Booking ${idx + 1}:`, {
        id: booking.id,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        check_in_type: typeof booking.check_in_date,
        check_out_type: typeof booking.check_out_date,
        has_time_in: booking.check_in_date?.includes('T'),
        has_time_out: booking.check_out_date?.includes('T'),
      });
    });

    // Fetch listing and agent data for each booking
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const [listingData, agentData] = await Promise.all([
          supabase.from('listings').select('id, title, location, main_image_url').eq('id', booking.listing_id).single(),
          supabase.from('users').select('fullname, email').eq('id', booking.assigned_agent).single()
        ]);

        return {
          ...booking,
          listing: listingData.data,
          agent: agentData.data
        } as Booking;
      })
    );

    return enrichedBookings;
  }

  // Get bookings by status
  static async getBookingsByStatus(status: BookingStatus): Promise<Booking[]> {
    const { data: bookings, error } = await supabase
      .from('booking')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings by status:', error);
      throw error;
    }

    if (!bookings) return [];

    // Fetch listing and agent data for each booking
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const [listingData, agentData] = await Promise.all([
          supabase.from('listings').select('id, title, location, main_image_url').eq('id', booking.listing_id).single(),
          supabase.from('users').select('fullname, email').eq('id', booking.assigned_agent).single()
        ]);

        return {
          ...booking,
          listing: listingData.data,
          agent: agentData.data
        } as Booking;
      })
    );

    return enrichedBookings;
  }

  // Get bookings for a specific listing (for availability checking)
  static async getBookingsForListing(listingId: string) {
    const { data, error } = await supabase
      .from('booking')
      .select(`
        id,
        listing_id,
        check_in_date,
        check_out_date,
        status
      `)
      .eq('listing_id', listingId)
      .in('status', ['pending', 'confirmed', 'ongoing']) // Only active bookings
      .order('check_in_date', { ascending: true });

    if (error) {
      console.error('Error fetching bookings for listing:', error);
      throw error;
    }

    return data || [];
  }

  // Get bookings for a specific listing with full details (for calendar view)
  static async getBookingsByListingId(listingId: string): Promise<Booking[]> {
    const { data: bookings, error } = await supabase
      .from('booking')
      .select('*')
      .eq('listing_id', listingId)
      .order('check_in_date', { ascending: true });

    if (error) {
      console.error('Error fetching bookings for listing:', error);
      throw error;
    }

    if (!bookings) return [];

    // Debug: Log raw booking data from database
    console.log('🔍 Raw booking data from database:');
    bookings.forEach((booking, idx) => {
      console.log(`Booking ${idx + 1}:`, {
        id: booking.id,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        check_in_type: typeof booking.check_in_date,
        check_out_type: typeof booking.check_out_date,
        has_time_in: booking.check_in_date?.includes('T'),
        has_time_out: booking.check_out_date?.includes('T'),
      });
    });

    // Fetch listing, agent, and client data for each booking
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const [listingData, agentData, clientData] = await Promise.all([
          supabase.from('listings').select('id, title, location, main_image_url').eq('id', booking.listing_id).single(),
          supabase.from('users').select('fullname, email').eq('id', booking.assigned_agent).single(),
          supabase.from('client_details').select('*').eq('booking_id', booking.id).single()
        ]);

        return {
          ...booking,
          listing: listingData.data,
          agent: agentData.data,
          client: clientData.data
        } as Booking;
      })
    );

    return enrichedBookings;
  }

  // Check if dates are available for a listing
  static async checkDateAvailability(
    listingId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<boolean> {
    const bookings = await this.getBookingsForListing(listingId);
    
    // Check for any overlapping bookings
    for (const booking of bookings) {
      const bookingCheckIn = new Date(booking.check_in_date);
      const bookingCheckOut = new Date(booking.check_out_date);
      const requestCheckIn = new Date(checkInDate);
      const requestCheckOut = new Date(checkOutDate);

      // Check if dates overlap
      if (
        (requestCheckIn >= bookingCheckIn && requestCheckIn < bookingCheckOut) ||
        (requestCheckOut > bookingCheckIn && requestCheckOut <= bookingCheckOut) ||
        (requestCheckIn <= bookingCheckIn && requestCheckOut >= bookingCheckOut)
      ) {
        return false; // Dates are not available
      }
    }

    return true; // Dates are available
  }

  // Create a new booking
  static async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
    const { data, error } = await supabase
      .from('booking')
      .insert([booking])
      .select('*')
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      throw error;
    }

    return data as Booking;
  }

  // Update booking status
  static async updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
    const { data, error } = await supabase
      .from('booking')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }

    return data as Booking;
  }

  // Get booking by ID
  static async getBookingById(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('booking')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }

    return data as Booking;
  }

  // Generate mock data for development
  static getMockBookings(): Booking[] {
    return [
      {
        id: '1',
        listing_id: '1',
        check_in_date: '2025-01-04',
        check_out_date: '2025-01-05',
        total_amount: 2095,
        status: 'completed',
        assigned_agent: '1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        listing: {
          id: '1',
          title: 'Apartment complex in Davao',
          location: 'Matina Crossing, Davao City',
          main_image_url: '/heroimage.png'
        },
        agent: {
          id: '1',
          fullname: 'Mika Ysabel',
          email: 'mika@example.com'
        }
      },
      {
        id: '2',
        listing_id: '2',
        check_in_date: '2025-01-06',
        check_out_date: '2025-01-08',
        total_amount: 3200,
        status: 'cancelled',
        assigned_agent: '2',
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
        listing: {
          id: '2',
          title: 'Modern Studio Apartment',
          location: 'Bajada, Davao City',
          main_image_url: '/heroimage.png'
        },
        agent: {
          id: '2',
          fullname: 'John Doe',
          email: 'john@example.com'
        }
      },
      {
        id: '3',
        listing_id: '3',
        check_in_date: '2025-01-10',
        check_out_date: '2025-01-12',
        total_amount: 4500,
        status: 'ongoing',
        assigned_agent: '3',
        created_at: '2025-01-03T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z',
        listing: {
          id: '3',
          title: 'Luxury Condo Unit',
          location: 'Lanang, Davao City',
          main_image_url: '/heroimage.png'
        },
        agent: {
          id: '3',
          fullname: 'Sarah Smith',
          email: 'sarah@example.com'
        }
      },
      {
        id: '4',
        listing_id: '4',
        check_in_date: '2025-01-15',
        check_out_date: '2025-01-17',
        total_amount: 2800,
        status: 'completed',
        assigned_agent: '4',
        created_at: '2025-01-04T00:00:00Z',
        updated_at: '2025-01-04T00:00:00Z',
        listing: {
          id: '4',
          title: 'Cozy Family House',
          location: 'Toril, Davao City',
          main_image_url: '/heroimage.png'
        },
        agent: {
          id: '4',
          fullname: 'Mike Johnson',
          email: 'mike@example.com'
        }
      }
    ];
  }
}
