import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthService } from '../services/authService'
import { UserService } from '../services/userService'
import type { UserRole, UserProfile } from '../types/auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  userRole: UserRole | null
  userProfile: UserProfile | null
  isAdmin: boolean
  roleLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, userProfile: {
    fullname: string;
    birth: string;
    contact_number: number;
    gender: string;
    address: string;
  }) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [roleLoading, setRoleLoading] = useState(false)

  // Function to fetch user role and profile data
  const fetchUserData = async () => {
    if (!user) {
      setUserRole(null)
      setUserProfile(null)
      setIsAdmin(false)
      return
    }

    try {
      setRoleLoading(true)
      const [roleData, profileData, adminStatus] = await Promise.all([
        AuthService.getUserRole(),
        AuthService.getUserProfile(),
        AuthService.isAdmin()
      ])

      setUserRole(roleData)
      setUserProfile(profileData)
      const finalAdminStatus = adminStatus || (roleData?.role === 'admin')
      setIsAdmin(finalAdminStatus)
    } catch (err) {
      console.error('Error fetching user data:', err)
      setUserRole(null)
      setUserProfile(null)
      setIsAdmin(false)
    } finally {
      setRoleLoading(false)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Handle profile creation after email confirmation
      if (event === 'SIGNED_IN' && session?.user) {
        const pendingProfile = localStorage.getItem('pendingUserProfile');
        if (pendingProfile) {
          try {
            const profileData = JSON.parse(pendingProfile);
            console.log('Creating profile for confirmed user:', session.user.id);
            
            const { error } = await UserService.createUserProfile(profileData);
            if (error) {
              console.error('Error creating profile after confirmation:', error);
            } else {
              console.log('Profile created successfully after email confirmation');
              localStorage.removeItem('pendingUserProfile');
            }
          } catch (err) {
            console.error('Error parsing pending profile data:', err);
            localStorage.removeItem('pendingUserProfile');
          }
        }
        
        // Refresh user data after sign in
        console.log('Refreshing user data after sign in');
        fetchUserData();
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch user data when user changes
  useEffect(() => {
    if (user && !loading) {
      fetchUserData()
    } else if (!user) {
      setUserRole(null)
      setUserProfile(null)
      setIsAdmin(false)
      setRoleLoading(false)
    }
  }, [user, loading])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string, userProfile: {
    fullname: string;
    birth: string;
    contact_number: number;
    gender: string;
    address: string;
  }) => {
    try {
      console.log('Starting signup process for email:', email);
      
      // Create the auth user - Supabase will handle email validation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log('Auth signup result:', { 
        hasUser: !!authData.user, 
        hasSession: !!authData.session, 
        error: authError 
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        // Handle specific Supabase auth errors
        if (authError.message?.includes('already registered') || 
            authError.message?.includes('User already registered')) {
          return { error: { message: 'An account with this email already exists. Please use a different email or try logging in.' } };
        }
        return { error: authError };
      }

      if (!authData.user) {
        console.error('No user returned from auth signup');
        return { error: { message: 'Failed to create user account' } };
      }

      console.log('Auth user created successfully:', authData.user.id);

      // Always try to create the user profile, regardless of session status
      console.log('Creating user profile...');
      const { error: profileError } = await UserService.createUserProfile({
        id: authData.user.id,
        fullname: userProfile.fullname,
        birth: userProfile.birth,
        email: email,
        contact_number: userProfile.contact_number,
        gender: userProfile.gender,
        address: userProfile.address,
      });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        
        // Handle specific duplicate key error
        if (profileError.message?.includes('duplicate key value violates unique constraint')) {
          console.log('User profile already exists, continuing with signup');
          // Don't treat this as an error - user profile already exists
        } else {
          return { error: profileError };
        }
      }

      console.log('User profile created successfully');
      
      if (authData.session) {
        await fetchUserData();
      } else {
        localStorage.setItem('pendingUserProfile', JSON.stringify({
          id: authData.user.id,
          fullname: userProfile.fullname,
          birth: userProfile.birth,
          email: email,
          contact_number: userProfile.contact_number,
          gender: userProfile.gender,
          address: userProfile.address,
        }));
      }

      console.log('User signup completed successfully');
      return { error: null };
    } catch (err) {
      console.error('Unexpected signup error:', err);
      return { error: err };
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    // Clear user data on logout
    setUserRole(null)
    setUserProfile(null)
    setIsAdmin(false)
    setRoleLoading(false)
  }

  const refreshUserData = async () => {
    await fetchUserData()
  }

  const value = {
    user,
    session,
    loading,
    userRole,
    userProfile,
    isAdmin,
    roleLoading,
    signIn,
    signUp,
    signOut,
    refreshUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
