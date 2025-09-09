import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B5858] text-white py-12 px-4 animate-fade-in-up">
      <div className="max-w-7xl mx-auto">
        {/* Top section of footer */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-8">
          {/* Logo */}
          <div className="flex items-center mb-8 md:mb-0 animate-fade-in-left" style={{animationDelay: '0.2s'}}>
            <img 
              src="./footerlogo.png" 
              alt="Kelsey's Homestay Logo" 
              className="w-60 h-auto hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Contact Section */}
          <div className="text-center md:text-right animate-fade-in-right" style={{animationDelay: '0.3s'}}>
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
  );
};

export default Footer;
