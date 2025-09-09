import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import NewListingForm from './NewListingForm';
import { ListingService } from '../services/listingService';
import { useAuth } from '../contexts/AuthContext';
import type { Listing } from '../types/listing';

const ManageUnits: React.FC = () => {
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

  // Helper function to format price
  const formatPrice = (price: number, currency: string) => {
    return `${currency} ${price.toLocaleString()}`;
  };

  // Helper function to get capacity text
  const getCapacityText = (bedrooms: number) => {
    const totalGuests = bedrooms * 2; // Assuming 2 guests per bedroom
    return `${totalGuests} guest${totalGuests !== 1 ? 's' : ''}`;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA'); // YYYY-MM-DD format
  };

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
        <div className="pt-24 px-12 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
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
            </div>
            <p className="text-gray-600 mb-8" style={{fontFamily: 'Poppins'}}>
              Fill out the form below to add a new property listing to your portfolio.
            </p>

            {/* New Listing Form Component */}
            <NewListingForm 
              onSuccess={handleListingCreated} 
              onCancel={() => setShowNewListing(false)} 
            />
          </div>
        </div>
        <Footer />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-24 px-12 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <h1 
              className="text-3xl font-bold text-black"
              style={{fontFamily: 'Poppins', fontWeight: 700}}
            >
              Manage Units
            </h1>
            
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
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by unit name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{fontFamily: 'Poppins'}}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{fontFamily: 'Poppins'}}
                >
                  <option value="All Status">All Status</option>
                  <option value="Available">Available</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
                <svg 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Type Filter */}
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{fontFamily: 'Poppins'}}
                >
                  <option value="All Types">All Types</option>
                  {Array.from(new Set(units.map(unit => unit.property_type))).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <svg 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
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
                <thead>
                  <tr style={{backgroundColor: 'rgba(11, 88, 88, 0.7)'}}>
                    <th className="px-6 py-3 text-left text-white font-medium w-1/4" style={{fontFamily: 'Poppins'}}>
                      Unit ID/Name
                    </th>
                    <th className="px-6 py-3 text-left text-white font-medium w-20" style={{fontFamily: 'Poppins'}}>
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-white font-medium w-24" style={{fontFamily: 'Poppins'}}>
                      Capacity
                    </th>
                    <th className="px-6 py-3 text-left text-white font-medium w-28" style={{fontFamily: 'Poppins'}}>
                      Price/Night
                    </th>
                    <th className="px-6 py-3 text-left text-white font-medium w-24" style={{fontFamily: 'Poppins'}}>
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-white font-medium w-16" style={{fontFamily: 'Poppins'}}>
                      Slots
                    </th>
                    <th className="px-6 py-3 text-left text-white font-medium w-20" style={{fontFamily: 'Poppins'}}>
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-white font-medium w-28" style={{fontFamily: 'Poppins'}}>
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-white font-medium w-32" style={{fontFamily: 'Poppins'}}>
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
                    filteredUnits.map((unit, index) => (
                      <tr 
                        key={unit.id} 
                        className={`border-b border-gray-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        {/* Unit ID/Name */}
                        <td className="px-6 py-3 align-top">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={unit.main_image_url || '/avida.jpg'} 
                              alt={unit.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                            <div>
                              <div className="font-medium text-gray-900" style={{fontFamily: 'Poppins'}}>
                                {unit.title}
                              </div>
                              <div className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>
                                {unit.id.substring(0, 8)}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Type */}
                        <td className="px-6 py-3 align-top">
                          <span className="text-gray-900" style={{fontFamily: 'Poppins'}}>
                            {unit.property_type}
                          </span>
                        </td>

                        {/* Capacity */}
                        <td className="px-6 py-3 align-top">
                          <span className="text-gray-900" style={{fontFamily: 'Poppins'}}>
                            {getCapacityText(unit.bedrooms)}
                          </span>
                        </td>

                        {/* Price/Night */}
                        <td className="px-6 py-3 align-top">
                          <span className="text-gray-900" style={{fontFamily: 'Poppins'}}>
                            {formatPrice(unit.price, unit.currency)}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-3 align-top">
                          <span 
                            className="inline-flex px-3 py-1 rounded-full text-xs font-medium text-white"
                            style={{
                              backgroundColor: unit.is_available ? '#0B5858' : '#F10E3B',
                              fontFamily: 'Poppins'
                            }}
                          >
                            {unit.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </td>

                        {/* Slots */}
                        <td className="px-6 py-3 align-top">
                          <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </td>

                        {/* Bookings - placeholder for now */}
                        <td className="px-6 py-3 align-top">
                          <span className="text-gray-900" style={{fontFamily: 'Poppins'}}>
                            0
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td className="px-6 py-3 align-top">
                          <span className="text-gray-900" style={{fontFamily: 'Poppins'}}>
                            {formatDate(unit.updated_at)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-3 align-top">
                          <div className="flex items-center space-x-2">
                            {/* Toggle Switch */}
                            <button 
                              onClick={() => toggleAvailability(unit.id, unit.is_available)}
                              disabled={togglingUnits.has(unit.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                                unit.is_available 
                                  ? 'bg-green-400 focus:ring-green-500 hover:bg-green-500' 
                                  : 'bg-gray-200 focus:ring-gray-500 hover:bg-gray-300'
                              }`}
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
                            <button className="text-gray-400 hover:text-red-600 transition-colors">
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
        </div>
      </div>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default ManageUnits;