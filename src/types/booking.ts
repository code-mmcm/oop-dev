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
  // Stay Details
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