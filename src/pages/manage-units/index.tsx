import React, { useState, useEffect, useRef } from 'react';
// Removed Lenis dependency for dropdowns; using shared Dropdown's portal/scroll handling
import Dropdown from '../../components/Dropdown';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import NewListingForm from '../../components/NewListingForm';
import { ListingService } from '../../services/listingService';
import { logger } from '../../lib/logger';
import { useAuth } from '../../contexts/AuthContext';
import type { Listing } from '../../types/listing';

const ManageUnits: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, roleLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [typeFilter] = useState('All Types');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [units, setUnits] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingUnits, setTogglingUnits] = useState<Set<string>>(new Set());
  const [togglingFeatured, setTogglingFeatured] = useState<Set<string>>(new Set());
  const [animatingStars, setAnimatingStars] = useState<Set<string>>(new Set());
  const [showNewListing, setShowNewListing] = useState(false);
  const [hoveredText, setHoveredText] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<Listing | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalActive, setDeleteModalActive] = useState(false);
  // Edit navigation state (reuse NewListingForm page UI)
  const [searchParams, setSearchParams] = useSearchParams();
  const editIdParam = searchParams.get('edit');
  const [editingUnit, setEditingUnit] = useState<Listing | null>(null);
  const [showAllFieldsToggle, setShowAllFieldsToggle] = useState(false);
  const [showAllFieldsCreateToggle, setShowAllFieldsCreateToggle] = useState(false);
  // Cross-page toast state (e.g., from Save & Exit in NewListingForm)
  const [pageToast, setPageToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const pageToastRef = useRef<HTMLDivElement | null>(null);

  // Helper to open/close delete modal with enter/exit animations
  const openDeleteModal = (unit: Listing) => {
    setUnitToDelete(unit);
    setShowDeleteModal(true);
    // Defer activation to trigger CSS transition on mount
    requestAnimationFrame(() => setDeleteModalActive(true));
  };

  const closeDeleteModal = () => {
    setDeleteModalActive(false);
    // Wait for transition to complete before unmounting
    setTimeout(() => {
      setShowDeleteModal(false);
      setUnitToDelete(null);
    }, 250);
  };

  // When navigating to ?edit=ID, prefetch listing if needed
  useEffect(() => {
    const load = async () => {
      if (!editIdParam) return;
      const fromState = units.find(u => u.id === editIdParam) || null;
      if (fromState) {
        setEditingUnit(fromState);
      } else {
        try {
          const fetched = await ListingService.getListingById(editIdParam);
          if (fetched) setEditingUnit(fetched);
        } catch (e) {
          logger.error('Failed to load listing for edit', e);
        }
      }
    };
    load();
  }, [editIdParam, units]);

  // Edit modal removed; edit now reuses create page via query param
  // Removed custom dropdown open states in favor of shared Dropdown component

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

  // Parent-owned toast API per spec
  const showToast = (message: string) => {
    setPageToast({ visible: true, message });
    // Double rAF to ensure DOM paint before adding the enter class
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = pageToastRef.current;
        if (!el) return;
        el.classList.remove('toast--exit');
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        el.offsetHeight;
        el.classList.add('toast--enter');
      });
    });
    // Slide out after ~2200ms
    window.setTimeout(() => {
      const el = pageToastRef.current;
      if (!el) return;
      el.classList.remove('toast--enter');
      el.classList.add('toast--exit');
    }, 2200);
  };

  // Also show any toast handed off via sessionStorage (e.g., after redirects)
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('global_toast');
      if (!pending) return;
      sessionStorage.removeItem('global_toast');
      showToast(pending);
    } catch {}
  }, []);

  // Handle in-place transitions (e.g., create flow toggles showNewListing without full remount)
  useEffect(() => {
    if (showNewListing) return; // Only check when returning to main view
    try {
      const pending = sessionStorage.getItem('global_toast');
      if (!pending) return;
      sessionStorage.removeItem('global_toast');
      showToast(pending);
    } catch {}
  }, [showNewListing]);

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

  /**
   * Formats a concise location string, prioritizing city and country
   * and falling back to the raw location field when necessary.
   */
  const formatLocation = (unit: Listing): string => {
    const parts: string[] = [];
    if (unit.city && unit.city.trim()) parts.push(unit.city.trim());
    if (unit.country && unit.country.trim()) parts.push(unit.country.trim());
    const cityCountry = parts.join(', ');
    return cityCountry || unit.location || '';
  };

  /**
   * Formats a property type string into Title Case, preserving comma-separated lists.
   * Example: "condo, penthouse" -> "Condo, Penthouse"
   */
  const formatPropertyType = (rawType: string): string => {
    // Split by comma to support multiple types, trim spaces, then title-case each part
    return rawType
      .split(',')
      .map(part => part.trim())
      .filter(part => part.length > 0)
      .map(part => {
        // Title case each word within the part (handles spaces and hyphens)
        return part
          .split(/([\s-]+)/) // keep separators to preserve spacing/hyphenation
          .map(token => {
            if (/^[\s-]+$/.test(token)) return token; // return separators as-is
            return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
          })
          .join('');
      })
      .join(', ');
  };

  // Helper function to handle text hover for tooltips
  const handleTextHover = (event: React.MouseEvent, text: string) => {
    const element = event.currentTarget as HTMLElement;
    // Consider both horizontal and vertical overflow to support multi-line clamps
    const isOverflowing =
      element.scrollWidth > element.clientWidth ||
      element.scrollHeight > element.clientHeight;

    if (isOverflowing) {
      setHoveredText(text);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
    }
  };

  const handleTextLeave = () => {
    setHoveredText(null);
  };

  // Removed body scroll locking; shared Dropdown manages scroll and portals safely

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

  /**
   * Toggles the featured status of a unit both in the backend and local UI state.
   * Uses a per-unit toggling set to prevent duplicate clicks while request is in-flight.
   */
  const toggleFeatured = async (unitId: string, currentFeatured: boolean) => {
    try {
      setTogglingFeatured(prev => new Set(prev).add(unitId));
      const newFeatured = !currentFeatured;
      logger.info('Toggling featured status for listing', { id: unitId, to: newFeatured });
      await ListingService.updateListing(unitId, { is_featured: newFeatured });
      setUnits(prevUnits => 
        prevUnits.map(unit => 
          unit.id === unitId 
            ? { ...unit, is_featured: newFeatured, updated_at: new Date().toISOString() }
            : unit
        )
      );
      logger.info('Successfully updated featured status for listing', { id: unitId, to: newFeatured });
    } catch (error) {
      logger.error('Error updating featured status', error);
      showToast('Failed to update featured status. Please try again.');
    } finally {
      setTogglingFeatured(prev => {
        const next = new Set(prev);
        next.delete(unitId);
        return next;
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
      // Ensure page is scrolled to top after returning from create flow
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 0);
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
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setShowNewListing(false)}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 
                className="text-3xl font-bold text-black"
                style={{fontFamily: 'Poppins', fontWeight: 700}}
              >
                New Listing
              </h1>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-sm text-gray-700" style={{fontFamily: 'Poppins'}}>Show All Fields</span>
                <button 
                  onClick={() => setShowAllFieldsCreateToggle(prev => !prev)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer ${
                    showAllFieldsCreateToggle 
                      ? 'focus:ring-gray-500 hover:opacity-80' 
                      : 'bg-gray-200 focus:ring-gray-500 hover:bg-gray-300'
                  }`}
                  style={{
                    backgroundColor: showAllFieldsCreateToggle ? '#558B8B' : undefined
                  }}
                  aria-label="Toggle show all fields"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showAllFieldsCreateToggle ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
            {/* Removed descriptive subtext per request to reduce clutter */}
          </div>
          
          <NewListingForm 
            onSuccess={handleListingCreated} 
            onCancel={() => setShowNewListing(false)} 
            showAllFields={showAllFieldsCreateToggle}
            showToast={showToast}
          />
        </div>
        <Footer />

        {/* Toast (visible in create view) */}
        {pageToast.visible && (
          <div className="fixed right-0 top-24 pr-6 z-[2000] pointer-events-none">
            <div
              ref={pageToastRef}
              className="toast-base px-4 py-3 rounded-lg pointer-events-auto"
              style={{
                backgroundColor: 'rgba(11, 88, 88, 0.65)',
                color: '#FFFFFF',
                fontFamily: 'Poppins',
                boxShadow: '0 18px 44px rgba(0, 0, 0, 0.35)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderLeft: '6px solid #0B5858'
              }}
              onTransitionEnd={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                if (el.classList.contains('toast--exit')) {
                  setPageToast({ visible: false, message: '' });
                  el.classList.remove('toast--exit');
                }
              }}
            >
              {pageToast.message}
            </div>
          </div>
        )}
        <style>{`
          .toast-base { transform: translateX(100%); opacity: 0; transition: transform .28s ease-out, opacity .28s ease-out; will-change: transform, opacity; }
          .toast--enter { transform: translateX(0); opacity: 1; }
          .toast--exit { transform: translateX(100%); opacity: 0; }
        `}</style>
      </div>
    );
  }

  // If URL has ?edit=, render the create page UI in edit mode
  if (editIdParam) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              {/* Ensure back arrow indicates clickability with pointer cursor */}
              <button
                onClick={() => {
                  searchParams.delete('edit');
                  setSearchParams(searchParams);
                  navigate('/manage-listings');
                }}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer hover:cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-3xl font-bold text-black" style={{fontFamily: 'Poppins', fontWeight: 700}}>Edit Listing</h1>
              <div className="ml-auto flex items-center gap-3">
                <span className="text-sm text-gray-700" style={{fontFamily: 'Poppins'}}>Show All Fields</span>
                <button 
                  onClick={() => setShowAllFieldsToggle(prev => !prev)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer ${
                    showAllFieldsToggle 
                      ? 'focus:ring-gray-500 hover:opacity-80' 
                      : 'bg-gray-200 focus:ring-gray-500 hover:bg-gray-300'
                  }`}
                  style={{
                    backgroundColor: showAllFieldsToggle ? '#558B8B' : undefined
                  }}
                  aria-label="Toggle show all fields"
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showAllFieldsToggle ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>
            {/* Removed subtitle per request */}
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <NewListingForm
              mode="edit"
              initialListing={editingUnit || units.find(u => u.id === editIdParam) || null}
              showAllFields={showAllFieldsToggle}
              showToast={showToast}
              onSuccess={() => {
                ListingService.getAllListingsForManagement().then(list => setUnits(list));
                searchParams.delete('edit');
                setSearchParams(searchParams);
                navigate('/manage-listings');
                // Ensure the page opens scrolled to the very top after Save & Exit
                setTimeout(() => {
                  window.scrollTo(0, 0);
                }, 0);
              }}
              onCancel={() => {
                searchParams.delete('edit');
                setSearchParams(searchParams);
                navigate('/manage-listings');
              }}
            />
          </div>
        </div>
        <Footer />

        {/* Toast (visible in edit view) */}
        {pageToast.visible && (
          <div className="fixed right-0 top-24 pr-6 z-[2000] pointer-events-none">
            <div
              ref={pageToastRef}
              className="toast-base px-4 py-3 rounded-lg pointer-events-auto"
              style={{
                backgroundColor: '#FFFFFF',
                color: '#0B5858',
                fontFamily: 'Poppins',
                boxShadow: '0 18px 44px rgba(0, 0, 0, 0.18)',
                borderLeft: '6px solid #0B5858'
              }}
              onTransitionEnd={(e) => {
                const el = e.currentTarget as HTMLDivElement;
                if (el.classList.contains('toast--exit')) {
                  setPageToast({ visible: false, message: '' });
                  el.classList.remove('toast--exit');
                }
              }}
            >
              {pageToast.message}
            </div>
          </div>
        )}
        <style>{`
          .toast-base { transform: translateX(100%); opacity: 0; transition: transform .28s ease-out, opacity .28s ease-out; will-change: transform, opacity; }
          .toast--enter { transform: translateX(0); opacity: 1; }
          .toast--exit { transform: translateX(100%); opacity: 0; }
        `}</style>
      </div>
    );
  }


  /**
   * PageSkeleton component for full page loading state
   * JSDoc: Displays skeleton for entire page including header, filters, and content
   */
  const PageSkeleton = () => (
    <>
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-6 animate-pulse">
        <div className="flex items-center">
          <div className="mr-4 w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div className="h-9 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>

      {/* Search and Filter Section Skeleton */}
      <div className="mb-6 animate-pulse">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col md:flex-row gap-4 items-center w-full">
            {/* Search Bar Skeleton */}
            <div className="relative w-full md:w-[60%] lg:w-[50%]">
              <div className="h-12 bg-gray-200 rounded-lg"></div>
            </div>

            {/* Status Filter Skeleton */}
            <div className="w-full md:w-auto min-w-[160px]">
              <div className="h-12 bg-gray-200 rounded-lg"></div>
            </div>

            {/* View Toggle Skeleton */}
            <div className="h-[52px] w-24 bg-gray-200 rounded-lg"></div>
          </div>

          {/* Add Button Skeleton */}
          <div className="w-full md:w-auto flex justify-end">
            <div className="h-12 w-40 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>

      {/* Content Skeleton - List View */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto min-w-[900px] md:min-w-0">
              <thead className="sticky top-0 z-10">
                <tr style={{backgroundColor: '#0B5858'}}>
                  <th className="px-3 py-2.5 text-left" style={{fontFamily: 'Poppins'}}>
                    <div className="h-4 w-4 bg-white/30 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-2.5 text-left" style={{fontFamily: 'Poppins'}}>
                    <div className="h-4 w-20 bg-white/30 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-2.5 text-left whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                    <div className="h-4 w-16 bg-white/30 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-2.5 text-left whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                    <div className="h-4 w-12 bg-white/30 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-2.5 text-left whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                    <div className="h-4 w-14 bg-white/30 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-2.5 text-left whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                    <div className="h-4 w-20 bg-white/30 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-2.5 text-left whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                    <div className="h-4 w-16 bg-white/30 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-2.5 text-left whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                    <div className="h-4 w-12 bg-white/30 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-2.5 text-left whitespace-nowrap hidden md:table-cell" style={{fontFamily: 'Poppins'}}>
                    <div className="h-4 w-16 bg-white/30 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-2.5 text-left whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                    <div className="h-4 w-24 bg-white/30 rounded animate-pulse"></div>
                  </th>
                  <th className="px-3 py-2.5 text-left whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                    <div className="h-4 w-16 bg-white/30 rounded animate-pulse"></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <TableSkeleton />
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // Content Skeleton - Grid View
        <GridSkeleton />
      )}

    </>
  );

  /**
   * GridSkeleton component for grid view loading state
   * JSDoc: Displays animated skeleton cards during grid view loading
   */
  const GridSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-pulse">
          <div className="h-40 bg-gray-200"></div>
          <div className="p-4">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-8"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  /**
   * TableSkeleton component for list view loading state
   * JSDoc: Displays animated skeleton rows during table loading
   */
  const TableSkeleton = () => (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="animate-pulse">
          {/* Featured Star */}
          <td className="px-3 py-2.5 align-middle text-center">
            <div className="h-6 w-6 bg-gray-200 rounded mx-auto"></div>
          </td>
          {/* Unit Title - with image and title */}
          <td className="px-3 py-2.5 align-middle">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </td>
          {/* Location */}
          <td className="px-3 py-2.5 align-middle">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </td>
          {/* Type */}
          <td className="px-3 py-2.5 align-middle">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </td>
          {/* Capacity */}
          <td className="px-3 py-2.5 align-middle">
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </td>
          {/* Price/Night */}
          <td className="px-3 py-2.5 align-middle">
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </td>
          {/* Status */}
          <td className="px-3 py-2.5 align-middle">
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
          </td>
          {/* Slots */}
          <td className="px-3 py-2.5 align-middle">
            <div className="h-7 bg-gray-200 rounded w-16"></div>
          </td>
          {/* Bookings - hidden on mobile */}
          <td className="px-3 py-2.5 align-middle hidden md:table-cell">
            <div className="h-4 bg-gray-200 rounded w-12"></div>
          </td>
          {/* Last Updated */}
          <td className="px-3 py-2.5 align-middle whitespace-nowrap">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </td>
          {/* Actions */}
          <td className="px-3 py-2.5 align-middle">
            <div className="flex items-center justify-end space-x-2">
              <div className="h-6 w-11 bg-gray-200 rounded-full"></div>
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
            </div>
          </td>
        </tr>
      ))}
    </>
  );

  /**
   * Handles edit action for a unit by navigating to edit mode
   * JSDoc: Sets the editing unit and updates URL params to open edit form
   */
  const handleEditUnit = (unit: Listing) => {
    setEditingUnit(unit);
    setSearchParams({ edit: unit.id });
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-24 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Show full page skeleton during loading */}
          {(roleLoading || isLoading) ? (
            <PageSkeleton />
          ) : (
            <>
              {/* Header Section */}
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center">
                  <button
                    onClick={() => navigate('/admin')}
                    className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200 cursor-pointer"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h1 
                    className="text-3xl font-bold text-black"
                    style={{fontFamily: 'Poppins', fontWeight: 700}}
                  >
                    Manage Listings
                  </h1>
                </div>
              </div>

              {/* Search and Filter Section */}
              {/*
                Removed white wrapper background, padding, and shadow from the container
                to ensure the search bar and filters are not covered by a white card.
                Kept margin-bottom for spacing from the table that follows.
              */}
              <div className="mb-6">
                {/*
                  Group search, filters, and view toggle on the left; position the
                  "Add new Listing" action on the right for clear primary action placement.
                */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col md:flex-row gap-4 items-center w-full">
                  {/* Search Bar */}
                  <div className="relative w-full md:w-[60%] lg:w-[50%]">
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
                      {/* Ensure search input has white fill for contrast on non-white page backgrounds */}
                      <input
                        type="text"
                        placeholder="Search by unit name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-white transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:shadow-md focus:border-transparent"
                        style={{
                          fontFamily: 'Poppins',
                          '--tw-ring-color': '#549F74'
                        } as React.CSSProperties & { '--tw-ring-color': string }}
                      />
                    </div>
                  </div>

                  {/* Status Filter using shared Dropdown */}
                  <div className="w-full md:w-auto min-w-[160px]">
                    <Dropdown
                      label={statusFilter}
                      options={[
                        { value: 'All Status', label: 'All Status' },
                        { value: 'Available', label: 'Available' },
                        { value: 'Unavailable', label: 'Unavailable' }
                      ]}
                      onSelect={(value) => setStatusFilter(value)}
                      placeholder="All Status"
                      className="min-w-[160px]"
                      maxVisibleItems={4}
                      alwaysScrollable
                    />
                  </div>


                  {/* View Toggle */}
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden h-[52px]">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-4 h-full flex items-center transition-colors cursor-pointer ${
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
                      className={`px-4 h-full flex items-center transition-colors cursor-pointer ${
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

                  {/* Primary action placed at right side of the row */}
                  <div className="w-full md:w-auto flex justify-end">
                    <button 
                      onClick={() => setShowNewListing(true)}
                      className="px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
                      style={{backgroundColor: '#0B5858', fontFamily: 'Poppins'}}
                    >
                      + Add new Listing
                    </button>
                  </div>
                </div>
              </div>

              {/* Units Display (Table or Grid) */}
          {viewMode === 'list' ? (
            <>
              {/* Table View */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full table-auto min-w-[900px] md:min-w-0">
                <thead className="sticky top-0 z-10">
                  <tr style={{backgroundColor: '#0B5858'}}>
                    {/* Increase header font weight for improved scannability and contrast on dark background */}
                    <th className="px-3 py-2.5 text-left text-white font-semibold text-sm" style={{fontFamily: 'Poppins'}}>
                      {/* Intentionally left blank for featured star column */}
                    </th>
                    <th className="px-3 py-2.5 text-left text-white font-semibold text-sm" style={{fontFamily: 'Poppins'}}>
                      Unit Title
                    </th>
                    <th className="px-3 py-2.5 text-left text-white font-semibold text-sm whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                      Location
                    </th>
                    <th className="px-3 py-2.5 text-left text-white font-semibold text-sm whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                      Type
                    </th>
                    <th className="px-3 py-2.5 text-left text-white font-semibold text-sm whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                      Capacity
                    </th>
                    <th className="px-3 py-2.5 text-left text-white font-semibold text-sm whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                      Price/Night
                    </th>
                    <th className="px-3 py-2.5 text-left text-white font-semibold text-sm whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-left text-white font-semibold text-sm whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                      Slots
                    </th>
                    <th className="px-3 py-2.5 text-left text-white font-semibold text-sm whitespace-nowrap hidden md:table-cell" style={{fontFamily: 'Poppins'}}>
                      Bookings
                    </th>
                    <th className="px-3 py-2.5 text-left text-white font-semibold text-sm whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                      Last Updated
                    </th>
                    <th className="px-3 py-2.5 text-left text-white font-semibold text-sm whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!isAdmin ? (
                    // Access denied state - maintain table structure
                  <tr>
                    <td className="px-6 py-8 text-center" colSpan={11}>
                        <div className="text-red-500">
                          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <p className="text-lg font-semibold mb-2" style={{fontFamily: 'Poppins'}}>
                            Access Denied
                          </p>
                          <p className="text-gray-600" style={{fontFamily: 'Poppins'}}>
                            You need admin privileges to access the Manage Listings page.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : error ? (
                    // Error state - maintain table structure
                  <tr>
                    <td className="px-6 py-8 text-center" colSpan={11}>
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
                      <td className="px-6 py-8 text-center" colSpan={11}>
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
                        {/* Featured Star */}
                        <td className="px-3 py-2.5 align-middle text-center">
                          <button
                            onClick={() => { 
                              if (togglingFeatured.has(unit.id)) return; 
                              setAnimatingStars(prev => new Set(prev).add(unit.id));
                              setTimeout(() => setAnimatingStars(prev => {
                                const next = new Set(prev);
                                next.delete(unit.id);
                                return next;
                              }), 400);
                              toggleFeatured(unit.id, !!unit.is_featured); 
                            }}
                            className="cursor-pointer"
                            aria-label="Toggle featured"
                            title={unit.is_featured ? 'Unmark as featured' : 'Mark as featured'}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            style={{ transition: 'fill 0.2s ease, transform 0.2s ease' }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              width="24"
                              height="24"
                              className={animatingStars.has(unit.id) ? 'star-click-animation' : ''}
                              style={{ transition: 'fill 0.2s ease' }}
                              fill={unit.is_featured ? '#F6D658' : 'none'}
                              stroke={'#0B5858'}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              {/* Rounded star path per request */}
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499c.197-.49.843-.49 1.04 0l2.125 5.111a1 1 0 00.874.618l5.518.401c.53.038.744.706.341 1.04l-4.205 3.53a1 1 0 00-.33 1.06l1.273 5.36c.122.515-.44.93-.898.65l-4.77-2.85a1 1 0 00-1.034 0l-4.77 2.85c-.458.279-1.02-.135-.898-.65l1.273-5.36a1 1 0 00-.33-1.06l-4.205-3.53c-.402-.334-.189-1.002.341-1.04l5.518-.401a1 1 0 00.874-.618l2.125-5.111z" />
                            </svg>
                          </button>
                        </td>
                        {/* Unit Name */}
                        <td className="px-3 py-2.5 align-middle">
                          <div className="flex items-center space-x-3">
                            <img 
                              src={unit.main_image_url || '/avida.jpg'} 
                              alt={unit.title}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              {/* Match font size with Property Type column and clamp title to two lines */}
                              <div 
                                className="text-sm font-medium text-gray-900 cursor-default leading-snug" 
                                style={{
                                  fontFamily: 'Poppins',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  maxWidth: '360px'
                                } as React.CSSProperties & { WebkitLineClamp: number; WebkitBoxOrient: string }}
                                onMouseEnter={(e) => handleTextHover(e, unit.title)}
                                onMouseLeave={handleTextLeave}
                              >
                                {unit.title}
                              </div>
                              {/* Remove unit ID display beneath title per request to declutter UI */}
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="px-3 py-2.5 align-middle">
                          <span 
                            className="text-gray-900 text-sm cursor-default leading-snug" 
                            style={{
                              fontFamily: 'Poppins',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden'
                            } as React.CSSProperties & { WebkitLineClamp: number; WebkitBoxOrient: string }}
                            onMouseEnter={(e) => handleTextHover(e, formatLocation(unit))}
                            onMouseLeave={handleTextLeave}
                          >
                            {formatLocation(unit)}
                          </span>
                        </td>

                        {/* Type */}
                        <td className="px-3 py-2.5 align-middle">
                          <span 
                            className="text-gray-900 text-sm cursor-default" 
                            style={{fontFamily: 'Poppins'}}
                            onMouseEnter={(e) => handleTextHover(e, formatPropertyType(unit.property_type))}
                            onMouseLeave={handleTextLeave}
                          >
                            {formatPropertyType(unit.property_type)}
                          </span>
                        </td>

                        {/* Capacity */}
                        <td className="px-3 py-2.5 align-middle">
                          <span className="text-gray-900 text-sm" style={{fontFamily: 'Poppins'}}>
                            {getCapacityText(unit.bedrooms)}
                          </span>
                        </td>

                        {/* Price/Night */}
                        <td className="px-3 py-2.5 align-middle">
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
                        <td className="px-3 py-2.5 align-middle">
                          <span 
                            className="inline-flex px-2 py-1 rounded-full text-xs font-medium text-white"
                            style={{
                              // Align status colors with brand: teal for available, red for unavailable
                              backgroundColor: unit.is_available ? '#558B8B' : '#B84C4C',
                              fontFamily: 'Poppins'
                            }}
                          >
                            {unit.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </td>

                        {/* Slots */}
                        <td className="px-3 py-2.5 align-middle">
                          <button
                            onClick={() => navigate(`/unit-calendar/${unit.id}`)}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium transition-colors border cursor-pointer"
                            style={{
                              borderColor: '#558B8B',
                              color: '#558B8B',
                              fontFamily: 'Poppins'
                            }}
                            aria-label="View availability"
                            // On hover, fill entire button background with brand yellow while keeping text/icon color
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F6D658'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                          >
                            {/* Update label to 'View' and place calendar icon on the right for clarity */}
                            <span>View</span>
                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </button>
                        </td>

                        {/* Bookings - placeholder for now */}
                        <td className="px-3 py-2.5 align-middle hidden md:table-cell">
                          <span className="text-gray-900 text-sm" style={{fontFamily: 'Poppins'}}>
                            0
                          </span>
                        </td>

                        {/* Last Updated */}
                        <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                          <span className="text-gray-900 text-sm whitespace-nowrap" style={{fontFamily: 'Poppins'}}>
                            {new Date(unit.updated_at).toLocaleDateString()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2.5 align-middle">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Toggle Switch */}
                            <button 
                              onClick={() => toggleAvailability(unit.id, unit.is_available)}
                              disabled={togglingUnits.has(unit.id)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
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
                            
                            {/* Edit Button: navigate to reuse create page in edit mode */}
                            <button className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer" onClick={() => handleEditUnit(unit)}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            
                            {/* Delete Button */}
                            <button 
                              className="text-gray-400 transition-colors cursor-pointer" 
                              style={{'--hover-color': '#B84C4C'} as React.CSSProperties} 
                              onMouseEnter={(e) => e.currentTarget.style.color = '#B84C4C'} 
                              onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                              onClick={() => openDeleteModal(unit)}
                            >
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

            </>
          ) : (
            // Grid View
            <>
               {!isAdmin ? (
                // Access denied state
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-red-500">
                    <svg className="w-20 h-20 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="text-xl font-semibold mb-3" style={{fontFamily: 'Poppins'}}>
                      Access Denied
                    </h3>
                    <p className="text-gray-600 text-center" style={{fontFamily: 'Poppins'}}>
                      You need admin privileges to access the Manage Units page.
                    </p>
                  </div>
                </div>
              ) : error ? (
                // Error state
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-red-500">
                    <svg className="w-20 h-20 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="text-xl font-semibold mb-3" style={{fontFamily: 'Poppins'}}>
                      Error Loading Units
                    </h3>
                    <p className="text-gray-600 text-center" style={{fontFamily: 'Poppins'}}>
                      {error}
                    </p>
                  </div>
                </div>
              ) : filteredUnits.length === 0 ? (
                // No units found
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="text-gray-500">
                    <svg className="w-20 h-20 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="text-xl font-semibold mb-3" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                      No Units Found
                    </h3>
                    <p className="text-gray-600 text-center" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                      {units.length === 0 ? 'No units available. Add your first listing!' : 'No units match your current filters.'}
                    </p>
                  </div>
                </div>
              ) : (
                // Grid of unit cards
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredUnits.map((unit) => (
                    <div
                      key={unit.id}
                      className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                      onClick={(e) => {
                        // Only navigate if clicking on non-interactive elements
                        const target = e.target as HTMLElement;
                        const isClickableElement = target.closest('button, a, [role="button"]');
                        if (!isClickableElement) {
                          navigate(`/unit/${unit.id}`);
                        }
                      }}
                    >
                      {/* Unit Image */}
                      <div className="relative h-40 overflow-hidden bg-gray-200">
                        <img
                          src={unit.main_image_url || '/avida.jpg'}
                          alt={unit.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.includes('/avida.jpg')) {
                              target.src = '/heroimage.png';
                            } else if (target.src.includes('/heroimage.png')) {
                              target.src = '/avida.webp';
                            }
                          }}
                        />
                        {/* Featured Star */}
                        <div className="absolute top-4 left-4">
                          <button
                            onClick={() => { 
                              if (togglingFeatured.has(unit.id)) return; 
                              setAnimatingStars(prev => new Set(prev).add(unit.id));
                              setTimeout(() => setAnimatingStars(prev => {
                                const next = new Set(prev);
                                next.delete(unit.id);
                                return next;
                              }), 400);
                              toggleFeatured(unit.id, !!unit.is_featured); 
                            }}
                            className="cursor-pointer"
                            aria-label="Toggle featured"
                            title={unit.is_featured ? 'Unmark as featured' : 'Mark as featured'}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            style={{ transition: 'all 0.2s ease', filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' }}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              width="28"
                              height="28"
                              className={animatingStars.has(unit.id) ? 'star-click-animation' : ''}
                              style={{ transition: 'all 0.2s ease' }}
                              fill={unit.is_featured ? '#F1C40F' : 'rgba(0, 0, 0, 0.4)'}
                              stroke="rgba(255, 255, 255, 0.95)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11.48 3.499c.197-.49.843-.49 1.04 0l2.125 5.111a1 1 0 00.874.618l5.518.401c.53.038.744.706.341 1.04l-4.205 3.53a1 1 0 00-.33 1.06l1.273 5.36c.122.515-.44.93-.898.65l-4.77-2.85a1 1 0 00-1.034 0l-4.77 2.85c-.458.279-1.02-.135-.898-.65l1.273-5.36a1 1 0 00-.33-1.06l-4.205-3.53c-.402-.334-.189-1.002.341-1.04l5.518-.401a1 1 0 00.874-.618l2.125-5.111z" />
                            </svg>
                          </button>
                        </div>
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4">
                          <span
                            className="inline-flex px-3 py-1.5 rounded-full text-xs font-normal text-white"
                            style={{
                              backgroundColor: unit.is_available 
                                ? 'rgba(85, 139, 139, 0.9)' 
                                : 'rgba(184, 76, 76, 0.9)',
                              fontFamily: 'Poppins',
                              backdropFilter: 'blur(15px) saturate(180%)',
                              WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                            }}
                          >
                            {unit.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                      {/* Unit Details */}
                      <div className="p-4">
                        {/* Price */}
                        <div className="mb-1">
                          <div className="flex items-baseline">
                            <span
                              className="text-xl font-bold text-gray-900"
                              style={{fontFamily: 'Poppins'}}
                            >
                              {formatPrice(unit.price, unit.currency)}
                            </span>
                            <span className="text-xs text-gray-500 ml-1 font-normal" style={{fontFamily: 'Poppins'}}>
                              /night
                            </span>
                          </div>
                        </div>
                        {/* Title */}
                        <div className="mb-1.5">
                          <h3
                            className="font-semibold text-gray-900 text-sm line-clamp-2 leading-tight"
                            style={{fontFamily: 'Poppins'}}
                            title={unit.title}
                          >
                            {unit.title}
                          </h3>
                        </div>
                        {/* Location */}
                        <div className="mb-0.8">
                          <div className="flex items-center text-xs text-gray-500" style={{fontFamily: 'Poppins'}}>
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="line-clamp-1">{formatLocation(unit)}</span>
                          </div>
                        </div>
                        {/* Property Type */}
                        <div className="mb-1">
                          <span className="text-xs text-gray-500" style={{fontFamily: 'Poppins'}}>
                            {formatPropertyType(unit.property_type)}
                          </span>
                        </div>
                        {/* Features (Beds, Baths, Guests) */}
                        <div className="mb-2 pb-2 border-b border-gray-100">
                          <div className="flex items-center justify-start space-x-3">
                            <div className="flex items-center text-xs text-gray-600" style={{fontFamily: 'Poppins'}}>
                              <svg className="w-3.5 h-3.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v3M4 9h16v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9V7a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                              <span className="font-normal">{unit.bedrooms} {unit.bedrooms === 1 ? 'bed' : 'beds'}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600" style={{fontFamily: 'Poppins'}}>
                              <svg className="w-3.5 h-3.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                              </svg>
                              <span className="font-normal">{unit.bathrooms} {unit.bathrooms === 1 ? 'bath' : 'baths'}</span>
                            </div>
                            <div className="flex items-center text-xs text-gray-600" style={{fontFamily: 'Poppins'}}>
                              <svg className="w-3.5 h-3.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <span className="font-normal">{unit.bedrooms * 2} pax</span>
                            </div>
                          </div>
                        </div>
                        {/* Bookings and Last Updated Info */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500" style={{fontFamily: 'Poppins'}}>
                              Bookings: <span className="font-normal text-gray-700">0</span>
                            </span>
                            <span className="text-gray-500" style={{fontFamily: 'Poppins'}}>
                              Last Updated: <span className="font-normal text-gray-700">{new Date(unit.updated_at).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex items-center justify-between">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card navigation
                              navigate(`/unit-calendar/${unit.id}`);
                            }}
                            className="flex items-center px-3 py-2 rounded text-xs font-medium text-white transition-colors hover:opacity-90 cursor-pointer"
                            style={{
                              backgroundColor: '#0B5858',
                              fontFamily: 'Poppins'
                            }}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            View Slots
                          </button>
                          
                          <div className="flex items-center space-x-1">
                            {/* Availability Toggle */}
                            <button 
                              onClick={() => toggleAvailability(unit.id, unit.is_available)}
                              disabled={togglingUnits.has(unit.id)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                                unit.is_available 
                                  ? 'focus:ring-gray-500 hover:opacity-80' 
                                  : 'bg-gray-200 focus:ring-gray-500 hover:bg-gray-300'
                              }`}
                              style={{
                                backgroundColor: unit.is_available ? '#558B8B' : undefined
                              }}
                              title={unit.is_available ? 'Mark as Unavailable' : 'Mark as Available'}
                            >
                              {togglingUnits.has(unit.id) ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="animate-spin rounded-full h-2.5 w-2.5 border-b-2 border-white"></div>
                                </div>
                              ) : (
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                  unit.is_available ? 'translate-x-5' : 'translate-x-0.5'
                                }`} />
                              )}
                            </button>
                            
                            {/* Edit Icon */}
                            <div 
                              title="Edit Unit"
                              onClick={() => handleEditUnit(unit)}
                              className="cursor-pointer"
                            >
                              <svg 
                                className="w-5 h-5 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </div>
                            
                            {/* Delete Icon */}
                            <div 
                              title="Delete Unit"
                              onClick={() => openDeleteModal(unit)}
                              className="cursor-pointer"
                            >
                              <svg 
                                className="w-5 h-5 text-gray-400 transition-colors cursor-pointer" 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                                style={{'--hover-color': '#B84C4C'} as React.CSSProperties}
                                onMouseEnter={(e) => e.currentTarget.style.color = '#B84C4C'}
                                onMouseLeave={(e) => e.currentTarget.style.color = '#9CA3AF'}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </>
          )}
            </>
          )}
        </div>
      </div>

      {/* Footer Section */}
      <Footer />


      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 modal-backdrop"
          style={{
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            transition: 'background-color 0.25s ease'
          }}
          onClick={closeDeleteModal}
        >
          <div 
            className={`modal-content ${deleteModalActive ? 'show' : ''} max-w-md w-full mx-4`}
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.25)',
              transform: deleteModalActive ? 'scale(1)' : 'scale(0.95)',
              opacity: deleteModalActive ? 1 : 0,
              transition: 'all 0.25s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2" style={{fontFamily: 'Poppins'}}>Delete Listing</h3>
              <p className="text-gray-700 mb-5" style={{fontFamily: 'Poppins'}}>
                Are you sure you want to delete <span className="font-semibold">{unitToDelete?.title}</span>? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{fontFamily: 'Poppins'}}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!unitToDelete) return;
                    try {
                      setIsDeleting(true);
                      logger.info('Deleting listing', { id: unitToDelete.id });
                      await ListingService.deleteListing(unitToDelete.id);
                      setUnits(prev => prev.filter(u => u.id !== unitToDelete.id));
                      setShowDeleteModal(false);
                      setUnitToDelete(null);
                      // Surface success feedback using the shared toast mechanism
                      showToast('Listing deleted.');
                      // Ensure the page opens scrolled to the very top after delete
                      setTimeout(() => {
                        window.scrollTo(0, 0);
                      }, 0);
                    } catch (e) {
                      logger.error('Failed to delete listing', e);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-white rounded-lg transition-colors hover:opacity-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{backgroundColor: '#B84C4C', fontFamily: 'Poppins'}}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal removed; editing now routed to the same create page via ?edit=ID */}

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

      {/* Cross-page Toast (e.g., after Save & Exit) */}
      {pageToast.visible && (
        <div className="fixed right-0 top-24 pr-6 z-[2000] pointer-events-none">
          <div
            ref={pageToastRef}
            className="toast-base px-4 py-3 rounded-lg pointer-events-auto"
            style={{
              backgroundColor: '#FFFFFF',
              color: '#0B5858',
              fontFamily: 'Poppins',
              boxShadow: '0 18px 44px rgba(0, 0, 0, 0.18)',
              borderLeft: '6px solid #0B5858'
            }}
            onTransitionEnd={(e) => {
              const el = e.currentTarget as HTMLDivElement;
              if (el.classList.contains('toast--exit')) {
                setPageToast({ visible: false, message: '' });
                el.classList.remove('toast--exit');
              }
            }}
          >
            {pageToast.message}
          </div>
        </div>
      )}

      {/* Toast styles (scoped) */}
      <style>{`
        .toast-base { transform: translateX(100%); opacity: 0; transition: transform .28s ease-out, opacity .28s ease-out; will-change: transform, opacity; }
        .toast--enter { transform: translateX(0); opacity: 1; }
        .toast--exit { transform: translateX(100%); opacity: 0; }
      `}</style>

    </div>
  );
};

export default ManageUnits;