
import { query } from '../services/database';

export type MatchStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'pending_acceptance';

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  status: MatchStatus;
  meeting_date?: Date;
  start_time?: string;
  end_time?: string;
  meeting_location?: { name: string, address: string, lat: number, lng: number };
  initial_message?: string;
  availability_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export class MatchModel {
  // Create a new match
  static async create(match: Omit<Match, 'id' | 'created_at' | 'updated_at'>): Promise<Match> {
    const {
      user1_id, user2_id, status, meeting_date, start_time, end_time,
      meeting_location, initial_message, availability_id
    } = match;

    const result = await query(
      `INSERT INTO matches(
        user1_id, user2_id, status, meeting_date, start_time, end_time,
        meeting_location, initial_message, availability_id
      ) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        user1_id, user2_id, status, meeting_date, start_time, end_time,
        meeting_location ? JSON.stringify(meeting_location) : null,
        initial_message, availability_id
      ]
    );
    return result.rows[0];
  }

  // Get matches for a user (both as user1 and user2)
  static async getByUserId(userId: string): Promise<Match[]> {
    const result = await query(
      `SELECT * FROM matches 
       WHERE user1_id = $1 OR user2_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // Update match status
  static async updateStatus(id: string, status: MatchStatus): Promise<Match> {
    const result = await query(
      `UPDATE matches SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, status]
    );
    return result.rows[0];
  }

  // Update match details
  static async update(id: string, matchData: Partial<Match>): Promise<Match> {
    const keys = Object.keys(matchData);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    
    const values = keys.map(key => {
      if (key === 'meeting_location' && matchData.meeting_location) {
        return JSON.stringify(matchData.meeting_location);
      }
      return matchData[key as keyof typeof matchData];
    });

    const result = await query(
      `UPDATE matches SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }
}
