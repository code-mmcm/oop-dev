import React, { useState, useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import { useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize Lenis for smooth scrolling
    lenisRef.current = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    function raf(time: number) {
      lenisRef.current?.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Cleanup Lenis on unmount
    return () => {
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 w-full py-4 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/70 backdrop-blur-md shadow-lg border-b border-white/20' 
        : 'bg-white shadow-md'
    }`}>
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between px-4 sm:px-8">
        {/* Brand/Logo with house icon */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform duration-300"
        >
          <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xl sm:text-2xl font-bold text-indigo-700">Kelsey's</span>
        </div>
        
        {/* Desktop Navigation Links - Hidden on mobile */}
        <div className="hidden lg:flex items-center gap-8">
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
        
        {/* Desktop Action Buttons - Hidden on mobile */}
        <div className="hidden lg:flex gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-3 border-2 border-indigo-700 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-all duration-300"
          >
            Login
          </button>
          <button className="px-6 py-3 bg-indigo-700 text-white font-semibold rounded-lg hover:bg-indigo-800 transition-all duration-300">
            Sign up
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMobileMenu}
          className="lg:hidden p-2 text-gray-800 hover:text-indigo-700 transition-colors duration-300"
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden">
          {/* Mobile Menu */}
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 z-50">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-3">
                <a 
                  href="#" 
                  className="block px-4 py-3 bg-indigo-100 text-indigo-700 font-semibold rounded-lg"
                  onClick={closeMobileMenu}
                >
                  Rent
                </a>
                <a 
                  href="#" 
                  className="block px-4 py-3 text-gray-800 font-medium hover:text-indigo-700 transition-colors duration-300"
                  onClick={closeMobileMenu}
                >
                  Buy
                </a>
                <a 
                  href="#" 
                  className="block px-4 py-3 text-gray-800 font-medium hover:text-indigo-700 transition-colors duration-300"
                  onClick={closeMobileMenu}
                >
                  Sell
                </a>
                <div className="px-4 py-3 text-gray-800 font-medium">
                  <div className="flex items-center justify-between">
                    <span>Manage Property</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="px-4 py-3 text-gray-800 font-medium">
                  <div className="flex items-center justify-between">
                    <span>Resources</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Mobile Action Buttons */}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <button 
                  onClick={() => {
                    navigate('/login');
                    closeMobileMenu();
                  }}
                  className="w-full px-6 py-3 border-2 border-indigo-700 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-50 transition-all duration-300"
                >
                  Login
                </button>
                <button 
                  className="w-full px-6 py-3 bg-indigo-700 text-white font-semibold rounded-lg hover:bg-indigo-800 transition-all duration-300"
                  onClick={closeMobileMenu}
                >
                  Sign up
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
