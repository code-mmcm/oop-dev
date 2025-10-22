import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { ListingService } from '../../services/listingService';
import type { ListingView } from '../../types/listing';
import { getLenis } from '../../App';
import Hero from './components/Hero';
import ResultsSection from './components/ResultsSection';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('Recently added');
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
        const listings = await ListingService.getRecentlyAddedListings();
        setApartments(listings);
        
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

  
  const filteredApartments = apartments.filter(apartment => {
    const matchesLocation = !searchLocation || 
      apartment.city?.toLowerCase().includes(searchLocation.toLowerCase());
    const matchesPrice = apartment.price >= priceRange.min && apartment.price <= priceRange.max;
    return matchesLocation && matchesPrice;
  });

  /**
   * Sort apartments based on selected criteria
   * JSDoc: Sorts listings by price, date, or other criteria
   */
  const sortedApartments = [...filteredApartments].sort((a, b) => {
    switch (sortBy) {
      case 'Price: Low to High':
        return (a.price || 0) - (b.price || 0);
      case 'Price: High to Low':
        return (b.price || 0) - (a.price || 0);
      case 'Recently added':
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      default:
        return 0;
    }
  });

  const handleListingClick = (listingId: string) => {
    navigate(`/unit/${listingId}`);
    // Use Lenis for smooth scroll to top
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(0, { duration: 1.2 });
    }
  };

  // Search and filter functions
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      setError(null);
      let filteredListings: ListingView[] = [];
      
      // Get listings based on sort preference
      if (sortBy === 'Recently added') {
        if (searchLocation) {
          filteredListings = await ListingService.searchListingsByCity(searchLocation);
        } else {
          filteredListings = await ListingService.getRecentlyAddedListings();
        }
      } else {
        if (searchLocation) {
          filteredListings = await ListingService.searchListingsByCity(searchLocation);
        } else {
          filteredListings = await ListingService.getListings();
        }
      }
      
      // Apply price range filter
      filteredListings = filteredListings.filter(listing => 
        listing.price >= priceRange.min && listing.price <= priceRange.max
      );
      
      // Apply additional sorting if not recently added
      if (sortBy !== 'Recently added') {
        switch (sortBy) {
          case 'Price: Low to High':
            filteredListings.sort((a, b) => a.price - b.price);
            break;
          case 'Price: High to Low':
            filteredListings.sort((a, b) => b.price - a.price);
            break;
        }
      }
      
      setApartments(filteredListings);
    } catch (err) {
      console.error('Error searching listings:', err);
      setError('Failed to search listings. Please try again later.');
    } finally {
      setIsLoading(false);
    }
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
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
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
        apartments={sortedApartments}
        isLoading={isLoading}
        sortBy={sortBy}
        setSortBy={setSortBy}
        onApartmentClick={handleListingClick}
        onSearch={handleSearch}
      />

      <Footer />
    </div>
  );
};

export default HomePage;