import React from 'react';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0B5858] leading-tight" style={{fontFamily: 'Poppins'}}>
                Travel Made Simple<br />
                Comfort Made Certain
              </h1>
              <p className="text-lg md:text-xl text-gray-600 max-w-lg" style={{fontFamily: 'Poppins'}}>
                Finding the perfect stay made effortless. Trusted listings, comfort that feels like home.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-8 py-4 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-500 transition-colors duration-200"
                style={{fontFamily: 'Poppins'}}
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors duration-200"
                style={{fontFamily: 'Poppins'}}
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Get Started
              </Link>
            </div>

            {/* Search Bar */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-lg">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search Location"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B5858] focus:border-transparent"
                    style={{fontFamily: 'Poppins'}}
                  />
                </div>
                <div className="flex-1">
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B5858] focus:border-transparent" style={{fontFamily: 'Poppins'}}>
                    <option>Price Range</option>
                    <option>Under $50</option>
                    <option>$50 - $100</option>
                    <option>$100 - $200</option>
                    <option>Above $200</option>
                  </select>
                </div>
                <button className="inline-flex items-center justify-center px-6 py-3 bg-[#0B5858] text-white font-semibold rounded-lg hover:bg-[#0a4a4a] transition-colors duration-200" style={{fontFamily: 'Poppins'}}>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* Right side - Featured Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/heroimage.png"
                alt="Luxurious living room with panoramic view"
                className="w-full h-96 md:h-[500px] object-cover"
              />
              {/* Image carousel dots */}
              <div className="absolute bottom-4 right-4 flex space-x-2">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
