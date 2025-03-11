
import { User, UserModel } from '../models/User';
import { Profile, ProfileModel } from '../models/Profile';
import { Availability, AvailabilityModel } from '../models/Availability';
import { Match, MatchModel, MatchStatus } from '../models/Match';

// Authentication methods
export const authService = {
  // Register a new user
  async register(username: string, email: string, password: string): Promise<User> {
    return UserModel.create(username, email, password);
  },

  // Login user
  async login(email: string, password: string): Promise<User | null> {
    const user = await UserModel.findByEmail(email);
    if (!user) return null;
    
    const isValid = await UserModel.verifyPassword(user, password);
    if (!isValid) return null;
    
    // Don't send password to client
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  },

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    return UserModel.findById(id);
  }
};

// Profile methods
export const profileService = {
  // Create or update profile
  async saveProfile(profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile> {
    const existingProfile = await ProfileModel.findByUserId(profile.user_id);
    
    if (existingProfile) {
      return ProfileModel.update(existingProfile.id, profile);
    } else {
      return ProfileModel.create(profile);
    }
  },

  // Get profile by user ID
  async getProfileByUserId(userId: string): Promise<Profile | null> {
    return ProfileModel.findByUserId(userId);
  },

  // Get profiles for matching
  async getProfilesForMatching(userId: string, limit: number = 10): Promise<Profile[]> {
    return ProfileModel.getProfilesForMatching(userId, limit);
  }
};

// Availability methods
export const availabilityService = {
  // Create new availability slot
  async createAvailability(availability: Omit<Availability, 'id' | 'created_at' | 'updated_at'>): Promise<Availability> {
    return AvailabilityModel.create(availability);
  },

  // Get availability slots for a user
  async getUserAvailability(userId: string): Promise<Availability[]> {
    return AvailabilityModel.getByUserId(userId);
  },

  // Update availability slot
  async updateAvailability(id: string, data: Partial<Availability>): Promise<Availability> {
    return AvailabilityModel.update(id, data);
  },

  // Delete availability slot
  async deleteAvailability(id: string): Promise<boolean> {
    return AvailabilityModel.delete(id);
  }
};

// Match methods
export const matchService = {
  // Create new match
  async createMatch(match: Omit<Match, 'id' | 'created_at' | 'updated_at'>): Promise<Match> {
    return MatchModel.create(match);
  },

  // Get matches for a user
  async getUserMatches(userId: string): Promise<Match[]> {
    return MatchModel.getByUserId(userId);
  },

  // Update match status
  async updateMatchStatus(id: string, status: MatchStatus): Promise<Match> {
    return MatchModel.updateStatus(id, status);
  },

  // Update match details
  async updateMatch(id: string, data: Partial<Match>): Promise<Match> {
    return MatchModel.update(id, data);
  }
};
