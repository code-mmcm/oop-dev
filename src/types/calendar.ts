/**
 * Calendar-related types for pricing and availability management
 */

export interface CalendarPricing {
  /** Unique identifier for the pricing entry */
  id: string;
  /** Listing ID this pricing belongs to */
  listing_id: string;
  /** Date for this pricing (YYYY-MM-DD format) */
  date: string;
  /** Price for this specific date */
  price: number;
  /** Whether this date is available for booking */
  is_available: boolean;
  /** Whether this date has a pending booking */
  is_pending?: boolean;
  /** Minimum stay requirement for this date */
  min_stay?: number;
  /** Maximum stay allowed for this date */
  max_stay?: number;
  /** Created timestamp */
  created_at: string;
  /** Updated timestamp */
  updated_at: string;
}

export interface CalendarWeek {
  /** Start date of the week (Monday) */
  start_date: string;
  /** End date of the week (Sunday) */
  end_date: string;
  /** Array of dates in this week */
  dates: string[];
  /** Day names for the week */
  day_names: string[];
}

export interface CalendarListing {
  /** Listing ID */
  id: string;
  /** Listing title */
  title: string;
  /** Listing subtitle/description */
  subtitle: string;
  /** Main image URL for the listing */
  image_url: string;
  /** Status indicator (available, unavailable, pending) */
  status: 'available' | 'unavailable' | 'pending';
  /** Pricing data for each day in the current week */
  weekly_pricing: CalendarPricing[];
}

export interface CalendarViewProps {
  /** Current selected week */
  currentWeek: CalendarWeek;
  /** List of listings with their pricing data */
  listings: CalendarListing[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if any */
  error?: string;
}

export interface CalendarFilters {
  /** Search term for filtering listings */
  searchTerm: string;
  /** Property type filter */
  propertyType?: string;
  /** Price range filter */
  priceRange?: {
    min: number;
    max: number;
  };
  /** Availability filter */
  availability?: 'all' | 'available' | 'unavailable';
}






