import { query } from '../services/database';

export interface Employment {
  company: string;
  position: string;
  fromDate: string;
  toDate: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  last_name?: string;
  age?: number;
  occupation?: string;
  photo?: string;
  bio?: string;
  employment?: Employment[];
  industry_categories?: string[];
  skills?: string[];
  neighborhoods?: string[];
  favorite_cafes?: string[];
  interests?: string[];
  location?: { lat: number, lng: number };
  created_at?: Date;
  updated_at?: Date;
}

export class ProfileModel {
  // Create a new profile
  static async create(profile: Omit<Profile, 'id' | 'created_at' | 'updated_at'>): Promise<Profile> {
    const {
      user_id, name, last_name, age, occupation, photo, bio,
      industry_categories, skills, neighborhoods, favorite_cafes, interests, location
    } = profile;

    const result = await query(
      `INSERT INTO profiles(
        user_id, name, last_name, age, occupation, photo, bio,
        industry_categories, skills, neighborhoods, favorite_cafes, interests, location
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING *`,
      [
        user_id, name, last_name, age, occupation, photo, bio,
        industry_categories, skills, neighborhoods, favorite_cafes, interests, JSON.stringify(location)
      ]
    );
    return result.rows[0];
  }

  // Find profile by user id
  static async findByUserId(userId: string): Promise<Profile | null> {
    const result = await query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  }

  // Update profile
  static async update(id: string, profileData: Partial<Profile>): Promise<Profile> {
    const keys = Object.keys(profileData);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

    const values = keys.map(key => {
      if (key === 'location' && profileData.location) {
        return JSON.stringify(profileData.location);
      }
      return profileData[key as keyof typeof profileData];
    });

    const result = await query(
      `UPDATE profiles SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }

  // Get profiles for matching
  static async getProfilesForMatching(userId: string, limit: number = 10): Promise<Profile[]> {
    // This query would incorporate your matching algorithm logic
    const result = await query(
      `SELECT p.* FROM profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id != $1
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }
}