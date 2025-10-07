import React from 'react';

const DiscoverConnectStay: React.FC = () => {
  const features = [
    {
      id: 1,
      title: 'Find Properties',
      description: 'Browse through our curated selection of premium accommodations',
      icon: (
        <svg className="w-8 h-8 text-[#0B5858]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      )
    },
    {
      id: 2,
      title: 'Leave a Review',
      description: 'Share your experience and help others make informed decisions',
      icon: (
        <svg className="w-8 h-8 text-[#0B5858]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      )
    },
    {
      id: 3,
      title: 'Book a Stay',
      description: 'Secure your perfect accommodation with our easy booking system',
      icon: (
        <svg className="w-8 h-8 text-[#0B5858]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
        </svg>
      )
    },
    {
      id: 4,
      title: 'Be Our Agent',
      description: 'Join our network of trusted property managers and hosts',
      icon: (
        <svg className="w-8 h-8 text-[#0B5858]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
        </svg>
      )
    },
    {
      id: 5,
      title: 'Be Our Guest',
      description: 'Experience exceptional hospitality and create lasting memories',
      icon: (
        <svg className="w-8 h-8 text-[#0B5858]" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
      )
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-16">
          <div className="mb-8 lg:mb-0">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B5858] mb-4" style={{fontFamily: 'Poppins'}}>
              Discover. Connect. Stay.
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl" style={{fontFamily: 'Poppins'}}>
              Search, book, or be part of our community.
            </p>
          </div>
          <button className="inline-flex items-center justify-center px-8 py-4 bg-[#0B5858] text-white font-semibold rounded-lg hover:bg-[#0a4a4a] transition-colors duration-200" style={{fontFamily: 'Poppins'}}>
            Discover More
          </button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-800" style={{fontFamily: 'Poppins'}}>
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed" style={{fontFamily: 'Poppins'}}>
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DiscoverConnectStay;
