
import React from 'react';
import type { Listing } from '../../../types/listing';
import ImageGallery, { ImageGallerySkeleton } from './left/ImageGallery';
import TitleLocation, { TitleLocationSkeleton } from './left/TitleLocation';
import PropertyDetailsTable, { PropertyDetailsTableSkeleton } from './left/PropertyDetailsTable';
import DescriptionSection, { DescriptionSectionSkeleton } from './left/DescriptionSection';

interface LeftColumnProps {
  listing: Listing | null;
  isLoading: boolean;
  error?: string | null;
  onImageClick: (index: number) => void;
}

/**
 * LeftColumn component - Property details with skeleton loading
 * JSDoc: Displays property details, image gallery, and description with loading and error states
 */
const LeftColumn: React.FC<LeftColumnProps> = ({
  listing,
  isLoading,
  error,
  onImageClick
}) => {
  if (isLoading) {
    return (
      <div className="flex-1">
        <ImageGallerySkeleton />
        <TitleLocationSkeleton />
        <PropertyDetailsTableSkeleton />
        <DescriptionSectionSkeleton />
      </div>
    );
  }

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
      <ImageGallery
        mainImageUrl={listing.main_image_url || ''}
        imageUrls={listing.image_urls || []}
        onImageClick={onImageClick}
      />
      <TitleLocation
        title={listing.title}
        location={listing.location}
        imageUrls={listing.image_urls || []}
      />
      <PropertyDetailsTable
        bedrooms={listing.bedrooms}
        bathrooms={listing.bathrooms}
        squareFeet={listing.square_feet}
        propertyType={listing.property_type}
      />
      <DescriptionSection
        description={listing.description}
      />
    </div>
  );
};

export default LeftColumn;
