import React, { useState, useEffect, useRef } from 'react';
import { ListingService } from '../services/listingService';
import type { Listing } from '../types/listing';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import ImageUpload from './ImageUpload';
import ImageGallery from './ImageGallery';
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
}

const NewListingForm: React.FC<NewListingFormProps> = ({ onSuccess, onCancel }) => {
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

  const propertyTypes = [
    'apartment',
    'house',
    'condo',
    'villa',
    'studio',
    'penthouse',
    'townhouse',
    'duplex'
  ];

  const priceUnits = [
    { value: 'daily', label: 'Per Day' },
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
    { id: 1, title: 'Basic Information', description: 'Title, type, and description' },
    { id: 2, title: 'Location & Pricing', description: 'City, country, and pricing details' },
    { id: 3, title: 'Property Details', description: 'Bedrooms, bathrooms, and amenities' },
    { id: 4, title: 'Images', description: 'Main image and additional photos' },
    { id: 5, title: 'Location Map', description: 'Set exact property location on map' }
  ];

  const totalSteps = steps.length;

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
      case 1: // Basic Information
        return formData.title.trim() !== '';
      case 2: // Location & Pricing
        return formData.city.trim() !== '' && formData.price.trim() !== '';
      case 3: // Property Details
        return true; // This step is optional
      case 4: // Images
        return uploadedImages.length > 0 && selectedMainImageId !== null;
      case 5: // Location Map
        return selectedPosition !== null && formData.latitude && formData.longitude;
      default:
        return false;
    }
  };

  // Navigation functions
  const nextStep = () => {
    if (currentStep < totalSteps && isStepValid(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError(null);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setError(null);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      setError(null);
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
      onSuccess();
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
        return renderBasicInfoStep();
      case 2:
        return renderLocationPricingStep();
      case 3:
        return renderPropertyDetailsStep();
      case 4:
        return renderImagesStep();
      case 5:
        return renderLocationMapStep();
      default:
        return null;
    }
  };

  const renderBasicInfoStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Poppins'}}>
            Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{fontFamily: 'Poppins'}}
            placeholder="Enter property title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Poppins'}}>
            Property Type
          </label>
          <select
            name="property_type"
            value={formData.property_type}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{fontFamily: 'Poppins'}}
          >
            {propertyTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Poppins'}}>
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{fontFamily: 'Poppins'}}
          placeholder="Describe your property..."
        />
      </div>
    </div>
  );

  const renderLocationPricingStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Poppins'}}>
            City *
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{fontFamily: 'Poppins'}}
            placeholder="Enter city name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Poppins'}}>
            Country
          </label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{fontFamily: 'Poppins'}}
            placeholder="Enter country"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Poppins'}}>
            Price *
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{fontFamily: 'Poppins'}}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Poppins'}}>
            Price Unit
          </label>
          <select
            name="price_unit"
            value={formData.price_unit}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{fontFamily: 'Poppins'}}
          >
            {priceUnits.map(unit => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Poppins'}}>
            Currency
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{fontFamily: 'Poppins'}}
          >
            <option value="PHP">PHP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderPropertyDetailsStep = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Poppins'}}>
            Bedrooms
          </label>
          <input
            type="number"
            name="bedrooms"
            value={formData.bedrooms}
            onChange={handleInputChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{fontFamily: 'Poppins'}}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Poppins'}}>
            Bathrooms
          </label>
          <input
            type="number"
            name="bathrooms"
            value={formData.bathrooms}
            onChange={handleInputChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{fontFamily: 'Poppins'}}
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Poppins'}}>
            Square Feet
          </label>
          <input
            type="number"
            name="square_feet"
            value={formData.square_feet}
            onChange={handleInputChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{fontFamily: 'Poppins'}}
            placeholder="0"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-black mb-4" style={{fontFamily: 'Poppins', fontWeight: 600}}>
          Amenities
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Poppins'}}>
            Add Amenities (Press Enter to add)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={amenityInput}
              onChange={(e) => setAmenityInput(e.target.value)}
              onKeyPress={handleAmenityKeyPress}
              placeholder="Type amenity and press Enter..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{fontFamily: 'Poppins'}}
            />
            <button
              type="button"
              onClick={handleAmenityAdd}
              className="px-4 py-2 text-white rounded-lg transition-colors"
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
                #{amenity}
                <button
                  type="button"
                  onClick={() => handleAmenityRemove(amenity)}
                  className="ml-1 hover:text-red-200 transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div>
          <p className="text-sm text-gray-600 mb-2" style={{fontFamily: 'Poppins'}}>
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
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
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
    <div className="space-y-8">
      {/* Upload Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{fontFamily: 'Poppins'}}>
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
        <div>
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
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2" style={{fontFamily: 'Poppins'}}>
            Image Summary
          </h4>
          <div className="text-sm text-gray-600 space-y-1" style={{fontFamily: 'Poppins'}}>
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm" style={{fontFamily: 'Poppins'}}>
          Search for a city or location, then click on the map to set the exact property location. Coordinates will be displayed after selection.
        </p>
      </div>

      <div className="relative search-container">
        <label className="block text-sm font-medium text-gray-700 mb-2" style={{fontFamily: 'Poppins'}}>
          Search Location
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Enter city, address, or landmark..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            style={{fontFamily: 'Poppins'}}
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm" style={{fontFamily: 'Poppins'}}>
            ✓ Location set successfully! The coordinates have been captured from the map.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden p-8">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-black" style={{fontFamily: 'Poppins', fontWeight: 700}}>
            {steps[currentStep - 1].title}
          </h2>
          <span className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>
            Step {currentStep} of {totalSteps}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => goToStep(step.id)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step.id === currentStep
                    ? 'bg-[#0B5858] text-white'
                    : step.id < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
                style={{fontFamily: 'Poppins'}}
              >
                {step.id}
              </button>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${
                  step.id < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <p className="text-sm text-gray-600 mt-2" style={{fontFamily: 'Poppins'}}>
          {steps[currentStep - 1].description}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600" style={{fontFamily: 'Poppins'}}>{error}</p>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step Content */}
        <div className="bg-gray-50 rounded-xl p-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-gray-200">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              style={{fontFamily: 'Poppins'}}
            >
              Cancel
            </button>
            
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                style={{fontFamily: 'Poppins'}}
              >
                Previous
              </button>
            )}
          </div>
          
          <div className="flex space-x-4">
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="px-6 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid()}
                className="px-6 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}
              >
                {isSubmitting ? 'Creating...' : 'Create Listing'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewListingForm;