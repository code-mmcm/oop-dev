import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Navbar from './Navbar';
import Footer from './Footer';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
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

// Global cache to persist data across component remounts
const adminDataCache = {
  stats: null as AdminStats | null,
  userId: null as string | null,
  isAdmin: false,
  hasLoaded: false
};

const AdminPanel: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { isAdmin, loading, user } = useAuth();
  const [stats, setStats] = useState<AdminStats>(() => 
    adminDataCache.stats || {
      totalUsers: 0,
      totalBookings: 0,
      totalListings: 0,
      monthlyBookings: 0,
      revenue: 0
    }
  );
  const [loadingStats, setLoadingStats] = useState(() => !adminDataCache.hasLoaded);

  // Memoized chart data
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

    return { monthlyData, bookingTypes, userGrowth };
  }, []);

  // Memoized fetch function
  const fetchStats = useCallback(async () => {
    // Check if we already have data for this user
    if (adminDataCache.hasLoaded && adminDataCache.userId === user?.id) {
      setStats(adminDataCache.stats!);
      setLoadingStats(false);
      return;
    }
    
    try {
      setLoadingStats(true);
      
      // Fetch total users
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch total listings
      const { count: listingCount, error: listingError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

      // Mock data for demo
      const mockBookings = 127;
      const mockMonthlyBookings = 94;
      const mockRevenue = 25800;

      if (userError) {
        console.error('Error fetching user count:', userError);
      }
      if (listingError) {
        console.error('Error fetching listing count:', listingError);
      }

      const newStats = {
        totalUsers: userCount || 0,
        totalBookings: mockBookings,
        totalListings: listingCount || 0,
        monthlyBookings: mockMonthlyBookings,
        revenue: mockRevenue
      };

      // Cache the data globally
      adminDataCache.stats = newStats;
      adminDataCache.userId = user?.id || null;
      adminDataCache.isAdmin = isAdmin;
      adminDataCache.hasLoaded = true;

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [user?.id, isAdmin]);

  // Check authentication and admin status
  useEffect(() => {
    if (!loading) {
      // If user is not authenticated, redirect to parent directory
      if (!user) {
        navigate('../');
        return;
      }

      // If we already have cached admin data for this user, trust it completely
      if (adminDataCache.hasLoaded && adminDataCache.userId === user.id) {
        setStats(adminDataCache.stats!);
        setLoadingStats(false);
        return; // Don't check admin status again
      }

      // Only check admin status if we don't have cached data
      if (!isAdmin) {
        navigate('/');
        return;
      }

      // User is admin, proceed with data fetching
      fetchStats();
    }
  }, [loading, user, isAdmin, navigate, fetchStats]);

  // Clear cache when user logs out
  useEffect(() => {
    if (!user && adminDataCache.hasLoaded) {
      adminDataCache.stats = null;
      adminDataCache.userId = null;
      adminDataCache.isAdmin = false;
      adminDataCache.hasLoaded = false;
    }
  }, [user]);

  if (loading || loadingStats) {
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

  const COLORS = ['#0B5858', '#FACC15', '#6B7280', '#10B981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
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
                className="bg-[#0B5858] text-white px-6 py-3 rounded-lg hover:bg-[#0a4a4a] transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
                style={{fontFamily: 'Poppins'}}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Manage Users
              </button>
              <button
                onClick={() => navigate('/manage')}
                className="bg-yellow-400 text-black px-6 py-3 rounded-lg hover:bg-yellow-500 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl"
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
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  <p className="text-green-400 text-sm font-semibold" style={{fontFamily: 'Poppins'}}>+12%</p>
                </div>
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
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  <p className="text-green-600 text-sm font-semibold" style={{fontFamily: 'Poppins'}}>+8%</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
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
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  <p className="text-green-400 text-sm font-semibold" style={{fontFamily: 'Poppins'}}>+5%</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          </div>

          {/* Revenue */}
          <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="text-right">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium mb-1" style={{fontFamily: 'Poppins'}}>Monthly Revenue</p>
                <p className="text-4xl font-bold text-white mb-2" style={{fontFamily: 'Poppins'}}>${stats.revenue.toLocaleString()}</p>
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-yellow-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                  </svg>
                  <p className="text-yellow-400 text-sm font-semibold" style={{fontFamily: 'Poppins'}}>+15%</p>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Bookings Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900" style={{fontFamily: 'Poppins'}}>Monthly Bookings</h3>
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-3 h-3 bg-[#0B5858] rounded-full mr-2"></div>
                <span style={{fontFamily: 'Poppins'}}>Bookings</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.monthlyData}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B5858" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0B5858" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#0B5858"
                  fillOpacity={1}
                  fill="url(#colorBookings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900" style={{fontFamily: 'Poppins'}}>Monthly Revenue</h3>
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-3 h-3 bg-yellow-400 rounded-full mr-2"></div>
                <span style={{fontFamily: 'Poppins'}}>Revenue ($)</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#FACC15" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Booking Types Pie Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6" style={{fontFamily: 'Poppins'}}>Booking Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.bookingTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.bookingTypes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* User Growth Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900" style={{fontFamily: 'Poppins'}}>User Growth</h3>
              <div className="flex items-center text-sm text-gray-500">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span style={{fontFamily: 'Poppins'}}>Users</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 6 }}
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
              onClick={() => navigate('/manage')}
              className="group relative bg-gradient-to-br from-[#0B5858] to-[#0a4a4a] rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden"
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

            <button
              onClick={() => navigate('/manageusers')}
              className="group relative bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent group-hover:from-white/30 transition-all duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-white/30 transition-all duration-300">
                  <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-black mb-2" style={{fontFamily: 'Poppins'}}>Manage Users</h4>
                <p className="text-black/70 text-sm" style={{fontFamily: 'Poppins'}}>View and manage user accounts</p>
                <div className="mt-4 flex items-center justify-center">
                  <span className="text-black/60 text-sm mr-2" style={{fontFamily: 'Poppins'}}>Go to users</span>
                  <svg className="w-4 h-4 text-black/60 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
            </button>

            <button
              onClick={() => navigate('/booking')}
              className="group relative bg-gradient-to-br from-gray-600 to-gray-700 rounded-2xl p-8 hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:from-white/20 transition-all duration-300"></div>
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-white/30 transition-all duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-white mb-2" style={{fontFamily: 'Poppins'}}>View Bookings</h4>
                <p className="text-white/80 text-sm" style={{fontFamily: 'Poppins'}}>Check all reservations and bookings</p>
                <div className="mt-4 flex items-center justify-center">
                  <span className="text-white/60 text-sm mr-2" style={{fontFamily: 'Poppins'}}>Go to bookings</span>
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
