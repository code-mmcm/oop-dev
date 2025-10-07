import React from 'react';
import { Link } from 'react-router-dom';

const FeaturedStays: React.FC = () => {
  const featuredListings = [
    {
      id: 1,
      title: 'Apartment complex in Davao',
      location: 'Medina, Apilaya Davao City',
      price: '₱ 4,320',
      priceUnit: '/night',
      image: '/heroimage.png', // Using placeholder - you can replace with actual listing images
      rating: 4.8,
      reviews: 24
    },
    {
      id: 2,
      title: 'Modern Condo in Manila',
      location: 'Makati, Metro Manila',
      price: '₱ 3,500',
      priceUnit: '/night',
      image: '/heroimage.png', // Using placeholder - you can replace with actual listing images
      rating: 4.9,
      reviews: 18
    },
    {
      id: 3,
      title: 'Cozy House in Cebu',
      location: 'Lahug, Cebu City',
      price: '₱ 2,800',
      priceUnit: '/night',
      image: '/heroimage.png', // Using placeholder - you can replace with actual listing images
      rating: 4.7,
      reviews: 31
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-16">
          <div className="text-center sm:text-left mb-6 sm:mb-0">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B5858] mb-4" style={{fontFamily: 'Poppins'}}>
              Featured Stays
            </h2>
            <p className="text-lg md:text-xl text-gray-600" style={{fontFamily: 'Poppins'}}>
              Discover the stays our guests love most.
            </p>
          </div>
          <Link
            to="/home"
            className="text-[#0B5858] hover:text-[#0a4a4a] font-medium transition-colors duration-200"
            style={{fontFamily: 'Poppins'}}
          >
            See All Listings →
          </Link>
        </div>

        {/* Featured Listings */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredListings.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Property Image */}
              <div className="relative h-64 overflow-hidden">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-800" style={{fontFamily: 'Poppins'}}>
                    {listing.rating}
                  </span>
                </div>
              </div>

              {/* Property Details */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2" style={{fontFamily: 'Poppins'}}>
                  {listing.title}
                </h3>
                <p className="text-gray-600 mb-4" style={{fontFamily: 'Poppins'}}>
                  {listing.location}
                </p>
                
                {/* Price and Reviews */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <span className="text-2xl font-bold text-gray-800" style={{fontFamily: 'Poppins'}}>
                      {listing.price}
                    </span>
                    <span className="text-gray-600" style={{fontFamily: 'Poppins'}}>
                      {listing.priceUnit}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>
                    {listing.reviews} reviews
                  </div>
                </div>

                {/* Book Button */}
                <button className="w-full bg-[#0B5858] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[#0a4a4a] transition-colors duration-200" style={{fontFamily: 'Poppins'}}>
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedStays;
