import React, { useState, useEffect, useRef } from 'react';
import { ListingService } from '../services/listingService';
import type { Listing } from '../types/listing';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ImageUpload from './ImageUpload';
import ImageGallery from './ImageGallery';
import Dropdown from './Dropdown';
import type { UploadedImage } from '../services/imageService';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface NewListingFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  /** add = create new listing; edit = update existing listing */
  mode?: 'add' | 'edit';
  /** When in edit mode, prefill fields from this listing */
  initialListing?: Listing | null;
  /** When true, renders without full-page scaffolding (for embedding in modals) */
  embed?: boolean;
  /** External control: show all fields in one view */
  showAllFields?: boolean;
  /** Optional callback when toggled externally */
  onShowAllFieldsChange?: (value: boolean) => void;
  /** Parent-controlled toast hook */
  showToast?: (message: string) => void;
}

const NewListingForm: React.FC<NewListingFormProps> = ({ onSuccess, onCancel, mode = 'add', initialListing = null, embed = false, showAllFields, showToast }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [amenityInput, setAmenityInput] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    price_unit: 'daily',
    currency: 'PHP',
    location: '',
    city: '',
    country: 'Philippines',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    property_type: 'apartment',
    main_image_url: '',
    image_urls: [] as string[],
    amenities: [] as string[],
    latitude: '',
    longitude: ''
  });

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedMainImageId, setSelectedMainImageId] = useState<string | null>(null);
  // Show-all-fields toggle (internal fallback if not controlled)
  const [showAllFieldsInternal] = useState(false);
  const effectiveShowAllFields = typeof showAllFields === 'boolean' ? showAllFields : showAllFieldsInternal;
  // Track which submit action to perform in edit mode (useRef avoids async state timing issues)
  const submitActionRef = useRef<'save' | 'save_exit'>('save');
  const formRef = useRef<HTMLFormElement>(null);
  // Toast is now owned by parent; use showToast prop instead

  const propertyTypes = [
    'Apartment',
    'House',
    'Condo',
    'Villa',
    'Studio',
    'Penthouse',
    'Townhouse',
    'Duplex'
  ];

  const priceUnits = [
    { value: 'daily', label: 'Per Night' },
    { value: 'weekly', label: 'Per Week' },
    { value: 'monthly', label: 'Per Month' },
    { value: 'yearly', label: 'Per Year' }
  ];

  const commonAmenities = [
    'WiFi',
    'Air Conditioning',
    'Kitchen',
    'Parking',
    'Pool',
    'Gym',
    'Balcony',
    'Garden',
    'Pet Friendly',
    'Security',
    'Elevator',
    'Laundry',
    'TV',
    'Refrigerator',
    'Microwave',
    'Dishwasher'
  ];

  const steps = [
    { id: 'basic-info', title: 'Basic Information', completed: false, active: true },
    { id: 'property-details', title: 'Property Details', completed: false, active: false },
    { id: 'images', title: 'Images', completed: false, active: false },
    { id: 'location-map', title: 'Location Map', completed: false, active: false }
  ];

  const getUpdatedSteps = () => {
    return steps.map((step, index) => ({
      ...step,
      completed: index < currentStep - 1,
      active: index === currentStep - 1
    }));
  };

  // Prefill when in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialListing) {
      setFormData({
        title: initialListing.title || '',
        description: initialListing.description || '',
        price: (initialListing.price ?? '').toString(),
        price_unit: initialListing.price_unit || 'daily',
        currency: initialListing.currency || 'PHP',
        location: initialListing.location || initialListing.city || '',
        city: initialListing.city || '',
        country: initialListing.country || 'Philippines',
        bedrooms: (initialListing.bedrooms ?? '').toString(),
        bathrooms: (initialListing.bathrooms ?? '').toString(),
        square_feet: (initialListing.square_feet ?? '').toString(),
        property_type: initialListing.property_type || 'apartment',
        main_image_url: initialListing.main_image_url || '',
        image_urls: initialListing.image_urls || [],
        amenities: initialListing.amenities || [],
        latitude: initialListing.latitude ? initialListing.latitude.toString() : '',
        longitude: initialListing.longitude ? initialListing.longitude.toString() : ''
      });
      // If we have a main image in edit mode, seed uploadedImages for gallery
      if (initialListing.main_image_url) {
        setUploadedImages([{ id: 'existing-main', url: initialListing.main_image_url, name: 'Main Image', size: 0, created_at: new Date().toISOString() }]);
        setSelectedMainImageId('existing-main');
      }
    }
  }, [mode, initialListing]);

  // No linear track; we will use animated circles with connectors between them

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };


  // Amenities hashtag functionality
  const handleAmenityAdd = () => {
    const amenity = amenityInput.trim();
    if (amenity && !formData.amenities.includes(amenity)) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenity]
      }));
      setAmenityInput('');
    }
  };

  const handleAmenityRemove = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleAmenityKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAmenityAdd();
    }
  };

  // Image upload handlers
  const handleImagesUploaded = (newImages: UploadedImage[]) => {
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const handleMainImageSelect = (imageId: string | null) => {
    setSelectedMainImageId(imageId);
    if (imageId) {
      const selectedImage = uploadedImages.find(img => img.id === imageId);
      if (selectedImage) {
        setFormData(prev => ({
          ...prev,
          main_image_url: selectedImage.url
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        main_image_url: ''
      }));
    }
  };

  const handleImageDelete = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    
    // If deleted image was the main image, clear selection
    if (selectedMainImageId === imageId) {
      setSelectedMainImageId(null);
      setFormData(prev => ({
        ...prev,
        main_image_url: ''
      }));
    }
  };

  // Update additional images when uploaded images change
  useEffect(() => {
    const additionalImageUrls = uploadedImages
      .filter(img => img.id !== selectedMainImageId)
      .map(img => img.url);
    
    setFormData(prev => ({
      ...prev,
      image_urls: additionalImageUrls
    }));
  }, [uploadedImages, selectedMainImageId]);

  // Update form data when position changes
  useEffect(() => {
    if (selectedPosition) {
      setFormData(prev => ({
        ...prev,
        latitude: selectedPosition[0].toString(),
        longitude: selectedPosition[1].toString()
      }));
      setShowCoordinates(true);
    }
  }, [selectedPosition]);

  // Geocoding search function
  const searchLocation = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
      );
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching location:', error);
      setError('Failed to search location. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce timer ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      if (query.trim()) {
        searchLocation(query);
      } else {
        setSearchResults([]);
      }
    }, 1000);
  };

  // Handle search result selection
  const handleSearchResultSelect = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setSelectedPosition([lat, lng]);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    
    // Update form data with the selected location
    setFormData(prev => ({
      ...prev,
      location: result.display_name,
      city: result.address?.city || result.display_name.split(',')[0] || ''
    }));
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.search-container')) {
        setSearchResults([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Step validation functions
  const isStepValid = (step: number) => {
    switch (step) {
      case 1: // Basic Information & Pricing
        return formData.title.trim() !== '' && formData.city.trim() !== '' && formData.price.trim() !== '';
      case 2: // Property Details
        return true; // This step is optional
      case 3: // Images
        return uploadedImages.length > 0 && selectedMainImageId !== null;
      case 4: // Location Map
        return selectedPosition !== null && formData.latitude && formData.longitude;
      default:
        return false;
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < steps.length && isStepValid(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError(null);
      // Ensure page is scrolled to the very top when moving to next step
      setTimeout(() => { window.scrollTo(0, 0); }, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setError(null);
      // Ensure page is scrolled to the very top when moving to previous step
      setTimeout(() => { window.scrollTo(0, 0); }, 0);
    }
  };


  // Form validation
  const isFormValid = () => {
    return formData.title && 
           formData.price && 
           formData.city && 
           uploadedImages.length > 0 && 
           selectedMainImageId !== null &&
           selectedPosition && 
           formData.latitude && 
           formData.longitude;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title || !formData.city || !formData.price) {
        throw new Error('Please fill in all required fields');
      }

      // Prepare listing data
      const allImageUrls = uploadedImages.map(img => img.url);

      if (mode === 'edit' && initialListing) {
        const updates: Partial<Listing> = {
          title: formData.title,
          description: formData.description || undefined,
          price: parseFloat(formData.price),
          price_unit: formData.price_unit,
          currency: formData.currency,
          location: formData.location || formData.city,
          city: formData.city,
          country: formData.country,
          bedrooms: parseInt(formData.bedrooms) || 0,
          bathrooms: parseInt(formData.bathrooms) || 0,
          square_feet: formData.square_feet ? parseInt(formData.square_feet) : undefined,
          property_type: formData.property_type,
          main_image_url: formData.main_image_url || undefined,
          image_urls: allImageUrls.length > 0 ? allImageUrls : undefined,
          amenities: Array.isArray(formData.amenities) && formData.amenities.length > 0 ? formData.amenities : undefined,
          updated_at: new Date().toISOString()
        };
        await ListingService.updateListing(initialListing.id, updates);
        if (submitActionRef.current === 'save') {
          // Parent-owned toast; stays visible even if this form unmounts
          if (typeof showToast === 'function') showToast('Changes saved successfully.');
        } else {
          if (typeof showToast === 'function') showToast('Changes saved successfully.');
          try { sessionStorage.setItem('global_toast', 'Changes saved.'); } catch {}
        }
      } else {
        const listingData: Omit<Listing, 'id' | 'created_at' | 'updated_at'> = {
          title: formData.title,
          description: formData.description || undefined,
          price: parseFloat(formData.price),
          price_unit: formData.price_unit,
          currency: formData.currency,
          location: formData.location || formData.city,
          city: formData.city,
          country: formData.country,
          bedrooms: parseInt(formData.bedrooms) || 0,
          bathrooms: parseInt(formData.bathrooms) || 0,
          square_feet: formData.square_feet ? parseInt(formData.square_feet) : undefined,
          property_type: formData.property_type,
          main_image_url: formData.main_image_url || undefined,
          image_urls: allImageUrls.length > 0 ? allImageUrls : undefined,
          amenities: Array.isArray(formData.amenities) && formData.amenities.length > 0 ? formData.amenities : undefined,
          is_available: true,
          is_featured: false,
          latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
          longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
        };
        await ListingService.createListing(listingData);
        // Hand off toast to parent for display after returning to Manage Listings
        try { sessionStorage.setItem('global_toast', 'Listing created.'); } catch {}
      }
      if (mode === 'edit') {
        if (submitActionRef.current === 'save_exit') {
          // Immediately return to parent; parent owns toast lifecycle
          onSuccess();
          return;
        }
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error('Error creating listing:', err);
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Map click handler component
  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setSelectedPosition([lat, lng]);
      },
    });
    return null;
  };

  // Step components
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="animate-fade-in-up">
            {renderBasicInfoPricingStep()}
          </div>
        );
      case 2:
        return (
          <div className="animate-fade-in-up">
            {renderPropertyDetailsStep()}
          </div>
        );
      case 3:
        return (
          <div className="animate-fade-in-up">
            {renderImagesStep()}
          </div>
        );
      case 4:
        return (
          <div className="animate-fade-in-up">
            {renderLocationMapStep()}
          </div>
        );
      default:
        return null;
    }
  };

  const renderBasicInfoPricingStep = () => (
    <div className="space-y-6">
      {/* Basic Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{fontFamily: 'Poppins', color: '#0B5858'}}>
            Title <span style={{color: '#B84C4C'}}>*</span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
            style={{
              fontFamily: 'Poppins',
              '--tw-ring-color': '#549F74'
            } as React.CSSProperties & { '--tw-ring-color': string }}
            placeholder="Enter property title"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{fontFamily: 'Poppins', color: '#0B5858'}}>
            Property Type
          </label>
          <Dropdown
            label={formData.property_type.charAt(0).toUpperCase() + formData.property_type.slice(1)}
            options={propertyTypes.map(type => ({
              value: type,
              label: type.charAt(0).toUpperCase() + type.slice(1)
            }))}
            onSelect={(value) => setFormData(prev => ({ ...prev, property_type: value }))}
            placeholder="Select property type"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2" style={{fontFamily: 'Poppins', color: '#0B5858'}}>
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
          style={{
            fontFamily: 'Poppins',
            '--tw-ring-color': '#549F74'
          } as React.CSSProperties & { '--tw-ring-color': string }}
          placeholder="Describe your property..."
        />
      </div>

      {/* Location & Pricing Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{fontFamily: 'Poppins', color: '#0B5858'}}>
            City <span style={{color: '#B84C4C'}}>*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
            style={{
              fontFamily: 'Poppins',
              '--tw-ring-color': '#549F74'
            } as React.CSSProperties & { '--tw-ring-color': string }}
            placeholder="Enter city name"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{fontFamily: 'Poppins', color: '#0B5858'}}>
            Country
          </label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
            style={{
              fontFamily: 'Poppins',
              '--tw-ring-color': '#549F74'
            } as React.CSSProperties & { '--tw-ring-color': string }}
            placeholder="Enter country"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{fontFamily: 'Poppins', color: '#0B5858'}}>
            Price <span style={{color: '#B84C4C'}}>*</span>
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
            style={{
              fontFamily: 'Poppins',
              '--tw-ring-color': '#549F74'
            } as React.CSSProperties & { '--tw-ring-color': string }}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{fontFamily: 'Poppins', color: '#0B5858'}}>
            Currency
          </label>
          <Dropdown
            label={formData.currency}
            options={[
              { value: 'PHP', label: 'PHP' },
              { value: 'USD', label: 'USD' },
              { value: 'EUR', label: 'EUR' }
            ]}
            onSelect={(value) => setFormData(prev => ({ ...prev, currency: value }))}
            placeholder="Select currency"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{fontFamily: 'Poppins', color: '#0B5858'}}>
            Price Unit
          </label>
          <Dropdown
            label={priceUnits.find(unit => unit.value === formData.price_unit)?.label || 'Per Night'}
            options={priceUnits}
            onSelect={(value) => setFormData(prev => ({ ...prev, price_unit: value }))}
            placeholder="Select price unit"
          />
        </div>
      </div>
    </div>
  );


  const renderPropertyDetailsStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2" style={{fontFamily: 'Poppins', color: '#0B5858'}}>
            Bedrooms
          </label>
          <input
            type="number"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleInputChange}
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
            style={{
              fontFamily: 'Poppins',
              '--tw-ring-color': '#549F74'
            } as React.CSSProperties & { '--tw-ring-color': string }}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{fontFamily: 'Poppins', color: '#0B5858'}}>
            Bathrooms
          </label>
          <input
            type="number"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleInputChange}
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
            style={{
              fontFamily: 'Poppins',
              '--tw-ring-color': '#549F74'
            } as React.CSSProperties & { '--tw-ring-color': string }}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2" style={{fontFamily: 'Poppins', color: '#0B5858'}}>
            Square Feet
          </label>
          <input
            type="number"
            name="square_feet"
            value={formData.square_feet}
            onChange={handleInputChange}
            min="0"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
            style={{
              fontFamily: 'Poppins',
              '--tw-ring-color': '#549F74'
            } as React.CSSProperties & { '--tw-ring-color': string }}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-black mb-4" style={{fontFamily: 'Poppins', fontWeight: 600}}>
          Amenities
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2" style={{fontFamily: 'Poppins', color: '#0B5858'}}>
            Add Amenities (Press Enter to add)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              onKeyPress={handleAmenityKeyPress}
              placeholder="Type amenity and press Enter..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all duration-200"
              style={{
                fontFamily: 'Poppins',
                '--tw-ring-color': '#549F74'
              } as React.CSSProperties & { '--tw-ring-color': string }}
            />
            {/* UX: Make the Add button clearly clickable */}
            <button
              type="button"
              onClick={handleAmenityAdd}
              className="px-4 py-2 text-white rounded-lg transition-colors cursor-pointer hover:cursor-pointer"
              style={{backgroundColor: '#0B5858', fontFamily: 'Poppins'}}
            >
              Add
            </button>
          </div>
        </div>

        {formData.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.amenities.map((amenity, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1 bg-[#0B5858] text-white rounded-full text-sm"
                style={{fontFamily: 'Poppins'}}
              >
                {/* Render amenity label without hashtag prefix for cleaner UI */}
                {amenity}
                {/* UX: Show pointer on delete badge action; hover color matches brand (#B84C4C) */}
                <button
                  type="button"
                  onClick={() => handleAmenityRemove(amenity)}
                  className="ml-1 transition-colors cursor-pointer hover:cursor-pointer"
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#B84C4C'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = ''; }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div>
          <p className="text-sm font-semibold mb-2" style={{fontFamily: 'Poppins', color: '#0B5858'}}>
            Common amenities (click to add):
          </p>
          <div className="flex flex-wrap gap-2">
            {commonAmenities.map(amenity => (
              <button
                key={amenity}
                type="button"
                onClick={() => {
                  if (!formData.amenities.includes(amenity)) {
                    setFormData(prev => ({
                      ...prev,
                      amenities: [...prev.amenities, amenity]
                    }));
                  }
                }}
                disabled={formData.amenities.includes(amenity)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  formData.amenities.includes(amenity)
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer hover:cursor-pointer'
                }`}
                style={{fontFamily: 'Poppins'}}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderImagesStep = () => (
    <div className="space-y-10">
      {/* Upload Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-6" style={{fontFamily: 'Poppins'}}>
          Upload Property Images
        </h3>
        <ImageUpload
          onImagesUploaded={handleImagesUploaded}
          maxFiles={10}
          disabled={isSubmitting}
        />
      </div>

      {/* Image Gallery Section */}
      {uploadedImages.length > 0 && (
        <div className="space-y-6">
          <ImageGallery
            images={uploadedImages}
            selectedImageId={selectedMainImageId}
            onImageSelect={handleMainImageSelect}
            onImageDelete={handleImageDelete}
            disabled={isSubmitting}
          />
        </div>
      )}

      {/* Image Summary */}
      {uploadedImages.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4" style={{fontFamily: 'Poppins'}}>
            Image Summary
          </h4>
          <div className="text-sm text-gray-600 space-y-2" style={{fontFamily: 'Poppins'}}>
            <p>• Main image: {selectedMainImageId ? 'Selected' : 'Not selected'}</p>
            <p>• Additional images: {uploadedImages.filter(img => img.id !== selectedMainImageId).length}</p>
            <p>• Total uploaded: {uploadedImages.length}</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderLocationMapStep = () => (
    <div className="space-y-6">
      <div className="border border-green-800 rounded-lg p-4">
        <p className="text-green-800 text-sm" style={{fontFamily: 'Poppins'}}>
          Search for a city or location, then click on the map to set the exact property location. Coordinates will be displayed after selection.
        </p>
      </div>

      <div className="relative search-container">
        <label className="block text-sm font-semibold mb-2" style={{fontFamily: 'Poppins', color: '#0B5858'}}>
          Search Location
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Enter city, address, or landmark..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:border-transparent transition-all duration-200 pr-10"
            style={{
              fontFamily: 'Poppins',
              '--tw-ring-color': '#549F74'
            } as React.CSSProperties & { '--tw-ring-color': string }}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        
        {searchResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSearchResultSelect(result)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                style={{fontFamily: 'Poppins'}}
              >
                <div className="text-sm font-medium text-gray-900">
                  {result.display_name.split(',')[0]}
                </div>
                <div className="text-xs text-gray-500">
                  {result.display_name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

        <div className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden relative z-0">
          <style>{`
            .leaflet-control-zoom a {
              background-color: white !important;
              color: #0B5858 !important;
              border: 1px solid #e5e7eb !important;
              width: 40px !important;
              height: 40px !important;
              line-height: 40px !important;
              font-size: 24px !important;
              font-weight: bold !important;
              text-decoration: none !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              transition: all 0.2s ease !important;
            }
            
            .leaflet-control-zoom a:hover {
              background-color: #f9fafb !important;
              color: #0B5858 !important;
              border-color: #0B5858 !important;
            }
            
            .leaflet-control-zoom {
              border: none !important;
              box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
            }
            
            .leaflet-control-zoom-in {
              border-bottom: 1px solid #e5e7eb !important;
            }
          `}</style>
          <MapContainer
            center={selectedPosition || [14.5995, 120.9842]}
          zoom={selectedPosition ? 15 : 13}
          style={{ height: '100%', width: '100%' }}
          key={selectedPosition ? 'selected' : 'default'}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler />
          {selectedPosition && (
            <Marker position={selectedPosition} />
          )}
        </MapContainer>
      </div>

      {showCoordinates && formData.latitude && formData.longitude && (
        <div className="border border-green-800 rounded-lg p-4">
          <p className="text-green-800 text-sm" style={{fontFamily: 'Poppins'}}>
            ✓ Location set successfully! The coordinates have been captured from the map.
          </p>
        </div>
      )}
    </div>
  );

    return (
      <div className={embed ? '' : 'min-h-screen bg-gray-50 py-6 sm:py-8'}>
      <div className={(embed ? '' : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8') + ' relative'}>
        {/* Header */}
        {!effectiveShowAllFields && (
        <div className="mb-8">
            {/* Subtle animated circles with enhanced connector lines (no top track) */}
            <div className="flex items-center justify-center space-x-6">
              {getUpdatedSteps().map((step, index) => {
                const stepNumber = index + 1;
                const completed = step.completed; // stepNumber < currentStep
                const active = step.active; // stepNumber === currentStep

                return (
                  <React.Fragment key={step.id}>
                    <div className="flex items-center">
                      <div className="flex flex-col items-center text-center select-none">
                        {/* Circle with gradient styling */}
                        <div className="relative">
                          {/* Soft outer glow/pulse for the active step */}
                          {active && (
                            <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-[#0B5858] to-[#558B8B] opacity-30 animate-pulse" />
                          )}

                          <button
                            type="button"
                            aria-current={active}
                            aria-label={`Step ${stepNumber}: ${step.title}`}
                            className={`relative w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-500 ease-in-out hover:scale-110 shadow-lg ${
                              completed || active
                                ? 'bg-gradient-to-br from-[#0B5858] to-[#558B8B] text-white shadow-[#0B5858]/25'
                                : 'bg-white text-[#558B8B] border-2 border-[#558B8B] shadow-gray-200 hover:shadow-[#558B8B]/20'
                            } ${(mode === 'edit' || completed) ? 'cursor-pointer' : 'cursor-default'} ${active ? 'scale-105' : ''}`}
                            onClick={() => {
                              if (mode === 'edit' || completed) setCurrentStep(stepNumber);
                            }}
                            style={{ fontFamily: 'Poppins' }}
                          >
                            {completed ? (
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <span className="font-bold">{stepNumber}</span>
                            )}
                            {/* Subtle inner ring for current step */}
                            {active && <span className="absolute inset-0 rounded-full border-2 border-white/20" />}
                          </button>
                        </div>
                        {/* Label under the circle (outside relative container so pulse doesn't cover text) */}
                        <div className="mt-5 text-center">
                          <span
                            className={`text-sm font-semibold transition-colors duration-300 ${
                              active ? 'text-[#0B5858]' : completed ? 'text-[#0B5858]' : 'text-gray-500'
                            }`}
                            style={{ fontFamily: 'Poppins', cursor: mode === 'edit' ? 'pointer' : 'default' }}
                            onClick={() => {
                              if (mode === 'edit' || completed) setCurrentStep(stepNumber);
                            }}
                          >
                            {step.title}
                          </span>
                        </div>
                      </div>

                      {/* Connector between circles */}
                      {index < steps.length - 1 && (
                        <div className="relative mx-6">
                          {/* Base track */}
                          <div className="w-20 h-0.5 bg-gray-200 rounded-full" />
                          {/* Animated overlay progress (yellow) */}
                          <div
                            className={`absolute top-0 left-0 h-0.5 rounded-full transition-all duration-700 ease-out ${
                              stepNumber < currentStep ? 'w-20 bg-[#F1C40F]' : 'w-0 bg-[#F1C40F]'
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
        </div>
        )}

        {/* Main content */}
        {effectiveShowAllFields ? (
          // Show 4 separate cards with spacing and no outer container card
          <div className={embed ? '' : 'mx-4 sm:mx-6 lg:mx-8'}>
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600" style={{fontFamily: 'Poppins'}}>{error}</p>
              </div>
            )}
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
                <div className="p-6 sm:p-8 lg:p-10">{renderBasicInfoPricingStep()}</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
                <div className="p-6 sm:p-8 lg:p-10">{renderPropertyDetailsStep()}</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
                <div className="p-6 sm:p-8 lg:p-10">{renderImagesStep()}</div>
              </div>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-in-up">
                <div className="p-6 sm:p-8 lg:p-10">
                  {renderLocationMapStep()}
                  {/* Primary action for create flow when Show All Fields is enabled */}
                  {mode !== 'edit' && (
                    <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || !isFormValid()}
                        className="px-6 py-2 text-white rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer"
                        style={{ backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600 }}
                      >
                        {isSubmitting ? 'Creating...' : 'Create Listing'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Buttons (Show All Fields mode): align actions to the right; hide Cancel */}
              <div className="flex items-center justify-end pt-2">
                {mode === 'edit' && (
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => { submitActionRef.current = 'save'; formRef.current?.requestSubmit(); }}
                      className="px-6 py-2 text-white rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg cursor-pointer"
                      style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => { submitActionRef.current = 'save_exit'; formRef.current?.requestSubmit(); }}
                      className="px-6 py-2 text-white rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg cursor-pointer"
                      style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}
                    >
                      Save & Exit
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        ) : (
          <div key={currentStep} className={`bg-white rounded-xl shadow-lg overflow-hidden ${embed ? '' : 'mx-4 sm:mx-6 lg:mx-8'} fade-step`}>
            <div className="p-6 sm:p-8 lg:p-10">
              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600" style={{fontFamily: 'Poppins'}}>{error}</p>
                </div>
              )}
              {/* Form Content */}
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-8">
                  {renderStepContent()}
                </div>
                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-8 border-t border-gray-200 mt-8">
                  {/* Left: Save & Save & Exit in edit mode */}
                  {mode === 'edit' ? (
                    <div className="flex space-x-3">
                      <button
                        type="button"
                        onClick={() => { submitActionRef.current = 'save'; formRef.current?.requestSubmit(); }}
                        className="px-6 py-2 text-white rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg cursor-pointer"
                        style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => { submitActionRef.current = 'save_exit'; formRef.current?.requestSubmit(); }}
                        className="px-6 py-2 text-white rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg cursor-pointer"
                        style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}
                      >
                        Save & Exit
                      </button>
                    </div>
                  ) : (
                    <div />
                  )}
                  
                  {/* Right: navigation and primary action */}
                  <div className="flex space-x-4">
                  {currentStep > 1 ? (
                    // UX: Back shows pointer to indicate it is clickable
                    <button type="button" onClick={prevStep} className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md cursor-pointer hover:cursor-pointer" style={{fontFamily: 'Poppins'}}>
                      Back
                    </button>
                  ) : (
                    // UX: Cancel shows pointer to indicate it is clickable; white fill for clarity
                    <button type="button" onClick={onCancel} className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-md cursor-pointer hover:cursor-pointer" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                      Cancel
                    </button>
                  )}
                  {currentStep < steps.length ? (
                    // UX: Next has pointer when enabled; falls back to not-allowed when disabled
                    <button type="button" onClick={nextStep} disabled={!isStepValid(currentStep)} className="px-6 py-2 text-white rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer" style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>
                      Next
                    </button>
                  ) : (
                    // UX: Submit behaves similarly to Next for cursor state
                    <button type="submit" disabled={isSubmitting || !isFormValid()} className="px-6 py-2 text-white rounded-lg transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none cursor-pointer" style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          {mode === 'edit' ? 'Saving...' : 'Creating...'}
                        </span>
                      ) : (mode === 'edit' ? 'Save Changes' : 'Create Listing')}
                    </button>
                  )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      {/* Toast UI removed; parent manages toast rendering */}
      {/* Step fade animation styles (scoped) */}
      <style>{`
        .fade-step { animation: fadeStep .18s ease-out; will-change: opacity, transform; }
        @keyframes fadeStep {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NewListingForm;