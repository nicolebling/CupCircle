
import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

// Custom hook for API calls
export function useApi() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile methods
  const getProfile = useCallback(async () => {
    if (!user?.id) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      return await api.profileService.getProfileByUserId(user.id);
    } catch (err) {
      setError('Failed to fetch profile');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const updateProfile = useCallback(async (profileData: any) => {
    if (!user?.id) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      return await api.profileService.saveProfile({
        user_id: user.id,
        ...profileData
      });
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Matching methods
  const getMatches = useCallback(async (limit = 10) => {
    if (!user?.id) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      return await api.profileService.getProfilesForMatching(user.id, limit);
    } catch (err) {
      setError('Failed to fetch matches');
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const createMatch = useCallback(async (profileId: string, message?: string) => {
    if (!user?.id) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      return await api.matchService.createMatch({
        user1_id: user.id,
        user2_id: profileId,
        status: 'pending',
        initial_message: message
      });
    } catch (err) {
      setError('Failed to create match');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const getUserMatches = useCallback(async () => {
    if (!user?.id) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      return await api.matchService.getUserMatches(user.id);
    } catch (err) {
      setError('Failed to fetch user matches');
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Availability methods
  const getUserAvailability = useCallback(async () => {
    if (!user?.id) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      return await api.availabilityService.getUserAvailability(user.id);
    } catch (err) {
      setError('Failed to fetch availability');
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const createAvailability = useCallback(async (availabilityData: any) => {
    if (!user?.id) return null;
    
    setIsLoading(true);
    setError(null);
    
    try {
      return await api.availabilityService.createAvailability({
        user_id: user.id,
        ...availabilityData
      });
    } catch (err) {
      setError('Failed to create availability');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const updateAvailability = useCallback(async (id: string, data: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await api.availabilityService.updateAvailability(id, data);
    } catch (err) {
      setError('Failed to update availability');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteAvailability = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      return await api.availabilityService.deleteAvailability(id);
    } catch (err) {
      setError('Failed to delete availability');
      console.error(err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    getProfile,
    updateProfile,
    getMatches,
    createMatch,
    getUserMatches,
    getUserAvailability,
    createAvailability,
    updateAvailability,
    deleteAvailability
  };
}
