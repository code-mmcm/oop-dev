import { supabase } from '../lib/supabase';
import type { UserProfile } from '../types/user';

export class UserService {
  // Create user profile in public.users table using upsert to handle duplicates
  static async createUserProfile(userData: {
    id: string;
    fullname: string;
    birth: string;
    email: string;
    contact_number: number;
    gender: string;
    address: string;
    profile_photo?: string;
  }): Promise<{ error: any }> {
    try {
      console.log('UserService: Attempting to create user profile for ID:', userData.id);
      console.log('UserService: Profile data:', {
        id: userData.id,
        fullname: userData.fullname,
        email: userData.email,
        contact_number: userData.contact_number,
        gender: userData.gender,
        address: userData.address
      });
      
      // First check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userData.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('UserService: Error checking existing user:', checkError);
        return { error: checkError };
      }

      if (existingUser) {
        console.log('UserService: User profile already exists, skipping creation');
        return { error: null };
      }

      // Try RPC function first
      const { error: rpcError } = await supabase.rpc('create_user_profile', {
        user_id: userData.id,
        user_fullname: userData.fullname,
        user_birth: userData.birth,
        user_email: userData.email,
        user_contact_number: userData.contact_number,
        user_gender: userData.gender,
        user_address: userData.address,
        user_profile_photo: userData.profile_photo || null
      });

      if (rpcError) {
        console.error('UserService: RPC function failed, trying upsert:', rpcError);
        
        // Use upsert to handle duplicates gracefully
        const { error: upsertError } = await supabase
          .from('users')
          .upsert([userData], { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (upsertError) {
          console.error('UserService: Upsert also failed:', upsertError);
          return { error: upsertError };
        }
        
        console.log('UserService: User profile created/updated successfully via upsert');
        return { error: null };
      }

      console.log('UserService: User profile created successfully via RPC');
      return { error: null };
    } catch (err) {
      console.error('UserService: Unexpected error creating user profile:', err);
      return { error: err };
    }
  }

  // Get user profile by ID
  static async getUserProfile(userId: string): Promise<{ data: UserProfile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Unexpected error fetching user profile:', err);
      return { data: null, error: err };
    }
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) {
        console.error('Error updating user profile:', error);
        return { error };
      }

      console.log('User profile updated successfully');
      return { error: null };
    } catch (err) {
      console.error('Unexpected error updating user profile:', err);
      return { error: err };
    }
  }
}