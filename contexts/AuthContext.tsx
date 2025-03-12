import React, { createContext, useState, useContext, useEffect } from 'react';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/api';
import { profileService } from '../services/api';

type User = {
  id: string;
  email: string;
};

type UserProfile = {
  id: string;
  email: string;
  name?: string;
  photo?: string;
  occupation?: string;
  bio?: string;
  interests?: string[];
};

type AuthContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
  updateUser: (userData: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setIsLoading(false);
      }
    };

    checkUserSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Get user from database
      const authenticatedUser = await authService.login(email, password);

      if (!authenticatedUser) {
        throw new Error('Invalid email or password');
      }

      // Get user profile
      const profile = await profileService.getProfileByUserId(authenticatedUser.id);

      // Combine user and profile data
      const userProfile: UserProfile = {
        id: authenticatedUser.id,
        email: authenticatedUser.email,
        name: profile?.name,
        photo: profile?.photo,
        occupation: profile?.occupation,
        bio: profile?.bio,
        interests: profile?.interests,
      };

      await AsyncStorage.setItem('@user', JSON.stringify(userProfile));
      setUser(userProfile);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      // Extract a username from the email (or use the first part of the name without spaces)
      const username = email.split('@')[0] || name.split(' ')[0].toLowerCase();
      
      // Register new user
      const newUser = await authService.register(email, password, username);

      // Create user profile
      await profileService.saveProfile({
        user_id: newUser.id,
        name: name,
      });

      // Create user profile object
      const userProfile: UserProfile = {
        id: newUser.id,
        email: newUser.email,
        name: name,
      };

      await AsyncStorage.setItem('@user', JSON.stringify(userProfile));
      setUser(userProfile);
      // Don't redirect to tabs, let the component handle redirection to onboarding
    } catch (error) {
      console.error('Registration failed', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('@user');
      setUser(null);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const updateUser = async (userData: Partial<UserProfile>) => {
    try {
      if (!user) return;

      // Update profile in database
      if (user.id) {
        const profileData: any = {};

        // Map user profile fields to profile model fields
        if (userData.name) profileData.name = userData.name;
        if (userData.photo) profileData.photo = userData.photo;
        if (userData.occupation) profileData.occupation = userData.occupation;
        if (userData.bio) profileData.bio = userData.bio;
        if (userData.interests) profileData.interests = userData.interests;

        if (Object.keys(profileData).length > 0) {
          await profileService.saveProfile({
            user_id: user.id,
            ...profileData
          });
        }
      }

      // Update local user state
      const updatedUser = { ...user, ...userData };
      await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user failed', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut, updateUser }}>
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