import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Calendar from '../calendar';
import AdminSummaryCards from './components/AdminSummaryCards';
import AdminCharts from './components/AdminCharts';
import type { AdminStats, ChartData } from './types';

const AdminPanel: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { loading } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalBookings: 0,
    totalListings: 0,
    monthlyBookings: 0,
    revenue: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const [weeklyUserData, setWeeklyUserData] = useState<ChartData[]>([]);
  const [weeklyBookingData, setWeeklyBookingData] = useState<ChartData[]>([]);

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { count: bookingCount, error: bookingError } = await supabase
        .from('booking')
        .select('*', { count: 'exact', head: true });

      const { count: listingCount, error: listingError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true });

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
  }, []);

  const fetchWeeklyUserData = useCallback(async () => {
    try {
      const dailyData: ChartData[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date();
        dayEnd.setDate(dayEnd.getDate() - i);
        dayEnd.setHours(23, 59, 59, 999);
        
        const { count: userCount, error } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());
        
        if (error) {
          console.error(`Error fetching users for day ${7-i}:`, error);
        }
        
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

  const fetchWeeklyBookingData = useCallback(async () => {
    try {
      const dailyData: ChartData[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date();
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date();
        dayEnd.setDate(dayEnd.getDate() - i);
        dayEnd.setHours(23, 59, 59, 999);
        
        const { count: bookingCount, error } = await supabase
          .from('booking')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lte('created_at', dayEnd.toISOString());
        
        if (error) {
          console.error(`Error fetching bookings for day ${7-i}:`, error);
        }
        
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

  const [hasLoaded, setHasLoaded] = useState(false);
 
  useEffect(() => {
    if (!loading && !hasLoaded) {
      setHasLoaded(true);
      fetchStats();
      fetchWeeklyUserData();
      fetchWeeklyBookingData();
    }
  }, [loading, hasLoaded, fetchStats, fetchWeeklyUserData, fetchWeeklyBookingData]);


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
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => navigate('/booking-requests')}
                className="bg-gradient-to-br from-[#F1C40F] to-[#F39C12] text-white px-4 py-2 rounded-lg hover:from-[#F39C12] hover:to-[#E67E22] transition-all duration-200 flex items-center shadow-md hover:shadow-lg cursor-pointer text-sm"
                style={{fontFamily: 'Poppins'}}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Booking Requests
              </button>
              <button
                onClick={() => navigate('/manage-users')}
                className="bg-[#0B5858] text-white px-4 py-2 rounded-lg hover:bg-[#0a4a4a] transition-all duration-200 flex items-center shadow-md hover:shadow-lg cursor-pointer text-sm"
                style={{fontFamily: 'Poppins'}}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Manage Users
              </button>
              <button
                onClick={() => navigate('/manage-listings')}
                className="bg-gradient-to-br from-gray-600 to-gray-700 text-white px-4 py-2 rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center shadow-md hover:shadow-lg cursor-pointer text-sm"
                style={{fontFamily: 'Poppins'}}
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Manage Listings
              </button>
            </div>
          </div>
        </div>

        <AdminSummaryCards stats={stats} />

        <AdminCharts userGrowth={weeklyUserData} bookingGrowth={weeklyBookingData} />

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900" style={{fontFamily: 'Poppins'}}>Upcoming Bookings Calendar</h3>
            <p className="text-gray-600 mt-1" style={{fontFamily: 'Poppins'}}>View and manage all upcoming bookings</p>
          </div>
          <div className="p-0">
            <Calendar hideNavbar={true} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
});

export default AdminPanel;