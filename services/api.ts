import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '../models/Profile';

// Base URL for API
// First try environment variables, then app.json config, then fallback
import Constants from 'expo-constants';

// Fix the HTTP/HTTPS protocol - always use HTTPS for Replit domains
const formatUrl = (url) => {
  if (url && url.includes('replit')) {
    // Force HTTPS for Replit domains
    return url.replace('http://', 'https://');
  }
  return url;
};

const API_URL = formatUrl(
  process.env.EXPO_PUBLIC_API_URL || 
  (Constants?.expoConfig?.extra?.API_URL) || 
  'https://cupcircle-api.cosanitty.replit.app'
);

console.log('Using API URL:', API_URL);

// Helper function to test if the API is reachable
export const testApiConnection = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout

    const response = await fetch(`${API_URL}/api/health-check`, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('API connection test failed:', error);
    return false;
  }
};

// Helper function for API queries
export const apiQuery = async (endpoint: string, params?: any) => {
  try {
    // First test if API is reachable
    const isApiReachable = await testApiConnection();
    if (!isApiReachable) {
      console.log('API is not reachable, using mock data');
      throw new Error('MOCK_DATA_REQUIRED');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET', // Default to GET
      headers: {
        'Content-Type': 'application/json',
      },
      ...(params && { body: JSON.stringify(params) })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'API request failed');
    }

    return await response.json();
  } catch (error) {
    if (error.message === 'MOCK_DATA_REQUIRED') {
      // Handle mock data here if needed
      console.log('Using mock data for:', endpoint);
      return []; // Or return appropriate mock data
    }
    console.error('API query failed:', error);
    throw error;
  }
};


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

      // Use a timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10-second timeout

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
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

      // Check if it's a certificate error (common with HTTP/HTTPS issues)
      const errorMessage = error.toString();
      if (errorMessage.includes('certificate') || errorMessage.includes('SSL')) {
        console.error('Certificate error detected. Make sure your API URL uses HTTPS.');
      }

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