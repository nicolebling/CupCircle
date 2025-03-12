
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Profile } from '../models/Profile';

// Base URL for API
// Get the API URL from environment or use the Replit domain
const API_URL = process.env.EXPO_PUBLIC_API_URL || `https://${process.env.REPLIT_DEV_DOMAIN}/api`;
console.log('Using API URL:', API_URL);

import { query } from './database';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

// Auth service
export const authService = {
  // Login function
  async login(email: string, password: string) {
    try {
      // Use database query
      const result = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        return null;
      }
      
      return {
        id: user.id,
        email: user.email,
        username: user.username
      };
    } catch (error) {
      console.error('Login error:', error);
      // In production, don't fallback to mock
      return null;
    }
  },
  
  // Register function
  async register(email: string, password: string, username: string = '') {
    try {
      // Check if user already exists
      const existingUser = await query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('User already exists');
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Generate user ID
      const userId = uuidv4();
      
      // Create new user
      const result = await query(
        'INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4) RETURNING id, email, username',
        [userId, username || email.split('@')[0], email, hashedPassword]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Register error:', error);
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
      
      const result = await query(
        'SELECT * FROM profiles WHERE user_id = $1',
        [userId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      console.error('Failed to load user profile', error);
      return null;
    }
  },
  
  // Save profile (create or update)
  async saveProfile(profileData: Partial<Profile> & { user_id: string }) {
    try {
      const { user_id } = profileData;
      
      // Check if profile exists
      const existingProfile = await query(
        'SELECT * FROM profiles WHERE user_id = $1',
        [user_id]
      );
      
      if (existingProfile.rows.length === 0) {
        // Create new profile
        const columns = Object.keys(profileData);
        const values = Object.values(profileData);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        
        const result = await query(
          `INSERT INTO profiles (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`,
          values
        );
        
        return result.rows[0];
      } else {
        // Update existing profile
        const keys = Object.keys(profileData).filter(key => key !== 'user_id');
        const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
        const values = keys.map(key => profileData[key as keyof typeof profileData]);
        
        const result = await query(
          `UPDATE profiles SET ${setClause}, updated_at = NOW() WHERE user_id = $1 RETURNING *`,
          [user_id, ...values]
        );
        
        return result.rows[0];
      }
    } catch (error) {
      console.error('Failed to save profile', error);
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
