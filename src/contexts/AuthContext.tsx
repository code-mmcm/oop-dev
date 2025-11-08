import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
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
  isAgent: boolean
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
  const [userRole, setUserRole] = useState<UserRole | null>(() => {
    try {
      const saved = localStorage.getItem('userRole')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('userProfile')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('isAdmin')
      return saved === 'true'
    } catch {
      return false
    }
  })
  const [isAgent, setIsAgent] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('isAgent')
      return saved === 'true'
    } catch {
      return false
    }
  })
  const [roleLoading, setRoleLoading] = useState(false)
  const hasFetchedData = useRef(false)

  // Function to fetch user role and profile data
  const fetchUserData = async () => {
    if (!user) {
      setUserRole(null)
      setUserProfile(null)
      setIsAdmin(false)
      setIsAgent(false)
      return
    }

    try {
      setRoleLoading(true)
      const [roleData, profileData] = await Promise.all([
        AuthService.getUserRole(),
        AuthService.getUserProfile()
      ])

      setUserRole(roleData)
      setUserProfile(profileData)
      const finalAdminStatus = roleData?.role === 'admin'
      const finalAgentStatus = roleData?.role === 'agent'
      setIsAdmin(finalAdminStatus)
      setIsAgent(finalAgentStatus)
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('userRole', JSON.stringify(roleData))
        localStorage.setItem('userProfile', JSON.stringify(profileData))
        localStorage.setItem('isAdmin', finalAdminStatus.toString())
        localStorage.setItem('isAgent', finalAgentStatus.toString())
      } catch (error) {
        console.error('Error saving user data to localStorage:', error)
      }
    } catch (err) {
      console.error('Error fetching user data:', err)
      // Don't clear anything on error - keep existing data
      // The data from localStorage will still be available
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
              
              // Immediately set the user profile and role state
              const newUserProfile: UserProfile = {
                ...profileData,
                role: 'user',
                profile_photo: profileData.profile_photo || undefined,
              };
              
              const newUserRole: UserRole = {
                role: 'user',
                user_id: session.user.id,
                fullname: profileData.fullname,
                email: profileData.email,
              };
              
              setUserProfile(newUserProfile);
              setUserRole(newUserRole);
              setIsAdmin(false);
              setIsAgent(false);
              
              // Mark as fetched to prevent useEffect from triggering a competing fetch
              hasFetchedData.current = true;
              
              // Save to localStorage
              try {
                localStorage.setItem('userProfile', JSON.stringify(newUserProfile));
                localStorage.setItem('userRole', JSON.stringify(newUserRole));
                localStorage.setItem('isAdmin', 'false');
                localStorage.setItem('isAgent', 'false');
              } catch (error) {
                console.error('Error saving user data to localStorage:', error);
              }
              
              localStorage.removeItem('pendingUserProfile');
            }
          } catch (err) {
            console.error('Error parsing pending profile data:', err);
            localStorage.removeItem('pendingUserProfile');
          }
        }
        
        // Reset fetch flag so useEffect can fetch data for new user
        // console.log('User signed in, resetting fetch flag');
        // hasFetchedData.current = false;
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Fetch user data when user changes (only fetch once per user)
  useEffect(() => {
    if (user && !loading && !hasFetchedData.current) {
      hasFetchedData.current = true
      fetchUserData()
    } else if (!user && !loading) {
      // Only clear state, NOT localStorage (keep data for when user comes back)
      setUserRole(null)
      setUserProfile(null)
      setIsAdmin(false)
      setIsAgent(false)
      setRoleLoading(false)
      hasFetchedData.current = false
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
      
      // Immediately set the user profile and role state with the data we just created
      // This prevents the navbar from showing incorrect/default data before the database fetch completes
      const newUserProfile: UserProfile = {
        id: authData.user.id,
        fullname: userProfile.fullname,
        birth: userProfile.birth,
        email: email,
        contact_number: userProfile.contact_number,
        gender: userProfile.gender,
        address: userProfile.address,
        role: 'user',
        profile_photo: undefined,
      };
      
      const newUserRole: UserRole = {
        role: 'user',
        user_id: authData.user.id,
        fullname: userProfile.fullname,
        email: email,
      };
      
      setUserProfile(newUserProfile);
      setUserRole(newUserRole);
      setIsAdmin(false);
      setIsAgent(false);
      
      // Mark as fetched to prevent useEffect from triggering a competing fetch
      hasFetchedData.current = true;
      
      // Save to localStorage immediately
      try {
        localStorage.setItem('userProfile', JSON.stringify(newUserProfile));
        localStorage.setItem('userRole', JSON.stringify(newUserRole));
        localStorage.setItem('isAdmin', 'false');
        localStorage.setItem('isAgent', 'false');
      } catch (error) {
        console.error('Error saving user data to localStorage:', error);
      }
      
      if (authData.session) {
        // Fetch complete data from database (including any server-side defaults)
        // This will update the profile with any additional data
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
    setIsAgent(false)
    setRoleLoading(false)
    hasFetchedData.current = false
    
    // Clear localStorage on logout
    try {
      localStorage.removeItem('userRole')
      localStorage.removeItem('userProfile')
      localStorage.removeItem('isAdmin')
      localStorage.removeItem('isAgent')
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
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
    isAgent,
    roleLoading,
    signIn,
    signUp,
    signOut,
    refreshUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
