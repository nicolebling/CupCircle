import React, { createContext, useState, useContext, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { profileService } from '../services/api';
import {supabase} from '../lib/supabase'


type User = {
  id: string;
  email: string;
};

type Profile = {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
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
  session: null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  fetchProfile: () => Promise<Profile | null>;
  updateUser: (userData: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const checkUserSession = async () => {
      try {
        const userJSON = await AsyncStorage.getItem('@user');
        if (userJSON) {
          setUser(JSON.parse(userJSON));
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Failed to load user data', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Get user from database
      const authenticatedUser = await authService.login(email, password);

      if (!authenticatedUser) {
        throw new Error('Invalid email or password');
      }

      await AsyncStorage.setItem('@user', JSON.stringify(authenticatedUser));
      setUser(authenticatedUser);
      router.replace('/profile-setup');

    } catch (error) {
      console.error('Login failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      // Register new user
      const newUser = await authService.register(email, password);

      await AsyncStorage.setItem('@user', JSON.stringify(newUser));
      setUser(newUser);
      router.replace('/profile-setup');

    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('@user');
      setUser(null);
      setProfile(null);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const fetchProfile = async (): Promise<Profile | null> => {
    try {
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      setProfile(data);
      return data;
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      return null;
    }
  };

  const updateUser = async (userData: Partial<Profile>) => {
    try {
      if (!user || !profile) return;

      const updatedProfile = {...profile, ...userData};
      const { error } = await supabase
        .from('profiles')
        .update(userData)
        .eq('id', profile.id);
      if (error){
        console.error("Error updating profile", error);
        throw error;
      }
      setProfile(updatedProfile);
      await AsyncStorage.setItem('@user', JSON.stringify({...user, ...userData}))

    } catch (error) {
      console.error('Update user failed', error);
      throw error;
    }
  };


  // Fetch profile when user changes
  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session: null,
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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};