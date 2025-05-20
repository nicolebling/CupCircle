import { useState, useEffect } from "react";
import { availabilityService } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { Availability } from "../models/Availability";
import { cacheService } from "../services/cacheService";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";

export function useAvailability() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const { user } = useAuth();
  
  // Initialize network listener
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected ?? true);
    });
    
    return () => unsubscribe();
  }, []);

  const createSlot = async (
    date: string,
    startTime: string,
    endTime: string,
  ) => {
    if (!user?.id) return null;
    setIsLoading(true);
    setError(null);

    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log("Original selected date:", date);
      console.log("Original date ISO string:", date);

      // Format date as YYYY-MM-DD using local date
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      console.log("Original date:", date);
      console.log("Formatted date:", formattedDate);

      const result = await availabilityService.createAvailability({
        id: user.id,
        date: formattedDate,
        start_time: startTime,
        end_time: endTime,
        is_available: true,
        timezone: timeZone,
      });
      
      // Update cache after creating a new slot
      if (result) {
        await cacheService.cacheAvailability(user.id);
      }
      
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
      // Check if we're online
      if (isConnected) {
        // Try to get from server
        const slots = await availabilityService.getUserAvailability(user.id);
        
        // Cache the results
        if (slots && slots.length > 0) {
          await AsyncStorage.setItem(`cached_availability_${user.id}`, JSON.stringify(slots));
          await AsyncStorage.setItem(`availability_cache_time_${user.id}`, Date.now().toString());
        }
        
        return slots;
      } else {
        // We're offline, get from cache
        console.log("Offline mode: getting availability from cache");
        const cachedSlots = await cacheService.getCachedAvailability(user.id);
        return cachedSlots || [];
      }
    } catch (err) {
      console.error("Error getting slots:", err);
      setError("Failed to fetch availability slots");
      
      // Try to get from cache if server request failed
      const cachedSlots = await cacheService.getCachedAvailability(user.id);
      return cachedSlots || [];
    } finally {
      setIsLoading(false);
    }
  };
  
  const syncAvailability = async () => {
    if (!user?.id || !isConnected) return false;
    
    try {
      setIsLoading(true);
      await cacheService.cacheAvailability(user.id);
      return true;
    } catch (error) {
      console.error("Failed to sync availability:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearCache = async () => {
    try {
      setIsLoading(true);
      await cacheService.clearCache();
      return true;
    } catch (error) {
      console.error("Failed to clear cache:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    isOffline: !isConnected,
    createSlot,
    getSlots,
    syncAvailability,
    clearCache
  };
}
