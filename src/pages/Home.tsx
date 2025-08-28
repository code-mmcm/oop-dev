import React, { useState, useEffect, useRef } from 'react';

const Home: React.FC = () => {
  const [searchData, setSearchData] = useState({
    location: '',
    checkIn: '02/22/2023',
    checkOut: '03/23/2023',
    guests: 'Add guests and rooms'
  });

  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({});
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

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

  const setSectionRef = (sectionId: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[sectionId] = el;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('data-section');
            if (sectionId) {
              setIsVisible(prev => ({ ...prev, [sectionId]: true }));
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => observer.disconnect();
  }, []);

  const topDestinations = [
    { name: 'New Jersey', hotels: 7, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center' },
    { name: 'Los Angeles', hotels: 13, image: 'https://images.unsplash.com/photo-1544919972-8ebeaac6c84e?w=200&h=200&fit=crop&crop=center' },
    { name: 'San Francisco', hotels: 5, image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=200&h=200&fit=crop&crop=center' },
    { name: 'Virginia', hotels: 3, image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&h=200&fit=crop&crop=center' },
    { name: 'Nevada', hotels: 11, image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=200&h=200&fit=crop&crop=center' },
    { name: 'California', hotels: 14, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=center' },
  ];

  const staycationHotels = [
    { name: 'Redac Gateway Hotel', location: 'Los Angeles', rating: 4, reviews: 5, price: '€136,00', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop&crop=center' },
    { name: 'Eastern Discovery', location: 'New York City', rating: 4, reviews: 3, price: '€189,00', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=300&h=200&fit=crop&crop=center' },
    { name: 'Southwest States', location: 'California City, CA, USA', rating: 3, reviews: 4, price: '€145,00', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=300&h=200&fit=crop&crop=center' },
    { name: 'TreeHouse Villas', location: 'Miami, FL', rating: 5, reviews: 5, price: '€220,00', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop&crop=center' },
  ];

  const recommendedHotels = [
    { name: 'TreeHouse Villas', location: 'Miami, FL', rating: 5, reviews: 5, price: '€220,00', image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=300&h=200&fit=crop&crop=center' },
    { name: 'Vnahomes Aparhotel', location: 'Barcelona, Spain', rating: 4, reviews: 4, price: '€165,00', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=300&h=200&fit=crop&crop=center' },
    { name: 'Furama Chiang Mai', location: 'Chiang Mai, Thailand', rating: 4, reviews: 3, price: '€98,00', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=300&h=200&fit=crop&crop=center' },
    { name: 'Redac Gateway Hotel', location: 'Los Angeles, CA', rating: 4, reviews: 5, price: '€136,00', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&h=200&fit=crop&crop=center' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/avida.jpg" 
            alt="Luxury hotel pool" 
            className="w-full h-full object-cover"
          />
        </div>
        
        <div className="absolute inset-0 flex flex-col justify-center items-center px-4 sm:px-8">
          <div className="text-center text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-4 text-shadow-lg">
              Find your next stay
            </h1>
            <p className="text-base sm:text-lg opacity-90 text-shadow-md px-4">
              Get the best prices on 2,000,000+ properties, worldwide
            </p>
          </div>
        </div>
      </section>
      
      {/* Search Form Section */}
      <section className="relative -mt-8 px-4 sm:px-8">
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-2xl max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex flex-col gap-2 w-full md:flex-1">
              <label htmlFor="location" className="font-semibold text-gray-700 text-sm text-left">
                Location
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  id="location"
                  placeholder="Where are you going?"
                  value={searchData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-300 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:flex-1">
              <label htmlFor="checkIn" className="font-semibold text-gray-700 text-sm text-left">
                Check in
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  type="text"
                  id="checkIn"
                  value={searchData.checkIn}
                  onChange={(e) => handleInputChange('checkIn', e.target.value)}
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-300 text-sm"
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 w-full md:flex-1">
              <label htmlFor="checkOut" className="font-semibold text-gray-700 text-sm text-left">
                Check out
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  type="text"
                  id="checkOut"
                  value={searchData.checkOut}
                  onChange={(e) => handleInputChange('checkOut', e.target.value)}
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-300 text-sm"
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 w-full md:flex-1">
              <label htmlFor="guests" className="font-semibold text-gray-700 text-sm text-left">
                Guests
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input
                  type="text"
                  id="guests"
                  value={searchData.guests}
                  onChange={(e) => handleInputChange('guests', e.target.value)}
                  className="w-full pl-10 pr-8 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 transition-all duration-300 text-sm"
                />
                <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            
            <button 
              onClick={handleSearch}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold text-base hover:bg-blue-700 transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 min-h-[48px] w-full md:w-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </div>
        </div>
      </section>
      
      {/* Promotional Banners */}
      <section 
        ref={setSectionRef('promotional')}
        data-section="promotional"
        className={`py-8 sm:py-12 md:py-16 bg-white transition-all duration-1000 ease-out ${
          isVisible['promotional'] 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Left Banner - Blue */}
            <div className="bg-blue-600 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-blue-100 mb-2 text-sm sm:text-base">Special Offer</p>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">50% OFF</h3>
                <p className="text-blue-100 mb-4 sm:mb-6 text-sm sm:text-base">Select hotel deals</p>
                <button className="bg-yellow-400 text-gray-800 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors text-sm sm:text-base">
                  Learn More
                </button>
              </div>
              {/* Decorative icons */}
              <div className="absolute right-4 top-4 opacity-20">
                <svg className="w-12 h-12 sm:w-16 sm:h-16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
            
            {/* Right Banner - Yellow */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-6 sm:p-8 text-gray-800 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-2xl sm:text-3xl font-bold mb-2">Get 20% OFF!</h3>
                <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base">Let's explore the world.</p>
                <button className="bg-blue-800 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors text-sm sm:text-base">
                  Book Now
                </button>
              </div>
              {/* Decorative icons */}
              <div className="absolute right-4 top-4 opacity-20">
                <svg className="w-12 h-12 sm:w-16 sm:h-16" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Destinations Section */}
      <section 
        ref={setSectionRef('destinations')}
        data-section="destinations"
        className={`py-8 sm:py-12 md:py-16 bg-gray-50 transition-all duration-1000 ease-out ${
          isVisible['destinations'] 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 text-center mb-8 sm:mb-12">Top destinations</h2>
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {topDestinations.map((destination, index) => (
              <div key={index} className="flex-shrink-0 text-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full overflow-hidden mb-3 sm:mb-4 mx-auto">
                  <img src={destination.image} alt={destination.name} className="w-full h-full object-cover" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-1 text-sm sm:text-base">{destination.name}</h3>
                <p className="text-gray-600 text-xs sm:text-sm">{destination.hotels} Hotels</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-6 sm:mt-8">
            <div className="flex gap-2">
              {[1, 2, 3].map((dot) => (
                <div key={dot} className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${dot === 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Plan Your Next Staycation Section */}
      <section 
        ref={setSectionRef('staycation')}
        data-section="staycation"
        className={`py-8 sm:py-12 md:py-16 bg-white transition-all duration-1000 ease-out ${
          isVisible['staycation'] 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 text-center mb-8 sm:mb-12">Plan your next staycation</h2>
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {staycationHotels.map((hotel, index) => (
              <div key={index} className="flex-shrink-0 bg-white rounded-xl shadow-lg overflow-hidden w-72 sm:w-80">
                <div className="relative">
                  <img src={hotel.image} alt={hotel.name} className="w-full h-40 sm:h-48 object-cover" />
                  <button className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">{hotel.name}</h3>
                  <p className="text-gray-600 mb-3 text-xs sm:text-sm">{hotel.location}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${i < hotel.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600">{hotel.rating}/5 Excellent ({hotel.reviews} Reviews)</span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-gray-800">{hotel.price} / night</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-6 sm:mt-8">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((dot) => (
                <div key={dot} className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${dot === 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recommended for You Section */}
      <section 
        ref={setSectionRef('recommended')}
        data-section="recommended"
        className={`py-8 sm:py-12 md:py-16 bg-gray-50 transition-all duration-1000 ease-out ${
          isVisible['recommended'] 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-12 gap-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">Recommended for you</h2>
            <div className="flex gap-3 sm:gap-4">
              <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide">
            {recommendedHotels.map((hotel, index) => (
              <div key={index} className="flex-shrink-0 bg-white rounded-xl shadow-lg overflow-hidden w-72 sm:w-80">
                <div className="relative">
                  <img src={hotel.image} alt={hotel.name} className="w-full h-40 sm:h-48 object-cover" />
                  <button className="absolute top-3 sm:top-4 right-3 sm:right-4 text-white hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  </button>
                </div>
                <div className="p-4 sm:p-6">
                  <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">{hotel.name}</h3>
                  <p className="text-gray-600 mb-3 text-xs sm:text-sm">{hotel.location}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-3 h-3 sm:w-4 sm:h-4 ${i < hotel.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600">{hotel.rating}/5 Excellent ({hotel.reviews} Reviews)</span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-gray-800">{hotel.price} / night</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-6 sm:mt-8">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((dot) => (
                <div key={dot} className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${dot === 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Signup Section */}
      <section 
        ref={setSectionRef('newsletter')}
        data-section="newsletter"
        className={`py-8 sm:py-12 md:py-16 bg-white transition-all duration-1000 ease-out ${
          isVisible['newsletter'] 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="lg:h-80 h-48 sm:h-64">
                <img 
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&crop=center" 
                  alt="Tropical beach" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">Get special offers, and more from Traveler</h3>
                <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Subscribe to see secret deals prices drop the moment you sign up!</p>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <input
                    type="email"
                    placeholder="Email Address"
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm sm:text-base"
                  />
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm sm:text-base">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
