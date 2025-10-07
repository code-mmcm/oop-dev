import React from 'react';

const ExploreByCategory: React.FC = () => {
  const categories = [
    {
      id: 1,
      name: 'Houses',
      image: '/heroimage.png', // Using placeholder - you can replace with actual house images
      description: 'Spacious homes perfect for families'
    },
    {
      id: 2,
      name: 'Condo',
      image: '/heroimage.png', // Using placeholder - you can replace with actual condo images
      description: 'Modern apartments with amenities'
    },
    {
      id: 3,
      name: 'Rooms',
      image: '/heroimage.png', // Using placeholder - you can replace with actual room images
      description: 'Cozy private rooms for solo travelers'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2">
        <div className="w-32 h-32 bg-[#0B5858] rounded-full opacity-10"></div>
      </div>
      <div className="absolute right-0 top-1/4 transform -translate-y-1/2 translate-x-1/2">
        <div className="w-24 h-24 bg-yellow-400 rounded-full opacity-20"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0B5858] mb-4" style={{fontFamily: 'Poppins'}}>
            Explore By Category
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto" style={{fontFamily: 'Poppins'}}>
            Discover the stays our guests love most.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
                <div className="p-6 text-center">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2" style={{fontFamily: 'Poppins'}}>
                    {category.name}
                  </h3>
                  <p className="text-gray-600 text-sm" style={{fontFamily: 'Poppins'}}>
                    {category.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExploreByCategory;
