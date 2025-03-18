
import { useState } from 'react';
import { availabilityService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export function useAvailability() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createSlot = async (date: Date, startTime: string, endTime: string) => {
    if (!user?.id) return null;
    setIsLoading(true);
    setError(null);
    
    try {
      return await availabilityService.createAvailability({
        user_id: user.id,
        date,
        start_time: startTime,
        end_time: endTime,
        is_available: true
      });
    } catch (err) {
      setError('Failed to create availability slot');
      console.error(err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getSlots = async () => {
    if (!user?.id) return [];
    setIsLoading(true);
    setError(null);
    
    try {
      return await availabilityService.getUserAvailability(user.id);
    } catch (err) {
      setError('Failed to fetch availability slots');
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    createSlot,
    getSlots
  };
}
