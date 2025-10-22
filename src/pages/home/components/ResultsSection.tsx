import React from 'react';
import type { ListingView } from '../../../types/listing';
import Listings from './Listings';

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
          
          {/* Recently added dropdown */}
          <div className="relative animate-fade-in-right self-start sm:self-auto" style={{animationDelay: '2.0s', animationDuration: '400ms'}}>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                onSearch();
              }}
              className="appearance-none bg-white border-none text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-poppins text-sm cursor-pointer focus:outline-none transition-all duration-300 hover:scale-105"
              style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}
            >
              <option value="Recently added">Recently added</option>
              <option value="Price: Low to High">Price: Low to High</option>
              <option value="Price: High to Low">Price: High to Low</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
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
