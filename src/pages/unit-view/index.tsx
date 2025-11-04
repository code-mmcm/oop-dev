import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMetaTags } from '../../hooks/useMetaTags';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import BookingForm from '../booking/components/BookingForm';
import { ListingService } from '../../services/listingService';
import type { Listing, ListingView } from '../../types/listing';
import type { BookingFormData } from '../../types/booking';
import { getLenis } from '../../App';
import LeftColumn from './components/LeftColumn';
import RightColumn from './components/RightColumn';
import TabsSection from './components/TabsSection';
import PropertiesInSameArea from './components/PropertiesInSameArea';
import ShareModal from './components/ShareModal';

const UnitView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [sameAreaListings, setSameAreaListings] = useState<ListingView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [, setShowImageModal] = useState(false);
  const [, setCurrentImageIndex] = useState(0);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Set meta tags for SEO and social sharing
  useMetaTags({
    title: listing ? `${listing.title} - Kelsey's Homestay` : 'Property Details - Kelsey\'s Homestay',
    description: listing?.description || 'Discover this amazing property at Kelsey\'s Homestay. Book your stay today!',
    keywords: `${listing?.title || 'property'}, ${listing?.location || 'accommodation'}, ${listing?.property_type || 'rental'}, Kelsey's Homestay, booking, vacation rental`,
    ogTitle: listing ? `${listing.title} - Kelsey's Homestay` : 'Property Details - Kelsey\'s Homestay',
    ogDescription: listing?.description || 'Discover this amazing property at Kelsey\'s Homestay. Book your stay today!',
    ogImage: listing?.main_image_url || `${window.location.origin}/avida.jpg`,
    ogUrl: `${window.location.origin}/unit/${id}`,
    twitterCard: 'summary_large_image',
    twitterTitle: listing ? `${listing.title} - Kelsey's Homestay` : 'Property Details - Kelsey\'s Homestay',
    twitterDescription: listing?.description || 'Discover this amazing property at Kelsey\'s Homestay. Book your stay today!',
    twitterImage: listing?.main_image_url || `${window.location.origin}/avida.jpg`
  });

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
        
        // Check if this is a mock ID (1, 2, 3) from homepage
        const mockIds = ['1', '2', '3'];
        if (mockIds.includes(id)) {
          // Use mock data for homepage listings
          const mockListings = {
            '1': {
              id: '1',
              title: 'Apartment complex in Davao',
              location: 'Medina, Apilaya Davao City',
              city: 'Davao City',
              price: 4320,
              currency: '₱',
              price_unit: 'night',
              bedrooms: 2,
              bathrooms: 1,
              square_feet: 800,
              property_type: 'Apartment',
              description: 'A beautiful apartment complex in the heart of Davao City with modern amenities and great location.',
              main_image_url: '/heroimage.png',
              image_urls: ['/heroimage.png'],
              is_featured: true,
              is_available: true,
              latitude: 7.1907,
              longitude: 125.4553,
              country: 'Philippines',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            '2': {
              id: '2',
              title: 'Modern Condo in Manila',
              location: 'Makati, Metro Manila',
              city: 'Manila',
              price: 3500,
              currency: '₱',
              price_unit: 'night',
              bedrooms: 1,
              bathrooms: 1,
              square_feet: 600,
              property_type: 'Condo',
              description: 'Modern condominium in the business district of Makati with stunning city views.',
              main_image_url: '/heroimage.png',
              image_urls: ['/heroimage.png'],
              is_featured: false,
              is_available: true,
              latitude: 14.5547,
              longitude: 121.0244,
              country: 'Philippines',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            '3': {
              id: '3',
              title: 'Cozy House in Cebu',
              location: 'Lahug, Cebu City',
              city: 'Cebu City',
              price: 2800,
              currency: '₱',
              price_unit: 'night',
              bedrooms: 3,
              bathrooms: 2,
              square_feet: 1200,
              property_type: 'House',
              description: 'Cozy family house in a quiet neighborhood of Cebu with garden and parking space.',
              main_image_url: '/heroimage.png',
              image_urls: ['/heroimage.png'],
              is_featured: false,
              is_available: true,
              latitude: 10.3157,
              longitude: 123.8854,
              country: 'Philippines',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          };
          
          setListing(mockListings[id as keyof typeof mockListings]);
          setSameAreaListings([]); // No same area listings for mock data
        } else {
          // Fetch real data from Supabase
          const listingData = await ListingService.getListingById(id);
          setListing(listingData);
          
          // Fetch listings in the same area
          if (listingData?.city) {
            const areaListings = await ListingService.getListingsInSameArea(listingData.city, id);
            setSameAreaListings(areaListings);
          }
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
    setShowBookingForm(true);
  };

  const handleCancelBooking = () => {
    setShowBookingForm(false);
  };

  const handleCompleteBooking = async (formData: BookingFormData) => {
    try {
      // Booking is now saved in ConfirmationStep
      console.log('Booking completed for property:', listing?.id, formData);
      
      // Show success and return to property view
      setShowBookingForm(false);
      
      // You could also navigate to a confirmation page or booking list
      // navigate('/booking');
    } catch (error) {
      console.error('Error completing booking:', error);
      // Error handling is done in ConfirmationStep
    }
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


  if (isLoading) {
    return (
      <div className="min-h-screen bg-white text-black">
        <Navbar />
        <div className="h-16" />
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col xl:flex-row gap-8">
              <LeftColumn 
                listing={listing} 
                error={error} 
                onImageClick={handleImageClick}
                onShareClick={() => setShowShareModal(true)} 
              />
              <RightColumn 
                listing={listing} 
                isLoading={isLoading} 
                error={error} 
                onReserve={handleReserve} 
              />
            </div>
          </div>
        </section>
        {/* Properties available in the same area skeletons */}
        <PropertiesInSameArea
          listings={[]}
          isLoading={true}
          onCardClick={() => {}}
        />
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

  // Show booking form if user clicked Reserve
  if (showBookingForm) {
    // Calculate price per night based on price unit
    const calculatePricePerNight = () => {
      if (!listing?.price || !listing?.price_unit) return 2000; // Fallback price
      
      const price = listing.price;
      const unit = listing.price_unit.toLowerCase();
      
      switch (unit) {
        case 'daily':
          return price;
        case 'weekly':
          return Math.round(price / 7);
        case 'monthly':
          return Math.round(price / 30);
        case 'yearly':
          return Math.round(price / 365);
        default:
          return price; // Default to daily if unknown
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <BookingForm
          listingId={listing?.id}
          listing={listing}
          pricePerNight={calculatePricePerNight()}
          priceUnit={listing?.price_unit || 'daily'}
          extraGuestFeePerPerson={250} // Default extra guest fee per person
          baseGuests={2} // Default base guests included
          onCancel={handleCancelBooking}
          onComplete={handleCompleteBooking}
        />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <div className="h-16" />

      {/* ShareModal component */}
      <ShareModal
        show={showShareModal}
        onClose={() => setShowShareModal(false)}
        onCopyLink={handleCopyLink}
        isLinkCopied={isLinkCopied}
        shareUrl={`${window.location.origin}/unit/${id}`}
        onFacebookShare={handleFacebookShare}
        onTwitterShare={handleTwitterShare}
        onWhatsAppShare={handleWhatsAppShare}
        onEmailShare={handleEmailShare}
      />


      {/* Main Content - Single Column Layout */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col xl:flex-row gap-8">
            {/* Left Column - Property Details */}
            <div className="flex-1">
              <LeftColumn 
                listing={listing} 
                error={error} 
                  onImageClick={handleImageClick}
                  onShareClick={() => setShowShareModal(true)} 
              />
            </div>
            {/* Right Column - Booking Sidebar */}
            <div className="w-full xl:w-96">
              <RightColumn 
                listing={listing} 
                isLoading={isLoading} 
                error={error} 
                onReserve={handleReserve} 
              />
              {/* On mobile (below xl) render the tabs & content under the reviews/sidebar */}
              <div className="block xl:hidden mt-6">
                <TabsSection listing={listing} />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Properties available in the same area */}
      <PropertiesInSameArea
        listings={sameAreaListings}
        isLoading={isLoading}
        onCardClick={handleSameAreaListingClick}
      />
      <Footer />
    </div>
  );
};

export default UnitView;


