import React from 'react';

interface FiltersProps {
  searchLocation: string;
  setSearchLocation: (location: string) => void;
  priceRange: { min: number; max: number };
  setPriceRange: (range: { min: number; max: number } | ((prev: { min: number; max: number }) => { min: number; max: number })) => void;
  availableLocations: string[];
  isLocationDropdownOpen: boolean;
  setIsLocationDropdownOpen: (open: boolean) => void;
  isPriceDropdownOpen: boolean;
  setIsPriceDropdownOpen: (open: boolean) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
}

/**
 * Filters component - Search and filter controls
 * JSDoc: Provides filtering and sorting controls for property listings
 */
const Filters: React.FC<FiltersProps> = ({
  setSearchLocation,
  priceRange,
  setPriceRange,
  availableLocations,
  isLocationDropdownOpen,
  setIsLocationDropdownOpen,
  isPriceDropdownOpen,
  setIsPriceDropdownOpen,
  sortBy,
  setSortBy
}) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
      <div className="flex flex-wrap gap-4 mb-4 md:mb-0">
        {/* Location Filter */}
        <div className="relative">
          <button
            onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <span>Location</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isLocationDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search locations..."
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
                <div className="mt-2 max-h-40 overflow-y-auto">
                  {availableLocations.map((location) => (
                    <button
                      key={location}
                      onClick={() => {
                        setSearchLocation(location);
                        setIsLocationDropdownOpen(false);
                      }}
                      className="w-full text-left px-2 py-1 hover:bg-gray-100 text-sm"
                    >
                      {location}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Price Filter */}
        <div className="relative">
          <button
            onClick={() => setIsPriceDropdownOpen(!isPriceDropdownOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <span>Price Range</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isPriceDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
              <div className="p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: ${priceRange.min} - ${priceRange.max}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="100"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange((prev: { min: number; max: number }) => ({ ...prev, max: Number(e.target.value) }))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sort */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="Recently added">Recently added</option>
          <option value="Price: Low to High">Price: Low to High</option>
          <option value="Price: High to Low">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
};

export default Filters;
