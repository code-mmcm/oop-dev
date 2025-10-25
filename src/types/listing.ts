export interface Listing {
  id: string;
  unit_id?: string; // User-defined unit identifier (e.g., "Floor 2, Room 201")
  title: string;
  description?: string;
  price: number;
  price_unit: string;
  currency: string;
  location: string;
  city?: string;
  country?: string;
  bedrooms: number;
  bathrooms: number;
  square_feet?: number;
  property_type: string;
  main_image_url?: string;
  image_urls?: string[];
  amenities?: string[];
  is_available: boolean;
  is_featured: boolean;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface ListingView {
  id: string;
  title: string;
  description?: string;
  price: number;
  price_unit: string;
  currency: string;
  location: string;
  city?: string;
  bedrooms: number;
  bathrooms: number;
  square_feet?: number;
  property_type: string;
  main_image_url?: string;
  amenities?: string[];
  is_available: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  details: string;
  formatted_price: string;
}
