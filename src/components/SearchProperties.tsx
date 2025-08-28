import React, { useState } from 'react';
import './SearchProperties.css';

const SearchProperties: React.FC = () => {
  const [searchData, setSearchData] = useState({
    location: 'New York, USA',
    when: 'Select Move-in Date',
    price: '$500-$2,500',
    propertyType: 'Houses'
  });

  const handleInputChange = (field: string, value: string) => {
    setSearchData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    console.log('Searching with:', searchData);
    // Add your search logic here
  };

  return (
    <section className="search-properties">
      <div className="search-container">
        <div className="search-header">
          <h1 className="search-title">Search properties to rent</h1>
          <div className="search-bar-dropdown">
            <span>Search with Search Bar</span>
            <span className="dropdown-arrow">▼</span>
          </div>
        </div>
        
        <div className="search-filters">
          <div className="filter-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              value={searchData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              placeholder="Enter location"
            />
          </div>
          
          <div className="filter-group">
            <label htmlFor="when">When</label>
            <div className="input-with-icon">
              <input
                type="text"
                id="when"
                value={searchData.when}
                onChange={(e) => handleInputChange('when', e.target.value)}
                placeholder="Select Move-in Date"
              />
              <span className="calendar-icon">📅</span>
            </div>
          </div>
          
          <div className="filter-group">
            <label htmlFor="price">Price</label>
            <div className="input-with-dropdown">
              <input
                type="text"
                id="price"
                value={searchData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="Price range"
              />
              <span className="dropdown-arrow">▼</span>
            </div>
          </div>
          
          <div className="filter-group">
            <label htmlFor="propertyType">Property Type</label>
            <div className="input-with-dropdown">
              <input
                type="text"
                id="propertyType"
                value={searchData.propertyType}
                onChange={(e) => handleInputChange('propertyType', e.target.value)}
                placeholder="Property type"
              />
              <span className="dropdown-arrow">▼</span>
            </div>
          </div>
          
          <button className="search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>
    </section>
  );
};

export default SearchProperties;
