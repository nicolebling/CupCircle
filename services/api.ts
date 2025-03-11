
import { User, UserModel } from '../models/User';
import { Profile, ProfileModel } from '../models/Profile';
import { Availability, AvailabilityModel } from '../models/Availability';
import { Match, MatchModel, MatchStatus } from '../models/Match';

// Authentication methods
export const authService = {
  // Register a new user
  async register(username: string, email: string, password: string): Promise<User> {
    console.log('Registering user:', email);
    try {
      return UserModel.create(username, email, password);
    } catch (error) {
      console.error('Registration error:', error);
      // For development, create a mock user when backend fails
      return {
        id: 'mock-id-' + Date.now(),
        username,
        email
      };
    }
  },

  // Login user
  async login(email: string, password: string): Promise<User | null> {
    console.log('Attempting login with:', email);
    
    // For development and testing - provide test accounts regardless of backend state
    if (email === 'john@example.com' && password === 'password123') {
      console.log('Using test account: john@example.com');
      return {
        id: 'mock-id-1',
        username: 'john_doe',
        email: 'john@example.com',
      };
    } else if (email === 'jane@example.com' && password === 'password123') {
      console.log('Using test account: jane@example.com');
      return {
        id: 'mock-id-2',
        username: 'jane_doe',
        email: 'jane@example.com',
      };
    }
    
    try {
      const user = await UserModel.findByEmail(email);
      if (!user) {
        console.log('User not found in database');
        return null;
      }
      
      const isValid = await UserModel.verifyPassword(user, password);
      if (!isValid) {
        console.log('Invalid password');
        return null;
      }
      
      // Don't send password to client
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('Login error:', error);
      return null;
    }
  },

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    try {
      return UserModel.findById(id);
    } catch (error) {
      console.error('Get user error:', error);
      // For development, return mock user
      if (id.includes('mock-id')) {
        return {
          id,
          username: id === 'mock-id-1' ? 'john_doe' : 'jane_doe',
          email: id === 'mock-id-1' ? 'john@example.com' : 'jane@example.com',
        };
      }
      return null;
    }
  }
};

// Profile methods
export const profileService = {
  // Create or update profile
  async saveProfile(profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile> {
    try {
      const existingProfile = await ProfileModel.findByUserId(profile.user_id);
      
      if (existingProfile) {
        return ProfileModel.update(existingProfile.id, profile);
      } else {
        return ProfileModel.create(profile);
      }
    } catch (error) {
      console.error('Save profile error:', error);
      console.log('Using mock profile service');
      // For development, return mock profile
      return {
        id: 'mock-profile-' + Date.now(),
        user_id: profile.user_id,
        name: profile.name || 'Mock User',
        photo: profile.photo || 'https://randomuser.me/api/portraits/men/32.jpg',
        occupation: profile.occupation || 'Software Engineer',
        bio: profile.bio || 'This is a mock profile for development',
        interests: profile.interests || ['React Native', 'Mobile Development', 'JavaScript'],
        created_at: new Date(),
        updated_at: new Date()
      };
    }
  },

  // Get profile by user ID
  async getProfileByUserId(userId: string): Promise<Profile | null> {
    try {
      return ProfileModel.findByUserId(userId);
    } catch (error) {
      console.error('Get profile error:', error);
      console.log('Using mock profile service');
      // For development, return mock profiles for test users
      if (userId === 'mock-id-1' || userId.includes('mock-id-1')) {
        return {
          id: 'mock-profile-1',
          user_id: userId,
          name: 'John Doe',
          photo: 'https://randomuser.me/api/portraits/men/32.jpg',
          occupation: 'Software Engineer',
          bio: 'Experienced developer with a passion for mobile apps',
          interests: ['React Native', 'Node.js', 'JavaScript'],
          created_at: new Date(),
          updated_at: new Date()
        };
      } else if (userId === 'mock-id-2' || userId.includes('mock-id-2')) {
        return {
          id: 'mock-profile-2',
          user_id: userId,
          name: 'Jane Smith',
          photo: 'https://randomuser.me/api/portraits/women/44.jpg',
          occupation: 'UX Designer',
          bio: 'Creative designer focused on user experience',
          interests: ['UI/UX', 'Figma', 'User Research'],
          created_at: new Date(),
          updated_at: new Date()
        };
      }
      return null;
    }
  },

  // Get profiles for matching
  async getProfilesForMatching(userId: string, limit: number = 10): Promise<Profile[]> {
    try {
      return ProfileModel.getProfilesForMatching(userId, limit);
    } catch (error) {
      console.error('Get profiles for matching error:', error);
      console.log('Using mock profile service');
      // For development, return mock profiles
      return [
        {
          id: 'mock-profile-3',
          user_id: 'mock-id-3',
          name: 'Alex Thompson',
          photo: 'https://randomuser.me/api/portraits/men/32.jpg',
          occupation: 'Software Engineer',
          bio: 'Passionate about building scalable web applications',
          interests: ['React', 'Node.js', 'Cloud Architecture'],
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          id: 'mock-profile-4',
          user_id: 'mock-id-4',
          name: 'Sophia Wang',
          photo: 'https://randomuser.me/api/portraits/women/44.jpg',
          occupation: 'UX/UI Designer',
          bio: 'Creative designer with a strong focus on user-centered design',
          interests: ['User Research', 'Wireframing', 'Figma'],
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
    }
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
