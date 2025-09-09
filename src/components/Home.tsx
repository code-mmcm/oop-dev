import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Lenis from '@studio-freight/lenis';
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
    // Initialize Lenis smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    // Animation frame loop for Lenis
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

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

    return () => {
      lenis.destroy();
    };
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
    <div className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-300"></div>
      <div className="p-4">
        <div className="h-6 bg-gray-300 rounded mb-2"></div>
        <div className="h-5 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 rounded mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
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
            backgroundImage: "url('./avida.jpg')",
            backgroundPosition: 'center 30%',
            backgroundSize: 'cover',
            height: '70vh'
          }}
        />
        {/* Dark overlay */}
        <div 
          className="absolute inset-0 bg-black opacity-20"
          style={{ height: '70vh' }}
        />
        
        {/* Text Overlays */}
        <div className="relative z-10 flex flex-col items-center justify-center h-[70vh] text-center px-4">
          {/* Main Heading */}
          <h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight mt-24 animate-fade-in-up"
            style={{fontFamily: 'Poppins', fontWeight: 700, animationDelay: '0.2s'}}
          >
            Feel at home anytime,<br /> anywhere!
          </h1>
          
          {/* Sub-heading */}
          <p 
            className="text-white text-lg md:text-xl mb-12 max-w-2xl leading-relaxed animate-fade-in-up"
            style={{fontFamily: 'Poppins', fontWeight: 700, animationDelay: '0.4s'}}
          >
            Find your perfect home away from home
            while you're on your dream vacation
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative z-20 flex justify-center -mt-16 px-4 animate-slide-up" style={{animationDelay: '0.8s'}}>
          <div className="bg-white rounded-2xl shadow-md p-3 w-full max-w-3xl">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              {/* Search Location */}
              <div className="flex-1 relative dropdown-container">
                <label className="block text-gray-700 font-poppins font-bold text-sm mb-1 px-4">
                  Search Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Any"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    onFocus={() => setIsLocationDropdownOpen(true)}
                    className="w-full px-4 py-2 border-none focus:outline-none font-poppins font-bold bg-transparent text-gray-700"
                  />
                  <button
                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {/* Location Dropdown */}
                {isLocationDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
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
              <div className="flex items-end pb-3">
                <span className="text-gray-400 font-poppins text-4xl">|</span>
              </div>
              
              {/* Price Range */}
              <div className="flex-1 relative dropdown-container">
                <label className="block text-gray-700 font-poppins font-bold text-sm mb-1">
                  Price Range
                </label>
                <div className="relative">
                  <button
                    onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
                    className="w-full px-0 py-2 border-none focus:outline-none font-poppins font-bold appearance-none bg-transparent text-gray-700 text-left flex items-center justify-between"
                  >
                    <span>₱{priceRange.min.toLocaleString()} - ₱{priceRange.max.toLocaleString()}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {/* Price Range Dropdown */}
                {isPriceDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 w-80">
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
              <div className="flex items-end pb-3">
                <span className="text-gray-400 font-poppins text-4xl">|</span>
              </div>
              
              {/* Search Button */}
              <div className="flex-shrink-0">
                <button 
                  onClick={handleSearch}
                  className="text-white px-8 py-3 rounded-lg font-poppins transition-all duration-300 flex items-center gap-2 hover:opacity-90 hover:scale-105 active:scale-95" 
                  style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 400}}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <div className="bg-white py-1 px-4 -mt-40 animate-fade-in" style={{animationDelay: '1.2s'}}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 
              className="text-3xl font-bold text-black animate-fade-in-left"
              style={{fontFamily: 'Poppins', fontWeight: 700, animationDelay: '1.4s'}}
            >
              All listings
            </h2>
            
            {/* Recently added dropdown */}
            <div className="relative animate-fade-in-right" style={{animationDelay: '1.6s'}}>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  handleSearch();
                }}
                className="appearance-none bg-white border-none text-white px-6 py-3 rounded-lg font-poppins text-sm cursor-pointer focus:outline-none transition-all duration-300 hover:scale-105"
                style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}
              >
                <option value="Recently added">Recently added</option>
                <option value="Price: Low to High">Price: Low to High</option>
                <option value="Price: High to Low">Price: High to Low</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div key={apartment.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  {/* Image */}
                  <div className="h-48 bg-cover bg-center" style={{backgroundImage: `url('${apartment.main_image_url || './avida.jpg'}')`}}></div>
                  
                  {/* Content */}
                  <div className="p-4">
                    {/* Price */}
                    <div className="mb-2">
                      <span className="text-black text-xl" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                        {apartment.formatted_price || `${apartment.currency} ${apartment.price}`}
                      </span>
                      <span className="text-gray-500 text-base ml-1" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                        {apartment.price_unit}
                      </span>
                    </div>
                    
                    {/* Title */}
                    <h3 className="text-black text-lg mb-1" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                      {apartment.title}
                    </h3>
                    
                    {/* Location */}
                    <p className="text-sm mb-2" style={{fontFamily: 'Poppins', fontWeight: 600, color: '#696969'}}>
                      {apartment.location}
                    </p>
                    
                    {/* Horizontal line */}
                    <div className="h-px bg-gray-200 mb-2"></div>
                    
                    {/* Details */}
                    <p className="text-gray-500 text-sm text-center" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                      {apartment.details}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* See More Section */}
          <div className="flex items-center justify-center mt-12 mb-16">
            <div className="flex items-center w-full">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-4 text-gray-600 text-sm font-poppins" style={{fontFamily: 'Poppins'}}>
                See more
              </span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <footer className="bg-[#0B5858] text-white py-12 px-4 animate-fade-in-up">
        <div className="max-w-7xl mx-auto">
          {/* Top section of footer */}
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-8">
            {/* Logo */}
            <div className="flex items-center mb-8 md:mb-0 animate-fade-in-left" style={{animationDelay: '0.2s'}}>
              <img 
                src="./footerlogo.png" 
                alt="Kelsey's Homestay Logo" 
                className="w-60 h-auto hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Contact Section */}
            <div className="text-center md:text-right animate-fade-in-right" style={{animationDelay: '0.3s'}}>
              <p className="text-2xl font-poppins font-semibold mb-4" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                For more inquiries please<br />
                contact us via email
              </p>
              <div className="flex justify-center md:justify-end shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <input
                  type="email"
                  placeholder="Your email"
                  className="p-4 rounded-l-2xl focus:outline-none text-black w-80 text-base bg-white transition-all duration-300 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50"
                  style={{fontFamily: 'Poppins', fontWeight: 400}}
                />
                <button className="bg-yellow-400 text-black p-4 rounded-r-2xl font-poppins font-medium text-base transition-all duration-300 hover:bg-yellow-500 hover:scale-105 active:scale-95" style={{fontFamily: 'Poppins', fontWeight: 500}}>
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Divider Line */}
          <div className="border-t border-white my-8"></div>

          {/* Bottom section of footer */}
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            {/* Copyright */}
            <p className="font-poppins mb-4 md:mb-0" style={{fontFamily: 'Poppins', fontWeight: 400}}>
              ©2025 Kelsey's Homestay. All Rights Reserved.
            </p>

            {/* Social Media */}
            <div className="flex items-center">
              <p className="font-poppins mr-4" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                Follow us on
              </p>
              <div className="flex">
                {/* Facebook Icon */}
                <a href="https://www.facebook.com/kelseycaiden" target="_blank" rel="noopener noreferrer" className="text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="feather feather-facebook"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
