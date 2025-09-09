import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const ProfileCard: React.FC = () => {
  const navigate = useNavigate();

  const handleEditAccount = () => {
    console.log('Edit account clicked');
  };

  const handleEditSection = () => {
    console.log('Edit section clicked');
  };

  const handleMostRecent = () => {
    console.log('Most recent clicked');
  };

  const handleSendEmail = () => {
    console.log('Send email clicked');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Header spacer for fixed navbar */}
      <div className="h-16" />

      {/* Page content container */}
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        {/* Top profile header */}
        <div className="bg-white rounded-xl shadow border border-gray-200 px-4 sm:px-5 py-6 sm:py-7 mb-4 sm:mb-6">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 flex items-center justify-center">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.761 0 5-2.462 5-5.5S14.761 1 12 1 7 3.462 7 6.5 9.239 12 12 12zm0 2c-4.418 0-8 2.91-8 6.5V22h16v-1.5c0-3.59-3.582-6.5-8-6.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl text-black" style={{fontFamily: 'Poppins', fontWeight: 700}}>Jeric B. Mata</h1>
                  <p className="text-xs sm:text-sm text-gray-500 -mt-0.5" style={{fontFamily: 'Poppins', fontWeight: 600}}>@_jericm</p>
                </div>
                <button onClick={handleEditAccount} className="px-3 sm:px-4 py-2 rounded-lg text-white text-xs sm:text-sm" style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>Edit account</button>
              </div>
              <p className="mt-2 text-xs sm:text-sm text-gray-500 leading-snug" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
              </p>
            </div>
          </div>
        </div>

        {/* Main two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Left column (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            {/* All personal information card */}
            <div className="bg-white rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
                <h2 className="text-base sm:text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 700}}>All Personal Information</h2>
                <button onClick={handleEditSection} className="text-xs sm:text-sm px-3 py-1 rounded-md text-white" style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>Edit</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-5 py-4">
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Jeric B. Mata</p>
                  <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Full name</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>April 8 2006</p>
                  <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Birthday</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Male</p>
                  <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Gender</p>
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Matina, Davao City</p>
                  <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Location</p>
                </div>
              </div>
            </div>

            {/* Previous bookings card */}
            <div className="bg-white rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
                <h2 className="text-base sm:text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 700}}>Previous Bookings</h2>
                <button onClick={handleMostRecent} className="text-xs sm:text-sm px-3 py-1 rounded-md text-black bg-gray-100" style={{fontFamily: 'Poppins', fontWeight: 600}}>Most Recent</button>
              </div>
              <div className="divide-y divide-gray-100">
                {[1,2,3].map((i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-5 py-3">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      <img src="/avida.jpg" alt="listing" className="w-20 h-14 sm:w-24 sm:h-16 object-cover rounded-md" />
                      <div>
                        <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Apartment complex in Davao</p>
                        <p className="text-xs sm:text-[11px] text-gray-500 -mt-0.5" style={{fontFamily: 'Poppins', fontWeight: 400}}>Matina, Davao City</p>
                        <p className="text-sm sm:text-base text-black mt-1" style={{fontFamily: 'Poppins', fontWeight: 600}}>₱4,320 <span className="text-gray-500 text-xs sm:text-sm" style={{fontFamily: 'Poppins', fontWeight: 400}}>per night</span></p>
                      </div>
                    </div>
                    <button onClick={() => navigate('/unit')} className="px-3 sm:px-4 py-2 rounded-md text-sm sm:text-base bg-gray-100 w-full sm:w-auto" style={{fontFamily: 'Poppins', fontWeight: 600}}>View</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-4">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100">
                <h2 className="text-base sm:text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 700}}>Contact Information</h2>
                <button onClick={handleEditSection} className="text-xs sm:text-sm px-3 py-1 rounded-md text-white" style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>Edit</button>
              </div>
              <div className="px-4 sm:px-5 py-4 space-y-4">
                <div>
                  <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>matajeric2006@gmail.com</p>
                  <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>email address</p>
                </div>
                <div>
                  <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>+63 241 485 1424</p>
                  <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>phone number</p>
                </div>
                <div>
                  <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Jeric B. Mata</p>
                  <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>LinkedIn Account</p>
                </div>
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <p className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Work hours</p>
                    <p className="text-[11px] sm:text-xs text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>10 AM - 4PM</p>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-sm sm:text-base text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Set Status</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 sm:w-10 sm:h-5 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors"></div>
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4 sm:peer-checked:translate-x-5"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer teaser matching screenshot */}
        <div className="mt-8 sm:mt-10 rounded-t-2xl overflow-hidden">
          <div className="bg-[#0B5858] text-white py-8 sm:py-10 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-center">
              <div className="flex items-center gap-3">
                <img src="/footerlogo.png" alt="logo" className="h-12 sm:h-14 w-auto" />
              </div>
              <div className="text-center md:text-right">
                <p className="text-lg md:text-2xl mb-4" style={{fontFamily: 'Poppins', fontWeight: 600}}>For more inquiries please<br/>contact us via email</p>
                <div className="flex md:justify-end justify-center">
                  <input className="p-3 rounded-l-2xl text-black w-56 sm:w-72" placeholder="Your email" />
                  <button onClick={handleSendEmail} className="bg-yellow-400 text-black px-5 sm:px-6 rounded-r-2xl" style={{fontFamily: 'Poppins', fontWeight: 600}}>Send</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;



