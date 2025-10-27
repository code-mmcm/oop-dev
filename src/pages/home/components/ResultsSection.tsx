import React from 'react';
import type { ListingView } from '../../../types/listing';
import Listings from './Listings';
import Dropdown from '../../../components/Dropdown';

interface ResultsSectionProps {
  apartments: ListingView[];
  isLoading: boolean;
  sortBy: string;
  setSortBy: (sort: string) => void;
  onApartmentClick: (apartmentId: string) => void;
  onSearch: () => void;
}

/**
 * ResultsSection component - Original listings section design
 * JSDoc: Contains the original listings section with header and grid
 */
const ResultsSection: React.FC<ResultsSectionProps> = ({
  apartments,
  isLoading,
  sortBy,
  setSortBy,
  onApartmentClick,
  onSearch
}) => {
  return (
    <div className="bg-white py-1 -mt-48 sm:-mt-52 md:-mt-56 animate-fade-in" style={{animationDelay: '1.6s', animationDuration: '400ms'}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-6 md:pt-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
          <h2 
            className="text-2xl sm:text-3xl font-bold text-black animate-fade-in-left"
            style={{fontFamily: 'Poppins', fontWeight: 700, animationDelay: '1.8s', animationDuration: '400ms'}}
          >
            All listings
          </h2>
          
          {/* Sort dropdown using unified Dropdown component */}
          <div className="animate-fade-in-right self-start sm:self-auto" style={{animationDelay: '1.6s'}}>
            <Dropdown
              label={sortBy}
              options={[
                { value: 'Recently added', label: 'Recently added' },
                { value: 'Price: Low to High', label: 'Price: Low to High' },
                { value: 'Price: High to Low', label: 'Price: High to Low' }
              ]}
              onSelect={(value) => {
                setSortBy(value);
                onSearch();
              }}
            />
          </div>
        </div>

        {/* Listings Grid */}
        <Listings
          apartments={apartments}
          isLoading={isLoading}
          onApartmentClick={onApartmentClick}
          error={null}
        />

        {/* See More Section */}
        <div className="flex items-center justify-center mt-8 sm:mt-12 mb-12 sm:mb-16">
          <div className="flex items-center w-full">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="px-3 sm:px-4 text-gray-600 text-xs sm:text-sm font-poppins" style={{fontFamily: 'Poppins'}}>
              See more
            </span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsSection;
