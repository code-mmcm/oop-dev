export interface Booking {
  id: string;
  listing_id: string;
  user_id: string;
  check_in_date: string;
  check_out_date: string;
  total_amount: number;
  status: BookingStatus;
  transaction_number: string;
  created_at: string;
  updated_at: string;
  listing?: {
    id: string;
    title: string;
    location: string;
    main_image_url?: string;
  };
  user?: {
    id: string;
    fullname: string;
    email: string;
  };
}

export type BookingStatus = 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'declined';

export interface BookingCard {
  id: string;
  dateRange: string;
  apartmentName: string;
  location: string;
  clientName: string;
  transactionNumber: string;
  status: BookingStatus;
  totalBill: number;
  imageUrl?: string;
}
