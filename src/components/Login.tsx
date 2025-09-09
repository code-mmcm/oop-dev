import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex relative" style={{backgroundColor: '#0B5858'}}>
      {/* Background design image - full page */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: "url('./bg.png')"
        }}
      />
      
      {/* Left Section - Welcome Panel */}
      <div className="flex-1 relative overflow-hidden z-10">
        
        {/* Content */}
        <div className="relative z-10 p-12 h-full flex flex-col">
          {/* Logo */}
          <div className="pt-8 mb-16 ml-8">
            <Link to="/" className="block">
              <img src="/logo.png" alt="kelsey's homestay" className="h-20 w-auto hover:opacity-80 transition-opacity" />
            </Link>
          </div>
          
          {/* Greeting */}
          <div className="mb-6 ml-8 mt-8">
            <h1 className="text-white text-6xl mb-2" style={{fontFamily: 'Poppins', fontWeight: 400}}>
              Hello,<br />
              <span className="text-yellow-400" style={{fontFamily: 'Poppins', fontWeight: 600}}>welcome!</span>
            </h1>
          </div>
          
          {/* Tagline */}
          <div className="ml-8">
            <p className="text-white text-2xl" style={{fontFamily: 'Poppins', fontWeight: 400}}>
              TAGLINE
            </p>
          </div>
        </div>
      </div>
      
      {/* Right Section - Login Form */}
      <div className="flex-1 flex items-center justify-center p-12 relative z-10">
        <div className="w-full max-w-lg">
          {/* Login Form Card */}
          <div className="bg-white rounded-3xl shadow-xl p-10">
            {/* Title */}
            <h2 className="text-black text-center text-3xl mb-2" style={{fontFamily: 'Poppins', fontWeight: 700}}>
              Log In
            </h2>
            
            {/* Sign Up Link */}
            <p className="text-gray-600 text-center text-sm mb-8" style={{fontFamily: 'Poppins', fontWeight: 400}}>
              Don't have an account? <a href="#" className="underline" style={{color: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}>Sign Up</a>
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm" style={{fontFamily: 'Poppins'}}>
                {error}
              </div>
            )}
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
              {/* Email Field */}
              <div className="relative">
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center z-10" style={{backgroundColor: '#0B5858'}}>
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full py-2 pl-12 pr-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-md"
                  style={{fontFamily: 'Poppins', fontWeight: 400}}
                />
              </div>
              
              {/* Password Field */}
              <div className="relative">
                <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center z-10" style={{backgroundColor: '#0B5858'}}>
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full py-2 pl-12 pr-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-gray-400 hover:shadow-md"
                  style={{fontFamily: 'Poppins', fontWeight: 400}}
                />
              </div>
              
              {/* Options */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 font-poppins" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="hover:opacity-80" style={{color: '#0B5858', fontFamily: 'Poppins', fontWeight: 400}}>
                    Forgot password?
                  </a>
                </div>
              </div>
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-3xl text-white text-lg transition-all duration-300 hover:opacity-90 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                style={{backgroundColor: '#0B5858', fontFamily: 'Poppins', fontWeight: 600}}
              >
                {loading ? (
                  <div className="flex items-center justify-center animate-pulse">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span className="animate-pulse">Loading...</span>
                  </div>
                ) : (
                  <span className="group-hover:animate-pulse">Log In</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
