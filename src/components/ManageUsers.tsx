import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Navbar from './Navbar';
import Footer from './Footer';
import type { UserProfile } from '../types/auth';

interface UserWithRole extends UserProfile {
  role?: string;
  created_at?: string;
}

const ManageUsers: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin, roleLoading, user, loading } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const hasFetchedUsers = useRef(false);

  useEffect(() => {
    if (!loading && !roleLoading) {
      // If user is not authenticated, redirect to parent directory
      if (!user) {
        navigate('../');
        return;
      }
      
      // If user is authenticated but not admin, redirect to parent directory
      if (!isAdmin) {
        navigate('../');
        return;
      }
    }
  }, [loading, roleLoading, user, isAdmin, navigate]);

  // Reset fetch flag when user changes
  useEffect(() => {
    hasFetchedUsers.current = false;
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        
        // Fetch users from the users table
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (usersError) {
          console.error('Error fetching users:', usersError);
          if (isMounted) setUsers([]);
          return;
        }

        // Fetch user roles - this should work with the updated RLS policy
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('*');

        if (rolesError) {
          console.error('Error fetching user roles:', rolesError);
          console.error('RLS Policy might be blocking access. Make sure admin can view all user roles.');
          // Continue without roles data - users will default to 'user' role
        }

        // Debug: Log the actual user data structure
        console.log('Users data from database:', usersData);
        
        // Combine user data with role data
        let usersWithRoles = usersData?.map(user => {
          const userRole = rolesData?.find(role => role.user_id === user.id);
          return {
            ...user,
            role: userRole?.role || 'user'
          };
        }) || [];

        // If we couldn't fetch roles in bulk and we have users, try to fetch individual roles
        if (!rolesData && usersData && usersData.length > 0) {
          console.log('Attempting to fetch individual user roles...');
          const individualRoles = await Promise.all(
            usersData.map(async (user) => {
              try {
                const { data: roleData } = await supabase
                  .from('user_roles')
                  .select('role')
                  .eq('user_id', user.id)
                  .single();
                return { userId: user.id, role: roleData?.role || 'user' };
              } catch (error) {
                console.log(`Could not fetch role for user ${user.id}:`, error);
                return { userId: user.id, role: 'user' };
              }
            })
          );

          // Update users with individual roles
          usersWithRoles = usersData.map(user => {
            const individualRole = individualRoles.find(r => r.userId === user.id);
            return {
              ...user,
              role: individualRole?.role || 'user'
            };
          });
        }

        console.log('Fetched users:', usersWithRoles); // Debug log
        console.log('Users count:', usersWithRoles.length); // Debug log
        console.log('Roles data:', rolesData); // Debug log
        console.log('Roles count:', rolesData?.length || 0); // Debug log
        
        if (isMounted) {
          setUsers(usersWithRoles);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        if (isMounted) setUsers([]);
      } finally {
        if (isMounted) setLoadingUsers(false);
      }
    };

    // Only fetch once when component mounts and user is confirmed to be admin
    if (!loading && !roleLoading && user && isAdmin && !hasFetchedUsers.current) {
      hasFetchedUsers.current = true;
      fetchUsers();
    }

    return () => {
      isMounted = false;
    };
  }, [loading, roleLoading, user, isAdmin]); // Keep dependencies but add condition to prevent re-fetch

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdatingRole(userId);
      
      // First try to update existing role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      // If update fails (no existing record), insert new one
      if (updateError) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: newRole
          });

        if (insertError) {
          console.error('Error inserting user role:', insertError);
          console.error('Permission denied or other error:', insertError.message);
          return;
        }
      }

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, role: newRole }
            : user
        )
      );

      console.log('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      console.error('Unexpected error:', error);
    } finally {
      setUpdatingRole(null);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.fullname || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="pt-24 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin')}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 
                className="text-3xl font-bold text-black"
                style={{fontFamily: 'Poppins', fontWeight: 700}}
              >
                Manage Users
              </h1>
            </div>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <div className="relative">
                  <svg 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search users by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B5858]"
                    style={{fontFamily: 'Poppins'}}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr style={{backgroundColor: 'rgba(11, 88, 88, 0.7)'}}>
                    <th className="px-6 py-3 text-left text-white font-medium w-1/4" style={{fontFamily: 'Poppins'}}>
                      User Info
                    </th>
                    <th className="px-6 py-3 text-left text-white font-medium w-32" style={{fontFamily: 'Poppins'}}>
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-white font-medium w-24" style={{fontFamily: 'Poppins'}}>
                      Gender
                    </th>
                    <th className="px-6 py-3 text-left text-white font-medium w-28" style={{fontFamily: 'Poppins'}}>
                      Joined Date
                    </th>
                    <th className="px-6 py-3 text-left text-white font-medium w-24" style={{fontFamily: 'Poppins'}}>
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-white font-medium w-32" style={{fontFamily: 'Poppins'}}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading || roleLoading ? (
                    // Role loading state - show loading message
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                          <p className="text-gray-600" style={{fontFamily: 'Poppins'}}>Loading...</p>
                        </div>
                      </td>
                    </tr>
                  ) : !isAdmin ? (
                    // Access denied state - maintain table structure
                    <tr>
                      <td className="px-6 py-8 text-center" colSpan={6}>
                        <div className="text-red-500">
                          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <p className="text-lg font-semibold mb-2" style={{fontFamily: 'Poppins'}}>
                            Access Denied
                          </p>
                          <p className="text-gray-600" style={{fontFamily: 'Poppins'}}>
                            You need admin privileges to access the Manage Users page.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : loadingUsers ? (
                    // Data loading state - show loading message
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                          <p className="text-gray-600" style={{fontFamily: 'Poppins'}}>Loading users...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    // No users found - maintain table structure
                    <tr>
                      <td className="px-6 py-8 text-center" colSpan={6}>
                        <div className="text-gray-500">
                          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                          </svg>
                          <p className="text-xl font-semibold mb-2" style={{fontFamily: 'Poppins', fontWeight: 600}}>
                            No Users Found
                          </p>
                          <p className="text-gray-600" style={{fontFamily: 'Poppins', fontWeight: 400}}>
                            {searchTerm ? 'No users match your current search.' : 'No users have been registered yet.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr 
                        key={user.id} 
                        className={`border-b border-gray-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                        }`}
                      >
                        {/* User Info */}
                        <td className="px-6 py-3 align-top">
                          <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-full bg-[#0B5858] flex items-center justify-center">
                              <span className="text-sm font-medium text-white" style={{fontFamily: 'Poppins'}}>
                                {(user.fullname || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900" style={{fontFamily: 'Poppins'}}>
                                {user.fullname || 'No Name'}
                              </div>
                              <div className="text-sm text-gray-500" style={{fontFamily: 'Poppins'}}>
                                {user.email || 'No Email'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-3 align-top">
                          <span className="text-gray-900" style={{fontFamily: 'Poppins'}}>
                            {user.contact_number || 'N/A'}
                          </span>
                        </td>

                        {/* Gender */}
                        <td className="px-6 py-3 align-top">
                          <span className="text-gray-900" style={{fontFamily: 'Poppins'}}>
                            {user.gender || 'N/A'}
                          </span>
                        </td>

                        {/* Joined Date */}
                        <td className="px-6 py-3 align-top">
                          <span className="text-gray-900" style={{fontFamily: 'Poppins'}}>
                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                          </span>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-3 align-top">
                          <span 
                            className="inline-flex px-3 py-1 rounded-full text-xs font-medium text-white"
                            style={{
                              backgroundColor: user.role === 'admin' ? '#F10E3B' : user.role === 'agent' ? '#FACC15' : '#0B5858',
                              fontFamily: 'Poppins'
                            }}
                          >
                            {user.role === 'admin' ? 'Admin' : user.role === 'agent' ? 'Agent' : 'User'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-3 align-top">
                          <div className="flex items-center space-x-2">
                            <select
                              value={user.role || 'user'}
                              onChange={(e) => updateUserRole(user.id, e.target.value)}
                              disabled={updatingRole === user.id}
                              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5858] disabled:opacity-50 disabled:cursor-not-allowed"
                              style={{fontFamily: 'Poppins'}}
                            >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="agent">Agent</option>
                            </select>
                            {updatingRole === user.id && (
                              <div className="ml-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0B5858]"></div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Role Legend */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4" style={{fontFamily: 'Poppins'}}>Role Permissions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <span 
                  className="inline-flex px-3 py-1 text-xs font-semibold rounded-full text-white mr-3"
                  style={{backgroundColor: '#0B5858', fontFamily: 'Poppins'}}
                >
                  User
                </span>
                <span className="text-sm text-gray-600" style={{fontFamily: 'Poppins'}}>Can browse</span>
              </div>
              <div className="flex items-center">
                <span 
                  className="inline-flex px-3 py-1 text-xs font-semibold rounded-full text-white mr-3"
                  style={{backgroundColor: '#FACC15', fontFamily: 'Poppins'}}
                >
                  Agent
                </span>
                <span className="text-sm text-gray-600" style={{fontFamily: 'Poppins'}}>Can make bookings only</span>
              </div>
              <div className="flex items-center">
                <span 
                  className="inline-flex px-3 py-1 text-xs font-semibold rounded-full text-white mr-3"
                  style={{backgroundColor: '#F10E3B', fontFamily: 'Poppins'}}
                >
                  Admin
                </span>
                <span className="text-sm text-gray-600" style={{fontFamily: 'Poppins'}}>Full access to all features</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Section */}
      <Footer />
    </div>
  );
};

export default ManageUsers;
