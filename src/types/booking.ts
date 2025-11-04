export interface Booking {
  id: string;
  listing_id: string;
  check_in_date: string;
  check_out_date: string;
  nights?: number;
  num_guests?: number;
  extra_guests?: number;
  unit_charge?: string;
  base_guest_included?: number;
  extra_guest_fee?: number;
  amenities_charge?: number;
  service_charge?: number;
  discount?: number;
  subtotal?: number;
  total_amount: number;
  currency?: string;
  status: BookingStatus;
  assigned_agent: string;
  landmark?: string;
  parking_info?: string;
  notes?: string;
  important_info?: any;
  add_ons?: any;
  request_description?: string;
  transaction_number?: string;
  created_at: string;
  updated_at: string;
  listing?: {
    id: string;
    title: string;
    location: string;
    main_image_url?: string;
    property_type?: string;
    latitude?: number;
    longitude?: number;
  };
  agent?: {
    id: string;
    fullname: string;
    email: string;
    contact_number?: number;
    profile_photo?: string;
  };
  user?: {
    id: string;
    fullname: string;
    email: string;
    profile_photo?: string;
  };
  client?: {
    first_name: string;
    last_name: string;
    email?: string;
    contact_number?: number;
    profile_photo?: string;
  };
}

export type BookingStatus = 'pending' | 'confirmed' | 'ongoing' | 'completed' | 'cancelled' | 'declined';

export interface BookingAvailability {
  id: string;
  listing_id: string;
  check_in_date: string;
  check_out_date: string;
  status: BookingStatus;
}

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

// Booking Form Types
export interface BookingFormData {
  [x: string]: any;
  billingDocumentUploaded: any;
  poNumber: string;
  cashPayerContact: any;
  cashPayerName: any;
  billingEmail: any;
  billingContact: any;
  companyName: any;
  bankReceiptUploaded: boolean;
  bankReceiptFileName?: string;
  billingDocumentFileName?: string;
  billingDocumentUrl?: string; 
  depositorName: any;
  bankAccountNumber: any;
  bankName: any;
  // Listing and Stay Details
  listingId?: string;
  pricePerNight?: number;
  priceUnit?: string;
  extraGuestFeePerPerson?: number;
  baseGuests?: number;
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  numberOfGuests: number;
  extraGuests: number;
  
  // Client Info
  firstName: string;
  lastName: string;
  email: string;
  nickname: string;
  dateOfBirth: string;
  referredBy: string;
  gender: 'male' | 'female' | 'other';
  preferredContactNumber: string;
  contactType: 'home' | 'mobile' | 'work';
  
  // Additional Services
  additionalServices: AdditionalService[];
  requestDescription: string;
  
  // Payment Info
  paymentMethod: 'bank_transfer' | 'credit_card' | 'company_account' | 'cash';
  cardNumber?: string;
  nameOnCard?: string;
  cvvCode?: string;
  expirationDate?: string;
  agreeToTerms: boolean;
}

export interface AdditionalService {
  id: string;
  name: string;
  quantity: number;
  charge: number;
}

export interface BookingSummary {
  nights: number;
  extraGuests: number;
  baseGuests: any;
  unitCharge: number;
  amenitiesCharge: number;
  serviceCharge: number;
  discount: number;
  totalCharges: number;
}

export interface BookingStep {
  id: string;
  title: string;
  completed: boolean;
  active: boolean;
}