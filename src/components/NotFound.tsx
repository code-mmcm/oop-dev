import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20 mt-15">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Number */}
          <div className="mb-6">
            <h1 
              className="text-8xl sm:text-9xl font-bold mb-4" 
              style={{ 
                fontFamily: 'Poppins',
                color: '#0B5858'
              }}
            >
              404
            </h1>
            
            <div className="w-24 h-1 mx-auto mb-6" style={{ backgroundColor: '#0B5858' }}></div>
            
            <h2 
              className="text-2xl sm:text-3xl font-semibold mb-4" 
              style={{ 
                fontFamily: 'Poppins',
                color: '#1F2937'
              }}
            >
              Page Not Found
            </h2>
            
            <p 
              className="text-gray-600 text-base sm:text-lg max-w-md mx-auto mb-8" 
              style={{ fontFamily: 'Poppins' }}
            >
              Sorry, we couldn't find the page you're looking for. It might have been removed, renamed, or doesn't exist.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              style={{ fontFamily: 'Poppins' }}
            >
              Go Back
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-8 py-3 text-white rounded-lg font-medium hover:opacity-90 transition-opacity duration-200 cursor-pointer"
              style={{ 
                fontFamily: 'Poppins',
                backgroundColor: '#0B5858'
              }}
            >
              Back to Home
            </button>
          </div>

          {/* Helpful Links */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: 'Poppins' }}>
              Looking for something else?
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => navigate('/listings')}
                className="text-sm font-medium hover:underline cursor-pointer"
                style={{ fontFamily: 'Poppins', color: '#0B5858' }}
              >
                View Listings
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => navigate('/help-and-support')}
                className="text-sm font-medium hover:underline cursor-pointer"
                style={{ fontFamily: 'Poppins', color: '#0B5858' }}
              >
                Help & Support
              </button>
              <span className="text-gray-300">•</span>
              <button
                onClick={() => navigate('/profile')}
                className="text-sm font-medium hover:underline cursor-pointer"
                style={{ fontFamily: 'Poppins', color: '#0B5858' }}
              >
                My Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;

