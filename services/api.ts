import { Profile } from '../models/Profile';
import { supabase } from '../lib/supabase';

// Auth service
export const authService = {
  // Login function
  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  // Register function
  async register(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }
};

// Profile service
export const profileService = {
  // Get profile by user ID
  async getProfileByUserId(userId: string) {
    try {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to load user profile', error);
      return null;
    }
  },

  // Save profile (create or update)
  async saveProfile(profileData: Partial<Profile> & { user_id: string }) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: profileData.user_id,
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to save profile', error);
      throw error;
    }
  }
};