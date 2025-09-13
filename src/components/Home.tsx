import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { ListingService } from '../services/listingService';
import type { ListingView } from '../types/listing';

const Home: React.FC = () => {
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
        // Wait for all animations to complete before loading cards
        setTimeout(() => {
          setIsLoading(false);
        }, 2500);
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

  // Skeleton component
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse border border-gray-100">
      <div className="h-56 bg-gray-300"></div>
      <div className="p-6">
        <div className="flex justify-between items-baseline mb-4">
          <div className="h-7 bg-gray-300 rounded w-32"></div>
          <div className="h-5 bg-gray-300 rounded w-16"></div>
        </div>
        <div className="h-6 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
        <div className="flex justify-between mb-4">
          <div className="h-4 bg-gray-300 rounded w-16"></div>
          <div className="h-4 bg-gray-300 rounded w-16"></div>
          <div className="h-4 bg-gray-300 rounded w-20"></div>
        </div>
        <div className="flex gap-1 mb-4">
          <div className="h-6 bg-gray-300 rounded-full w-16"></div>
          <div className="h-6 bg-gray-300 rounded-full w-20"></div>
          <div className="h-6 bg-gray-300 rounded-full w-14"></div>
        </div>
        <div className="h-4 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      </div>
    </div>
  );

  return (
    <div className="App">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative min-h-screen">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-no-repeat"
          style={{
            backgroundImage: "url('./heroimage.png')",
            backgroundPosition: 'center 30%',
            backgroundSize: 'cover',
            height: '60vh'
          }}
        />
        {/* Dark overlay */}
        <div 
          className="absolute inset-0 bg-black opacity-20"
          style={{ height: '60vh' }}
        />
        
        {/* Text Overlays */}
        <div className="relative z-10 flex flex-col items-center justify-center h-[60vh] text-center px-4 sm:px-6 lg:px-8">
          {/* Main Heading */}
          <h1 
            className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-4 sm:mb-6 leading-tight mt-16 sm:mt-20 md:mt-24 animate-fade-in-up"
            style={{fontFamily: 'Poppins', fontWeight: 700, animationDelay: '0.2s'}}
          >
            Feel at home anytime,<br className="hidden sm:block" /> anywhere!
          </h1>
          
          {/* Sub-heading */}
          <p 
            className="text-white text-base sm:text-lg md:text-xl mb-8 sm:mb-10 md:mb-12 max-w-2xl leading-relaxed animate-fade-in-up px-2"
            style={{fontFamily: 'Poppins', fontWeight: 600, animationDelay: '0.4s'}}
          >
            Find your perfect home away from home
            while you're on your dream vacation
          </p>
        </div>
        
        {/* Search Bar - positioned between hero and white section */}
        <div className="relative z-20 flex justify-center items-center -mt-20 sm:-mt-10 md:-mt-12 px-4 sm:px-6 lg:px-8 animate-slide-up" style={{animationDelay: '0.8s'}}>
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-md p-3 w-full max-w-3xl relative overflow-visible">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
              {/* Search Location */}
              <div className="flex-1 relative dropdown-container">
                <label className="block text-gray-700 font-poppins font-medium text-base px-0 sm:px-4">
                  Search Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Any"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onFocus={() => setIsLocationDropdownOpen(true)}
                    className="w-full px-3 sm:px-4 py-2 border-none focus:outline-none font-poppins font-medium bg-transparent text-gray-700"
                  />
                  <button
                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                    className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {/* Location Dropdown */}
                {isLocationDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto w-full">
                    {availableLocations.length > 0 ? (
                      availableLocations.map((location, index) => (
                        <button
                          key={index}
                          onClick={() => handleLocationSelect(location)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors"
                          style={{fontFamily: 'Poppins', fontWeight: 400}}
                        >
                          {location}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-gray-500" style={{fontFamily: 'Poppins'}}>
                        No locations available
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Separator */}
              <div className="flex items-end pb-3 hidden sm:block">
                <span className="text-gray-400 font-poppins text-4xl font-thin" style={{fontWeight: 100}}>|</span>
              </div>
              
              {/* Price Range */}
              <div className="flex-1 relative dropdown-container">
                <label className="block text-gray-700 font-poppins font-medium text-base px-0 sm:px-4">
                  Price Range
                </label>
                <div className="relative">
                  <button
                    onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
                    className="w-full px-3 sm:px-4 py-2 border-none focus:outline-none font-poppins font-medium appearance-none bg-transparent text-gray-700 text-left flex items-center justify-between"
                  >
                    <span className="text-sm sm:text-base">₱{priceRange.min.toLocaleString()} - ₱{priceRange.max.toLocaleString()}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {/* Price Range Dropdown */}
                {isPriceDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 sm:right-0 sm:left-auto mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 w-full sm:w-80 max-w-full sm:max-w-none">
                    <div className="space-y-4">
                      <h3 className="font-semibold" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                        Price Range
                      </h3>
                      
                      <div className="space-y-2">
                        <label className="block text-sm" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                          Min Price: ₱{priceRange.min.toLocaleString()}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="100"
                          value={priceRange.min}
                          onChange={(e) => handlePriceRangeChange('min', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                          Max Price: ₱{priceRange.max.toLocaleString()}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10000"
                          step="100"
                          value={priceRange.max}
                          onChange={(e) => handlePriceRangeChange('max', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setPriceRange({ min: 0, max: 10000 });
                            setIsPriceDropdownOpen(false);
                          }}
                          className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
                          style={{fontFamily: 'Poppins', fontWeight: 400}}
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => setIsPriceDropdownOpen(false)}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          style={{fontFamily: 'Poppins', fontWeight: 400}}
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Separator */}
              <div className="flex items-end pb-3 hidden sm:block">
                <span className="text-gray-400 font-poppins text-4xl font-thin" style={{fontWeight: 100}}>|</span>
              </div>
              
              {/* Search Button */}
              <div className="flex-shrink-0 w-full sm:w-auto self-stretch sm:self-auto flex justify-center pr-3 pl-3">
                <button 
                  onClick={handleSearch}
                  className="text-white px-6 sm:px-8 py-3 rounded-lg font-poppins transition-all duration-300 flex items-center justify-center gap-2 hover:opacity-90 hover:scale-105 active:scale-95 w-full sm:w-auto h-full sm:h-auto" 
                  style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 400}}
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* White background for bottom section */}
        <div className="bg-white h-0"></div>
      </div>

      {/* All Listings Section */}
      <div className="bg-white py-1 -mt-48 sm:-mt-52 md:-mt-56 animate-fade-in" style={{animationDelay: '1.2s'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-6 md:pt-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
            <h2 
              className="text-2xl sm:text-3xl font-bold text-black animate-fade-in-left"
              style={{fontFamily: 'Poppins', fontWeight: 700, animationDelay: '1.4s'}}
            >
              All listings
            </h2>
            
            {/* Recently added dropdown */}
            <div className="relative animate-fade-in-right self-start sm:self-auto" style={{animationDelay: '1.6s'}}>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  handleSearch();
                }}
                className="appearance-none bg-white border-none text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-poppins text-sm cursor-pointer focus:outline-none transition-all duration-300 hover:scale-105"
                style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}
              >
                <option value="Recently added">Recently added</option>
                <option value="Price: Low to High">Price: Low to High</option>
                <option value="Price: High to Low">Price: High to Low</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {isLoading ? (
              // Show skeleton loading
              Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))
            ) : error ? (
              // Show error message
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <div className="text-red-500 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-lg font-semibold mb-2" style={{fontFamily: 'Poppins'}}>
                    Error Loading Listings
                  </p>
                  <p className="text-gray-600" style={{fontFamily: 'Poppins'}}>
                    {error}
                  </p>
                </div>
              </div>
            ) : apartments.length === 0 ? (
              // Show no listings message
              <div className="col-span-full flex flex-col items-center justify-center py-12">
                <div className="text-gray-500 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p className="text-xl font-semibold mb-2" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                    No Available Listings
                  </p>
                  <p className="text-gray-600" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                    There are currently no properties available. Please check back later.
                  </p>
                </div>
              </div>
            ) : (
              // Show actual listings
              apartments.map((apartment) => (
                <div key={apartment.id} className="group bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 sm:hover:-translate-y-3 border border-gray-100 cursor-pointer">
                  {/* Image Container with Overlay */}
                  <div className="relative h-48 sm:h-56 overflow-hidden">
                    <div 
                      className="w-full h-full bg-cover bg-center" 
                      style={{backgroundImage: `url('${apartment.main_image_url || './avida.jpg'}')`}}
                    ></div>
                    
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    
                    {/* Property Type Badge */}
                    <div className="absolute top-4 right-4">
                      <span 
                        className="inline-flex px-3 py-1 rounded-full text-xs font-medium text-white bg-black/50 backdrop-blur-sm"
                        style={{fontFamily: 'Poppins'}}
                      >
                        {apartment.property_type?.charAt(0).toUpperCase() + apartment.property_type?.slice(1) || 'Property'}
                      </span>
                    </div>
                    
                    {/* Heart Icon */}
                    <div className="absolute bottom-4 right-4">
                      <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors">
                        <svg className="w-5 h-5 text-gray-600 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4 sm:p-6">
                    {/* Price Section */}
                    <div className="mb-4">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-xl sm:text-2xl font-bold text-black" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                            {apartment.currency} {apartment.price?.toLocaleString()}
                          </span>
                          <span className="text-gray-500 text-xs sm:text-sm ml-1 sm:ml-2" style={{fontFamily: 'Poppins', fontWeight: 500}}>
                            / {apartment.price_unit}
                          </span>
                        </div>
                        {apartment.is_featured && (
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium text-[#0B5858] bg-[#0B5858]/10" style={{fontFamily: 'Poppins'}}>
                            Featured
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-semibold text-black mb-2 line-clamp-2" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                      {apartment.title}
                    </h3>
                    
                    {/* Location */}
                    <div className="flex items-center mb-4">
                      <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm text-gray-600 truncate" style={{fontFamily: 'Poppins', fontWeight: 500}}>
                        {apartment.location}
                      </p>
                    </div>
                    
                    {/* Property Features */}
                    <div className="flex items-center justify-between mb-3 sm:mb-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                        </svg>
                        <span style={{fontFamily: 'Poppins', fontWeight: 500}}>
                          {apartment.bedrooms || 0} bed
                        </span>
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                        <span style={{fontFamily: 'Poppins', fontWeight: 500}}>
                          {apartment.bathrooms || 0} bath
                        </span>
                      </div>
                      {apartment.square_feet && (
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          <span style={{fontFamily: 'Poppins', fontWeight: 500}}>
                            {apartment.square_feet} sqft
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Amenities Preview */}
                    {apartment.amenities && apartment.amenities.length > 0 && (
                      <div className="mb-3 sm:mb-4">
                        <div className="flex flex-wrap gap-1">
                          {apartment.amenities.slice(0, 3).map((amenity, index) => (
                            <span 
                              key={index}
                              className="inline-flex px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-100"
                              style={{fontFamily: 'Poppins'}}
                            >
                              {amenity}
                            </span>
                          ))}
                          {apartment.amenities.length > 3 && (
                            <span 
                              className="inline-flex px-2 py-1 rounded-full text-xs font-medium text-gray-500 bg-gray-50"
                              style={{fontFamily: 'Poppins'}}
                            >
                              +{apartment.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Description */}
                    {apartment.description && (
                      <p className="text-gray-600 text-sm line-clamp-2" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                        {apartment.description}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* See More Section */}
          <div className="flex items-center justify-center mt-8 sm:mt-12 mb-12 sm:mb-16">
            <div className="flex items-center w-full">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-3 sm:px-4 text-gray-600 text-xs sm:text-sm font-poppins" style={{fontFamily: 'Poppins'}}>
                See more
              </span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default Home;
