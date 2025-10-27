import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface AdminStats {
  totalUsers: number;
  totalBookings: number;
  totalListings: number;
  monthlyBookings: number;
  revenue: number;
}

interface ChartData {
  name: string;
  value?: number;
  bookings?: number;
  revenue?: number;
  users?: number;
}

const AdminPanel: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { isAdmin, loading, user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBookings: 0,
    totalListings: 0,
    monthlyBookings: 0,
    revenue: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Memoized chart data
  const [weeklyUserData, setWeeklyUserData] = useState<ChartData[]>([]);
  const [weeklyBookingData, setWeeklyBookingData] = useState<ChartData[]>([]);

  const chartData = useMemo(() => {
    const monthlyData: ChartData[] = [
      { name: 'Jan', bookings: 45, revenue: 12500, users: 12 },
      { name: 'Feb', bookings: 52, revenue: 14200, users: 18 },
      { name: 'Mar', bookings: 38, revenue: 9800, users: 15 },
      { name: 'Apr', bookings: 67, revenue: 18500, users: 22 },
      { name: 'May', bookings: 73, revenue: 20100, users: 28 },
      { name: 'Jun', bookings: 89, revenue: 24500, users: 35 },
      { name: 'Jul', bookings: 95, revenue: 26200, users: 42 },
      { name: 'Aug', bookings: 78, revenue: 21500, users: 38 },
      { name: 'Sep', bookings: 82, revenue: 22800, users: 41 },
      { name: 'Oct', bookings: 91, revenue: 25100, users: 45 },
      { name: 'Nov', bookings: 87, revenue: 23900, users: 43 },
      { name: 'Dec', bookings: 94, revenue: 25800, users: 47 }
    ];

    const bookingTypes: ChartData[] = [
      { name: 'Single Room', value: 45 },
      { name: 'Double Room', value: 32 },
      { name: 'Family Suite', value: 23 },
      { name: 'Deluxe Suite', value: 15 }
    ];

    const userGrowth: ChartData[] = [
      { name: 'Q1', users: 45 },
      { name: 'Q2', users: 78 },
      { name: 'Q3', users: 125 },
      { name: 'Q4', users: 167 }
    ];

    return { monthlyData, bookingTypes, userGrowth, weeklyUserGrowth: weeklyUserData, weeklyBookingData };
  }, [weeklyUserData, weeklyBookingData]);

  // Memoized fetch function
  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      
      // Fetch total users
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch total bookings
      const { count: bookingCount, error: bookingError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Fetch total listings
      const { count: listingCount, error: listingError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

      // Mock data for demo
      const mockMonthlyBookings = 94;
      const mockRevenue = 25800;

      if (userError) {
        console.error('Error fetching user count:', userError);
      }
      if (bookingError) {
        console.error('Error fetching booking count:', bookingError);
      }
      if (listingError) {
        console.error('Error fetching listing count:', listingError);
      }

      const newStats = {
        totalUsers: userCount || 0,
        totalBookings: bookingCount || 0,
        totalListings: listingCount || 0,
        monthlyBookings: mockMonthlyBookings,
        revenue: mockRevenue
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user?.id, isAdmin]);

  // Fetch daily user growth data
  const fetchWeeklyUserData = useCallback(async () => {
    try {
      const dailyData: ChartData[] = [];
      
      // Get data for last 7 days (including today)
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0); // Start of day
        
        const dayEnd = new Date();
        dayEnd.setDate(dayEnd.getDate() - i);
        dayEnd.setHours(23, 59, 59, 999); // End of day
        
        const { count: userCount, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());
        
        if (error) {
          console.error(`Error fetching users for day ${7-i}:`, error);
        }
        
        // Format date as relative (Today, Yesterday, 2 days ago, etc.)
        let dateString;
        if (i === 0) {
          dateString = "Today";
        } else if (i === 1) {
          dateString = "Yesterday";
        } else {
          dateString = `${i} days ago`;
        }
        
        dailyData.push({
          name: dateString,
          users: userCount || 0
        });
      }
      
      setWeeklyUserData(dailyData);
    } catch (error) {
      console.error('Error fetching daily user data:', error);
    }
  }, []);

  // Fetch daily booking growth data
  const fetchWeeklyBookingData = useCallback(async () => {
    try {
      const dailyData: ChartData[] = [];
      
      // Get data for last 7 days (including today)
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0); // Start of day
        
        const dayEnd = new Date();
        dayEnd.setDate(dayEnd.getDate() - i);
        dayEnd.setHours(23, 59, 59, 999); // End of day
        
        const { count: bookingCount, error } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());
        
        if (error) {
          console.error(`Error fetching bookings for day ${7-i}:`, error);
        }
        
        // Format date as relative (Today, Yesterday, 2 days ago, etc.)
        let dateString;
        if (i === 0) {
          dateString = "Today";
        } else if (i === 1) {
          dateString = "Yesterday";
        } else {
          dateString = `${i} days ago`;
        }
        
        dailyData.push({
          name: dateString,
          bookings: bookingCount || 0
        });
      }
      
      setWeeklyBookingData(dailyData);
    } catch (error) {
      console.error('Error fetching daily booking data:', error);
    }
  }, []);

  // Check authentication and admin status
  useEffect(() => {
    if (!loading) {
      // If user is not authenticated, redirect to parent directory
      if (!user) {
        navigate('../');
        return;
      }

      // Check admin status
      if (!isAdmin) {
        navigate('/');
        return;
      }

      // User is admin, proceed with data fetching
      fetchStats();
      fetchWeeklyUserData();
      fetchWeeklyBookingData();
    }
  }, [loading, user, isAdmin, navigate, fetchStats, fetchWeeklyUserData, fetchWeeklyBookingData]);


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#0B5858] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600" style={{fontFamily: 'Poppins'}}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4" style={{fontFamily: 'Poppins'}}>Access Denied</h1>
          <p className="text-gray-600" style={{fontFamily: 'Poppins'}}>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      <Navbar />
      {loadingStats && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B5858] mx-auto mb-3"></div>
            <p className="text-lg text-gray-600" style={{fontFamily: 'Poppins'}}>Loading Dashboard...</p>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900" style={{fontFamily: 'Poppins'}}>
                Admin Dashboard
              </h1>
              <p className="mt-2 text-lg text-gray-600" style={{fontFamily: 'Poppins'}}>
                Welcome back! Here's what's happening with your platform.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/manageusers')}
                className="bg-[#0B5858] text-white px-6 py-3 rounded-lg hover:bg-[#0a4a4a] transition-all duration-200 flex items-center shadow-lg hover:shadow-xl cursor-pointer"
                style={{fontFamily: 'Poppins'}}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Manage Users
              </button>
              <button
                onClick={() => navigate('/manage')}
                className="bg-gradient-to-br from-gray-600 to-gray-700 text-white px-6 py-3 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl cursor-pointer"
                style={{fontFamily: 'Poppins'}}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Manage Listings
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="relative bg-gradient-to-br from-[#0B5858] to-[#0a4a4a] rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium mb-1" style={{fontFamily: 'Poppins'}}>Total Users</p>
                <p className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Poppins'}}>{stats.totalUsers}</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          </div>

          {/* Total Listings */}
          <div className="relative bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium mb-1" style={{fontFamily: 'Poppins'}}>Total Listings</p>
                <p className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Poppins'}}>{stats.totalListings}</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          </div>

          {/* Total Bookings */}
          <div className="relative bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                  <svg className="w-7 h-7 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <p className="text-black/70 text-sm font-medium mb-1" style={{fontFamily: 'Poppins'}}>Total Bookings</p>
                <p className="text-4xl font-bold text-black mb-2" style={{fontFamily: 'Poppins'}}>{stats.totalBookings}</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          </div>

        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Growth Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900" style={{fontFamily: 'Poppins'}}>Daily User Growth</h3>
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span style={{fontFamily: 'Poppins'}}>Users</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.weeklyUserGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Bookings Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900" style={{fontFamily: 'Poppins'}}>Daily Bookings</h3>
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span style={{fontFamily: 'Poppins'}}>Bookings</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.weeklyBookingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="bookings" 
                  stroke="#FACC15" 
                  strokeWidth={2}
                  dot={{ fill: '#FACC15', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{fontFamily: 'Poppins'}}>Quick Actions</h3>
            <p className="text-gray-600" style={{fontFamily: 'Poppins'}}>Access your most important tools instantly</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <button
              onClick={() => navigate('/manageusers')}
              className="group relative bg-gradient-to-br from-[#0B5858] to-[#0a4a4a] rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20 transition-all duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-white/30 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-white mb-2" style={{fontFamily: 'Poppins'}}>Manage Users</h4>
                <p className="text-white/80 text-sm" style={{fontFamily: 'Poppins'}}>View and manage user accounts</p>
                <div className="mt-4 flex items-center justify-center">
                  <span className="text-white/60 text-sm mr-2" style={{fontFamily: 'Poppins'}}>Go to users</span>
                  <svg className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            </button>

            <button
              onClick={() => navigate('/booking')}
              className="group relative bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent group-hover:from-white/30 transition-all duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-white/30 transition-all duration-300">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-black mb-2" style={{fontFamily: 'Poppins'}}>View Bookings</h4>
                <p className="text-black/70 text-sm" style={{fontFamily: 'Poppins'}}>Check all reservations and bookings</p>
                <div className="mt-4 flex items-center justify-center">
                  <span className="text-black/60 text-sm mr-2" style={{fontFamily: 'Poppins'}}>Go to bookings</span>
                  <svg className="w-4 h-4 text-black/60 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            </button>

            <button
              onClick={() => navigate('/manage')}
              className="group relative bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20 transition-all duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-white/30 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-white mb-2" style={{fontFamily: 'Poppins'}}>Manage Listings</h4>
                <p className="text-white/80 text-sm" style={{fontFamily: 'Poppins'}}>View and manage all property listings</p>
                <div className="mt-4 flex items-center justify-center">
                  <span className="text-white/60 text-sm mr-2" style={{fontFamily: 'Poppins'}}>Go to listings</span>
                  <svg className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
});

export default AdminPanel;