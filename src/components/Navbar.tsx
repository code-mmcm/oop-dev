import React, { useState, useEffect } from 'react';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 w-full py-4 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/70 backdrop-blur-md shadow-lg border-b border-white/20' 
        : 'bg-white shadow-md'
    }`}>
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between px-8">
        {/* Brand/Logo with house icon */}
        <div className="flex items-center gap-2">
          <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-2xl font-bold text-indigo-700">Kelsey's</span>
        </div>
        
        {/* Navigation Links */}
        <div className="flex items-center gap-8">
          <a href="#" className="px-4 py-2 bg-indigo-100 text-indigo-700 font-semibold rounded-lg">
            Rent
          </a>
          <a href="#" className="text-gray-800 font-medium hover:text-indigo-700 transition-colors duration-300">
            Buy
          </a>
          <a href="#" className="text-gray-800 font-medium hover:text-indigo-700 transition-colors duration-300">
            Sell
          </a>
          <div className="flex items-center gap-2 text-gray-800 font-medium hover:text-indigo-700 transition-colors duration-300 cursor-pointer">
            <span>Manage Property</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <div className="flex items-center gap-2 text-gray-800 font-medium hover:text-indigo-700 transition-colors duration-300 cursor-pointer">
            <span>Resources</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4">
          <button className="px-6 py-3 border-2 border-indigo-700 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-all duration-300">
            Login
          </button>
          <button className="px-6 py-3 bg-indigo-700 text-white font-semibold rounded-lg hover:bg-indigo-800 transition-all duration-300">
            Sign up
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
