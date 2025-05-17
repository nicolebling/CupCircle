
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const CACHE_KEYS = {
  PROFILES: 'cached_profiles',
  AVAILABILITY: (userId: string) => `cached_availability_${userId}`,
  MESSAGES: (userId: string) => `cached_messages_${userId}`,
  MATCHES: (userId: string) => `cached_matches_${userId}`,
};

const CACHE_EXPIRY = {
  PROFILES: 3600000, // 1 hour
  AVAILABILITY: 300000, // 5 minutes
  MESSAGES: 60000, // 1 minute
  MATCHES: 300000, // 5 minutes
};

/**
 * Cache service for storing and retrieving data from local storage
 */
export const cacheService = {
  /**
   * Cache profiles data
   */
  async cacheProfiles(userId: string) {
    try {
      // Fetch profiles from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      
      // Store in AsyncStorage
      await AsyncStorage.setItem('cached_profiles', JSON.stringify(data));
      await AsyncStorage.setItem('profiles_cache_time', Date.now().toString());
      
      console.log('Profiles cached successfully');
      return data;
    } catch (error) {
      console.error('Error caching profiles:', error);
      return null;
    }
  },
  
  /**
   * Get cached profiles
   */
  async getCachedProfiles() {
    try {
      const cachedData = await AsyncStorage.getItem('cached_profiles');
      if (!cachedData) return null;
      
      return JSON.parse(cachedData);
    } catch (error) {
      console.error('Error getting cached profiles:', error);
      return null;
    }
  },
  
  /**
   * Cache availability data
   */
  async cacheAvailability(userId: string) {
    try {
      // Fetch availability from Supabase
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('id', userId);
      
      if (error) throw error;
      
      // Store in AsyncStorage
      await AsyncStorage.setItem(`cached_availability_${userId}`, JSON.stringify(data));
      await AsyncStorage.setItem(`availability_cache_time_${userId}`, Date.now().toString());
      
      console.log('Availability cached successfully');
      return data;
    } catch (error) {
      console.error('Error caching availability:', error);
      return null;
    }
  },
  
  /**
   * Get cached availability
   */
  async getCachedAvailability(userId: string) {
    try {
      const cachedData = await AsyncStorage.getItem(`cached_availability_${userId}`);
      if (!cachedData) return null;
      
      return JSON.parse(cachedData);
    } catch (error) {
      console.error('Error getting cached availability:', error);
      return null;
    }
  },
  
  /**
   * Cache matches data
   */
  async cacheMatches(userId: string) {
    try {
      // Fetch matches from Supabase
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
      
      if (error) throw error;
      
      // Store in AsyncStorage
      await AsyncStorage.setItem(`cached_matches_${userId}`, JSON.stringify(data));
      await AsyncStorage.setItem(`matches_cache_time_${userId}`, Date.now().toString());
      
      console.log('Matches cached successfully');
      return data;
    } catch (error) {
      console.error('Error caching matches:', error);
      return null;
    }
  },
  
  /**
   * Get cached matches
   */
  async getCachedMatches(userId: string) {
    try {
      const cachedData = await AsyncStorage.getItem(CACHE_KEYS.MATCHES(userId));
      if (!cachedData) return null;
      
      return JSON.parse(cachedData);
    } catch (error) {
      console.error('Error getting cached matches:', error);
      return null;
    }
  },

  /**
   * Cache messages data
   */
  async cacheMessages(userId: string, chatId: string) {
    try {
      const { data, error } = await supabase
        .from('message')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const cacheKey = `${CACHE_KEYS.MESSAGES(userId)}_${chatId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
      await AsyncStorage.setItem(`${cacheKey}_time`, Date.now().toString());

      return data;
    } catch (error) {
      console.error('Error caching messages:', error);
      return null;
    }
  },

  /**
   * Get cached messages
   */
  async getCachedMessages(userId: string, chatId: string) {
    try {
      const cacheKey = `${CACHE_KEYS.MESSAGES(userId)}_${chatId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (!cachedData) return null;

      const cacheTime = await AsyncStorage.getItem(`${cacheKey}_time`);
      if (cacheTime && Date.now() - parseInt(cacheTime) > CACHE_EXPIRY.MESSAGES) {
        return null;
      }

      return JSON.parse(cachedData);
    } catch (error) {
      console.error('Error getting cached messages:', error);
      return null;
    }
  },
  
  /**
   * Check if cache is expired
   * @param cacheKey The key for the cache timestamp
   * @param maxAge Max age in milliseconds
   */
  async isCacheExpired(cacheKey: string, maxAge: number = 3600000) { // Default 1 hour
    try {
      const cacheTime = await AsyncStorage.getItem(cacheKey);
      if (!cacheTime) return true;
      
      const cacheAge = Date.now() - parseInt(cacheTime);
      return cacheAge > maxAge;
    } catch (error) {
      console.error('Error checking cache expiry:', error);
      return true;
    }
  },
  
  /**
   * Clear all cached data
   */
  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => 
        key.startsWith('cached_') || 
        key.endsWith('_cache_time')
      );
      
      await AsyncStorage.multiRemove(cacheKeys);
      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
};
