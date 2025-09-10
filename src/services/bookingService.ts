import { supabase } from '../lib/supabase';
import type { Booking, BookingStatus } from '../types/booking';

export class BookingService {
  // Get all bookings for a user
  static async getUserBookings(userId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        listing:listings(id, title, location, main_image_url),
        user:users(id, fullname, email)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }

    return data || [];
  }

  // Get all bookings (for admin)
  static async getAllBookings(): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        listing:listings(id, title, location, main_image_url),
        user:users(id, fullname, email)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all bookings:', error);
      throw error;
    }

    return data || [];
  }

  // Get bookings by status
  static async getBookingsByStatus(status: BookingStatus): Promise<Booking[]> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        listing:listings(id, title, location, main_image_url),
        user:users(id, fullname, email)
      `)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookings by status:', error);
      throw error;
    }

    return data || [];
  }

  // Create a new booking
  static async createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select(`
        *,
        listing:listings(id, title, location, main_image_url),
        user:users(id, fullname, email)
      `)
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      throw error;
    }

    return data;
  }

  // Update booking status
  static async updateBookingStatus(id: string, status: BookingStatus): Promise<Booking> {
    const { data, error } = await supabase
      .from('bookings')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        listing:listings(id, title, location, main_image_url),
        user:users(id, fullname, email)
      `)
      .single();

    if (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }

    return data;
  }

  // Get booking by ID
  static async getBookingById(id: string): Promise<Booking | null> {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        listing:listings(id, title, location, main_image_url),
        user:users(id, fullname, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }

    return data;
  }

  // Generate mock data for development
  static getMockBookings(): Booking[] {
    return [
      {
        id: '1',
        listing_id: '1',
        user_id: '1',
        check_in_date: '2025-01-04',
        check_out_date: '2025-01-05',
        total_amount: 2095,
        status: 'completed',
        transaction_number: 'A221-092345-76',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        listing: {
          id: '1',
          title: 'Apartment complex in Davao',
          location: 'Matina Crossing, Davao City',
          main_image_url: '/heroimage.png'
        },
        user: {
          id: '1',
          fullname: 'Mika Ysabel',
          email: 'mika@example.com'
        }
      },
      {
        id: '2',
        listing_id: '2',
        user_id: '2',
        check_in_date: '2025-01-06',
        check_out_date: '2025-01-08',
        total_amount: 3200,
        status: 'cancelled',
        transaction_number: 'A221-092345-77',
        created_at: '2025-01-02T00:00:00Z',
        updated_at: '2025-01-02T00:00:00Z',
        listing: {
          id: '2',
          title: 'Modern Studio Apartment',
          location: 'Bajada, Davao City',
          main_image_url: '/heroimage.png'
        },
        user: {
          id: '2',
          fullname: 'John Doe',
          email: 'john@example.com'
        }
      },
      {
        id: '3',
        listing_id: '3',
        user_id: '3',
        check_in_date: '2025-01-10',
        check_out_date: '2025-01-12',
        total_amount: 4500,
        status: 'ongoing',
        transaction_number: 'A221-092345-78',
        created_at: '2025-01-03T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z',
        listing: {
          id: '3',
          title: 'Luxury Condo Unit',
          location: 'Lanang, Davao City',
          main_image_url: '/heroimage.png'
        },
        user: {
          id: '3',
          fullname: 'Sarah Smith',
          email: 'sarah@example.com'
        }
      },
      {
        id: '4',
        listing_id: '4',
        user_id: '4',
        check_in_date: '2025-01-15',
        check_out_date: '2025-01-17',
        total_amount: 2800,
        status: 'completed',
        transaction_number: 'A221-092345-79',
        created_at: '2025-01-04T00:00:00Z',
        updated_at: '2025-01-04T00:00:00Z',
        listing: {
          id: '4',
          title: 'Cozy Family House',
          location: 'Toril, Davao City',
          main_image_url: '/heroimage.png'
        },
        user: {
          id: '4',
          fullname: 'Mike Johnson',
          email: 'mike@example.com'
        }
      }
    ];
  }
}
