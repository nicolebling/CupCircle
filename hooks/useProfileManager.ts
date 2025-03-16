
import { useState } from 'react';
import { profileService } from '../services/api';
import { Profile } from '../models/Profile';

export interface ProfileFormData {
  name: string;
  age?: number;
  occupation?: string;
  photo?: string;
  bio?: string;
  industry_categories?: string[];
  skills?: string[];
  neighborhoods?: string[];
  favorite_cafes?: string[];
  interests?: string[];
  location?: { lat: number, lng: number };
}

export function useProfileManager(userId: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile. Please try again.');
        return;
      }

      console.log('Fetched profile data:', data);
      setProfile(data);
      
    } catch (err) {
      console.error('Failed to load user profile', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (formData: ProfileFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (profile) {
        // Update existing profile
        const updatedProfile = await profileService.saveProfile({
          user_id: userId,
          ...formData
        });
        setProfile(updatedProfile);
        return true;
      } else {
        // Create new profile
        const newProfile = await profileService.saveProfile({
          user_id: userId,
          ...formData
        });
        setProfile(newProfile);
        return true;
      }
    } catch (err) {
      console.error('Failed to update profile', err);
      setError('Failed to save profile. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile
  };
}
