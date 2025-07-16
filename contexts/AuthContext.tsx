import React, { createContext, useState, useContext, useEffect } from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import Superwall, {
  SuperwallOptions,
  LogLevel,
  LogScope,
} from "expo-superwall/compat";
import { notificationService } from "../services/notificationService";

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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Superwall logging
  // useEffect(() => {
  //   const initializeSuperwall = async () => {
  //     try {
  //       // Set log level for debugging
  //       await Superwall.shared.setLogLevel(LogLevel.Warn);
  //       console.log('Superwall logging initialized with Warn level');
  //     } catch (error) {
  //       console.error('Failed to initialize Superwall logging:', error);
  //     }
  //   };

  //   initializeSuperwall();
  // }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Identify user with Superwall if session exists
      if (session?.user) {
        try {
          await Superwall.shared.identify({ userId: session.user.id });
          console.log(
            "Superwall user identified from existing session:",
            session.user.id,
          );
        } catch (error) {
          console.error(
            "Failed to identify user with Superwall from session:",
            error,
          );
        }
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Handle Superwall user identification based on auth state
      if (session?.user) {
        try {
          await Superwall.shared.identify({ userId: session.user.id });
          console.log(
            "Superwall user identified on auth state change:",
            session.user.id,
          );
        } catch (error) {
          console.error(
            "Failed to identify user with Superwall on auth state change:",
            error,
          );
        }
      } else {
        try {
          await Superwall.shared.reset();
          console.log("Superwall user reset on auth state change");
        } catch (error) {
          console.error(
            "Failed to reset Superwall user on auth state change:",
            error,
          );
        }
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        setSession(data.session);

        // Identify user with Superwall
        try {
          await Superwall.shared.identify({ userId: data.user.id });
          console.log("Superwall user identified:", data.user.id);
        } catch (error) {
          console.error("Failed to identify user with Superwall:", error);
        }

        // Register for push notifications
        try {
          console.log('🔔 [AUTH] Starting push notification registration for user:', data.user.id);
          console.log('🔔 [AUTH] User email:', data.user.email);
          
          const token = await notificationService.registerForPushNotificationsAsync();
          console.log('🎯 [AUTH] Push token registration result:', { hasToken: !!token });
          
          if (token) {
            console.log('💾 [AUTH] Token received, attempting to save to database...');
            console.log('💾 [AUTH] Token preview:', token.substring(0, 30) + '...');
            
            await notificationService.savePushToken(data.user.id, token);
            console.log('✅ [AUTH] Push token save operation completed');
            
            // Verify the token was saved by reading it back
            console.log('🔍 [AUTH] Verifying token was saved - fetching from database...');
            const { data: verifyData, error: verifyError } = await supabase
              .from('profiles')
              .select('push_token')
              .eq('id', data.user.id)
              .single();
            
            if (verifyError) {
              console.log('❌ [AUTH] Error verifying push token save:', verifyError);
              console.log('❌ [AUTH] Verify error details:', JSON.stringify(verifyError, null, 2));
            } else {
              console.log('✅ [AUTH] Token verification result:', {
                hasTokenInDB: !!verifyData?.push_token,
                tokenMatch: verifyData?.push_token === token,
                dbTokenPreview: verifyData?.push_token?.substring(0, 20) + '...'
              });
            }
          } else {
            console.log('❌ [AUTH] No push token received - skipping save operation');
          }
        } catch (error) {
          console.error("❌ [AUTH] Failed to register for push notifications:", error);
          console.error("❌ [AUTH] Error details:", JSON.stringify(error, null, 2));
          console.error("❌ [AUTH] Error stack:", error.stack);
        }

        router.replace("/profile-setup");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) throw error;

      if (data.user) {
        setUser(data.user);
        setSession(data.session);

        // Identify user with Superwall
        try {
          await Superwall.shared.identify({ userId: data.user.id });
          console.log("Superwall user identified during signup:", data.user.id);
        } catch (error) {
          console.error(
            "Failed to identify user with Superwall during signup:",
            error,
          );
        }

        router.replace("/profile-setup");
      }
    } catch (error) {
      console.error("Registration failed:", error);
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

      // Reset Superwall user identification
      try {
        await Superwall.shared.reset();
        console.log("Superwall user reset on logout");
      } catch (error) {
        console.error("Failed to reset Superwall user:", error);
      }

      // Update state after navigation starts
      setSession(null);
      setProfile(null);
      setUser(null);

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
