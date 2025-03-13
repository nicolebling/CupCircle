import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Custom storage implementation that checks for window
const customStorage = {
  getItem: async (key) => {
    try {
      if (typeof window === "undefined") {
        // Return null when running on server
        return null;
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      if (typeof window === "undefined") {
        // Do nothing when running on server
        return;
      }
      return await AsyncStorage.setItem(key, value);
    } catch (error) {
      return;
    }
  },
  removeItem: async (key) => {
    try {
      if (typeof window === "undefined") {
        // Do nothing when running on server
        return;
      }
      return await AsyncStorage.removeItem(key);
    } catch (error) {
      return;
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
