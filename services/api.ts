import { Profile } from "../models/Profile";
import { supabase } from "../lib/supabase";

// Auth service
export const authService = {
  // Login function
  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error("Login error:", error);
      return null;
    }
  },

  // Register function
  async register(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return data.user;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },
};

// Profile service
export const profileService = {
  // Get profile by user ID
  async getProfileByUserId(userId: string) {
    try {
      if (!userId) return null;

      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      // Parse employment data if it exists
      if (data && data.employment) {
        try {
          data.employment =
            typeof data.employment === "string"
              ? JSON.parse(data.employment)
              : data.employment;
        } catch (e) {
          console.error("Error parsing employment data:", e);
          data.employment = [];
        }
      }

      console.log("Profile data:", data);
      return data;
    } catch (error) {
      console.error("Failed to load user profile:", error);
      throw error;
    }
  },

  // Save profile (create or update)
  async saveProfile(profileData: Partial<Profile> & { id: string }) {
    try {
      // Convert employment array to JSON string if it exists
      const formattedData = {
        ...profileData,
        employment: profileData.employment
          ? JSON.stringify(profileData.employment)
          : null,
      };

      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          
          ...formattedData,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to save profile", error);
      throw error;
    }
  },
};
// Availability service
export const availabilityService = {
  // Create availability slot
  async createAvailability(availabilityData: {
    user_id: string;
    date: string;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      console.log("Received date in service:", availabilityData.date);
      console.log("Timezone being used:", timezone);

      // Format date as YYYY-MM-DD string
      const formattedDate = availabilityData.date;
      console.log("Formatted date to be saved:", formattedDate);

      const { data, error } = await supabase
        .from("availability")
        .insert([
          {
            ...availabilityData,
            date: formattedDate,
            timezone: timezone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {2
      console.error("Failed to create availability:", error);
      throw error;
    }
  },

  // Get user's availability slots
  async getUserAvailability(userId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("availability")
        .select("*")
        .eq("user_id", userId)
        .gte('date', todayStr) // Only get dates from today onwards
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;
      
      // Further filter out today's past time slots
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;
      
      return (data || []).filter(slot => {
        if (slot.date > todayStr) return true;
        if (slot.date === todayStr) {
          return slot.start_time > currentTime;
        }
        return false;
      });
    } catch (error) {
      console.error("Failed to get availability:", error);
      throw error;
    }
  },

  // Update availability slot
  async updateAvailability(
    id: string,
    updateData: Partial<{
      date: string;
      start_time: string;
      end_time: string;
      is_available: boolean;
    }>,
  ) {
    try {
      const { data, error } = await supabase
        .from("availability")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Failed to update availability:", error);
      throw error;
    }
  },

  // Delete availability slot
  async deleteAvailability(id: string) {
    try {
      const { error } = await supabase
        .from("availability")
        .delete()
        .eq("id", id); // Corrected column name here.  It was likely "avil_id" before and should match the other functions.

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Failed to delete availability:", error);
      throw error;
    }
  },
};
