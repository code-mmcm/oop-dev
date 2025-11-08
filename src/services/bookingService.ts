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
          supabase.from('users').select('fullname, email, profile_photo').eq('id', booking.assigned_agent).single()
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

  // Get all bookings (for admin) with full related data (client, agent, listing)
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

    // Fetch listing, agent, and client data for each booking
    // Handle errors gracefully - don't fail if related data is missing
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const [listingResponse, agentResponse, clientResponse] = await Promise.all([
          supabase.from('listings').select('id, title, location, main_image_url').eq('id', booking.listing_id).single(),
          booking.assigned_agent 
            ? supabase.from('users').select('id, fullname, email, contact_number').eq('id', booking.assigned_agent).single()
            : Promise.resolve({ data: null, error: null }),
          // Use maybeSingle() instead of single() to handle cases where client_details doesn't exist yet
          supabase.from('client_details').select('*').eq('booking_id', booking.id).maybeSingle()
        ]);

        // Extract data, handling errors gracefully
        const listingData = listingResponse.error ? null : listingResponse.data;
        const agentData = (agentResponse.error || !agentResponse.data) ? null : agentResponse.data;
        // Only log error if it's not a "no rows found" error (PGRST116)
        const clientData = (clientResponse.error && clientResponse.error.code !== 'PGRST116') 
          ? null 
          : (clientResponse.data || null);

        // Log warnings if data is missing but don't fail (skip "no rows found" errors for client_details as it's optional)
        if (listingResponse.error) {
          console.warn('Error fetching listing data for booking', { bookingId: booking.id, listingId: booking.listing_id, error: listingResponse.error });
        }
        if (agentResponse.error && booking.assigned_agent) {
          console.warn('Error fetching agent data for booking', { bookingId: booking.id, agentId: booking.assigned_agent, error: agentResponse.error });
        }
        // Only warn for client_details errors if it's not a "no rows found" error
        if (clientResponse.error && clientResponse.error.code !== 'PGRST116') {
          console.warn('Error fetching client data for booking', { bookingId: booking.id, error: clientResponse.error });
        }

        return {
          ...booking,
          listing: listingData || undefined,
          agent: agentData || undefined,
          client: clientData || undefined
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

    // Fetch listing, agent, client, and payment data for each booking
    const enrichedBookings = await Promise.all(
      bookings.map(async (booking) => {
        const [listingData, agentData, clientData, paymentData] = await Promise.all([
          supabase.from('listings').select('id, title, location, main_image_url').eq('id', booking.listing_id).single(),
          supabase.from('users').select('fullname, email, contact_number').eq('id', booking.assigned_agent).single(),
          // Use maybeSingle() instead of single() to handle cases where client_details doesn't exist yet
          supabase.from('client_details').select('*').eq('booking_id', booking.id).maybeSingle(),
          // Use maybeSingle() for payment as well since it might not exist yet
          supabase.from('payment').select('billing_document_url, proof_of_payment_url').eq('booking_id', booking.id).maybeSingle()
        ]);

        // Extract data, handling errors gracefully
        const listing = listingData.error ? null : listingData.data;
        const agent = (agentData.error || !agentData.data) ? null : agentData.data;
        // Handle maybeSingle() results - data will be null if not found, which is fine
        const client = (clientData.error && clientData.error.code !== 'PGRST116') ? null : (clientData.data || null);
        const payment = (paymentData.error && paymentData.error.code !== 'PGRST116') ? null : (paymentData.data || null);

        // Log warnings only for actual errors (not "no rows found")
        if (listingData.error) {
          console.warn('Error fetching listing data for booking', { bookingId: booking.id, listingId: booking.listing_id, error: listingData.error });
        }
        if (agentData.error && booking.assigned_agent) {
          console.warn('Error fetching agent data for booking', { bookingId: booking.id, agentId: booking.assigned_agent, error: agentData.error });
        }
        if (clientData.error && clientData.error.code !== 'PGRST116') {
          console.warn('Error fetching client data for booking', { bookingId: booking.id, error: clientData.error });
        }
        if (paymentData.error && paymentData.error.code !== 'PGRST116') {
          console.warn('Error fetching payment data for booking', { bookingId: booking.id, error: paymentData.error });
        }

        return {
          ...booking,
          listing: listing || undefined,
          agent: agent || undefined,
          client: client || undefined,
          // Add payment document URLs to booking object
          billing_document_url: payment?.billing_document_url,
          proof_of_payment_url: payment?.proof_of_payment_url
        } as Booking & { billing_document_url?: string; proof_of_payment_url?: string };
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
      .in('status', ['pending', 'confirmed', 'booked', 'ongoing']) // Only active bookings
      .order('check_in_date', { ascending: true });

    if (error) {
      console.error('Error fetching bookings for listing:', error);
      throw error;
    }

    return data || [];
  }

  // Get bookings for a specific listing with full details (for calendar view)
  // Excludes declined and cancelled bookings from calendar display
  static async getBookingsByListingId(listingId: string): Promise<Booking[]> {
    const { data: bookings, error } = await supabase
      .from('booking')
      .select('*')
      .eq('listing_id', listingId)
      .in('status', ['pending', 'confirmed', 'booked', 'ongoing', 'completed']) // Only active bookings (exclude declined/cancelled)
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

  /**
   * Confirm payment for a booking and update status to 'booked'
   * This is called when admin verifies that payment has been received
   * Only bookings with status 'confirmed' can be marked as 'booked'
   */
  static async confirmPayment(bookingId: string): Promise<Booking> {
    try {
      // First, verify the booking exists and is in 'confirmed' status
      const { data: booking, error: fetchError } = await supabase
        .from('booking')
        .select('id, status')
        .eq('id', bookingId)
        .single();

      if (fetchError) {
        console.error('Error fetching booking for payment confirmation:', fetchError);
        throw fetchError;
      }

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== 'confirmed') {
        throw new Error(`Cannot confirm payment for booking with status: ${booking.status}. Only 'confirmed' bookings can be marked as 'booked'.`);
      }

      // Update booking status to 'booked'
      const { data: updatedBooking, error: updateError } = await supabase
        .from('booking')
        .update({ 
          status: 'booked' as BookingStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', bookingId)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating booking to booked status:', updateError);
        throw updateError;
      }

      // Optionally update payment status in payment table
      const { error: paymentUpdateError } = await supabase
        .from('payment')
        .update({ 
          payment_status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId);

      if (paymentUpdateError) {
        console.warn('Error updating payment status:', paymentUpdateError);
        // Don't throw - booking status update is more important
      }

      console.log('Payment confirmed successfully', { bookingId });
      return updatedBooking as Booking;
    } catch (error) {
      console.error('Error in confirmPayment:', error);
      throw error;
    }
  }

  /**
   * Checks if two date ranges overlap
   * Returns true if the ranges overlap (inclusive of start, exclusive of end)
   */
  private static datesOverlap(
    checkIn1: string,
    checkOut1: string,
    checkIn2: string,
    checkOut2: string
  ): boolean {
    const start1 = new Date(checkIn1);
    const end1 = new Date(checkOut1);
    const start2 = new Date(checkIn2);
    const end2 = new Date(checkOut2);

    // Normalize dates to compare only date portion (ignore time)
    const normalizeDate = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const start1Norm = normalizeDate(start1);
    const end1Norm = normalizeDate(end1);
    const start2Norm = normalizeDate(start2);
    const end2Norm = normalizeDate(end2);

    // Check for overlap: ranges overlap if start1 < end2 AND end1 > start2
    return start1Norm < end2Norm && end1Norm > start2Norm;
  }

  /**
   * Declines all pending bookings that overlap with a confirmed booking's date range
   * This ensures only the confirmed booking remains visible for the date range
   */
  static async declineOverlappingPendingBookings(
    confirmedBookingId: string,
    listingId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<void> {
    try {
      // Fetch all pending bookings for the same listing
      const { data: pendingBookings, error: fetchError } = await supabase
        .from('booking')
        .select('id, check_in_date, check_out_date')
        .eq('listing_id', listingId)
        .eq('status', 'pending')
        .neq('id', confirmedBookingId); // Exclude the confirmed booking itself

      if (fetchError) {
        console.error('Error fetching pending bookings:', fetchError);
        throw fetchError;
      }

      if (!pendingBookings || pendingBookings.length === 0) {
        return; // No pending bookings to decline
      }

      // Find overlapping pending bookings
      const overlappingIds: string[] = [];
      for (const pendingBooking of pendingBookings) {
        if (
          this.datesOverlap(
            checkInDate,
            checkOutDate,
            pendingBooking.check_in_date,
            pendingBooking.check_out_date
          )
        ) {
          overlappingIds.push(pendingBooking.id);
        }
      }

      // Decline all overlapping pending bookings
      if (overlappingIds.length > 0) {
        const { error: updateError } = await supabase
          .from('booking')
          .update({ 
            status: 'declined' as BookingStatus, 
            updated_at: new Date().toISOString() 
          })
          .in('id', overlappingIds);

        if (updateError) {
          console.error('Error declining overlapping bookings:', updateError);
          throw updateError;
        }

        console.log(`Declined ${overlappingIds.length} overlapping pending booking(s)`, {
          confirmedBookingId,
          declinedBookingIds: overlappingIds
        });
      }
    } catch (error) {
      console.error('Error in declineOverlappingPendingBookings:', error);
      // Don't throw - allow the confirmation to proceed even if declining overlaps fails
      // Log the error for monitoring
    }
  }

  // Get booking by ID with full related data (client, agent, listing)
  static async getBookingById(id: string): Promise<Booking | null> {
    const { data: booking, error } = await supabase
      .from('booking')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }

    if (!booking) return null;

    // Fetch related data: listing, agent, and client
    // Handle errors gracefully - don't fail if related data is missing
    const [listingResponse, agentResponse, clientResponse] = await Promise.all([
      supabase.from('listings').select('id, title, location, main_image_url').eq('id', booking.listing_id).single(),
      booking.assigned_agent 
        ? supabase.from('users').select('id, fullname, email, contact_number').eq('id', booking.assigned_agent).single()
        : Promise.resolve({ data: null, error: null }),
      // Use maybeSingle() instead of single() to handle cases where client_details doesn't exist yet
      supabase.from('client_details').select('*').eq('booking_id', booking.id).maybeSingle()
    ]);

    // Extract data, handling errors gracefully
    const listingData = listingResponse.error ? null : listingResponse.data;
    const agentData = (agentResponse.error || !agentResponse.data) ? null : agentResponse.data;
    // Only log error if it's not a "no rows found" error (PGRST116)
    const clientData = (clientResponse.error && clientResponse.error.code !== 'PGRST116') 
      ? null 
      : (clientResponse.data || null);

    // Log warnings if data is missing but don't fail (skip "no rows found" errors for client_details as it's optional)
    if (listingResponse.error) {
      console.warn('Error fetching listing data for booking', { bookingId: booking.id, listingId: booking.listing_id, error: listingResponse.error });
    }
    if (agentResponse.error && booking.assigned_agent) {
      console.warn('Error fetching agent data for booking', { bookingId: booking.id, agentId: booking.assigned_agent, error: agentResponse.error });
    }
    // Only warn for client_details errors if it's not a "no rows found" error
    if (clientResponse.error && clientResponse.error.code !== 'PGRST116') {
      console.warn('Error fetching client data for booking', { bookingId: booking.id, error: clientResponse.error });
    }

    // Return enriched booking with related data
    return {
      ...booking,
      listing: listingData || undefined,
      agent: agentData || undefined,
      client: clientData || undefined
    } as Booking;
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

  /**
   * Resolves overlapping confirmed bookings by keeping the earliest one
   * and declining the others with a migration cleanup note.
   * This is a one-time migration script to clean up data conflicts.
   */
  static async resolveOverlappingConfirmedBookings(): Promise<{
    totalProcessed: number;
    totalDeclined: number;
    conflicts: Array<{
      listingId: string;
      keptBooking: string;
      declinedBookings: string[];
    }>;
    errors: Array<{
      listingId: string;
      error: string;
    }>;
  }> {
    const result = {
      totalProcessed: 0,
      totalDeclined: 0,
      conflicts: [] as Array<{
        listingId: string;
        keptBooking: string;
        declinedBookings: string[];
      }>,
      errors: [] as Array<{
        listingId: string;
        error: string;
      }>
    };

    try {
      // Fetch all confirmed bookings
      const { data: confirmedBookings, error: fetchError } = await supabase
        .from('booking')
        .select('id, listing_id, check_in_date, check_out_date, notes')
        .eq('status', 'confirmed')
        .order('check_in_date', { ascending: true });

      if (fetchError) {
        console.error('Error fetching confirmed bookings:', fetchError);
        throw fetchError;
      }

      if (!confirmedBookings || confirmedBookings.length === 0) {
        console.log('No confirmed bookings found.');
        return result;
      }

      // Group bookings by listing_id
      const bookingsByListing = new Map<string, typeof confirmedBookings>();
      for (const booking of confirmedBookings) {
        const listingId = booking.listing_id;
        if (!bookingsByListing.has(listingId)) {
          bookingsByListing.set(listingId, []);
        }
        bookingsByListing.get(listingId)!.push(booking);
      }

      console.log(`Processing ${bookingsByListing.size} listings with confirmed bookings...`);

      // Process each listing
      for (const [listingId, bookings] of bookingsByListing.entries()) {
        try {
          result.totalProcessed += bookings.length;

          // Sort bookings by check_in_date (earliest first)
          const sortedBookings = [...bookings].sort((a, b) => {
            const dateA = new Date(a.check_in_date).getTime();
            const dateB = new Date(b.check_in_date).getTime();
            return dateA - dateB;
          });

          // Find overlapping bookings
          // Strategy: Keep the earliest booking, decline any that overlap with kept bookings
          const toDecline: string[] = [];
          const keptBookings: typeof sortedBookings = [];
          
          for (const currentBooking of sortedBookings) {
            // Check if this booking overlaps with any kept booking
            let overlaps = false;
            for (const keptBooking of keptBookings) {
              if (this.datesOverlap(
                keptBooking.check_in_date,
                keptBooking.check_out_date,
                currentBooking.check_in_date,
                currentBooking.check_out_date
              )) {
                overlaps = true;
                break;
              }
            }
            
            if (overlaps) {
              // This booking overlaps with a kept booking, decline it
              toDecline.push(currentBooking.id);
            } else {
              // This booking doesn't overlap with any kept booking, keep it
              keptBookings.push(currentBooking);
            }
          }

          // If there are overlapping bookings, update them
          if (toDecline.length > 0) {
            // Append note, preserving existing notes if any
            const migrationNote = 'auto-declined due to date conflict (migration cleanup)';
            
            // Update each booking to declined status with the note
            for (const bookingId of toDecline) {
              const booking = sortedBookings.find(b => b.id === bookingId);
              const existingNotes = booking?.notes || '';
              const updatedNotes = existingNotes 
                ? `${existingNotes}\n${migrationNote}`
                : migrationNote;

              const { error: updateError } = await supabase
                .from('booking')
                .update({
                  status: 'declined' as BookingStatus,
                  notes: updatedNotes,
                  updated_at: new Date().toISOString()
                })
                .eq('id', bookingId);

              if (updateError) {
                console.error(`Error declining booking ${bookingId}:`, updateError);
                result.errors.push({
                  listingId,
                  error: `Failed to decline booking ${bookingId}: ${updateError.message}`
                });
              } else {
                result.totalDeclined++;
              }
            }

            result.conflicts.push({
              listingId,
              keptBooking: keptBookings[0].id, // The earliest kept booking
              declinedBookings: toDecline
            });

            console.log(`Listing ${listingId}: Kept ${keptBookings.length} booking(s) (earliest: ${keptBookings[0].id}), declined ${toDecline.length} overlapping booking(s)`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error processing listing ${listingId}:`, error);
          result.errors.push({
            listingId,
            error: errorMessage
          });
        }
      }

      console.log(`Migration complete. Processed ${result.totalProcessed} bookings, declined ${result.totalDeclined} conflicts.`);
      return result;
    } catch (error) {
      console.error('Error in resolveOverlappingConfirmedBookings:', error);
      throw error;
    }
  }
}
