-- Create listings table for apartment/property listings
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  price_unit TEXT DEFAULT '/ night',
  currency TEXT DEFAULT 'PHP',
  location TEXT NOT NULL,
  city TEXT,
  country TEXT DEFAULT 'Philippines',
  
  -- Property details
  bedrooms INTEGER DEFAULT 0,
  bathrooms INTEGER DEFAULT 0,
  square_feet INTEGER,
  property_type TEXT DEFAULT 'apartment', -- apartment, house, condo, etc.
  
  -- Images
  main_image_url TEXT,
  image_urls TEXT[], -- Array of image URLs
  
  -- Amenities
  amenities TEXT[], -- Array of amenities like ['wifi', 'parking', 'pool']
  
  -- Availability and status
  is_available BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  
  -- Host information
  host_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  host_name TEXT,
  host_phone TEXT,
  host_email TEXT,
  
  -- Location coordinates (for future map features)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_property_type ON listings(property_type);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_available ON listings(is_available);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured);
CREATE INDEX IF NOT EXISTS idx_listings_host ON listings(host_id);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_listings_updated_at 
    BEFORE UPDATE ON listings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Allow everyone to read available listings
CREATE POLICY "Allow public read access to available listings" 
    ON listings FOR SELECT 
    USING (is_available = true);

-- Allow authenticated users to read all listings
CREATE POLICY "Allow authenticated users to read all listings" 
    ON listings FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow hosts to insert their own listings
CREATE POLICY "Allow hosts to insert their own listings" 
    ON listings FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = host_id);

-- Allow hosts to update their own listings
CREATE POLICY "Allow hosts to update their own listings" 
    ON listings FOR UPDATE 
    TO authenticated 
    USING (auth.uid() = host_id)
    WITH CHECK (auth.uid() = host_id);

-- Allow hosts to delete their own listings
CREATE POLICY "Allow hosts to delete their own listings" 
    ON listings FOR DELETE 
    TO authenticated 
    USING (auth.uid() = host_id);

-- Insert sample data
INSERT INTO listings (
  title,
  description,
  price,
  price_unit,
  currency,
  location,
  city,
  bedrooms,
  bathrooms,
  square_feet,
  property_type,
  main_image_url,
  amenities,
  is_available,
  is_featured,
  host_name,
  host_email
) VALUES 
(
  'Modern Apartment in Davao City',
  'Beautiful modern apartment with stunning city views. Perfect for short-term stays with all amenities included.',
  4320.00,
  '/ night',
  'PHP',
  'Matina, Aplaya Davao City',
  'Davao City',
  2,
  1,
  215,
  'apartment',
  '/avida.jpg',
  ARRAY['wifi', 'air_conditioning', 'kitchen', 'parking', 'elevator'],
  true,
  true,
  'John Doe',
  'john@example.com'
),
(
  'Cozy Studio in Downtown Davao',
  'Charming studio apartment in the heart of downtown Davao. Walking distance to restaurants and shopping centers.',
  3200.00,
  '/ night',
  'PHP',
  'Downtown Davao City',
  'Davao City',
  1,
  1,
  180,
  'studio',
  '/avida.jpg',
  ARRAY['wifi', 'air_conditioning', 'kitchen', 'gym'],
  true,
  false,
  'Jane Smith',
  'jane@example.com'
),
(
  'Luxury Condo with Pool Access',
  'High-end condominium with access to swimming pool and fitness center. Perfect for business travelers.',
  5500.00,
  '/ night',
  'PHP',
  'Lanang, Davao City',
  'Davao City',
  2,
  2,
  300,
  'condo',
  '/avida.jpg',
  ARRAY['wifi', 'air_conditioning', 'kitchen', 'parking', 'pool', 'gym', 'elevator', 'security'],
  true,
  true,
  'Mike Johnson',
  'mike@example.com'
),
(
  'Budget-Friendly Apartment',
  'Affordable apartment perfect for budget-conscious travelers. Clean and comfortable with basic amenities.',
  2500.00,
  '/ night',
  'PHP',
  'Bajada, Davao City',
  'Davao City',
  1,
  1,
  150,
  'apartment',
  '/avida.jpg',
  ARRAY['wifi', 'fan', 'kitchen'],
  true,
  false,
  'Sarah Wilson',
  'sarah@example.com'
),
(
  'Family House with Garden',
  'Spacious family house with private garden. Perfect for families or groups looking for more space.',
  6800.00,
  '/ night',
  'PHP',
  'Toril, Davao City',
  'Davao City',
  3,
  2,
  450,
  'house',
  '/avida.jpg',
  ARRAY['wifi', 'air_conditioning', 'kitchen', 'parking', 'garden', 'washing_machine'],
  true,
  true,
  'Robert Brown',
  'robert@example.com'
),
(
  'Executive Suite in Business District',
  'Premium executive suite in the business district. Ideal for business travelers and executives.',
  7500.00,
  '/ night',
  'PHP',
  'Obrero, Davao City',
  'Davao City',
  2,
  2,
  350,
  'suite',
  '/avida.jpg',
  ARRAY['wifi', 'air_conditioning', 'kitchen', 'parking', 'gym', 'elevator', 'security', 'concierge'],
  true,
  true,
  'Lisa Davis',
  'lisa@example.com'
);

-- Create a view for easy querying with formatted details
CREATE OR REPLACE VIEW listings_view AS
SELECT 
  id,
  title,
  description,
  price,
  price_unit,
  currency,
  location,
  city,
  bedrooms,
  bathrooms,
  square_feet,
  property_type,
  main_image_url,
  amenities,
  is_available,
  is_featured,
  host_name,
  host_email,
  created_at,
  updated_at,
  -- Format details string like in the original data
  CONCAT(bedrooms, ' beds | ', bathrooms, ' bathroom | ', square_feet, 'sqft') as details,
  -- Format price with Pesos sign
  CONCAT('₱ ', price::text) as formatted_price
FROM listings
WHERE is_available = true
ORDER BY is_featured DESC, created_at DESC;
