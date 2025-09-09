import { supabase } from '../lib/supabase';
import type { UserProfile, UserProfileUpdate } from '../types/user';

export class UserService {
  // Get user profile by user ID
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }

    return data;
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: UserProfileUpdate): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }

    return data;
  }

  // Create user profile (for new users)
  static async createUserProfile(profile: Omit<UserProfile, 'id'>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .insert([profile])
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }

    return data;
  }

  // Check if user profile exists
  static async profileExists(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (error) {
      return false;
    }

    return !!data;
  }
}
