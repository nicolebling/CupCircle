
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

      console.log('Fetching profile for user22:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      console.log('Profile data:', data);
      return data;
    } catch (error) {
      console.error('Failed to load user profile:', error);
      throw error;
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