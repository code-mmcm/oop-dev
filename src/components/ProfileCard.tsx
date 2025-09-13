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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top profile header */}
        <div className="bg-white rounded-xl shadow border border-gray-200 px-8 py-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.761 0 5-2.462 5-5.5S14.761 1 12 1 7 3.462 7 6.5 9.239 12 12 12zm0 2c-4.418 0-8 2.91-8 6.5V22h16v-1.5c0-3.59-3.582-6.5-8-6.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl text-black mb-1" style={{fontFamily: 'Poppins', fontWeight: 700}}>Jeric B. Mata</h1>
                  <p className="text-base text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 600}}>@_jericm</p>
                </div>
                <button onClick={handleEditAccount} className="px-6 py-3 rounded-lg text-white text-base" style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>Edit account</button>
              </div>
              <p className="mt-4 text-base text-gray-500 leading-relaxed" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.
              </p>
            </div>
          </div>
        </div>

        {/* Main two-column layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left column (2/3) */}
          <div className="xl:col-span-2 space-y-6">
            {/* All personal information card */}
            <div className="bg-white rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h2 className="text-xl text-black" style={{fontFamily: 'Poppins', fontWeight: 700}}>All Personal Information</h2>
                <button onClick={handleEditSection} className="text-sm px-4 py-2 rounded-md text-white" style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>Edit</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 px-6 py-6">
                <div className="space-y-2">
                  <p className="text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Jeric B. Mata</p>
                  <p className="text-sm text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Full name</p>
                </div>
                <div className="space-y-2">
                  <p className="text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>April 8 2006</p>
                  <p className="text-sm text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Birthday</p>
                </div>
                <div className="space-y-2">
                  <p className="text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Male</p>
                  <p className="text-sm text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Gender</p>
                </div>
                <div className="space-y-2">
                  <p className="text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Matina, Davao City</p>
                  <p className="text-sm text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Location</p>
                </div>
              </div>
            </div>

            {/* Previous bookings card */}
            <div className="bg-white rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h2 className="text-xl text-black" style={{fontFamily: 'Poppins', fontWeight: 700}}>Previous Bookings</h2>
                <button onClick={handleMostRecent} className="text-sm px-4 py-2 rounded-md text-black bg-gray-100" style={{fontFamily: 'Poppins', fontWeight: 600}}>Most Recent</button>
              </div>
              <div className="divide-y divide-gray-100">
                {[1,2,3].map((i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4">
                    <div className="flex items-start sm:items-center gap-4">
                      <img src="/avida.jpg" alt="listing" className="w-24 h-16 object-cover rounded-md" />
                      <div>
                        <p className="text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Apartment complex in Davao</p>
                        <p className="text-sm text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>Matina, Davao City</p>
                        <p className="text-lg text-black mt-1" style={{fontFamily: 'Poppins', fontWeight: 600}}>₱4,320 <span className="text-gray-500 text-sm" style={{fontFamily: 'Poppins', fontWeight: 400}}>per night</span></p>
                      </div>
                    </div>
                    <button onClick={() => navigate('/unit')} className="px-4 py-2 rounded-md text-base bg-gray-100 w-full sm:w-auto" style={{fontFamily: 'Poppins', fontWeight: 600}}>View</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow border border-gray-200">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h2 className="text-xl text-black" style={{fontFamily: 'Poppins', fontWeight: 700}}>Contact Information</h2>
                <button onClick={handleEditSection} className="text-sm px-4 py-2 rounded-md text-white" style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>Edit</button>
              </div>
              <div className="px-6 py-6 space-y-6">
                <div>
                  <p className="text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>matajeric2006@gmail.com</p>
                  <p className="text-sm text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>email address</p>
                </div>
                <div>
                  <p className="text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>+63 241 485 1424</p>
                  <p className="text-sm text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>phone number</p>
                </div>
                <div>
                  <p className="text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Jeric B. Mata</p>
                  <p className="text-sm text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>LinkedIn Account</p>
                </div>
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <p className="text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Work hours</p>
                    <p className="text-sm text-gray-500" style={{fontFamily: 'Poppins', fontWeight: 400}}>10 AM - 4PM</p>
                  </div>
                  <div className="flex items-center justify-end gap-3">
                    <span className="text-lg text-black" style={{fontFamily: 'Poppins', fontWeight: 600}}>Set Status</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 transition-colors"></div>
                      <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section - Full Width */}
      <footer className="bg-[#0B5858] text-white py-12 w-full">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top section of footer */}
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-8">
            {/* Logo */}
            <div className="flex items-center mb-8 md:mb-0">
              <img 
                src="./footerlogo.png" 
                alt="Kelsey's Homestay Logo" 
                className="w-60 h-auto hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Contact Section */}
            <div className="text-center md:text-right">
              <p className="text-2xl font-poppins font-semibold mb-4" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                For more inquiries please<br />
                contact us via email
              </p>
              <div className="flex justify-center md:justify-end shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <input
                  type="email"
                  placeholder="Your email"
                  className="p-4 rounded-l-2xl focus:outline-none text-black w-80 text-base bg-white transition-all duration-300 focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50"
                  style={{fontFamily: 'Poppins', fontWeight: 400}}
                />
                <button onClick={handleSendEmail} className="bg-yellow-400 text-black p-4 rounded-r-2xl font-poppins font-medium text-base transition-all duration-300 hover:bg-yellow-500 hover:scale-105 active:scale-95" style={{fontFamily: 'Poppins', fontWeight: 500}}>
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Divider Line */}
          <div className="border-t border-white my-8"></div>

          {/* Bottom section of footer */}
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            {/* Copyright */}
            <p className="font-poppins mb-4 md:mb-0" style={{fontFamily: 'Poppins', fontWeight: 400}}>
              ©2025 Kelsey's Homestay. All Rights Reserved.
            </p>

            {/* Social Media */}
            <div className="flex items-center">
              <p className="font-poppins mr-4" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                Follow us on
              </p>
              <div className="flex">
                {/* Facebook Icon */}
                <a href="https://www.facebook.com/kelseycaiden" target="_blank" rel="noopener noreferrer" className="text-white">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="feather feather-facebook"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProfileCard;



