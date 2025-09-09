import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthService } from '../services/authService'
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
  signUp: (email: string, password: string) => Promise<{ error: any }>
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
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

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
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
