import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from './Navbar';
import Footer from './Footer';
import { ListingService } from '../services/listingService';
import type { Listing, ListingView } from '../types/listing';
import { getLenis } from '../App';

const UnitView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [sameAreaListings, setSameAreaListings] = useState<ListingView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);

  useEffect(() => {
    // Scroll to top when component mounts or id changes using Lenis
    const scrollToTop = () => {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.2 });
      } else {
        // Fallback to regular scroll if Lenis is not available
        window.scrollTo(0, 0);
      }
    };

    // Small delay to ensure Lenis is ready
    const timeoutId = setTimeout(scrollToTop, 100);
    
    const fetchListingData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch the main listing
        const listingData = await ListingService.getListingById(id);
        setListing(listingData);
        
        // Fetch listings in the same area
        if (listingData?.city) {
          const areaListings = await ListingService.getListingsInSameArea(listingData.city, id);
          setSameAreaListings(areaListings);
        }
      } catch (err) {
        console.error('Error fetching listing data:', err);
        setError('Failed to load listing details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchListingData();
    
    return () => clearTimeout(timeoutId);
  }, [id]);

  const handleReserve = () => {
    console.log('Reserve clicked');
  };

  const handleSameAreaListingClick = (listingId: string) => {
    navigate(`/unit/${listingId}`);
    // Use Lenis for smooth scroll to top with small delay
    setTimeout(() => {
      const lenis = getLenis();
      if (lenis) {
        lenis.scrollTo(0, { duration: 1.2 });
      }
    }, 100);
  };

  const handleShare = () => {
    setIsLinkCopied(false); // Reset copied state when opening modal
    setShowShareModal(true);
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/unit/${id}`;
    const shareText = `Check out this property: ${listing?.title || 'Amazing Property'}`;
    
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setIsLinkCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsLinkCopied(false);
      }, 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = `${shareText}\n${shareUrl}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setIsLinkCopied(true);
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsLinkCopied(false);
      }, 2000);
    }
  };

  const handleFacebookShare = () => {
    const shareUrl = `${window.location.origin}/unit/${id}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  const handleTwitterShare = () => {
    const shareUrl = `${window.location.origin}/unit/${id}`;
    const shareText = `Check out this property: ${listing?.title || 'Amazing Property'}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
    setShowShareModal(false);
  };

  const handleWhatsAppShare = () => {
    const shareUrl = `${window.location.origin}/unit/${id}`;
    const shareText = `Check out this property: ${listing?.title || 'Amazing Property'}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank');
    setShowShareModal(false);
  };

  const handleEmailShare = () => {
    const shareUrl = `${window.location.origin}/unit/${id}`;
    const shareText = `Check out this property: ${listing?.title || 'Amazing Property'}`;
    const subject = `Property Listing: ${listing?.title || 'Amazing Property'}`;
    const body = `${shareText}\n\nView the property here: ${shareUrl}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = emailUrl;
    setShowShareModal(false);
  };

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
  };

  const handleNextImage = () => {
    if (!listing || isImageTransitioning) return;
    const totalImages = 1 + (listing.image_urls?.length || 0);
    setIsImageTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
      setIsImageTransitioning(false);
    }, 150);
  };

  const handlePrevImage = () => {
    if (!listing || isImageTransitioning) return;
    const totalImages = 1 + (listing.image_urls?.length || 0);
    setIsImageTransitioning(true);
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
      setIsImageTransitioning(false);
    }, 150);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
  };

  const getCurrentImageUrl = () => {
    if (!listing) return '';
    if (currentImageIndex === 0) {
      return listing.main_image_url || '/avida.jpg';
    }
    return listing.image_urls?.[currentImageIndex - 1] || '';
  };

  // Skeleton component
  const SkeletonCard = () => (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden animate-pulse border border-gray-100">
      <div className="h-48 sm:h-56 bg-gray-300"></div>
      <div className="p-4 sm:p-6">
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Navbar />
        <div className="h-16" />

        {/* Main Content Skeleton */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col xl:flex-row gap-8">
              {/* Left Column - Property Details Skeleton */}
              <div className="flex-1">
                {/* Image Gallery Skeleton */}
                <div className="mb-8">
                  <div className="w-full h-64 bg-gray-300 rounded-lg animate-pulse"></div>
                </div>

                {/* Title and Location Skeleton */}
                <div className="mb-6 mt-8">
                  <div className="h-8 bg-gray-300 rounded w-3/4 mb-3 animate-pulse"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-5 bg-gray-300 rounded w-1/2 animate-pulse"></div>
                    <div className="flex items-center gap-4">
                      <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
                      <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Property Details Table Skeleton */}
                <div className="grid grid-cols-4 gap-0 border border-gray-200 rounded-xl overflow-hidden mb-8">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="p-6 border-r border-gray-200">
                      <div className="h-4 bg-gray-300 rounded w-16 mb-2 animate-pulse"></div>
                      <div className="h-6 bg-gray-300 rounded w-8 animate-pulse"></div>
                    </div>
                  ))}
                </div>

                {/* Description Skeleton */}
                <div>
                  <div className="h-6 bg-gray-300 rounded w-24 mb-3 animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded w-5/6 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded w-4/6 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Right Column - Booking Sidebar Skeleton */}
              <div className="w-full xl:w-96">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
                  <div className="mb-6">
                    <div className="h-6 bg-gray-300 rounded w-2/3 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
                  </div>

                  <div className="mb-6">
                    <div className="h-8 bg-gray-300 rounded w-1/2 animate-pulse"></div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-16 mb-2 animate-pulse"></div>
                        <div className="h-5 bg-gray-300 rounded w-20 animate-pulse"></div>
                      </div>
                      <div>
                        <div className="h-4 bg-gray-300 rounded w-16 mb-2 animate-pulse"></div>
                        <div className="h-5 bg-gray-300 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                    <div>
                      <div className="h-4 bg-gray-300 rounded w-20 mb-2 animate-pulse"></div>
                      <div className="h-5 bg-gray-300 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="h-5 bg-gray-300 rounded w-32 mb-3 animate-pulse"></div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="h-4 bg-gray-300 rounded w-24 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-300 rounded w-24 mb-3 animate-pulse"></div>
                      <div className="h-4 bg-gray-300 rounded w-full animate-pulse"></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-6">
                    <div className="h-5 bg-gray-300 rounded w-20 animate-pulse"></div>
                    <div className="h-5 bg-gray-300 rounded w-16 animate-pulse"></div>
                  </div>

                  <div className="h-12 bg-gray-300 rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Properties in Same Area Skeleton */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8 animate-pulse"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Navbar />
        <div className="h-16" />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-lg font-semibold mb-2" style={{fontFamily: 'Poppins'}}>
              {error || 'Listing not found'}
            </p>
            <button 
              onClick={() => navigate('/')}
              className="text-teal-700 hover:underline"
              style={{fontFamily: 'Poppins'}}
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Dynamic Meta Tags for Social Sharing */}
      <Helmet>
        <title>{listing ? `${listing.title} - Kelsey's Homestay` : 'Property Details - Kelsey\'s Homestay'}</title>
        <meta name="description" content={listing?.description || 'Discover this amazing property at Kelsey\'s Homestay. Book your stay today!'} />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:title" content={listing ? `${listing.title} - Kelsey's Homestay` : 'Property Details - Kelsey\'s Homestay'} />
        <meta property="og:description" content={listing?.description || 'Discover this amazing property at Kelsey\'s Homestay. Book your stay today!'} />
        <meta property="og:image" content={listing?.main_image_url || `${window.location.origin}/avida.jpg`} />
        <meta property="og:url" content={`${window.location.origin}/unit/${id}`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Kelsey's Homestay" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={listing ? `${listing.title} - Kelsey's Homestay` : 'Property Details - Kelsey\'s Homestay'} />
        <meta name="twitter:description" content={listing?.description || 'Discover this amazing property at Kelsey\'s Homestay. Book your stay today!'} />
        <meta name="twitter:image" content={listing?.main_image_url || `${window.location.origin}/avida.jpg`} />
        
        {/* Additional Meta Tags */}
        <meta name="keywords" content={`${listing?.title || 'property'}, ${listing?.location || 'accommodation'}, ${listing?.property_type || 'rental'}, Kelsey's Homestay, booking, vacation rental`} />
        <meta name="author" content="Kelsey's Homestay" />
        <link rel="canonical" href={`${window.location.origin}/unit/${id}`} />
        
        {/* Property-specific Meta Tags */}
        {listing && (
          <>
            <meta property="og:price:amount" content={listing.price?.toString() || ''} />
            <meta property="og:price:currency" content={listing.currency || 'USD'} />
            {listing.latitude && <meta property="place:location:latitude" content={listing.latitude.toString()} />}
            {listing.longitude && <meta property="place:location:longitude" content={listing.longitude.toString()} />}
            <meta property="business:contact_data:street_address" content={listing.location || ''} />
            {listing.city && <meta property="business:contact_data:locality" content={listing.city} />}
            {listing.country && <meta property="business:contact_data:country_name" content={listing.country} />}
          </>
        )}
      </Helmet>

      <Navbar />
      <div className="h-16" />

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                Share Property
              </h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* Link Display */}
            <div className="mb-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                <div className="flex-1 text-sm text-gray-600 truncate" style={{fontFamily: 'Poppins'}}>
                  {`${window.location.origin}/unit/${id}`}
                </div>
                <button 
                  onClick={handleCopyLink}
                  className={`px-3 py-1 text-white text-sm rounded-md transition-all duration-200 ${
                    isLinkCopied 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-teal-700 hover:bg-teal-800'
                  }`}
                  style={{fontFamily: 'Poppins', fontWeight: 500}}
                >
                  {isLinkCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Facebook */}
              <button 
                onClick={handleFacebookShare}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm" style={{fontFamily: 'Poppins', fontWeight: 600}}>Facebook</div>
                </div>
              </button>

              {/* Twitter */}
              <button 
                onClick={handleTwitterShare}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm" style={{fontFamily: 'Poppins', fontWeight: 600}}>Twitter</div>
                </div>
              </button>

              {/* WhatsApp */}
              <button 
                onClick={handleWhatsAppShare}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"></path>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm" style={{fontFamily: 'Poppins', fontWeight: 600}}>WhatsApp</div>
                </div>
              </button>

              {/* Email */}
              <button 
                onClick={handleEmailShare}
                className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm" style={{fontFamily: 'Poppins', fontWeight: 600}}>Email</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button 
              onClick={handleCloseImageModal}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Previous Button */}
            {listing && (listing.image_urls?.length || 0) > 0 && (
              <button 
                onClick={handlePrevImage}
                disabled={isImageTransitioning}
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-200 z-10 p-2 rounded-full hover:bg-white/10 ${
                  isImageTransitioning ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                }`}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
              </button>
            )}

            {/* Next Button */}
            {listing && (listing.image_urls?.length || 0) > 0 && (
              <button 
                onClick={handleNextImage}
                disabled={isImageTransitioning}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-all duration-200 z-10 p-2 rounded-full hover:bg-white/10 ${
                  isImageTransitioning ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                }`}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              </button>
            )}

            {/* Image */}
            <div className="w-full h-full flex items-center justify-center p-8">
              <img 
                src={getCurrentImageUrl()} 
                className={`max-w-full max-h-full object-contain rounded-lg transition-all duration-300 ease-in-out ${
                  isImageTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                }`}
                alt={`Property image ${currentImageIndex + 1}`} 
                style={{maxWidth: '90vw', maxHeight: '90vh'}}
              />
            </div>

            {/* Image Counter */}
            {listing && (listing.image_urls?.length || 0) > 0 && (
              <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full transition-all duration-300 ${
                isImageTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
              }`}>
                {currentImageIndex + 1} / {1 + (listing.image_urls?.length || 0)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content - Single Column Layout */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col xl:flex-row gap-8">
            {/* Left Column - Property Details */}
            <div className="flex-1">
              {/* Image Gallery */}
              <div className="mb-8">
                {listing.image_urls && listing.image_urls.length > 0 ? (
                  // Show grid layout when there are additional images
                  <div className="grid grid-cols-3 gap-3 h-64">
                    <div className="col-span-2 h-full w-full cursor-pointer overflow-hidden" onClick={() => handleImageClick(0)}>
                      <img 
                        src={listing.main_image_url || '/avida.jpg'} 
                        className="h-full w-full object-cover rounded-lg hover:opacity-90 transition-opacity" 
                        style={{aspectRatio: '16/9', maxHeight: '100%'}}
                        alt="main" 
                      />
                    </div>
                    <div className="col-span-1 flex flex-col gap-3">
                      {listing.image_urls.slice(0, 2).map((imageUrl, index) => (
                        <div key={index} className="cursor-pointer" onClick={() => handleImageClick(index + 1)}>
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
                  // Show single image when no additional images
                  <div className="w-full flex justify-center cursor-pointer" onClick={() => handleImageClick(0)}>
                    <img 
                      src={listing.main_image_url || '/avida.jpg'} 
                      className="max-w-full h-auto object-contain rounded-lg hover:opacity-90 transition-opacity" 
                      alt="main" 
                    />
                  </div>
                )}
              </div>

              {/* Property Title and Location */}
              <div className={`mb-6 ${listing.image_urls && listing.image_urls.length > 0 ? 'mt-20' : 'mt-8'}`}>
                <h1 className="text-3xl font-bold mb-3" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                  {listing.title}
                </h1>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span className="text-base" style={{fontFamily: 'Poppins'}}>
                      {listing.location}
                    </span>
                  </div>
                  {/* Action Icons */}
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleShare}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Share this property"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16,6 12,2 8,6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Property Details Table */}
              <div className="grid grid-cols-4 gap-0 border border-gray-200 rounded-xl overflow-hidden mb-8">
                <div className="p-6 border-r border-gray-200">
                  <p className="text-base text-gray-600 mb-2" style={{fontFamily: 'Poppins'}}>Bedroom</p>
                  <p className="text-xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                    {listing.bedrooms}
                  </p>
                </div>
                <div className="p-6 border-r border-gray-200">
                  <p className="text-base text-gray-600 mb-2" style={{fontFamily: 'Poppins'}}>Bathroom</p>
                  <p className="text-xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                    {listing.bathrooms}
                  </p>
                </div>
                <div className="p-6 border-r border-gray-200">
                  <p className="text-base text-gray-600 mb-2" style={{fontFamily: 'Poppins'}}>Area</p>
                  <p className="text-xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                    {listing.square_feet ? `${listing.square_feet} sqft` : 'N/A'}
                  </p>
                </div>
                <div className="p-6">
                  <p className="text-base text-gray-600 mb-2" style={{fontFamily: 'Poppins'}}>Type</p>
                  <p className="text-xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                    {listing.property_type}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg font-bold mb-3" style={{fontFamily: 'Poppins', fontWeight: 700}}>Description</h2>
                <p className="text-base text-gray-600 mb-3" style={{fontFamily: 'Poppins'}}>
                  {listing.description || 'No description available for this property.'}
                </p>
                {listing.description && listing.description.length > 200 && (
                  <button className="text-base text-black font-semibold hover:underline" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                    Show More
                  </button>
                )}
              </div>
            </div>

            {/* Right Column - Booking Sidebar */}
            <div className="w-full xl:w-96">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
                <div className="mb-6">
                  <h3 className="text-xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                    {listing.title}
                  </h3>
                  <div className="mt-2">
                    <span className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>
                      {listing.is_featured ? 'Featured Property' : 'Available Property'}
                    </span>
                    <span className="text-sm text-gray-500 mx-1" style={{fontFamily: 'Poppins'}}>•</span>
                    <span className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>
                      {listing.property_type}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                      {listing.currency} {listing.price?.toLocaleString()}
                    </span>
                    <span className="ml-2 text-base text-gray-500" style={{fontFamily: 'Poppins'}}>
                      per {listing.price_unit}
                    </span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-2" style={{fontFamily: 'Poppins'}}>Check in</p>
                      <p className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>12:00 PM</p>
                  </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2" style={{fontFamily: 'Poppins'}}>Check out</p>
                      <p className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>10:00 AM</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2" style={{fontFamily: 'Poppins'}}>Guest Limit</p>
                    <div className="flex items-center">
                      <div className="flex -space-x-1 mr-3">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                      </div>
                      <span className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                        {listing.bedrooms}-{listing.bedrooms + 1} Guests
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-base font-bold mb-3" style={{fontFamily: 'Poppins', fontWeight: 700}}>Cancellation Policies</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-2" style={{fontFamily: 'Poppins'}}>
                      Non-Refundable {listing.currency} {listing.price?.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 mb-3" style={{fontFamily: 'Poppins'}}>
                      Refundable {listing.currency} {listing.price?.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400" style={{fontFamily: 'Poppins'}}>
                      Free cancellation before check-in, after that, the reservation is non-refundable.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>Total Bill:</span>
                  <span className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                    {listing.currency} {listing.price?.toLocaleString()}
                  </span>
                </div>

                <button onClick={handleReserve} className="w-full bg-teal-700 text-white py-4 rounded-lg font-bold uppercase text-lg" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                  Reserve
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Properties available in the same area */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <h3 className="text-2xl font-bold mb-8" style={{fontFamily: 'Poppins', fontWeight: 700}}>
            Properties available in the same area
          </h3>
          {sameAreaListings.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <p className="text-xl font-semibold mb-2" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                  No Other Properties Available
                </p>
                <p className="text-gray-600" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                  There are currently no other properties available in this area.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {sameAreaListings.map((apartment) => (
                <div 
                  key={apartment.id} 
                  onClick={() => handleSameAreaListingClick(apartment.id)} 
                  className="group bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 sm:hover:-translate-y-3 border border-gray-100 cursor-pointer"
                >
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
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default UnitView;


