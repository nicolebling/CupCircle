
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '../models/Profile';

// Base URL for API
// Get the API URL from environment or use the Replit domain
const API_URL = process.env.EXPO_PUBLIC_API_URL || `https://${process.env.REPLIT_DEV_DOMAIN}`;
console.log('Using API URL:', API_URL);

// Auth service
export const authService = {
  // Login function
  async login(email: string, password: string) {
    try {
      console.log('Making login request to:', `${API_URL}/api/auth/login`);
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        console.error('Login failed with status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      // Only fallback to mock if there's a network error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('Network error, falling back to mock auth service');
        return mockAuthService.login(email, password);
      }
      throw error;
    }
  },
  
  // Register function
  async register(email: string, password: string) {
    try {
      console.log('Making registration request to:', `${API_URL}/api/auth/register`);
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        console.error('Registration failed with status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        throw new Error(errorData.error || 'Registration failed');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Register error:', error);
      // Only fallback to mock if there's a network error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('Network error, falling back to mock auth service');
        return mockAuthService.register(email, password);
      }
      throw error;
    }
  }
};

// Profile service
export const profileService = {
  // Get profile by user ID
  async getProfileByUserId(userId: string) {
    try {
      if (!userId) return null;
      
      console.log('Fetching profile for user ID:', userId);
      const response = await fetch(`${API_URL}/api/profile/${userId}`);
      
      if (!response.ok) {
        console.error('Profile fetch failed with status:', response.status);
        // Only fall back to mock for 404 (profile not found yet)
        if (response.status === 404) {
          console.warn('Profile not found, returning null');
          return null;
        }
        return null;
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to load user profile:', error);
      // Only fallback to mock if there's a network error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('Network error, falling back to mock profile service');
        return mockProfileService.getProfileByUserId(userId);
      }
      return null;
    }
  },
  
  // Save profile (create or update)
  async saveProfile(profileData: Partial<Profile> & { user_id: string }) {
    try {
      console.log('Saving profile for user ID:', profileData.user_id);
      
      const response = await fetch(`${API_URL}/api/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        console.error('Profile save failed with status:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        throw new Error(errorData.error || 'Failed to save profile');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to save profile:', error);
      // Only fallback to mock if there's a network error
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.warn('Network error, falling back to mock profile service');
        return mockProfileService.saveProfile(profileData);
      }
      throw error;
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
        profiles.push({
          id: Date.now().toString(),
          user_id,
          ...profileData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
