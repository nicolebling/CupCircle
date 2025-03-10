
import { query } from '../services/database';

export interface Availability {
  id: string;
  user_id: string;
  date: Date;
  start_time: string;
  end_time: string;
  is_available: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class AvailabilityModel {
  // Create a new availability slot
  static async create(availability: Omit<Availability, 'id' | 'created_at' | 'updated_at'>): Promise<Availability> {
    const { user_id, date, start_time, end_time, is_available } = availability;

    const result = await query(
      `INSERT INTO availability(user_id, date, start_time, end_time, is_available) 
       VALUES($1, $2, $3, $4, $5) RETURNING *`,
      [user_id, date, start_time, end_time, is_available]
    );
    return result.rows[0];
  }

  // Get availability slots for a user
  static async getByUserId(userId: string): Promise<Availability[]> {
    const result = await query(
      'SELECT * FROM availability WHERE user_id = $1 ORDER BY date, start_time',
      [userId]
    );
    return result.rows;
  }

  // Update availability slot
  static async update(id: string, availabilityData: Partial<Availability>): Promise<Availability> {
    const keys = Object.keys(availabilityData);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');
    
    const values = keys.map(key => availabilityData[key as keyof typeof availabilityData]);

    const result = await query(
      `UPDATE availability SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return result.rows[0];
  }

  // Delete availability slot
  static async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM availability WHERE id = $1', [id]);
    return result.rowCount > 0;
  }
}
