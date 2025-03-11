
import { query } from './database';
import { Profile } from '../models/Profile';

// Auth service
export const authService = {
  // Login function
  async login(email: string, password: string) {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const user = result.rows[0];
      
      // In a real app, you would hash the password and compare it
      if (user.password !== password) {
        return null;
      }
      
      return {
        id: user.id,
        username: user.username,
        email: user.email
      };
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },
  
  // Register function
  async register(username: string, email: string, password: string) {
    try {
      // Check if email already exists
      const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
      
      if (existingUser.rows.length > 0) {
        throw new Error('Email already exists');
      }
      
      // In a real app, you would hash the password before storing
      const users = await query('SELECT * FROM users', []);
      const userId = String(users.rows.length + 1);
      
      const newUser = {
        id: userId,
        username,
        email,
        password // In a real app, this would be hashed
      };
      
      // Since we're using AsyncStorage mock, we'll add it manually
      const existingUsers = JSON.parse(await AsyncStorage.getItem('@db_users') || '[]');
      existingUsers.push(newUser);
      await AsyncStorage.setItem('@db_users', JSON.stringify(existingUsers));
      
      return {
        id: userId,
        username,
        email
      };
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
      
      const result = await query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
      return result.rows.length > 0 ? result.rows[0] : null;
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
      const existingProfile = await this.getProfileByUserId(user_id);
      
      if (existingProfile) {
        // Update existing profile
        const result = await query(
          `UPDATE profiles SET name = $2, age = $3, occupation = $4, photo = $5, bio = $6, 
           industry_categories = $7, skills = $8, neighborhoods = $9, favorite_cafes = $10, 
           interests = $11, updated_at = NOW() WHERE id = $1 RETURNING *`,
          [
            existingProfile.id,
            profileData.name || existingProfile.name,
            profileData.age || existingProfile.age,
            profileData.occupation || existingProfile.occupation,
            profileData.photo || existingProfile.photo,
            profileData.bio || existingProfile.bio,
            profileData.industry_categories || existingProfile.industry_categories,
            profileData.skills || existingProfile.skills,
            profileData.neighborhoods || existingProfile.neighborhoods,
            profileData.favorite_cafes || existingProfile.favorite_cafes,
            profileData.interests || existingProfile.interests
          ]
        );
        
        return result.rows[0];
      } else {
        // Create new profile
        const result = await query(
          `INSERT INTO profiles(
            user_id, name, age, occupation, photo, bio,
            industry_categories, skills, neighborhoods, favorite_cafes, interests
          ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
          RETURNING *`,
          [
            user_id,
            profileData.name || '',
            profileData.age || null,
            profileData.occupation || '',
            profileData.photo || '',
            profileData.bio || '',
            profileData.industry_categories || [],
            profileData.skills || [],
            profileData.neighborhoods || [],
            profileData.favorite_cafes || [],
            profileData.interests || []
          ]
        );
        
        return result.rows[0];
      }
    } catch (error) {
      console.error('Failed to save profile', error);
      throw error;
    }
  }
};

// Add AsyncStorage import at the top
import AsyncStorage from '@react-native-async-storage/async-storage';
