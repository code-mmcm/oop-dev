import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import NewListingForm from '../../components/NewListingForm';
import { ListingService } from '../../services/listingService';
import { useAuth } from '../../contexts/AuthContext';
import type { Listing } from '../../types/listing';

const ManageUnits: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, roleLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [units, setUnits] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingUnits, setTogglingUnits] = useState<Set<string>>(new Set());
  const [showNewListing, setShowNewListing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [hoveredText, setHoveredText] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  // Fetch units from Supabase
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const listings = await ListingService.getAllListingsForManagement();
        setUnits(listings);
      } catch (err) {
        console.error('Error fetching units:', err);
        setError('Failed to load units. Please try again later.');
        setUnits([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnits();
  }, []);

  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         unit.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All Status' || 
                         (statusFilter === 'Available' && unit.is_available) ||
                         (statusFilter === 'Unavailable' && !unit.is_available);
    const matchesType = typeFilter === 'All Types' || unit.property_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUnits.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUnits = filteredUnits.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  // Helper function to format price
  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toLocaleString()}`;
  };

  // Helper function to get capacity text
  const getCapacityText = (bedrooms: number) => {
    const totalGuests = bedrooms * 2; // Assuming 2 guests per bedroom
    return `${totalGuests} guest${totalGuests !== 1 ? 's' : ''}`;
  };

  // Helper function to handle text hover for tooltips
  const handleTextHover = (event: React.MouseEvent, text: string) => {
    const element = event.currentTarget as HTMLElement;
    const isOverflowing = element.scrollWidth > element.clientWidth;
    
    if (isOverflowing) {
      setHoveredText(text);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleTextLeave = () => {
    setHoveredText(null);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showStatusDropdown && !target.closest('.status-dropdown')) {
        setShowStatusDropdown(false);
      }
      if (showTypeDropdown && !target.closest('.type-dropdown')) {
        setShowTypeDropdown(false);
      }
    };

    if (showStatusDropdown || showTypeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showStatusDropdown, showTypeDropdown]);

  // Toggle availability status
  const toggleAvailability = async (unitId: string, currentStatus: boolean) => {
    try {
      // Add to toggling set
      setTogglingUnits(prev => new Set(prev).add(unitId));
      
      const newStatus = !currentStatus;
      await ListingService.updateListing(unitId, { is_available: newStatus });
      
      // Update local state
      setUnits(prevUnits => 
        prevUnits.map(unit => 
          unit.id === unitId 
            ? { ...unit, is_available: newStatus, updated_at: new Date().toISOString() }
            : unit
        )
      );
    } catch (error) {
      console.error('Error updating availability:', error);
      // You could add a toast notification here
    } finally {
      // Remove from toggling set
      setTogglingUnits(prev => {
        const newSet = new Set(prev);
        newSet.delete(unitId);
        return newSet;
      });
    }
  };

  // Handle successful listing creation - refresh the list
  const handleListingCreated = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const listings = await ListingService.getAllListingsForManagement();
      setUnits(listings);
      setShowNewListing(false); // Hide the new listing form
    } catch (err) {
      console.error('Error refreshing listings:', err);
      setError('Failed to refresh listings. Please reload the page.');
    } finally {
      setIsLoading(false);
    }
  };


  // Show new listing form if requested
  if (showNewListing) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <div className="flex items-center mb-6">
              <button
                onClick={() => setShowNewListing(false)}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 
                className="text-3xl font-bold text-black"
                style={{fontFamily: 'Poppins', fontWeight: 700}}
              >
                Create New Listing
              </h1>
            </div>
            <p className="text-gray-600 mb-8" style={{fontFamily: 'Poppins'}}>
              Fill out the form below to add a new property listing to your portfolio.
            </p>
          </div>
          
          <NewListingForm 
            onSuccess={handleListingCreated} 
            onCancel={() => setShowNewListing(false)} 
          />
        </div>
        <Footer />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-24 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 
                className="text-3xl font-bold text-black"
                style={{fontFamily: 'Poppins', fontWeight: 700}}
              >
                Manage Units
              </h1>
            </div>
            
            <button 
              onClick={() => setShowNewListing(true)}
              className="px-6 py-3 rounded-lg text-white font-medium transition-all duration-300 hover:opacity-90"
              style={{backgroundColor: '#0B5858', fontFamily: 'Poppins'}}
            >
              + Add new Listing
            </button>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <div className="relative">
                  <svg 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ color: '#558B8B' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by unit name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-colors"
                    style={{
                      fontFamily: 'Poppins',
                      '--tw-ring-color': '#0B5858'
                    } as React.CSSProperties & { '--tw-ring-color': string }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0B5858';
                      e.target.style.boxShadow = '0 0 0 2px rgba(11, 88, 88, 0.2)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D1D5DB';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <div 
                  className="flex border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all duration-300 focus-within:ring-2"
                  style={{ 
                    '--tw-ring-color': '#0B5858',
                    borderColor: 'rgb(209 213 219)', // gray-300
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.boxShadow = '0 0 0 2px #0B5858';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgb(209 213 219)'; // gray-300
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div className="relative status-dropdown w-full">
                    <div 
                      className="flex items-center justify-between py-3 pl-4 pr-4 cursor-pointer rounded-lg"
                      onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    >
                      <span className={`${statusFilter !== 'All Status' ? 'text-black' : 'text-gray-500'}`} style={{fontFamily: 'Poppins', fontWeight: 400}}>
                        {statusFilter}
                      </span>
                      <img src="/dropdown_icon.svg" alt="dropdown" className="h-5 w-5 opacity-90 ml-2" />
                    </div>
                    
                    {/* Status Dropdown Options */}
                    {showStatusDropdown && (
                      <div className="absolute top-full left-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-full max-h-48 overflow-y-auto" style={{boxShadow: '0 10px 15px -3px rgba(11, 88, 88, 0.1), 0 4px 6px -2px rgba(11, 88, 88, 0.05)'}}>
                        {[
                          { value: 'All Status', label: 'All Status' },
                          { value: 'Available', label: 'Available' },
                          { value: 'Unavailable', label: 'Unavailable' }
                        ].map((statusOption) => (
                          <div
                            key={statusOption.value}
                            className="flex items-center py-3 px-4 hover:bg-gray-50 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusFilter(statusOption.value);
                              setShowStatusDropdown(false);
                            }}
                          >
                            <span className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                              {statusOption.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Type Filter */}
              <div className="relative">
                <div 
                  className="flex border border-gray-300 rounded-lg hover:border-gray-400 hover:shadow-md transition-all duration-300 focus-within:ring-2"
                  style={{ 
                    '--tw-ring-color': '#0B5858',
                    borderColor: 'rgb(209 213 219)', // gray-300
                  } as React.CSSProperties}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.boxShadow = '0 0 0 2px #0B5858';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgb(209 213 219)'; // gray-300
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div className="relative type-dropdown w-full">
                    <div 
                      className="flex items-center justify-between py-3 pl-4 pr-4 cursor-pointer rounded-lg"
                      onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                    >
                      <span className={`${typeFilter !== 'All Types' ? 'text-black' : 'text-gray-500'}`} style={{fontFamily: 'Poppins', fontWeight: 400}}>
                        {typeFilter}
                      </span>
                      <img src="/dropdown_icon.svg" alt="dropdown" className="h-5 w-5 opacity-90 ml-2" />
                    </div>
                    
                    {/* Type Dropdown Options */}
                    {showTypeDropdown && (
                      <div className="absolute top-full left-0 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-full max-h-48 overflow-y-auto" style={{boxShadow: '0 10px 15px -3px rgba(11, 88, 88, 0.1), 0 4px 6px -2px rgba(11, 88, 88, 0.05)'}}>
                        {[
                          { value: 'All Types', label: 'All Types' },
                          ...Array.from(new Set(units.map(unit => unit.property_type))).map(type => ({
                            value: type,
                            label: type
                          }))
                        ].map((typeOption) => (
                          <div
                            key={typeOption.value}
                            className="flex items-center py-3 px-4 hover:bg-gray-50 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTypeFilter(typeOption.value);
                              setShowTypeDropdown(false);
                            }}
                          >
                            <span className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                              {typeOption.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* View Toggle */}
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-3 transition-colors ${
                    viewMode === 'list' 
                      ? 'text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: viewMode === 'list' ? '#0B5858' : 'white',
                    fontFamily: 'Poppins'
                  }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-3 transition-colors ${
                    viewMode === 'grid' 
                      ? 'text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: viewMode === 'grid' ? '#0B5858' : 'white',
                    fontFamily: 'Poppins'
                  }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Units Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                <thead className="sticky top-0 z-10">
                  <tr style={{backgroundColor: '#0B5858'}}>
                    <th className="px-4 py-3 text-left text-white font-medium text-sm" style={{fontFamily: 'Poppins', width: '25%'}}>
                      Unit ID/Name
                    </th>
                    <th className="px-3 py-3 text-left text-white font-medium text-sm" style={{fontFamily: 'Poppins', width: '10%'}}>
                      Type
                    </th>
                    <th className="px-3 py-3 text-left text-white font-medium text-sm" style={{fontFamily: 'Poppins', width: '10%'}}>
                      Capacity
                    </th>
                    <th className="px-3 py-3 text-left text-white font-medium text-sm" style={{fontFamily: 'Poppins', width: '12%'}}>
                      Price/Night
                    </th>
                    <th className="px-3 py-3 text-left text-white font-medium text-sm" style={{fontFamily: 'Poppins', width: '10%'}}>
                      Status
                    </th>
                    <th className="px-3 py-3 text-left text-white font-medium text-sm" style={{fontFamily: 'Poppins', width: '10%'}}>
                      Slots
                    </th>
                    <th className="px-3 py-3 text-left text-white font-medium text-sm" style={{fontFamily: 'Poppins', width: '8%'}}>
                      Bookings
                    </th>
                    <th className="pl-6 pr-3 py-3 text-left text-white font-medium text-sm" style={{fontFamily: 'Poppins', width: '10%'}}>
                      Last Updated
                    </th>
                    <th className="pl-12 pr-4 py-3 text-left text-white font-medium text-sm" style={{fontFamily: 'Poppins', width: '15%'}}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {roleLoading ? (
                    // Role loading state - show loading message
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                          <p className="text-gray-600" style={{fontFamily: 'Poppins'}}>Loading...</p>
                        </div>
                      </td>
                    </tr>
                  ) : !isAdmin ? (
                    // Access denied state - maintain table structure
                    <tr>
                      <td className="px-6 py-8 text-center" colSpan={9}>
                        <div className="text-red-500">
                          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <p className="text-lg font-semibold mb-2" style={{fontFamily: 'Poppins'}}>
                            Access Denied
                          </p>
                          <p className="text-gray-600" style={{fontFamily: 'Poppins'}}>
                            You need admin privileges to access the Manage Units page.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : isLoading ? (
                    // Data loading state - show loading message
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                          <p className="text-gray-600" style={{fontFamily: 'Poppins'}}>Loading units...</p>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    // Error state - maintain table structure
                    <tr>
                      <td className="px-6 py-8 text-center" colSpan={9}>
                        <div className="text-red-500">
                          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <p className="text-lg font-semibold mb-2" style={{fontFamily: 'Poppins'}}>
                            Error Loading Units
                          </p>
                          <p className="text-gray-600" style={{fontFamily: 'Poppins'}}>
                            {error}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUnits.length === 0 ? (
                    // No units found - maintain table structure
                    <tr>
                      <td className="px-6 py-8 text-center" colSpan={9}>
                        <div className="text-gray-500">
                          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <p className="text-xl font-semibold mb-2" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                            No Units Found
                          </p>
                          <p className="text-gray-600" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                            {units.length === 0 ? 'No units available. Add your first listing!' : 'No units match your current filters.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // Actual units data
                    currentUnits.map((unit, index) => (
                      <tr 
                        key={unit.id} 
                        className={`border-b border-gray-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        {/* Unit ID/Name */}
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={unit.main_image_url || '/avida.jpg'} 
                              alt={unit.title}
                              className="w-10 h-10 rounded object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <div 
                                className="font-medium text-gray-900 truncate cursor-default" 
                                style={{fontFamily: 'Poppins'}}
                                onMouseEnter={(e) => handleTextHover(e, unit.title)}
                                onMouseLeave={handleTextLeave}
                              >
                                {unit.title}
                              </div>
                              <div className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>
                                {unit.id.substring(0, 8)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-3 py-3 align-top">
                          <span 
                            className="text-gray-900 text-sm cursor-default" 
                            style={{fontFamily: 'Poppins'}}
                            onMouseEnter={(e) => handleTextHover(e, unit.property_type)}
                            onMouseLeave={handleTextLeave}
                          >
                            {unit.property_type}
                          </span>
                        </td>

                        {/* Capacity */}
                        <td className="px-3 py-3 align-top">
                          <span className="text-gray-900 text-sm" style={{fontFamily: 'Poppins'}}>
                            {getCapacityText(unit.bedrooms)}
                          </span>
                        </td>

                        {/* Price/Night */}
                        <td className="px-3 py-3 align-top">
                          <span 
                            className="text-gray-900 text-sm font-medium cursor-default" 
                            style={{fontFamily: 'Poppins'}}
                            onMouseEnter={(e) => handleTextHover(e, formatPrice(unit.price, unit.currency))}
                            onMouseLeave={handleTextLeave}
                          >
                            {formatPrice(unit.price, unit.currency)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-3 align-top">
                          <span 
                            className="inline-flex px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{
                              backgroundColor: unit.is_available ? '#0B5858' : '#8A1C1C',
                              fontFamily: 'Poppins'
                            }}
                          >
                            {unit.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </td>

                        {/* Slots */}
                        <td className="px-3 py-3 align-top">
                          <button
                            onClick={() => {
                              setSelectedUnitId(unit.id);
                              setShowCalendarModal(true);
                            }}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors border hover:bg-gray-50"
                            style={{
                              borderColor: '#558B8B',
                              color: '#558B8B',
                              fontFamily: 'Poppins'
                            }}
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Manage
                          </button>
                        </td>

                        {/* Bookings - placeholder for now */}
                        <td className="px-3 py-3 align-top">
                          <span className="text-gray-900 text-sm" style={{fontFamily: 'Poppins'}}>
                            0
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td className="pl-6 pr-3 py-3 align-top">
                          <span className="text-gray-900 text-sm whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                            {new Date(unit.updated_at).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Toggle Switch */}
                            <button 
                              onClick={() => toggleAvailability(unit.id, unit.is_available)}
                              disabled={togglingUnits.has(unit.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                unit.is_available 
                                  ? 'focus:ring-gray-500 hover:opacity-80' 
                                  : 'bg-gray-200 focus:ring-gray-500 hover:bg-gray-300'
                              }`}
                              style={{
                                backgroundColor: unit.is_available ? '#558B8B' : undefined
                              }}
                            >
                              {togglingUnits.has(unit.id) ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                </div>
                              ) : (
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  unit.is_available ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              )}
                            </button>
                            
                            {/* Edit Button */}
                            <button className="text-gray-400 hover:text-gray-600 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            
                            {/* Delete Button */}
                            <button className="text-gray-400 transition-colors" style={{'--hover-color': '#A23C3C'} as React.CSSProperties} onMouseEnter={(e) => e.currentTarget.style.color = '#A23C3C'} onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                  
                </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {filteredUnits.length > itemsPerPage && (
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700" style={{fontFamily: 'Poppins'}}>
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredUnits.length)} of {filteredUnits.length} results
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{fontFamily: 'Poppins'}}
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === page
                              ? 'text-white'
                              : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                          style={{
                            backgroundColor: currentPage === page ? '#0B5858' : undefined,
                            fontFamily: 'Poppins'
                          }}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{fontFamily: 'Poppins'}}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Footer Section */}
      <Footer />

      {/* Calendar Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900" style={{fontFamily: 'Poppins'}}>
                  Availability Calendar
                </h2>
                <p className="text-gray-600 mt-1" style={{fontFamily: 'Poppins'}}>
                  Manage slots for: {units.find(u => u.id === selectedUnitId)?.title}
                </p>
              </div>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Calendar Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2" style={{fontFamily: 'Poppins'}}>
                  Calendar Coming Soon
                </h3>
                <p className="text-gray-500" style={{fontFamily: 'Poppins'}}>
                  This feature will allow you to manage availability slots and bookings for this property.
                </p>
                <div className="mt-6 space-y-2">
                  <p className="text-sm text-gray-600" style={{fontFamily: 'Poppins'}}>
                    <strong>Planned Features:</strong>
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1" style={{fontFamily: 'Poppins'}}>
                    <li>• Monthly calendar view</li>
                    <li>• Block/unblock dates</li>
                    <li>• Set pricing per date</li>
                    <li>• View existing bookings</li>
                    <li>• Bulk availability updates</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  style={{fontFamily: 'Poppins'}}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Future: Implement calendar functionality
                    console.log('Calendar functionality will be implemented here');
                  }}
                  className="px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90"
                  style={{backgroundColor: '#0B5858', fontFamily: 'Poppins'}}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip */}
      {hoveredText && (
        <div
          className="fixed z-50 px-3 py-2 text-sm text-white rounded-lg shadow-lg pointer-events-none"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 40,
            backgroundColor: '#558B8B',
            fontFamily: 'Poppins',
            maxWidth: '300px',
            wordWrap: 'break-word'
          }}
        >
          {hoveredText}
          <div
            className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent"
            style={{ borderTopColor: '#558B8B' }}
          />
        </div>
      )}

    </div>
  );
};

export default ManageUnits;