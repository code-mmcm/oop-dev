import React, { useState } from 'react';
import type { Listing } from '../../../types/listing';

interface LeftColumnProps {
  listing: Listing | null;
  isLoading: boolean;
  error?: string | null;
  onImageClick: (index: number) => void;
  onShareClick?: () => void;
}

const LeftColumn: React.FC<LeftColumnProps> = ({
  listing,
  isLoading,
  error,
  onImageClick,
  onShareClick,
}) => {
  // Image gallery state/handlers inlined here so the gallery + modal live inside this component
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);



  // Description expansion state (inlined from DescriptionSection)
  const [showFullDescription, setShowFullDescription] = useState(false);

  const amenities = listing?.amenities || [];
  const latitude = listing?.latitude;
  const longitude = listing?.longitude;

  const isClient = typeof window !== 'undefined';
  const hasCoords = latitude != null && longitude != null;

  // default to Amenities tab
  const [activeTab, setActiveTab] = useState<'amenities' | 'management' | 'location'>('amenities');


  const allImages = listing ? [listing.main_image_url || '/avida.jpg', ...(listing.image_urls || [])] : ['/avida.jpg'];

  const handleOpenModal = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
    // notify parent if it wants to handle image clicks too
    try { onImageClick && onImageClick(index); } catch (e) { void e; }
  };

  const handleCloseModal = () => {
    setShowImageModal(false);
  };

  const handleNextImage = () => {
    if (isImageTransitioning) return;
    setIsImageTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
      setIsImageTransitioning(false);
    }, 150);
  };

  const handlePrevImage = () => {
    if (isImageTransitioning) return;
    setIsImageTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
      setIsImageTransitioning(false);
    }, 150);
  };

  // ...existing code...
  if (isLoading) {
    return (
      <div className="flex-1">
        <div className="mb-8">
          <div className="w-full h-75 bg-gray-300 rounded-lg animate-pulse"></div>
        </div>

        <div className="mb-6 mt-8">
          <div className="h-10 bg-gray-300 rounded w-3/4 mb-3 animate-pulse"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-300 rounded w-24 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
              <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-gray-200 rounded-xl overflow-hidden mb-8">
          {[1,2,3,4].map((i) => (
            <div key={i} className="p-6 border-r border-gray-200">
              <div className="h-4 bg-gray-300 rounded w-16 mb-2 animate-pulse"></div>
              <div className="h-6 bg-gray-300 rounded w-8 animate-pulse"></div>
            </div>
          ))}
        </div>

        <div>
          <div className="h-6 bg-gray-300 rounded w-24 mb-3 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-300 rounded w-4/6 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // ...existing code continues unchanged...
  if (error || !listing) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-lg font-semibold mb-2" style={{fontFamily: 'Poppins'}}>
            {error || 'Listing not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Inlined Image Gallery */}
      <div className="mb-1">
        { (listing.image_urls && listing.image_urls.length > 0) ? (
          listing.image_urls.length >= 2 ? (
            <div className="grid grid-cols-3 gap-3 h-75">
              <div className="col-span-2 h-full w-full cursor-pointer overflow-hidden" onClick={() => handleOpenModal(0)}>
                <img
                  src={listing.main_image_url || '/avida.jpg'}
                  className="h-full w-full object-cover rounded-lg hover:opacity-90 transition-opacity"
                  style={{aspectRatio: '16/9', maxHeight: '100%'}}
                  alt="main"
                />
              </div>
              <div className="col-span-1 flex flex-col gap-3">
                {listing.image_urls.slice(0,2).map((imageUrl, index) => (
                  <div key={index} className="cursor-pointer" onClick={() => handleOpenModal(index + 1)}>
                    <img
                      src={imageUrl}
                      className="h-36 w-full object-cover rounded-lg hover:opacity-90 transition-opacity"
                      alt={`additional ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 h-75">
              <div className="col-span-1 h-full w-full cursor-pointer overflow-hidden flex items-center justify-center" onClick={() => handleOpenModal(0)}>
                <img
                  src={listing.main_image_url || '/avida.jpg'}
                  className="h-full w-full object-cover rounded-lg hover:opacity-90 transition-opacity"
                  style={{aspectRatio: '16/9', maxHeight: '100%'}}
                  alt="main"
                />
              </div>
              <div className="col-span-1 h-full w-full cursor-pointer overflow-hidden flex items-center justify-center" onClick={() => handleOpenModal(0)}>
                <img
                  src={listing.main_image_url || '/avida.jpg'}
                  className="h-full w-full object-cover rounded-lg hover:opacity-90 transition-opacity"
                  style={{aspectRatio: '16/9', maxHeight: '100%'}}
                  alt="main"
                />
              </div>
            </div>
          )
        ) : (
          <div className="h-75 w-full flex justify-center cursor-pointer" onClick={() => handleOpenModal(0)}>
            <img
              src={listing.main_image_url || '/avida.jpg'}
              className="h-full w-full object-cover rounded-lg hover:opacity-90 transition-opacity"
              style={{aspectRatio: '16/9', maxHeight: '100%'}}
              alt="main"
            />
          </div>
        )}

        {/* Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
            <div className="relative w-full h-full flex items-center justify-center">
              <button onClick={handleCloseModal} className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {(allImages.length > 1) && (
                <>
                  <button onClick={handlePrevImage} disabled={isImageTransitioning} className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-200 z-10 p-2 rounded-full hover:bg-white/10 ${isImageTransitioning ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15,18 9,12 15,6"></polyline></svg>
                  </button>
                  <button onClick={handleNextImage} disabled={isImageTransitioning} className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-200 z-10 p-2 rounded-full hover:bg-white/10 ${isImageTransitioning ? 'opacity-50 cursor-not-allowed' : 'opacity-100'}`}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9,18 15,12 9,6"></polyline></svg>
                  </button>
                </>
              )}

              <div className="w-full h-full flex items-center justify-center p-8">
                <img src={allImages[currentImageIndex]} className={`max-w-full max-h-full object-contain rounded-lg transition-all duration-300 ease-in-out ${isImageTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`} alt={`Property image ${currentImageIndex + 1}`} style={{maxWidth: '90vw', maxHeight: '90vh'}} />
              </div>

              {allImages.length > 1 && (
                <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full transition-all duration-300 ${isImageTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
                  {currentImageIndex + 1} / {allImages.length}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Other left column parts (kept as component calls) */}
      {/* Inlined TitleLocation (originally ./left/TitleLocation.tsx) */}
      <div className={`mb-6 ${listing.image_urls && listing.image_urls.length > 0 ? 'mt-5' : 'mt-8'}`}>
        <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{fontFamily: 'Poppins', fontWeight: 700}}>{listing.title}</h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-2 text-gray-600 mb-2 md:mb-0 md:flex-1 md:min-w-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-2 flex-shrink-0" style={{paddingTop: '1px'}}>
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span className="text-sm md:text-base flex-1 break-words" style={{fontFamily: 'Poppins'}}>{listing.location}</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
            <button 
              onClick={() => onShareClick && onShareClick()}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 md:p-0"
              title="Share this property"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16,6 12,2 8,6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </button>
            <button className="text-gray-400 hover:text-gray-600 p-1 md:p-0">
              <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            <button className="text-gray-400 hover:text-gray-600 p-1 md:p-0">
              <svg className="w-4 h-4 md:w-5 md:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </button>
          </div>
        </div>

        
      </div>
      {/* Inlined PropertyDetailsTable (from ./left/PropertyDetailsTable.tsx) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-gray-200 rounded-xl overflow-hidden mb-8">
        <div className="p-3 border-r border-gray-200">
          <p className="text-base text-gray-600 mb-1" style={{fontFamily: 'Poppins'}}>Bedroom</p>
          <p className="text-xl text-center font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>{listing.bedrooms}</p>
        </div>
        <div className="p-3 border-r border-gray-200">
          <p className="text-base text-gray-600 mb-1" style={{fontFamily: 'Poppins'}}>Bathroom</p>
          <p className="text-xl text-center font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>{listing.bathrooms}</p>
        </div>
        <div className="col-span-2 md:hidden border-t border-gray-200 mx-3"></div>
        <div className="p-3 border-r border-gray-200">
          <p className="text-base text-gray-600 mb-1" style={{fontFamily: 'Poppins'}}>Area</p>
          <p className="text-xl text-center font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>{listing.square_feet ? `${listing.square_feet} sqft` : 'N/A'}</p>
        </div>
        <div className="p-3">
          <p className="text-base text-gray-600 mb-1" style={{fontFamily: 'Poppins'}}>Type</p>
          <p className="text-xl text-center font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>{listing.property_type}</p>
        </div>
      </div>

      {/* Inlined DescriptionSection (from ./left/DescriptionSection.tsx) */}
      <div>
        <h2 className="text-lg font-bold mb-3" style={{fontFamily: 'Poppins', fontWeight: 700}}>Description</h2>
        {(() => {
          const desc = listing.description || 'No description available for this property.';
          const isLong = desc.length > 200;
          return (
            <>
              <p className="text-base text-gray-600 mb-3" style={{fontFamily: 'Poppins'}}>
                {isLong && !showFullDescription ? `${desc.slice(0, 200)}...` : desc}
              </p>
              {isLong && (
                <button onClick={() => setShowFullDescription((s) => !s)} className="text-base text-black font-semibold hover:underline" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                  {showFullDescription ? 'Show Less' : 'Show More'}
                </button>
              )}
            </>
          );
        })()}
      </div>

      <div className="mt-15">
        <div className="inline-grid grid-flow-col auto-cols-auto items-center gap-x-4 md:gap-x-6">
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('amenities')}
              className={`text-sm md:text-lg transition-colors ${activeTab === 'amenities' ? 'text-teal-700' : 'text-black'}`}
              style={{ fontFamily: 'Poppins', fontWeight: 600 }}
              aria-controls="amenities-grid"
              aria-pressed={activeTab === 'amenities'}
            >
              Amenities
            </button>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setActiveTab('management')}
              className={`text-sm md:text-lg transition-colors ${activeTab === 'management' ? 'text-teal-700' : 'text-black'}`}
              style={{ fontFamily: 'Poppins', fontWeight: 600 }}
              aria-controls="management-section"
              aria-pressed={activeTab === 'management'}
            >
              Management
            </button>
          </div>

          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('location')}
              className={`text-sm md:text-lg transition-colors ${activeTab === 'location' ? 'text-teal-700' : 'text-black'}`}
              style={{ fontFamily: 'Poppins', fontWeight: 600 }}
              aria-controls="MapSection"
              aria-pressed={activeTab === 'location'}
            >
              Location
            </button>
          </div>
        </div>
      </div>

      <div className="border-b border-black mt-2" />

      {activeTab === 'amenities' && amenities && amenities.length > 0 && (
        <div id="amenities-grid" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {amenities.map((amenity, i) => (
              <div key={i} className="px-3 py-2 bg-gray-50 rounded-md text-sm text-gray-700" style={{ fontFamily: 'Poppins' }}>
                {amenity}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'management' && (
        <div id="management-section" className="mt-4">
          <p className="text-gray-500 mt-2">Management details not provided.</p>
        </div>
      )}

      {activeTab === 'location' && (
        <div id="MapSection" className="mt-4">
          <div className="w-full h-64 md:h-67 border border-gray-200 rounded-lg overflow-hidden relative z-0 mt-2">
            {isClient && hasCoords ? (
              <iframe
                title="Property location map"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${encodeURIComponent(`${listing.latitude},${listing.longitude}`)}&output=embed`}
              ></iframe>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p className="text-sm" style={{fontFamily: 'Poppins'}}>Location not available</p>
              </div>
            )}
          </div>
          {listing.latitude && listing.longitude && (
            <div className="mt-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${listing.latitude},${listing.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-800 transition-colors"
                style={{fontFamily: 'Poppins', fontWeight: 600}}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View in Google Maps
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeftColumn;