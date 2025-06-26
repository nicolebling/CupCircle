import React, { createContext, useState, useContext, useEffect } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import Superwall from "expo-superwall/compat";

type User = {
  id: string;
  email: string;
};

type Profile = {
  id: string;
  name?: string;
  occupation?: string;
  photo_url?: string;
  bio?: string;
  age?: number;
  experience_level?: string;
  education?: string;
  city?: string;
  industry_categories?: string[];
  skills?: string[];
  neighborhoods?: string[];
  favorite_cafes?: string[];
  interests?: string[];
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<Profile | null>;
  updateUser: (userData: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to validate and format UUID for Superwall with detailed logging
const formatUserIdForSuperwall = (userId: string, context: string): string => {
  console.log(`[SUPERWALL DEBUG] ${context} - Raw user ID:`, userId);
  console.log(`[SUPERWALL DEBUG] ${context} - User ID type:`, typeof userId);
  console.log(`[SUPERWALL DEBUG] ${context} - User ID length:`, userId?.length);

  if (!userId) {
    console.error(`[SUPERWALL ERROR] ${context} - User ID is null or undefined`);
    return userId;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const isValidUUID = uuidRegex.test(userId);

  console.log(`[SUPERWALL DEBUG] ${context} - Is valid UUID:`, isValidUUID);

  if (!isValidUUID) {
    console.warn(`[SUPERWALL WARNING] ${context} - User ID is not a valid UUID format:`, userId);
    console.warn(`[SUPERWALL WARNING] ${context} - This may cause issues with Apple's appAccountToken requirements`);
  } else {
    console.log(`[SUPERWALL SUCCESS] ${context} - User ID is valid UUID format`);
  }

  return userId;
};

// Function to safely identify user with Superwall with comprehensive logging
const identifyUserWithSuperwall = (userId: string, context: string) => {
  try {
    console.log(`[SUPERWALL DEBUG] ${context} - Starting user identification process`);

    const formattedUserId = formatUserIdForSuperwall(userId, context);

    console.log(`[SUPERWALL DEBUG] ${context} - Calling Superwall.shared.identify with:`, {
      userId: formattedUserId,
      timestamp: new Date().toISOString()
    });

    Superwall.shared.identify({ userId: formattedUserId });

    console.log(`[SUPERWALL SUCCESS] ${context} - User identification completed successfully`);

  } catch (error) {
    console.error(`[SUPERWALL ERROR] ${context} - Failed to identify user:`, error);
    console.error(`[SUPERWALL ERROR] ${context} - Error details:`, {
      message: error.message,
      stack: error.stack,
      userId: userId
    });
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[SUPERWALL DEBUG] AuthContext - useEffect initializing');

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[SUPERWALL DEBUG] Initial session check:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Identify user with Superwall
      if (session?.user) {
        identifyUserWithSuperwall(session.user.id, 'Initial Session Check');
      } else {
        console.log('[SUPERWALL DEBUG] Initial Session Check - No user to identify');
      }
    }).catch(error => {
      console.error('[SUPERWALL ERROR] Failed to get initial session:', error);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[SUPERWALL DEBUG] Auth state change:', {
        event,
        hasSession: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id,
        userEmail: session?.user?.email,
        timestamp: new Date().toISOString()
      });

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Identify user with Superwall
      if (session?.user) {
        identifyUserWithSuperwall(session.user.id, `Auth State Change (${event})`);
      } else {
        console.log(`[SUPERWALL DEBUG] Auth State Change (${event}) - No user to identify`);
        if (event === 'SIGNED_OUT') {
          console.log('[SUPERWALL DEBUG] User signed out, calling Superwall.shared.reset()');
          try {
            Superwall.shared.reset();
            console.log('[SUPERWALL SUCCESS] Superwall reset completed');
          } catch (error) {
            console.error('[SUPERWALL ERROR] Failed to reset Superwall:', error);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('[SUPERWALL DEBUG] SignIn - Starting sign in process for:', email);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[SUPERWALL ERROR] SignIn - Authentication failed:', error);
        throw error;
      }

      console.log('[SUPERWALL DEBUG] SignIn - Authentication successful:', {
        hasUser: !!data.user,
        hasSession: !!data.session,
        userId: data.user?.id,
        userEmail: data.user?.email
      });

      if (data.user) {
        setUser(data.user);
        setSession(data.session);

        // Identify user with Superwall using validated UUID
        identifyUserWithSuperwall(data.user.id, 'Manual Sign In');

        console.log('[SUPERWALL DEBUG] SignIn - Navigating to profile-setup');
        router.replace("/profile-setup");
      } else {
        console.warn('[SUPERWALL WARNING] SignIn - No user data received despite successful authentication');
      }
    } catch (error) {
      console.error("[SUPERWALL ERROR] SignIn - Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      console.log('[SUPERWALL DEBUG] SignUp - Starting sign up process for:', email, 'with name:', name);
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        console.error('[SUPERWALL ERROR] SignUp - Registration failed:', error);
        throw error;
      }

      console.log('[SUPERWALL DEBUG] SignUp - Registration successful:', {
        hasUser: !!data.user,
        hasSession: !!data.session,
        userId: data.user?.id,
        userEmail: data.user?.email,
        needsConfirmation: !data.session
      });

      if (data.user) {
        setUser(data.user);
        setSession(data.session);

        // Identify user with Superwall using validated UUID
        identifyUserWithSuperwall(data.user.id, 'Manual Sign Up');

        console.log('[SUPERWALL DEBUG] SignUp - Navigating to profile-setup');
        router.replace("/profile-setup");
      } else {
        console.warn('[SUPERWALL WARNING] SignUp - No user data received despite successful registration');
      }
    } catch (error) {
      console.error("[SUPERWALL ERROR] SignUp - Registration failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Add small delay for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 300));

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      router.replace("/(auth)/login");

      // Update state after navigation starts
      setSession(null);
      setProfile(null);
      setUser(null);

      // Reset Superwall
      Superwall.shared.reset();

      // Small delay before completing
      await new Promise((resolve) => setTimeout(resolve, 200));
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error("Logout failed:", error);
      throw error;
    }
  };

  const fetchProfile = async (): Promise<Profile | null> => {
    try {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }

      setProfile(data);
      return data;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      return null;
    }
  };

  const updateUser = async (userData: Partial<Profile>) => {
    try {
      if (!user?.id) return;

      // Ensure firstName and lastName are combined into name
      const processedUserData = { ...userData };
      if (userData.firstName && userData.lastName) {
        processedUserData.name = `${userData.firstName} ${userData.lastName}`;
      }

      const { error } = await supabase
        .from("profiles")
        .update(processedUserData)
        .eq("id", user.id);

      if (error) throw error;

      setProfile((prev) => (prev ? { ...prev, ...userData } : null));
    } catch (error) {
      console.error("Update user failed:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        fetchProfile,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};