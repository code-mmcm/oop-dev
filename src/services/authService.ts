import { supabase } from '../lib/supabase';
import type { UserRole, UserProfile } from '../types/auth';

export class AuthService {
  // Get current user's role
  static async getUserRole(): Promise<UserRole | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        return null;
      }

      console.log('Current user ID:', user.id);

      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          role,
          user_id
        `)
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        console.log('No role found in user_roles table, returning default user role');
        
        // Return default user role without additional fetching
        return {
          role: 'user',
          user_id: user.id,
          fullname: '', // Will be populated by getUserProfile if needed
          email: user.email || ''
        };
      }

      console.log('User role data:', data);

      // Get user info separately
      const { data: userData } = await supabase
        .from('users')
        .select('fullname, email')
        .eq('id', user.id)
        .single();

      return {
        role: data.role,
        user_id: data.user_id,
        fullname: userData?.fullname || '',
        email: userData?.email || ''
      };
    } catch (error) {
      console.error('Error in getUserRole:', error);
      return null;
    }
  }

  // Check if current user is admin
  static async isAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found for admin check');
        return false;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      const isAdmin = data?.role === 'admin';
      console.log('Admin check result:', { role: data?.role, isAdmin });
      return isAdmin;
    } catch (error) {
      console.error('Error in isAdmin:', error);
      return false;
    }
  }

  // Get current user's profile with role
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found for profile');
        return null;
      }

      // Get user profile data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) {
        console.error('Error fetching user profile:', userError);
        return null;
      }

      // Set default user role without additional fetching
      return {
        ...userData,
        role: 'user' // Default role, can be overridden by getUserRole if needed
      };
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }
}
