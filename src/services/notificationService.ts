import { supabase } from '../lib/supabase';

export interface NotificationPayload {
  user_id: string;
  title: string;
  message: string;
  link?: string;
  type?: string;
}

/**
 * Notification Service
 * Handles creating and managing notifications for users
 */
export class NotificationService {
  /**
   * Create a new notification for a user
   */
  static async createNotification(payload: NotificationPayload): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: payload.user_id,
          title: payload.title,
          message: payload.message,
          link: payload.link || null,
          type: payload.type || 'info',
          is_read: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      console.log('Notification created successfully', { 
        user_id: payload.user_id,
        title: payload.title 
      });
    } catch (error) {
      console.error('Error in createNotification:', error);
      throw error;
    }
  }

  /**
   * Send a notification when a booking is approved (status changed to pending-payment)
   */
  static async notifyBookingApproved(
    agentId: string,
    bookingId: string,
    propertyTitle: string
  ): Promise<void> {
    try {
      await this.createNotification({
        user_id: agentId,
        title: 'Booking Approved - Payment Required',
        message: `Your booking request for "${propertyTitle}" (ID: ${bookingId.substring(0, 8)}) has been approved. Please proceed with payment to confirm the reservation.`,
        link: `/booking-details/${bookingId}`,
        type: 'booking_approved'
      });
    } catch (error) {
      console.error('Error sending booking approval notification:', error);
      // Don't throw - notification failure shouldn't block the approval process
    }
  }

  /**
   * Send a notification when payment is confirmed
   */
  static async notifyPaymentConfirmed(
    agentId: string,
    bookingId: string,
    propertyTitle: string
  ): Promise<void> {
    try {
      await this.createNotification({
        user_id: agentId,
        title: 'Payment Confirmed - Booking Complete',
        message: `Payment for your booking "${propertyTitle}" (ID: ${bookingId.substring(0, 8)}) has been confirmed. Your reservation is now official!`,
        link: `/booking-details/${bookingId}`,
        type: 'payment_confirmed'
      });
    } catch (error) {
      console.error('Error sending payment confirmation notification:', error);
    }
  }

  /**
   * Send a notification when a booking is declined
   */
  static async notifyBookingDeclined(
    agentId: string,
    bookingId: string,
    propertyTitle: string
  ): Promise<void> {
    try {
      await this.createNotification({
        user_id: agentId,
        title: 'Booking Request Declined',
        message: `Your booking request for "${propertyTitle}" (ID: ${bookingId.substring(0, 8)}) has been declined. Please contact support for more information.`,
        link: `/booking-details/${bookingId}`,
        type: 'booking_declined'
      });
    } catch (error) {
      console.error('Error sending booking declined notification:', error);
    }
  }
}

