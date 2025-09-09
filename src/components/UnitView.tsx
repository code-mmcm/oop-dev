import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const UnitView: React.FC = () => {
  const navigate = useNavigate();

  const handleReserve = () => {
    console.log('Reserve clicked');
  };

  const handleSendEmail = () => {
    console.log('Send email clicked');
  };
  return (
    <div className="min-h-screen bg-[#F7F7F7] text-black">
      <Navbar />
      <div className="h-16" />

      {/* Top: Media + booking sidebar */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Gallery */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-4 gap-2">
                <img src="/avida.jpg" className="col-span-4 sm:col-span-2 h-36 sm:h-52 w-full object-cover rounded-lg" alt="main" />
                <img src="/avida.jpg" className="col-span-2 h-24 sm:h-28 w-full object-cover rounded-lg" alt="thumb1" />
                <img src="/avida.jpg" className="col-span-2 h-24 sm:h-28 w-full object-cover rounded-lg" alt="thumb2" />
              </div>

              <div className="mt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-lg sm:text-xl" style={{fontFamily: 'Poppins', fontWeight: 700}}>Kelsey Deluxe</h1>
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-600" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                      <span className="inline-flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        Palm Drive, Davao City
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2 4 4L19 4l2 2-12 12z"/></svg></button>
                    <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21v-7a4 4 0 0 1 4-4h12"/><path d="M12 7V3h4v4"/></svg></button>
                    <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V5a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking */}
            <aside>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500" style={{fontFamily: 'Poppins'}}>Sasta Residence</p>
                    <p className="text-lg" style={{fontFamily: 'Poppins', fontWeight: 700}}>₱2,095</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .66.39 1.26 1 1.51.58.24 1.24.11 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.46.58-.57 1.24-.33 1.82.24.61.84 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.66 0-1.26.39-1.51 1z"/></svg>
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="border border-gray-200 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500" style={{fontFamily: 'Poppins'}}>Check-in</p>
                    <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 600}}>12:00 PM</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500" style={{fontFamily: 'Poppins'}}>Check-out</p>
                    <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 600}}>10:00 AM</p>
                  </div>
                  <div className="col-span-2 border border-gray-200 rounded-lg p-2 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500" style={{fontFamily: 'Poppins'}}>Guests</p>
                      <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 600}}>2 Adults • 3 Guests</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>

                <div className="mt-3 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600" style={{fontFamily: 'Poppins'}}>Cancellation Policies</span>
                    <span className="text-gray-500 text-xs" style={{fontFamily: 'Poppins'}}>Policies</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600" style={{fontFamily: 'Poppins', fontWeight: 600}}>Total Bill:</span>
                    <span className="text-gray-900" style={{fontFamily: 'Poppins', fontWeight: 700}}>₱2,095</span>
                  </div>
                </div>

                <button onClick={handleReserve} className="w-full mt-4 text-white py-2 rounded-lg" style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>Reserve</button>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Description + details row */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <h4 className="text-sm text-gray-600 mb-2" style={{fontFamily: 'Poppins', fontWeight: 600}}>Description</h4>
          <p className="text-[13px] sm:text-sm text-gray-600 leading-relaxed" style={{fontFamily: 'Poppins'}}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-[11px] text-gray-500" style={{fontFamily: 'Poppins'}}>Bedrooms</p>
              <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 700}}>3</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-[11px] text-gray-500" style={{fontFamily: 'Poppins'}}>Bathrooms</p>
              <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 700}}>2</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-[11px] text-gray-500" style={{fontFamily: 'Poppins'}}>Area</p>
              <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 700}}>1,024 ft²</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-[11px] text-gray-500" style={{fontFamily: 'Poppins'}}>Parking</p>
              <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 700}}>Indoor</p>
            </div>
          </div>
        </div>
      </section>

      {/* Properties available in the same area */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <h3 className="text-base sm:text-lg mb-3" style={{fontFamily: 'Poppins', fontWeight: 700}}>Properties available in the same area</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <img src="/avida.jpg" alt="item" className="h-28 sm:h-32 w-full object-cover" />
                <div className="p-3">
                  <p className="text-[13px] sm:text-sm" style={{fontFamily: 'Poppins', fontWeight: 600}}>Apartment complex in Davao</p>
                  <p className="text-[11px] text-gray-500" style={{fontFamily: 'Poppins'}}>Kelsey, Davao City</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 600}}>₱4,320 <span className="text-[11px] text-gray-500" style={{fontFamily: 'Poppins'}}> / night</span></p>
                    <span className="text-[11px] text-gray-500" style={{fontFamily: 'Poppins'}}>2 Beds · 1 Bath</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200" style={{fontFamily: 'Poppins'}}>2 Beds</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200" style={{fontFamily: 'Poppins'}}>1 Bathroom</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200" style={{fontFamily: 'Poppins'}}>1 Night</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 border border-gray-200" style={{fontFamily: 'Poppins'}}>2 Days</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      {/* Description + details row */}
      <section className="bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <h4 className="text-sm text-gray-600 mb-2" style={{fontFamily: 'Poppins', fontWeight: 600}}>Description</h4>
          <p className="text-[13px] sm:text-sm text-gray-600 leading-relaxed" style={{fontFamily: 'Poppins'}}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-[11px] text-gray-500" style={{fontFamily: 'Poppins'}}>Bedrooms</p>
              <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 700}}>3</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-[11px] text-gray-500" style={{fontFamily: 'Poppins'}}>Bathrooms</p>
              <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 700}}>2</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-[11px] text-gray-500" style={{fontFamily: 'Poppins'}}>Area</p>
              <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 700}}>1,024 ft²</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-[11px] text-gray-500" style={{fontFamily: 'Poppins'}}>Parking</p>
              <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 700}}>Indoor</p>
            </div>
          </div>
        </div>
      </section>

      {/* Top: Media + booking sidebar */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Gallery */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-4 gap-2">
                <img src="/avida.jpg" className="col-span-4 sm:col-span-2 h-36 sm:h-52 w-full object-cover rounded-lg" alt="main" />
                <img src="/avida.jpg" className="col-span-2 h-24 sm:h-28 w-full object-cover rounded-lg" alt="thumb1" />
                <img src="/avida.jpg" className="col-span-2 h-24 sm:h-28 w-full object-cover rounded-lg" alt="thumb2" />
              </div>

              <div className="mt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-lg sm:text-xl" style={{fontFamily: 'Poppins', fontWeight: 700}}>Kelsey Deluxe</h1>
                    <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-600" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                      <span className="inline-flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        Palm Drive, Davao City
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2 4 4L19 4l2 2-12 12z"/></svg></button>
                    <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21v-7a4 4 0 0 1 4-4h12"/><path d="M12 7V3h4v4"/></svg></button>
                    <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a4 4 0 0 1-4 4H7l-4 4V5a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg></button>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking */}
            <aside>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500" style={{fontFamily: 'Poppins'}}>Sasta Residence</p>
                    <p className="text-lg" style={{fontFamily: 'Poppins', fontWeight: 700}}>₱2,095</p>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .66.39 1.26 1 1.51.58.24 1.24.11 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.46.58-.57 1.24-.33 1.82.24.61.84 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.66 0-1.26.39-1.51 1z"/></svg>
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="border border-gray-200 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500" style={{fontFamily: 'Poppins'}}>Check-in</p>
                    <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 600}}>12:00 PM</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-2">
                    <p className="text-[10px] text-gray-500" style={{fontFamily: 'Poppins'}}>Check-out</p>
                    <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 600}}>10:00 AM</p>
                  </div>
                  <div className="col-span-2 border border-gray-200 rounded-lg p-2 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-gray-500" style={{fontFamily: 'Poppins'}}>Guests</p>
                      <p className="text-sm" style={{fontFamily: 'Poppins', fontWeight: 600}}>2 Adults • 3 Guests</p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </div>

                <div className="mt-3 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600" style={{fontFamily: 'Poppins'}}>Cancellation Policies</span>
                    <span className="text-gray-500 text-xs" style={{fontFamily: 'Poppins'}}>Policies</span>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600" style={{fontFamily: 'Poppins', fontWeight: 600}}>Total Bill:</span>
                    <span className="text-gray-900" style={{fontFamily: 'Poppins', fontWeight: 700}}>₱2,095</span>
                  </div>
                </div>

                <button onClick={handleReserve} className="w-full mt-4 text-white py-2 rounded-lg" style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>Reserve</button>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};

export default UnitView;


