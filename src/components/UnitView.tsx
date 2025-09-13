import React from 'react';
import Navbar from './Navbar';

const UnitView: React.FC = () => {
  const handleReserve = () => {
    console.log('Reserve clicked');
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <div className="h-16" />

      {/* Main Content - Single Column Layout */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col xl:flex-row gap-8">
            {/* Left Column - Property Details */}
            <div className="flex-1">
              {/* Image Gallery */}
              <div className="mb-8">
                <div className="grid grid-cols-3 gap-3 h-80">
                  <img src="/avida.jpg" className="col-span-2 h-full w-full object-cover rounded-lg" alt="main" />
                  <div className="col-span-1 flex flex-col gap-3">
                    <img src="/avida.jpg" className="h-38 w-full object-cover rounded-lg" alt="thumb1" />
                    <img src="/avida.jpg" className="h-38 w-full object-cover rounded-lg" alt="thumb2" />
                  </div>
                </div>
              </div>

              {/* Property Title and Location */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-3" style={{fontFamily: 'Poppins', fontWeight: 700}}>Kelsey Deluxe</h1>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span className="text-base" style={{fontFamily: 'Poppins'}}>Palm Drive, Davao City</span>
                  </div>
                  {/* Action Icons */}
                  <div className="flex items-center gap-4">
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16,6 12,2 8,6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                      </svg>
                    </button>
                    <button className="text-gray-400 hover:text-gray-600">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Property Details Table */}
              <div className="grid grid-cols-4 gap-0 border border-gray-200 rounded-xl overflow-hidden mb-8">
                <div className="p-6 border-r border-gray-200">
                  <p className="text-base text-gray-600 mb-2" style={{fontFamily: 'Poppins'}}>Bedroom</p>
                  <p className="text-xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>3</p>
                </div>
                <div className="p-6 border-r border-gray-200">
                  <p className="text-base text-gray-600 mb-2" style={{fontFamily: 'Poppins'}}>Bathroom</p>
                  <p className="text-xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>2</p>
                </div>
                <div className="p-6 border-r border-gray-200">
                  <p className="text-base text-gray-600 mb-2" style={{fontFamily: 'Poppins'}}>Area</p>
                  <p className="text-xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>1,024 ft</p>
                </div>
                <div className="p-6">
                  <p className="text-base text-gray-600 mb-2" style={{fontFamily: 'Poppins'}}>Parking</p>
                  <p className="text-xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>Indoor</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg font-bold mb-3" style={{fontFamily: 'Poppins', fontWeight: 700}}>Description</h2>
                <p className="text-base text-gray-600 mb-3" style={{fontFamily: 'Poppins'}}>
                  Lorem ipsum dolor sit amet. Rem nobis atque ea autem tenetur et consectetur deserunt ut impedit quia. Aut Quis quis qui magnam consequatur ut ullam expedita est impedit...
                </p>
                <button className="text-base text-black font-semibold hover:underline" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                  Show More
                </button>
              </div>
            </div>

            {/* Right Column - Booking Sidebar */}
            <div className="w-full xl:w-96">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
                <div className="mb-6">
                  <h3 className="text-xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>Baste Residence</h3>
                  <div className="mt-2">
                    <span className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>Unclock superhost</span>
                    <span className="text-sm text-gray-500 mx-1" style={{fontFamily: 'Poppins'}}>•</span>
                    <span className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>Great Location</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>₱ 2,095</span>
                    <span className="ml-2 text-base text-gray-500" style={{fontFamily: 'Poppins'}}>per Night</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-2" style={{fontFamily: 'Poppins'}}>Check in</p>
                      <p className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>12:00 PM</p>
                  </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2" style={{fontFamily: 'Poppins'}}>Check out</p>
                      <p className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>10:00 AM</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-2" style={{fontFamily: 'Poppins'}}>Guest Limit</p>
                    <div className="flex items-center">
                      <div className="flex -space-x-1 mr-3">
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                        <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                        </div>
                      </div>
                      <span className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>2-3 Guests</span>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-base font-bold mb-3" style={{fontFamily: 'Poppins', fontWeight: 700}}>Cancellation Policies</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-2" style={{fontFamily: 'Poppins'}}>Non-Refundable ₱ 2,095</p>
                    <p className="text-sm text-gray-500 mb-3" style={{fontFamily: 'Poppins'}}>Refundable ₱ 2,095</p>
                    <p className="text-sm text-gray-400" style={{fontFamily: 'Poppins'}}>Free cancellation before September 21, after that, the reservation is non-refundable.</p>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <span className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>Total Bill:</span>
                  <span className="text-base font-bold" style={{fontFamily: 'Poppins', fontWeight: 700}}>₱ 2,095</span>
                </div>

                <button onClick={handleReserve} className="w-full bg-teal-700 text-white py-4 rounded-lg font-bold uppercase text-lg" style={{fontFamily: 'Poppins', fontWeight: 700}}>
                  Reserve
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Properties available in the same area */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h3 className="text-2xl font-bold mb-8" style={{fontFamily: 'Poppins', fontWeight: 700}}>Properties available in the same area</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img src="/avida.jpg" alt="apartment interior" className="h-48 w-full object-cover" />
                <div className="p-4">
                  <div className="mb-3">
                    <p className="text-base font-semibold text-gray-800 mb-1" style={{fontFamily: 'Poppins', fontWeight: 600}}>₱ 4,320 / night</p>
                    <p className="text-base text-gray-600 mb-1" style={{fontFamily: 'Poppins'}}>Apartment complex in Davao</p>
                    <p className="text-base text-gray-600" style={{fontFamily: 'Poppins'}}>Matina, Aplaya Davao City</p>
                  </div>
                  <p className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>2 beds | 1 bathroom | 215sqft</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-[#0B5858] text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
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
                <button className="bg-yellow-400 text-black p-4 rounded-r-2xl font-poppins font-medium text-base transition-all duration-300 hover:bg-yellow-500 hover:scale-105 active:scale-95" style={{fontFamily: 'Poppins', fontWeight: 500}}>
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

export default UnitView;


