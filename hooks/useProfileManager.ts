
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
      console.log('useProfileManager: Starting profile fetch');
      setIsLoading(true);
      setError(null);
      console.log("useProfileManager: userId is", userId);

      console.log('useProfileManager: Fetching profile for userId:', userId);
      const userProfile = await profileService.getProfileByUserId(userId);
      console.log('useProfileManager: Profile data received:', userProfile);
      setProfile(userProfile);
      
    } catch (err) {
      console.error('useProfileManager: Failed to load user profile', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
      console.log('useProfileManager: Profile fetch complete');
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
    setProfile,
    isLoading,
    error,
    fetchProfile,
    updateProfile
  };
}
