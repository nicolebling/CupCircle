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
  showWelcomeModal: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<Profile | null>;
  updateUser: (userData: Partial<Profile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  setWelcomeModalShown: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
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
          console.log('🔔 Starting push notification registration for user:', data.user.id);
          const token = await notificationService.registerForPushNotificationsAsync();
          console.log('🎯 Push token registration result:', { token, hasToken: !!token });

          if (token) {
            console.log('💾 Attempting to save push token to database...');
            await notificationService.savePushToken(data.user.id, token);
            console.log('✅ Push token save operation completed');

            // Verify the token was saved by reading it back
            console.log('🔍 Verifying token was saved - fetching from database...');
            const { data: verifyData, error: verifyError } = await supabase
              .from('profiles')
              .select('push_token')
              .eq('id', data.user.id)
              .single();

            if (verifyError) {
              console.log('❌ Error verifying push token save:', verifyError);
            } else {
              console.log('✅ Token verification result:', {
                hasTokenInDB: !!verifyData?.push_token,
                tokenMatch: verifyData?.push_token === token,
                dbTokenPreview: verifyData?.push_token?.substring(0, 20) + '...'
              });
            }
          } else {
            console.log('❌ No push token received - skipping save operation');
          }
        } catch (error) {
          console.error("❌ Failed to register for push notifications:", error);
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

      // Check if this is completing onboarding (has all required fields)
      if (userData.name && userData.occupation && userData.bio && userData.education && 
          userData.experience_level && userData.industry_categories?.length && 
          userData.interests?.length && userData.favorite_cafes?.length && userData.photo_url) {
        setShowWelcomeModal(true);
      }

      // Fetch the updated user data
      await refreshUser();
    } catch (error) {
      console.error("Update user failed:", error);
      throw error;
    }
  };

  const setWelcomeModalShown = () => {
    setShowWelcomeModal(false);
  };

  // Placeholder for refreshUser, signInWithApple, signInWithGoogle if not implemented
  const refreshUser = async () => {
    console.log("refreshUser called");
    // Implement refreshUser logic if needed
  };
  const signInWithApple = async () => {
    console.log("signInWithApple called");
    // Implement signInWithApple logic if needed
  };
  const signInWithGoogle = async () => {
    console.log("signInWithGoogle called");
    // Implement signInWithGoogle logic if needed
  };

  const value = {
    user,
    session,
    profile,
    loading,
    isFirstTimeUser,
    signIn,
    signUp,
    signOut,
    fetchProfile,
    updateUser,
    refreshUser,
    signInWithApple,
    signInWithGoogle,
    setFirstTimeUserComplete,
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        showWelcomeModal,
        signIn,
        signUp,
        signOut,
        fetchProfile,
        updateUser,
        refreshUser,
        signInWithApple,
        signInWithGoogle,
        setWelcomeModalShown,
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