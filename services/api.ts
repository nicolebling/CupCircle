
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '../models/Profile';

// Base URL for API
// Get the API URL from environment or use the configured API URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || Constants?.expoConfig?.extra?.API_URL || 'http://cupcircle-api.cosanitty.replit.app';
console.log('Using API URL:', API_URL);

// Auth service
export const authService = {
  // Login function
  async login(email: string, password: string) {
    try {
      // For testing, always try to use the real API first
      console.log('Attempting to use real API service');
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      // Fallback to mock during development
      return mockAuthService.login(email, password);
    }
  },
  
  // Register function
  async register(email: string, password: string) {
    try {
      // For testing, always try to use the real API first
      console.log('Attempting to use real API service for registration');
      console.log('Registration endpoint:', `${API_URL}/api/auth/register`);
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      console.log('Registration response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Registration API error:', errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: 'Unknown registration error' };
        }
        throw new Error(errorData.error || 'Registration failed');
      }
      
      const userData = await response.json();
      console.log('Registration successful with real API:', userData);
      return userData;
    } catch (error) {
      console.error('Register error:', error);
      console.log('Falling back to mock auth service');
      // Fallback to mock during development
      const mockUser = mockAuthService.register(email, password);
      console.log('Created mock user:', mockUser);
      return mockUser;
    }
  }
};

// Profile service
export const profileService = {
  // Get profile by user ID
  async getProfileByUserId(userId: string) {
    try {
      if (!userId) return null;
      
      // For testing, always try to use the real API first
      console.log('Attempting to use real API service for profile');
      
      const response = await fetch(`${API_URL}/api/profile/${userId}`);
      
      if (!response.ok) {
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to load user profile', error);
      // Fallback to mock during development
      return mockProfileService.getProfileByUserId(userId);
    }
  },
  
  // Save profile (create or update)
  async saveProfile(profileData: Partial<Profile> & { user_id: string }) {
    try {
      // For testing, always try to use the real API first
      console.log('Attempting to use real API service for profile saving');
      
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const data = await response.json();
        console.error('Profile API error response:', data);
        throw new Error(data.error || 'Failed to save profile');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to save profile', error);
      // Fallback to mock during development
      return mockProfileService.saveProfile(profileData);
    }
  }
};

// Mock auth service (for development)
export const mockAuthService = {
  // Login function
  async login(email: string, password: string) {
    try {
      // For development, accept any login
      return {
        id: '1',
        email: email
      };
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },
  
  // Register function
  async register(email: string, password: string) {
    try {
      return {
        id: Date.now().toString(),
        email
      };
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }
};

// Mock profile service (for development)
export const mockProfileService = {
  // Mock data for development
  MOCK_PROFILES: [
    {
      id: '1',
      user_id: '1',
      name: 'Alex Thompson',
      age: 28,
      photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      occupation: 'Software Engineer',
      bio: 'Passionate about building scalable web applications and mentoring junior developers.',
      industry_categories: ['Technology', 'Software Development'],
      skills: ['React', 'Node.js', 'TypeScript'],
      neighborhoods: ['Downtown', 'Tech District'],
      favorite_cafes: ['Coffee House', 'Bean There'],
      interests: ['Coding', 'Hiking', 'Photography']
    },
    {
      id: '2',
      user_id: '2',
      name: 'Sophia Wang',
      age: 31,
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      occupation: 'UX/UI Designer',
      bio: 'Creative designer with a strong focus on user-centered design.',
      industry_categories: ['Design', 'Technology'],
      skills: ['UI Design', 'User Research', 'Figma'],
      neighborhoods: ['Arts District', 'Midtown'],
      favorite_cafes: ['The Roastery', 'Morning Brew'],
      interests: ['Design', 'Art', 'Photography']
    }
  ],
  
  // Get profile by user ID
  async getProfileByUserId(userId: string) {
    try {
      if (!userId) return null;
      
      const storedProfiles = await AsyncStorage.getItem('@profiles');
      const profiles = storedProfiles ? JSON.parse(storedProfiles) : this.MOCK_PROFILES;
      return profiles.find((profile: any) => profile.user_id === userId) || null;
    } catch (error) {
      console.error('Failed to load user profile', error);
      return null;
    }
  },
  
  // Save profile (create or update)
  async saveProfile(profileData: any) {
    try {
      const { user_id } = profileData;
      
      // Get existing profiles
      const storedProfiles = await AsyncStorage.getItem('@profiles');
      const profiles = storedProfiles ? JSON.parse(storedProfiles) : this.MOCK_PROFILES;
      
      // Check if profile exists
      const existingIndex = profiles.findIndex((p: any) => p.user_id === user_id);
      
      if (existingIndex >= 0) {
        // Update existing profile
        profiles[existingIndex] = {
          ...profiles[existingIndex],
          ...profileData,
          updated_at: new Date().toISOString()
        };
      } else {
        // Create new profile
        const timestamp = new Date().toISOString();
        profiles.push({
          id: Date.now().toString(),
          user_id,
          ...profileData,
          created_at: timestamp,
          updated_at: timestamp
        });
      }
      
      // Save updated profiles
      await AsyncStorage.setItem('@profiles', JSON.stringify(profiles));
      
      // Return the saved profile
      return profiles.find((p: any) => p.user_id === user_id);
    } catch (error) {
      console.error('Failed to save profile', error);
      throw error;
    }
  }
};
