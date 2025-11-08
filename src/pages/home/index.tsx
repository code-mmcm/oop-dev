import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ListingService } from '../../services/listingService';
import type { ListingView } from '../../types/listing';
import { getLenis } from '../../lib/lenis';
import Hero from './components/Hero';
import ResultsSection from './components/ResultsSection';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [apartments, setApartments] = useState<ListingView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchLocation, setSearchLocation] = useState('');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);

  useEffect(() => {
    // Fetch listings from Supabase
    const fetchListings = async () => {
      try {
        setError(null);
        // Fetch featured listings and limit to 3
        const listings = await ListingService.getFeaturedListings();
        setApartments(listings.slice(0, 3));
        
        // Extract unique locations for dropdown
        const locations = [...new Set(listings.map(listing => listing.city).filter((city): city is string => Boolean(city)))];
        setAvailableLocations(locations);
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to load listings. Please try again later.');
        setApartments([]);
      } finally {
        // Wait for slower hero animations to complete before showing listings
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      }
    };

    fetchListings();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setIsLocationDropdownOpen(false);
        setIsPriceDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // const scrollToResults = () => {
  //   const resultsSection = document.getElementById('results');
  //   const lenis = getLenis();
  //   if (resultsSection && lenis) {
  //     lenis.scrollTo(resultsSection, { offset: -100 });
  //   }
  // };

  // Featured listings should always show the 3 featured listings without filtering
  // No filtering needed - just show the 3 featured listings as is

  const handleListingClick = (listingId: string) => {
    navigate(`/unit/${listingId}`);
    // Use Lenis for smooth scroll to top
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.2 });
    }
  };

  // Search and filter functions - Navigate to all listings page with search params
  const handleSearch = () => {
    // Navigate to all listings page with search parameters
    const params = new URLSearchParams();
    if (searchLocation) params.append('location', searchLocation);
    if (priceRange.min > 0) params.append('minPrice', priceRange.min.toString());
    if (priceRange.max < 10000) params.append('maxPrice', priceRange.max.toString());
    
    navigate(`/listings?${params.toString()}`);
  };  

  const handleLocationSelect = (location: string) => {
    setSearchLocation(location);
    setIsLocationDropdownOpen(false);
  };

  const handlePriceRangeChange = (field: 'min' | 'max', value: number) => {
    setPriceRange(prev => ({ ...prev, [field]: value }));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 cursor-pointer"
            >
              Try Again
            </button>
        </div>
        </div>
        <Footer />
    </div>
  );
  }

  return (
    <div className="App">
      <Navbar />
      
      {/* Hero Section */}
      <Hero
        searchLocation={searchLocation}
        setSearchLocation={setSearchLocation}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        onSearch={handleSearch}
        availableLocations={availableLocations}
        isLocationDropdownOpen={isLocationDropdownOpen}
        setIsLocationDropdownOpen={setIsLocationDropdownOpen}
        isPriceDropdownOpen={isPriceDropdownOpen}
        setIsPriceDropdownOpen={setIsPriceDropdownOpen}
        handleLocationSelect={handleLocationSelect}
        handlePriceRangeChange={handlePriceRangeChange}
      />

      {/* Results Section */}
      <ResultsSection
        apartments={apartments}
        isLoading={isLoading}
        onApartmentClick={handleListingClick}
      />

      <Footer />
    </div>
  );
};

export default HomePage;