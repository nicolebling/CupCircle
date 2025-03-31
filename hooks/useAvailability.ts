import { useState } from "react";
import { availabilityService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Availability } from "../models/Availability";

export function useAvailability() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createSlot = async (date: Date, startTime: string, endTime: string) => {
    if (!user?.id) return null;
    setIsLoading(true);
    setError(null);

    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('Original selected date:', date);
      console.log('Original date ISO string:', date.toISOString());
      
      // Keep original date without timezone conversion
      const adjustedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      console.log('Original date:', date);
      console.log('Selected date:', adjustedDate);

      const result = await availabilityService.createAvailability({
        id: user.id,
        date: adjustedDate,
        start_time: startTime,
        end_time: endTime,
        is_available: true,
        timezone: timeZone,
      });
      return result;
    } catch (err) {
      setError("Failed to create availability slot");
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
      const slots = await availabilityService.getUserAvailability(user.id);
      return slots;
    } catch (err) {
      setError("Failed to fetch availability slots");
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
    getSlots,
  };
}